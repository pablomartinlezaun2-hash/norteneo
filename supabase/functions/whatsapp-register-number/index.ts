/**
 * whatsapp-register-number
 *
 * Registra el Phone Number ID en WhatsApp Cloud API.
 * Llama a POST /v21.0/{PHONE_NUMBER_ID}/register con un PIN de 6 dígitos.
 *
 * Requiere usuario autenticado con rol "coach".
 * Body esperado: { "pin": "123456" }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRAPH_VERSION = "v21.0";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---- Auth: solo coach ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supa = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supa.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: prof } = await admin
      .from("profiles").select("role").eq("user_id", userId).maybeSingle();
    if (prof?.role !== "coach") {
      return new Response(JSON.stringify({ error: "Forbidden: coach only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Body: PIN ----
    let body: { pin?: string } = {};
    try { body = await req.json(); } catch (_) {}
    const pin = (body.pin ?? "").toString().trim();
    if (!/^\d{6}$/.test(pin)) {
      return new Response(JSON.stringify({
        error: "Invalid PIN. Must be exactly 6 digits.",
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Secrets ----
    const ACCESS = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const missing: string[] = [];
    if (!ACCESS) missing.push("WHATSAPP_ACCESS_TOKEN");
    if (!PHONE_ID) missing.push("WHATSAPP_PHONE_NUMBER_ID");
    if (missing.length) {
      return new Response(JSON.stringify({ error: "Missing secrets", missing }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Llamada a Meta ----
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_ID}/register`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin,
      }),
    });
    const metaBody = await r.json().catch(() => ({}));

    return new Response(JSON.stringify({
      ok: r.ok,
      meta_status: r.status,
      meta_response: metaBody,
      hint: r.ok
        ? "Número registrado. Vuelve a 'Comprobar' para validar can_send_messages."
        : (metaBody?.error?.code === 133005
          ? "PIN incorrecto. Si nunca configuraste 2FA, este PIN queda fijado a partir de ahora."
          : metaBody?.error?.code === 133006
          ? "Número ya verificado pero pendiente de otro paso. Revisa Meta Business Suite."
          : null),
    }, null, 2), {
      status: r.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[whatsapp-register-number] error", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "unknown",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
