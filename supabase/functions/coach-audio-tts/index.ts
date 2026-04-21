/**
 * coach-audio-tts — Sintetiza el script con ElevenLabs y sube el MP3 al
 * bucket privado `coach-audio-messages`.
 *
 * Flujo:
 *   1. Valida que el usuario es el coach del audio (RLS + comprobación servidor).
 *   2. Marca el audio como `generating`.
 *   3. Llama a ElevenLabs TTS.
 *   4. Sube el MP3 a `coach-audio-messages/{coach_id}/{athlete_id}/{audio_id}.mp3`.
 *   5. Actualiza el registro con storage_path y status `ready`.
 *   6. Devuelve { storage_path, signed_url } para reproducción inmediata.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  audioId: string; // id en coach_audio_messages
}

const BUCKET = "coach-audio-messages";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVEN_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const ELEVEN_VOICE = Deno.env.get("ELEVENLABS_VOICE_ID");
    const ELEVEN_MODEL = Deno.env.get("ELEVENLABS_MODEL_ID") || "eleven_multilingual_v2";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ANON = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    if (!ELEVEN_KEY || !ELEVEN_VOICE) {
      return new Response(JSON.stringify({ error: "ElevenLabs no configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!SUPABASE_URL || !SERVICE_ROLE || !ANON) {
      return new Response(JSON.stringify({ error: "Supabase no configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente con JWT del usuario para validar identidad
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authUid = userData.user.id;

    const body = (await req.json()) as Body;
    if (!body.audioId) {
      return new Response(JSON.stringify({ error: "audioId requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente con service role para todas las operaciones siguientes
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Resolver profile_id del usuario
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", authUid)
      .maybeSingle();
    if (!profile?.id) {
      return new Response(JSON.stringify({ error: "Perfil no encontrado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const coachProfileId = profile.id;

    // Cargar registro
    const { data: audioRow, error: rowErr } = await admin
      .from("coach_audio_messages")
      .select("*")
      .eq("id", body.audioId)
      .maybeSingle();
    if (rowErr || !audioRow) {
      return new Response(JSON.stringify({ error: "Audio no encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (audioRow.coach_id !== coachProfileId) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (audioRow.status === "ready" || audioRow.status === "sent") {
      // Ya generado: devolver signed url y salir
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(audioRow.storage_path!, 3600);
      return new Response(JSON.stringify({
        status: audioRow.status,
        storage_path: audioRow.storage_path,
        signed_url: signed?.signedUrl ?? null,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Marcar como generating
    await admin
      .from("coach_audio_messages")
      .update({ status: "generating", error_message: null })
      .eq("id", body.audioId);

    // Llamar a ElevenLabs
    const voiceId = audioRow.voice_id || ELEVEN_VOICE;
    const modelId = audioRow.model_id || ELEVEN_MODEL;
    const ttsResp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: audioRow.script,
          model_id: modelId,
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      },
    );

    if (!ttsResp.ok) {
      const errText = await ttsResp.text();
      console.error("[coach-audio-tts] ElevenLabs error", ttsResp.status, errText);
      await admin
        .from("coach_audio_messages")
        .update({ status: "failed", error_message: `ElevenLabs ${ttsResp.status}: ${errText.slice(0, 200)}` })
        .eq("id", body.audioId);
      return new Response(JSON.stringify({ error: "Error generando audio" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBytes = new Uint8Array(await ttsResp.arrayBuffer());
    const storagePath = `${audioRow.coach_id}/${audioRow.athlete_id}/${audioRow.id}.mp3`;

    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });
    if (uploadErr) {
      console.error("[coach-audio-tts] upload error", uploadErr);
      await admin
        .from("coach_audio_messages")
        .update({ status: "failed", error_message: `Upload: ${uploadErr.message}` })
        .eq("id", body.audioId);
      return new Response(JSON.stringify({ error: "Error subiendo audio" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Estimación de duración: ~16 chars/seg en castellano hablado normal.
    const durationSeconds = Math.max(3, Math.round(audioRow.script.length / 16));

    await admin
      .from("coach_audio_messages")
      .update({
        status: "ready",
        storage_path: storagePath,
        duration_seconds: durationSeconds,
      })
      .eq("id", body.audioId);

    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);

    return new Response(JSON.stringify({
      status: "ready",
      storage_path: storagePath,
      duration_seconds: durationSeconds,
      signed_url: signed?.signedUrl ?? null,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[coach-audio-tts] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
