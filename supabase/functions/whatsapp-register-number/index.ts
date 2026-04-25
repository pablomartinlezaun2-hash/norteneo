/**
 * whatsapp-register-number
 *
 * Registra el número de WhatsApp Business en Cloud API mediante POST /{PHONE_NUMBER_ID}/register
 * Requiere PIN de 2FA de 6 dígitos configurado en Meta para ese número.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const pin = String(body?.pin ?? "").trim();
    if (!/^\d{6}$/.test(pin)) {
      return new Response(JSON.stringify({
        error: "El PIN debe ser exactamente 6 dígitos numéricos.",
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Secrets de WhatsApp ----
    const TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const missing: string[] = [];
    if (!TOKEN) missing.push("WHATSAPP_ACCESS_TOKEN");
    if (!PHONE_ID) missing.push("WHATSAPP_PHONE_NUMBER_ID");
    if (missing.length) {
      return new Response(JSON.stringify({ error: "Missing secrets", missing }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Llamada a Meta Graph API ----
    const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/register`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin,
      }),
    });

    const metaJson = await resp.json().catch(() => ({}));

    return new Response(JSON.stringify({
      ok: resp.ok,
      meta_status: resp.status,
      meta_response: metaJson,
      hint: resp.ok
        ? "Número registrado. Espera unos segundos y vuelve a pulsar 'Comprobar' en el diagnóstico."
        : "Si recibes 'Account not registered' o '(#100) Register endpoint is not available for SMB businesses', tu cuenta usa Embedded Signup y el registro lo gestiona Meta automáticamente. Verifica método de pago, número verificado y términos aceptados.",
    }, null, 2), {
      status: 200,
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
