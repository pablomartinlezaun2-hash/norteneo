/**
 * coach-audio-script — Genera un script optimizado para voz a partir de un
 * evento de intervención + nombre del atleta.
 *
 * - Usa Lovable AI Gateway (Gemini Flash) por defecto.
 * - El script DEBE empezar con "Buenas, {nombre}, …" o variante permitida.
 * - Salida breve, natural, premium (15-35s al hablar, 45-100 palabras).
 *
 * Esta función NO sintetiza audio. Solo devuelve el script editable.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  athleteFirstName?: string | null;
  eventType: string;
  eventSummary: string;
  metadata?: Record<string, unknown>;
  baseText?: string | null; // texto del mensaje escrito si existe (referencia)
}

const ALLOWED_EVENTS = new Set([
  "reps_out_of_range",
  "missing_set",
  "load_drop",
  "performance_drop",
  "low_sleep",
  "high_fatigue",
  "low_protein",
  "calorie_off_target",
  "low_adherence",
  "progress_milestone",
]);

function buildSystemPrompt(name: string | null): string {
  return [
    "Eres el coach personal del atleta dentro de NEO. Vas a generar un script BREVE para un mensaje de VOZ que se enviará dentro de la app.",
    "Reglas obligatorias:",
    `1. SIEMPRE empieza con un saludo personalizado. Apertura preferente: "Buenas, ${name ?? "{nombre}"}, …". Variantes permitidas: "Hola, ${name ?? "{nombre}"}, …", "Buenas, ${name ?? "{nombre}"}. He visto que…", "Hola, ${name ?? "{nombre}"}. Me ha llegado una alerta de que…".`,
    "2. Tono cercano, calmado, humano, premium. Como un coach real hablando, no un asistente automático.",
    "3. Muy breve: entre 45 y 100 palabras (15-35s al hablar). Máximo 3 frases.",
    "4. Lenguaje natural para voz: contracciones, ritmo conversacional, sin tecnicismos secos.",
    "5. NUNCA uses emojis, viñetas, markdown, números entre paréntesis ni símbolos como % o /. Escribe los números con palabras si son importantes para el oído.",
    "6. NO empieces con la incidencia. NO digas 'Se ha detectado'. NO suenes a sistema.",
    "7. Termina con una pregunta abierta o una invitación cálida (cuándo me cuentas, dime cómo lo ves, etc.) cuando proceda.",
    "8. Devuelve SOLO el texto del script, sin etiquetas, sin comillas envolventes, sin prefijos.",
  ].join("\n");
}

function buildUserPrompt(body: Body): string {
  const { eventType, eventSummary, metadata, baseText } = body;
  const lines = [
    `Tipo de evento: ${eventType}`,
    `Resumen interno (no leer literal): ${eventSummary}`,
  ];
  if (metadata && Object.keys(metadata).length > 0) {
    lines.push(`Datos: ${JSON.stringify(metadata)}`);
  }
  if (baseText) {
    lines.push(`Texto del mensaje escrito relacionado (referencia, no lo copies literal): ${baseText}`);
  }
  lines.push("Genera ahora el script de voz cumpliendo TODAS las reglas.");
  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Body;
    if (!body.eventType || !ALLOWED_EVENTS.has(body.eventType)) {
      return new Response(
        JSON.stringify({ error: `eventType inválido: ${body.eventType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!body.eventSummary || typeof body.eventSummary !== "string") {
      return new Response(
        JSON.stringify({ error: "eventSummary requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const name = (body.athleteFirstName ?? "").trim() || null;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: buildSystemPrompt(name) },
            { role: "user", content: buildUserPrompt(body) },
          ],
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas peticiones. Inténtalo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Sin créditos en Lovable AI. Añade fondos en el workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiResp.text();
      console.error("[coach-audio-script] AI error", aiResp.status, errText);
      return new Response(
        JSON.stringify({ error: "Error generando script" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await aiResp.json();
    let script: string = json?.choices?.[0]?.message?.content?.toString().trim() ?? "";

    // Post-procesado: eliminar comillas envolventes y caracteres no aptos para voz
    script = script.replace(/^["“”']+|["“”']+$/g, "").trim();

    // Garantizar saludo
    const lower = script.toLowerCase();
    const hasGreeting =
      lower.startsWith("buenas,") ||
      lower.startsWith("hola,") ||
      lower.startsWith("buenas.") ||
      lower.startsWith("hola.");
    if (!hasGreeting) {
      script = (name ? `Buenas, ${name}, ` : "Buenas, ") + script;
    }

    return new Response(JSON.stringify({ script }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[coach-audio-script] error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
