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

function buildGreetingText(firstName: string, _locale: string): string {
  const clean = firstName.trim().replace(/[^\p{L}\p{N}\s'-]/gu, "");
  // Spanish-only for now (locale reserved for future variants)
  return `Bienvenido, ${clean}.`;
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

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
    .data.publicUrl;

  // 1) Try cache via storage.list (more reliable than HEAD over CDN)
  try {
    const { data: list, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list("", { search: `${fileHash}.mp3`, limit: 1 });

    if (!listErr && list && list.length > 0) {
      console.log(
        `[greeting] cache HIT key=${cacheKey} path=${objectPath} name=${firstName}`
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
    console.warn("[greeting] cache list failed, proceeding to generate", e);
  }

  console.log(
    `[greeting] cache MISS key=${cacheKey} name=${firstName} → generating via ElevenLabs`
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
    console.error(
      `[greeting] ElevenLabs error status=${ttsRes.status} body=${errText.slice(
        0,
        300
      )}`
    );
    return new Response(
      JSON.stringify({
        error: "TTS generation failed",
        status: ttsRes.status,
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const audioBuffer = await ttsRes.arrayBuffer();
  const tGen = Date.now() - t0;
  console.log(
    `[greeting] generated bytes=${audioBuffer.byteLength} in ${tGen}ms name=${firstName}`
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
        durationMs: tGen,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(`[greeting] cached at ${objectPath} durationMs=${tGen}`);

  return new Response(
    JSON.stringify({
      audioUrl: publicUrl,
      cached: false,
      durationMs: tGen,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
