import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseName, setLogs, pctChange, alertType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Servicio no disponible." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build a concise data summary for the AI
    const dataLines = setLogs
      .slice(-30) // Last 30 sets max
      .map(
        (s: any) =>
          `${s.date} | ${s.weight}kg × ${s.reps} reps | RIR: ${s.rir ?? "?"} | e1RM: ${s.est_1rm?.toFixed(1) ?? "?"}`
      )
      .join("\n");

    const systemPrompt = `Eres un analista de rendimiento deportivo. Responde SOLO en español.
Dado el historial de sets de un ejercicio, genera un resumen breve (3-5 frases máximo) explicando:
- La causa principal del ${alertType === "improvement" ? "progreso" : alertType === "regression" ? "retroceso" : "estancamiento"} (¿fue por cambio de peso, repeticiones, RIR, o combinación?).
- Si el volumen o intensidad cambiaron significativamente.
- Una recomendación breve y concreta.

Sé directo, técnico y conciso. No uses introducciones ni despedidas. No uses markdown, solo texto plano.`;

    const userPrompt = `Ejercicio: ${exerciseName}
Cambio reciente: ${pctChange != null ? (pctChange * 100).toFixed(1) : "?"}%
Tipo de alerta: ${alertType}

Historial de sets (fecha | peso × reps | RIR | e1RM estimado):
${dataLines}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Error al generar resumen." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content ?? "No se pudo generar un resumen.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("exercise-summary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
