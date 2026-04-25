/**
 * whatsapp-diagnostics
 *
 * SOLO LECTURA. No envía mensajes. Comprueba:
 *  - Estado del Phone Number ID en Meta
 *  - WABA ID asociado, name_status, quality_rating, messaging_limit
 *  - Coexistence flag (si Meta lo expone)
 *  - Plantillas aprobadas
 *
 * Requiere usuario autenticado con rol "coach".
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function graphGet(path: string, token: string, fields?: string) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  if (fields) url.searchParams.set("fields", fields);
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

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

    // ---- Secrets ----
    const ACCESS = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const WABA_ID = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID");
    const TEST_NUM = Deno.env.get("WHATSAPP_TEST_NUMBER");
    const missing: string[] = [];
    if (!ACCESS) missing.push("WHATSAPP_ACCESS_TOKEN");
    if (!PHONE_ID) missing.push("WHATSAPP_PHONE_NUMBER_ID");
    if (!WABA_ID) missing.push("WHATSAPP_BUSINESS_ACCOUNT_ID");
    if (!TEST_NUM) missing.push("WHATSAPP_TEST_NUMBER");
    if (missing.length) {
      return new Response(JSON.stringify({ error: "Missing secrets", missing }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- 1. Phone Number ----
    const phone = await graphGet(
      `/${PHONE_ID}`,
      ACCESS!,
      "verified_name,display_phone_number,quality_rating,name_status,code_verification_status,messaging_limit_tier,platform_type,throughput,account_mode,certificate",
    );

    // ---- 2. WABA ----
    const waba = await graphGet(
      `/${WABA_ID}`,
      ACCESS!,
      "name,timezone_id,message_template_namespace,account_review_status,business_verification_status,country,ownership_type,primary_funding_id,on_behalf_of_business_info",
    );

    // ---- 2b. Payment / funding (si existe primary_funding_id) ----
    let payment: { ok: boolean; status: number; body: any } | null = null;
    const fundingId = waba.body?.primary_funding_id;
    if (fundingId) {
      payment = await graphGet(
        `/${fundingId}`,
        ACCESS!,
        "id,funding_source_details,reason_code,status",
      );
    }

    // ---- 3. Templates aprobadas ----
    const tpl = await graphGet(
      `/${WABA_ID}/message_templates`,
      ACCESS!,
      "name,status,language,category",
    );

    // ---- 4. Phone numbers under WABA (para detectar Coexistence / múltiples números) ----
    const phones = await graphGet(
      `/${WABA_ID}/phone_numbers`,
      ACCESS!,
      "id,display_phone_number,verified_name,quality_rating,platform_type",
    );

    // ---- Análisis ----
    const phoneOk = phone.ok;
    const platformType = phone.body?.platform_type ?? phones.body?.data?.find((p: any) => p.id === PHONE_ID)?.platform_type ?? null;
    const isCoexistence = platformType === "COEXISTENCE";
    const canSend = phoneOk
      && phone.body?.code_verification_status === "VERIFIED"
      && (phone.body?.messaging_limit_tier ?? "").length > 0;

    const summary = {
      phone_number_id: PHONE_ID,
      waba_id: WABA_ID,
      test_number: TEST_NUM,
      can_send_messages: canSend,
      platform_type: platformType,
      coexistence_mode: isCoexistence,
      verified_name: phone.body?.verified_name ?? null,
      display_number: phone.body?.display_phone_number ?? null,
      quality_rating: phone.body?.quality_rating ?? null,
      name_status: phone.body?.name_status ?? null,
      messaging_limit_tier: phone.body?.messaging_limit_tier ?? null,
      account_review_status: waba.body?.account_review_status ?? null,
      business_verification_status: waba.body?.business_verification_status ?? null,
      approved_templates: (tpl.body?.data ?? []).filter((t: any) => t.status === "APPROVED").map((t: any) => ({
        name: t.name, language: t.language, category: t.category,
      })),
      total_templates: (tpl.body?.data ?? []).length,
      phones_in_waba: (phones.body?.data ?? []).map((p: any) => ({
        id: p.id, number: p.display_phone_number, platform_type: p.platform_type,
      })),
    };

    return new Response(JSON.stringify({
      ok: true,
      summary,
      raw: {
        phone: { status: phone.status, body: phone.body },
        waba: { status: waba.status, body: waba.body },
        templates: { status: tpl.status, count: tpl.body?.data?.length ?? 0 },
        phones_in_waba: { status: phones.status, body: phones.body },
      },
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[whatsapp-diagnostics] error", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "unknown",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
