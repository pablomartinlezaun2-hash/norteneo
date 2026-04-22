/**
 * coach-auto-dispatch
 *
 * Procesa eventos de intervención pendientes y los envía al chat del atleta:
 *   - eventos "premium" (low_sleep, performance_drop, high_fatigue,
 *     low_adherence, progress_milestone) → AUDIO con la voz del briefing
 *     (ELEVENLABS_VOICE_ID).
 *   - resto → mensaje de TEXTO directo.
 *
 * Diseñado para ser invocado por cron (pg_cron + pg_net) cada ~2 minutos
 * y también manualmente. No requiere JWT (verify_jwt=false en config.toml).
 *
 * Procesa máx N eventos por ejecución (límite configurable) para evitar
 * timeouts y picos de coste.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AUDIO_EVENTS = new Set([
  "low_sleep", "performance_drop", "high_fatigue", "low_adherence", "progress_milestone",
]);

const BUCKET = "coach-audio-messages";
const MAX_PER_RUN = 6;

function buildScript(firstName: string, eventType: string, summary: string, coachName: string): string {
  const greeting = `Hola ${firstName}, soy ${coachName}.`;
  switch (eventType) {
    case "low_sleep":
      return `${greeting} He visto que el descanso esta semana ha estado por debajo de lo ideal. ${summary}. Hoy bajamos un punto la intensidad y priorizamos técnica. Cuídate y descansa bien esta noche.`;
    case "performance_drop":
      return `${greeting} ${summary}. No te preocupes, suele pasar tras semanas exigentes. Esta sesión la planteamos como descarga: cargas un 10% más bajas y foco en ejecución.`;
    case "high_fatigue":
      return `${greeting} ${summary}. Toca semana de descarga: reducimos volumen un 30% y priorizamos recuperación. Te paso los ajustes en el plan.`;
    case "low_adherence":
      return `${greeting} ${summary}. Sin presión, pero quiero entender qué está fallando. ¿Te viene bien que reorganicemos tu semana?`;
    case "progress_milestone":
      return `${greeting} ${summary}. ¡Enhorabuena! Es la prueba de que el trabajo está dando frutos. Sigamos por aquí.`;
    default:
      return `${greeting} ${summary}.`;
  }
}

function buildTextMessage(firstName: string, eventType: string, summary: string): string {
  const greeting = `Hola ${firstName}, soy Marta.`;
  switch (eventType) {
    case "reps_out_of_range":
      return `${greeting} He revisado tu última sesión y ${summary.toLowerCase()}. Recuerda mantenerte dentro del rango pautado para que el estímulo sea el correcto.`;
    case "missing_set":
      return `${greeting} ${summary}. ¿Fue olvido o decisión consciente? Avísame para ajustar.`;
    case "load_drop":
      return `${greeting} ${summary}. Vamos a vigilar la próxima sesión, puede ser fatiga puntual.`;
    case "low_protein":
      return `${greeting} ${summary}. Te recomiendo añadir una fuente proteica extra en comida o cena.`;
    case "calorie_off_target":
      return `${greeting} ${summary}. Especialmente en días de entreno, mantener calorías ayuda a la recuperación.`;
    default:
      return `${greeting} ${summary}.`;
  }
}

async function processOne(
  admin: ReturnType<typeof createClient>,
  event: any,
  voiceId: string,
  elevenKey: string,
): Promise<{ ok: boolean; channel: string; message?: string; audioId?: string; error?: string }> {
  // Resolver atleta
  const { data: athlete } = await admin
    .from("profiles")
    .select("display_name, full_name")
    .eq("id", event.athlete_id)
    .maybeSingle();

  const firstName = (athlete?.display_name ?? athlete?.full_name ?? "atleta")
    .split(" ")[0];

  // Asegurar conversación
  let conversationId: string | null = null;
  const { data: conv } = await admin
    .from("coach_conversations")
    .select("id")
    .eq("coach_id", event.coach_id)
    .eq("athlete_id", event.athlete_id)
    .maybeSingle();
  if (conv) conversationId = conv.id;
  else {
    const { data: newConv, error: convErr } = await admin
      .from("coach_conversations")
      .insert({ coach_id: event.coach_id, athlete_id: event.athlete_id })
      .select("id")
      .single();
    if (convErr) return { ok: false, channel: "n/a", error: `conv: ${convErr.message}` };
    conversationId = newConv.id;
  }

  const isAudio = AUDIO_EVENTS.has(event.event_type);

  if (isAudio) {
    const script = buildScript(firstName, event.event_type, event.summary);

    // 1) Crear registro de audio
    const { data: audioRow, error: aErr } = await admin
      .from("coach_audio_messages")
      .insert({
        coach_id: event.coach_id,
        athlete_id: event.athlete_id,
        intervention_event_id: event.id,
        voice_id: voiceId,
        model_id: "eleven_multilingual_v2",
        script,
        status: "generating",
      })
      .select("*")
      .single();
    if (aErr || !audioRow) return { ok: false, channel: "audio", error: `audio_insert: ${aErr?.message}` };

    // 2) ElevenLabs TTS
    const ttsResp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": elevenKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed: 1.0 },
        }),
      },
    );
    if (!ttsResp.ok) {
      const errText = await ttsResp.text();
      await admin.from("coach_audio_messages")
        .update({ status: "failed", error_message: `tts ${ttsResp.status}: ${errText.slice(0, 200)}` })
        .eq("id", audioRow.id);
      return { ok: false, channel: "audio", error: `tts ${ttsResp.status}` };
    }
    const audioBytes = new Uint8Array(await ttsResp.arrayBuffer());
    const storagePath = `${event.coach_id}/${event.athlete_id}/${audioRow.id}.mp3`;

    const { error: upErr } = await admin.storage.from(BUCKET).upload(storagePath, audioBytes, {
      contentType: "audio/mpeg", upsert: true,
    });
    if (upErr) {
      await admin.from("coach_audio_messages")
        .update({ status: "failed", error_message: `upload: ${upErr.message}` })
        .eq("id", audioRow.id);
      return { ok: false, channel: "audio", error: `upload: ${upErr.message}` };
    }

    const durationSeconds = Math.max(3, Math.round(script.length / 16));

    // 3) Crear mensaje en chat
    const { data: msg, error: msgErr } = await admin
      .from("coach_messages")
      .insert({
        conversation_id: conversationId,
        coach_id: event.coach_id,
        athlete_id: event.athlete_id,
        sender_id: event.coach_id,
        sender_role: "coach",
        message: script,
        context_type: "audio",
        metadata: {
          audio_id: audioRow.id,
          event_type: event.event_type,
          event_summary: event.summary,
          duration_seconds: durationSeconds,
          kind: "intervention_audio",
          auto_dispatched: true,
        },
      })
      .select("id, created_at")
      .single();
    if (msgErr) return { ok: false, channel: "audio", error: `msg: ${msgErr.message}` };

    // 4) Cerrar registros
    await admin.from("coach_audio_messages").update({
      status: "sent", sent_at: msg.created_at,
      coach_message_id: msg.id, storage_path: storagePath,
      duration_seconds: durationSeconds,
    }).eq("id", audioRow.id);

    await admin.from("coach_conversations").update({
      last_message_at: msg.created_at,
      last_message_preview: "🎙️ Audio del coach",
      updated_at: new Date().toISOString(),
    }).eq("id", conversationId);

    await admin.from("coach_intervention_events").update({
      status: "sent", sent_at: msg.created_at,
      sent_message_id: msg.id, generated_message: script,
    }).eq("id", event.id);

    return { ok: true, channel: "audio", audioId: audioRow.id };
  }

  // ===== TEXTO =====
  const text = buildTextMessage(firstName, event.event_type, event.summary);

  const { data: msg, error: msgErr } = await admin
    .from("coach_messages")
    .insert({
      conversation_id: conversationId,
      coach_id: event.coach_id,
      athlete_id: event.athlete_id,
      sender_id: event.coach_id,
      sender_role: "coach",
      message: text,
      context_type: "intervention",
      metadata: {
        event_type: event.event_type,
        event_summary: event.summary,
        kind: "intervention_text",
        auto_dispatched: true,
      },
    })
    .select("id, created_at")
    .single();
  if (msgErr) return { ok: false, channel: "text", error: msgErr.message };

  await admin.from("coach_conversations").update({
    last_message_at: msg.created_at,
    last_message_preview: text.slice(0, 80),
    updated_at: new Date().toISOString(),
  }).eq("id", conversationId);

  await admin.from("coach_intervention_events").update({
    status: "sent", sent_at: msg.created_at,
    sent_message_id: msg.id, generated_message: text,
  }).eq("id", event.id);

  return { ok: true, channel: "text", message: text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ELEVEN_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID");
    if (!ELEVEN_KEY || !VOICE_ID) {
      return new Response(JSON.stringify({ error: "ElevenLabs no configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Eventos pendientes (más antiguos primero)
    const { data: pending, error: pErr } = await admin
      .from("coach_intervention_events")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(MAX_PER_RUN);
    if (pErr) throw pErr;

    const processed: any[] = [];
    for (const ev of pending ?? []) {
      const r = await processOne(admin, ev, VOICE_ID, ELEVEN_KEY);
      processed.push({ event_id: ev.id, event_type: ev.event_type, ...r });
    }

    return new Response(JSON.stringify({
      ok: true, picked: pending?.length ?? 0, processed,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[coach-auto-dispatch] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
