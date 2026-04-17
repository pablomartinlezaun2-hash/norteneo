// Edge Function: personalized-greeting
// Generates (or returns from cache) a short ElevenLabs TTS clip:
// "Bienvenido, {firstName}."
//
// POST body: { firstName: string, locale?: string, voiceVersion?: string }
// Response:  { audioUrl: string, durationMs?: number, cached: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "personalized-greetings";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID");
const ELEVENLABS_MODEL_ID =
  Deno.env.get("ELEVENLABS_MODEL_ID") || "eleven_multilingual_v2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function normalizeName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 40);
}

async function md5Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("MD5", data).catch(async () => {
    // Fallback: SHA-256 → first 16 bytes
    return await crypto.subtle.digest("SHA-256", data);
  });
  return Array.from(new Uint8Array(hash))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Female names that don't follow the -a rule, plus common ambiguous cases.
const FEMALE_NAMES = new Set([
  "carmen", "pilar", "isabel", "mercedes", "dolores", "concepcion", "consuelo",
  "rocio", "belen", "maria", "esther", "raquel", "soledad", "inmaculada",
  "milagros", "asuncion", "encarnacion", "nieves", "sol", "mar", "luz",
  "beatriz", "cruz", "estefani", "estefany", "jennifer", "jenifer",
]);
const MALE_NAMES_ENDING_A = new Set([
  "luca", "noa", "elias", "isaias", "jeremias", "matias", "tobias",
  "andrea", "joshua",
]);
const MALE_SUFFIXES_2 = ["os", "on", "or", "el", "an", "en", "in", "un"];

function detectGender(rawName: string): "f" | "m" | "u" {
  if (!rawName) return "u";
  const first = rawName
    .trim()
    .split(/\s+/)[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!first) return "u";
  if (FEMALE_NAMES.has(first)) return "f";
  if (MALE_NAMES_ENDING_A.has(first)) return "m";
  const last = first.slice(-1);
  const last2 = first.slice(-2);
  if (last === "a") return "f";
  if (["ia", "ina", "ela", "isa", "ana", "ena"].includes(last2)) return "f";
  if (MALE_SUFFIXES_2.includes(last2)) return "m";
  if (last === "o") return "m";
  return "u";
}

function buildGreetingText(firstName: string, locale: string): string {
  const clean = firstName.trim().replace(/[^\p{L}\p{N}\s'-]/gu, "");
  const word = detectGender(clean) === "f" ? "Bienvenida" : "Bienvenido";
  // Spanish-only for now (locale reserved for future variants)
  return `${word}, ${clean}.`;
}

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
    console.error("[greeting] Missing ElevenLabs configuration");
    return new Response(
      JSON.stringify({ error: "ElevenLabs not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let body: {
    firstName?: string;
    locale?: string;
    voiceVersion?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const firstName = (body.firstName || "").trim();
  const locale = (body.locale || "es").toLowerCase();
  const voiceVersion = (body.voiceVersion || "v1").toLowerCase();

  if (!firstName || firstName.length < 1 || firstName.length > 40) {
    return new Response(
      JSON.stringify({ error: "firstName must be 1-40 chars" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const normalized = normalizeName(firstName);
  if (!normalized) {
    return new Response(JSON.stringify({ error: "Invalid firstName" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const text = buildGreetingText(firstName, locale);
  const cacheKey = `${voiceVersion}:${locale}:${ELEVENLABS_VOICE_ID}:${normalized}`;
  const fileHash = await md5Hex(cacheKey);
  const objectPath = `${fileHash}.mp3`;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 1) Try cache
  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
    .data.publicUrl;

  try {
    const head = await fetch(publicUrl, { method: "HEAD" });
    if (head.ok) {
      console.log(
        `[greeting] cache HIT key=${cacheKey} path=${objectPath}`
      );
      return new Response(
        JSON.stringify({ audioUrl: publicUrl, cached: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (e) {
    console.warn("[greeting] cache HEAD failed, proceeding to generate", e);
  }

  console.log(
    `[greeting] cache MISS key=${cacheKey} → generating via ElevenLabs`
  );
  const t0 = Date.now();

  // 2) Generate via ElevenLabs
  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.8,
          style: 0.25,
          use_speaker_boost: true,
          speed: 1.0,
        },
      }),
    }
  );

  if (!ttsRes.ok) {
    const errText = await ttsRes.text();
    const isAuthOrBilling = ttsRes.status === 401 || ttsRes.status === 402;
    const reason = isAuthOrBilling
      ? "elevenlabs_auth_or_billing"
      : "elevenlabs_upstream_error";
    console.error(
      `[greeting] ElevenLabs error status=${ttsRes.status} reason=${reason} body=${errText.slice(
        0,
        300
      )}`
    );
    // Return 200 + fallback flag so the client uses the visual fallback
    // gracefully instead of surfacing a 502 to the user.
    return new Response(
      JSON.stringify({
        fallback: true,
        error: "TTS_UNAVAILABLE",
        reason,
        upstreamStatus: ttsRes.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const audioBuffer = await ttsRes.arrayBuffer();
  const tGen = Date.now() - t0;
  console.log(
    `[greeting] generated bytes=${audioBuffer.byteLength} in ${tGen}ms`
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
    console.error("[greeting] storage upload error", uploadError);
    // Still return the audio inline as data URL fallback so UX isn't blocked
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
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(`[greeting] cached at ${objectPath}`);

  return new Response(
    JSON.stringify({
      audioUrl: publicUrl,
      cached: false,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
