// Edge Function: microcycle-audio-briefing
// Generates a short premium "briefing" script from microcycle metrics,
// synthesizes it with ElevenLabs and returns a cached audio URL.
//
// POST body: {
//   microcycleId: string,
//   adherence: number,        // 0-100 global adherence
//   performance?: number,     // -100..+100 trend %
//   fatigue?: number,         // 0-100 (higher = more accumulated fatigue)
//   nutrition?: number,       // 0-100 nutrition adherence
//   trainingAcc?: number,     // 0-100 training adherence
//   hasNutrition?: boolean,
//   hasFatigue?: boolean,
// }
// Response: { audioUrl, durationSeconds?, cached, script, fallback?, reason? }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "microcycle-briefings";
const SCRIPT_VERSION = "v2";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID");
const ELEVENLABS_MODEL_ID =
  Deno.env.get("ELEVENLABS_MODEL_ID") || "eleven_multilingual_v2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/* ──────────────────────────────────────────────────────
   SCRIPT BUILDER — premium executive briefing tone
   ────────────────────────────────────────────────────── */

interface BriefingInput {
  adherence: number;
  performance?: number;
  fatigue?: number;
  nutrition?: number;
  trainingAcc?: number;
  hasNutrition?: boolean;
  hasFatigue?: boolean;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function buildScript(input: BriefingInput, seed: number): string {
  const { adherence, performance, fatigue, nutrition, trainingAcc } = input;

  // 1. Apertura
  const opening = pick(
    [
      "Resumen semanal completado.",
      "Tu microciclo semanal ya está analizado.",
      "Este es tu resumen semanal de rendimiento.",
    ],
    seed
  );

  // 2. Estado general (basado en adherencia + tendencia)
  let general: string;
  const trend = performance ?? 0;
  if (adherence >= 80 && trend >= 2) {
    general = pick(
      [
        "Se observa una mejora general moderada del rendimiento.",
        "La semana cierra con una evolución claramente positiva.",
      ],
      seed + 1
    );
  } else if (adherence >= 65 && trend >= -2) {
    general = pick(
      [
        "La semana cierra con una evolución estable.",
        "La semana ha sido consistente, con margen de mejora en algunas áreas.",
      ],
      seed + 1
    );
  } else if (trend < -3) {
    general = pick(
      [
        "El microciclo muestra una ligera caída en el rendimiento global.",
        "La semana refleja un descenso leve respecto al microciclo anterior.",
      ],
      seed + 1
    );
  } else {
    general = "El microciclo ha sido irregular, con oportunidades claras de ajuste.";
  }

  // 3. Adherencia
  let adh: string;
  if (adherence >= 85) {
    adh = "La adherencia al plan ha sido alta y estable.";
  } else if (adherence >= 70) {
    adh = "La adherencia ha sido correcta, aunque con algo de variabilidad.";
  } else {
    adh = "Se observa margen de mejora en la consistencia semanal.";
  }

  // 4. Rendimiento
  let perf: string;
  const t = trainingAcc ?? adherence;
  if (t >= 85 && trend >= 0) {
    perf = pick(
      [
        "El rendimiento se ha mantenido sólido en la mayoría de ejercicios.",
        "La progresión ha sido moderada, pero consistente.",
      ],
      seed + 2
    );
  } else if (trend >= 3) {
    perf = "Destaca una mejora clara en los patrones de entrenamiento principales.";
  } else if (trend <= -3) {
    perf = "Se observa una ligera caída en algunos patrones, conviene revisarla.";
  } else {
    perf = "El rendimiento se mantiene en la línea esperada del microciclo.";
  }

  // 5. Fatiga / recuperación
  let recov = "";
  if (input.hasFatigue && typeof fatigue === "number") {
    if (fatigue >= 70) {
      recov = "Se detecta cierta acumulación de fatiga en la parte final de la semana.";
    } else if (fatigue >= 40) {
      recov = "La fatiga acumulada se mantiene dentro de un rango razonable.";
    } else {
      recov = "La recuperación general parece suficiente para consolidar la progresión.";
    }
  }

  // 6. Nutrición (solo si hay datos)
  let nut = "";
  if (input.hasNutrition && typeof nutrition === "number") {
    if (nutrition >= 80) {
      nut = "La nutrición ha acompañado correctamente al microciclo.";
    } else if (nutrition >= 60) {
      nut = "La adherencia nutricional ha sido correcta, aunque todavía mejorable.";
    } else {
      nut = "Se observa margen de mejora en la precisión nutricional.";
    }
  }

  // 7. Recomendación final
  let rec: string;
  if (adherence < 70) {
    rec = "La siguiente semana debería centrarse en recuperar estabilidad y control.";
  } else if (input.hasFatigue && (fatigue ?? 0) >= 70) {
    rec = "Conviene mantener la técnica y el tempo antes de seguir progresando.";
  } else if (trend >= 3 && adherence >= 80) {
    rec = "Buen momento para consolidar el rendimiento actual.";
  } else {
    rec = "La próxima semana prioriza consistencia antes de progresar la carga.";
  }

  // Concatenación natural
  const parts = [opening, general, adh, perf, recov, nut, rec].filter(Boolean);
  return parts.join(" ");
}

/* ──────────────────────────────────────────────────────
   HASH for cache key
   ────────────────────────────────────────────────────── */

async function sha1Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ──────────────────────────────────────────────────────
   HANDLER
   ────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    return new Response(
      JSON.stringify({ error: "ElevenLabs not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let body: BriefingInput & { microcycleId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const microcycleId = (body.microcycleId || "default").toString().slice(0, 80);
  const adherence = Math.round(body.adherence ?? 0);
  const performance = typeof body.performance === "number"
    ? Math.round(body.performance)
    : undefined;
  const fatigue = typeof body.fatigue === "number"
    ? Math.round(body.fatigue)
    : undefined;
  const nutrition = typeof body.nutrition === "number"
    ? Math.round(body.nutrition)
    : undefined;
  const trainingAcc = typeof body.trainingAcc === "number"
    ? Math.round(body.trainingAcc)
    : undefined;

  // Seed for variation: stable per microcycleId so the same week has the same script.
  let seed = 0;
  for (let i = 0; i < microcycleId.length; i++) seed = (seed * 31 + microcycleId.charCodeAt(i)) | 0;

  const script = buildScript(
    {
      adherence,
      performance,
      fatigue,
      nutrition,
      trainingAcc,
      hasNutrition: !!body.hasNutrition,
      hasFatigue: !!body.hasFatigue,
    },
    seed
  );

  // Cache key includes anything that affects the audio output
  const cachePayload = JSON.stringify({
    v: SCRIPT_VERSION,
    voice: ELEVENLABS_VOICE_ID,
    model: ELEVENLABS_MODEL_ID,
    script,
  });
  const fileHash = await sha1Hex(cachePayload);
  const objectPath = `${microcycleId}/${fileHash}.mp3`;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
    .data.publicUrl;

  // 1) Cache hit?
  try {
    const head = await fetch(publicUrl, { method: "HEAD" });
    if (head.ok) {
      console.log(`[briefing] cache HIT ${objectPath}`);
      return new Response(
        JSON.stringify({ audioUrl: publicUrl, cached: true, script }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (e) {
    console.warn("[briefing] cache HEAD failed", e);
  }

  console.log(`[briefing] cache MISS → generating (${script.length} chars)`);
  const t0 = Date.now();

  // 2) ElevenLabs TTS
  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: script,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.8,
          style: 0.18,
          use_speaker_boost: true,
          speed: 1.0,
        },
      }),
    }
  );

  if (!ttsRes.ok) {
    const errText = await ttsRes.text();
    console.error(
      `[briefing] ElevenLabs error ${ttsRes.status}: ${errText.slice(0, 300)}`
    );
    return new Response(
      JSON.stringify({
        fallback: true,
        error: "TTS_UNAVAILABLE",
        upstreamStatus: ttsRes.status,
        script,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const audioBuffer = await ttsRes.arrayBuffer();
  console.log(
    `[briefing] generated ${audioBuffer.byteLength} bytes in ${Date.now() - t0}ms`
  );

  // 3) Upload to storage cache
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, audioBuffer, {
      contentType: "audio/mpeg",
      upsert: true,
      cacheControl: "31536000",
    });

  if (uploadError) {
    console.error("[briefing] upload error", uploadError);
    // Inline fallback (data URL) so the user still hears the briefing
    const b64 = btoa(
      new Uint8Array(audioBuffer).reduce(
        (s, b) => s + String.fromCharCode(b),
        ""
      )
    );
    return new Response(
      JSON.stringify({
        audioUrl: `data:audio/mpeg;base64,${b64}`,
        cached: false,
        script,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ audioUrl: publicUrl, cached: false, script }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
