import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, workoutType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompts: Record<string, string> = {
      gym: `Eres un entrenador personal experto en musculación y fitness. Tu nombre es NEO Assistant.
Tu objetivo es ayudar a los usuarios a diseñar rutinas de gimnasio personalizadas basándose en:
- Sus objetivos (hipertrofia, fuerza, resistencia, pérdida de grasa)
- Días disponibles para entrenar
- Nivel de experiencia
- Limitaciones o lesiones

Cuando des recomendaciones de ejercicios, sé específico con:
- Nombre del ejercicio
- Series y repeticiones recomendadas
- Descanso entre series
- Consejos de ejecución

Usa un tono motivador pero profesional. Responde siempre en español.`,

      swimming: `Eres un entrenador de natación experto. Tu nombre es NEO Assistant.
Tu objetivo es ayudar a los usuarios a diseñar sesiones de natación personalizadas basándose en:
- Sus objetivos (resistencia, velocidad, técnica, triatlón)
- Nivel de natación
- Tiempo disponible por sesión
- Estilos preferidos

Cuando des recomendaciones, incluye:
- Calentamiento apropiado
- Series con distancias y estilos
- Tiempos de descanso
- Vuelta a la calma

Usa un tono motivador pero profesional. Responde siempre en español.`,

      running: `Eres un entrenador de running experto. Tu nombre es NEO Assistant.
Tu objetivo es ayudar a los usuarios a diseñar planes de entrenamiento de carrera basándose en:
- Sus objetivos (5K, 10K, media maratón, maratón, o simplemente mejorar)
- Nivel de experiencia
- Días disponibles para entrenar
- Volumen semanal actual

Cuando des recomendaciones, incluye:
- Tipos de entrenamientos (rodajes, series, tempo, fartlek)
- Distancias y ritmos apropiados
- Días de descanso
- Progresión semanal

Usa un tono motivador pero profesional. Responde siempre en español.`
    };

    const systemPrompt = systemPrompts[workoutType] || systemPrompts.gym;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content
          })),
        ],
        stream: false,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido. Inténtalo de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados. Contacta con soporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in workout-ai-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
