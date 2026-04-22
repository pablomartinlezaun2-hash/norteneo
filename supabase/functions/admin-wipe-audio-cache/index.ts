/**
 * admin-wipe-audio-cache
 *
 * Borra los archivos de los buckets de audio para forzar regeneración con la
 * voz actualizada. Endpoint puntual, sin auth (verify_jwt=false).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKETS = [
  "microcycle-briefings",
  "personalized-greetings",
  "coach-audio-messages",
];

async function wipeBucket(sb: ReturnType<typeof createClient>, bucket: string) {
  const all: string[] = [];
  async function walk(prefix = "") {
    const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error) {
      console.error("[wipe]", bucket, prefix, error.message);
      return;
    }
    for (const it of data ?? []) {
      const path = prefix ? `${prefix}/${it.name}` : it.name;
      // Carpetas no tienen id
      if ((it as any).id == null) {
        await walk(path);
      } else {
        all.push(path);
      }
    }
  }
  await walk("");
  if (all.length === 0) return { bucket, removed: 0 };
  const { error } = await sb.storage.from(bucket).remove(all);
  if (error) return { bucket, removed: 0, error: error.message };
  return { bucket, removed: all.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results = [];
    for (const b of BUCKETS) {
      results.push(await wipeBucket(sb, b));
    }
    return new Response(JSON.stringify({ ok: true, results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
