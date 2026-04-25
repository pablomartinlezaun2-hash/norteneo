/**
 * whatsapp-send-test
 *
 * Envía UN mensaje WhatsApp manual. Allowlist estricta:
 *   - El destino tiene que coincidir con WHATSAPP_TEST_NUMBER, o
 *   - estar en la lista WHATSAPP_TEST_ALLOWLIST (csv) si la añades en el futuro.
 *
 * No usa coach_message_assets / coach_message_deliveries.
 * No es invocada por cron. Sólo manual.
 *
 * Body:
 *   {
 *     "to": "34600123456",        // sin +
 *     "kind": "text" | "template",
 *     "text"?: "hola",            // requerido si kind=text (sólo dentro de ventana 24h o session-initiated)
 *     "template_name"?: "hello_world",  // requerido si kind=template
 *     "template_lang"?: "en_US"
 *   }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRAPH_VERSION = "v21.0";

function normalize(num: string): string {
  return (num || "").replace(/[^0-9]/g, "");
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
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimErr } = await supa.auth.getClaims(token);
    if (claimErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;
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
    const TEST_NUM = Deno.env.get("WHATSAPP_TEST_NUMBER");
    const ALLOWLIST_CSV = Deno.env.get("WHATSAPP_TEST_ALLOWLIST") ?? "";
    if (!ACCESS || !PHONE_ID || !TEST_NUM) {
      return new Response(JSON.stringify({
        error: "Missing secrets",
        missing: [
          !ACCESS && "WHATSAPP_ACCESS_TOKEN",
          !PHONE_ID && "WHATSAPP_PHONE_NUMBER_ID",
          !TEST_NUM && "WHATSAPP_TEST_NUMBER",
        ].filter(Boolean),
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Body ----
    let body: any;
    try { body = await req.json(); }
    catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    }); }

    const to = normalize(body?.to ?? "");
    const kind = body?.kind ?? "template";
    if (!to) {
      return new Response(JSON.stringify({ error: "Missing 'to'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ALLOWLIST estricta ----
    const allowed = new Set<string>([normalize(TEST_NUM)]);
    for (const n of ALLOWLIST_CSV.split(",").map(normalize).filter(Boolean)) allowed.add(n);
    if (!allowed.has(to)) {
      return new Response(JSON.stringify({
        error: "Destination not in allowlist",
        to,
        hint: "Modo prueba: solo se permite enviar a WHATSAPP_TEST_NUMBER (o WHATSAPP_TEST_ALLOWLIST).",
      }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Construir payload Meta ----
    let payload: any;
    if (kind === "template") {
      const name = body?.template_name ?? "hello_world";
      const lang = body?.template_lang ?? "en_US";
      payload = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: { name, language: { code: lang } },
      };
    } else if (kind === "text") {
      const text = String(body?.text ?? "").trim();
      if (!text) return new Response(JSON.stringify({ error: "Missing 'text' for kind=text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      payload = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text, preview_url: false },
      };
    } else {
      return new Response(JSON.stringify({ error: `Unsupported kind: ${kind}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Llamada a Meta ----
    const resp = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const respBody = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error("[whatsapp-send-test] Meta error", resp.status, respBody);
      return new Response(JSON.stringify({
        ok: false,
        meta_status: resp.status,
        meta_error: respBody?.error ?? respBody,
        hint: respBody?.error?.code === 131030
          ? "Tu número no está en allowlist en Meta. Añádelo en WhatsApp Manager → Configuración → Números permitidos."
          : respBody?.error?.code === 131009
          ? "Fuera de ventana 24h. Usa kind=template con un template aprobado (ej. hello_world)."
          : null,
      }, null, 2), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      sent_to: to,
      kind,
      meta_response: respBody,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[whatsapp-send-test] error", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "unknown",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
