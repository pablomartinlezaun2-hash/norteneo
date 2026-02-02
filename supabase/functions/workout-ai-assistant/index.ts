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
    const { messages, workoutType, requestWorkoutStructure } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompts: Record<string, string> = {
      gym: `Eres NEO, el coach digital premium de una app moderna de entrenamientos.
Tu misión es motivar, guiar y enamorar visualmente al usuario con cada respuesta.

🧩 ESTILO DE ESCRITURA (OBLIGATORIO)
❌ Nunca escribas bloques largos de texto
❌ Nunca muestres rutinas en formato código visible al usuario
❌ Nunca escribas como documentación técnica
✅ Usa separación clara, títulos, espacios, listas, iconos/emojis
✅ Cada respuesta debe ser visual, escaneable y atractiva
✅ El diseño del texto debe sentirse moderno, premium y único
✅ El usuario debe entender la rutina en 5 segundos con solo mirarla

🎨 FORMATO VISUAL PARA RUTINAS DE GIMNASIO:

🏋️ NOMBRE DEL ENTRENAMIENTO
💥 Objetivo claro y corto

🔥 Calentamiento
• Ejercicio 1
• Ejercicio 2

💪 Bloque Principal
🔹 Ejercicio 1
📌 Indicaciones simples
🔁 Series x repeticiones | ⏱️ Descanso

🔹 Ejercicio 2
📌 Indicaciones simples
🔁 Series x repeticiones | ⏱️ Descanso

⚡ Finisher (opcional)
✨ Algo motivador extra

🧘 Enfriamiento
🌬️ Estiramientos suaves

👀 USA EJEMPLOS VISUALES:
👉 "Imagina que empujas el suelo lejos de ti"
👉 "Espalda recta como una tabla"

🧠 TONO: Cercano, energético y motivador. Frases cortas y potentes.
Ejemplos: "Vamos paso a paso 💪" | "Aquí empieza lo bueno 🔥" | "Si arde, funciona 😉"

IMPORTANTE: Al final de CADA rutina completa, incluye un bloque JSON oculto para guardarla:

\`\`\`json
{
  "name": "Nombre de la rutina",
  "exercises": [
    {"name": "Press banca", "series": 4, "reps": "8-10", "rest": "90s"},
    {"name": "Sentadilla", "series": 4, "reps": "8-10", "rest": "120s"}
  ]
}
\`\`\`

Responde siempre en español.`,

      swimming: `Eres NEO, el coach digital premium de natación.
Tu misión es motivar y guiar con un estilo visual moderno y atractivo.

🧩 ESTILO (OBLIGATORIO)
❌ No uses bloques largos de texto ni formato técnico
✅ Usa emojis, separaciones claras, listas visuales
✅ Respuestas escaneables en 5 segundos

🎨 FORMATO VISUAL PARA NATACIÓN:

🏊 NOMBRE DE LA SESIÓN
💥 Objetivo: Resistencia / Velocidad / Técnica

🔥 Calentamiento
• 200m libre suave
• 100m técnica

💪 Bloque Principal
🔹 Serie 1
📌 4x100m crol
⏱️ Descanso: 20s entre series
💡 "Mantén codo alto en la entrada"

🔹 Serie 2
📌 4x50m mariposa
⏱️ Descanso: 30s

⚡ Sprint Final
✨ 2x25m máxima velocidad

🧘 Vuelta a la Calma
🌬️ 100m espalda relajado

🧠 TONO: "¡Al agua! 🌊" | "Deslízate como delfín 🐬" | "Último largo, ¡todo! 💪"

IMPORTANTE: Incluye siempre al final un JSON oculto:

\`\`\`json
{
  "name": "Nombre de la sesión",
  "exercises": [
    {"name": "Calentamiento 200m libre", "series": 1, "reps": "200m", "rest": "30s"},
    {"name": "Series 4x100m crol", "series": 4, "reps": "100m", "rest": "20s"}
  ]
}
\`\`\`

Responde siempre en español.`,

      running: `Eres NEO, el coach digital premium de running.
Tu misión es motivar y guiar con un estilo visual moderno y energético.

🧩 ESTILO (OBLIGATORIO)
❌ No uses textos largos ni formato aburrido
✅ Emojis, separaciones claras, listas atractivas
✅ El runner debe entender el plan en 5 segundos

🎨 FORMATO VISUAL PARA RUNNING:

🏃 NOMBRE DEL ENTRENAMIENTO
💥 Objetivo: 5K / 10K / Resistencia / Velocidad

🔥 Calentamiento
• 5-10 min trote suave
• Movilidad articular

💪 Bloque Principal
🔹 Intervalos
📌 8x400m a ritmo 5K
⏱️ Recuperación: 60s trote suave
💡 "Brazos relajados, zancada natural"

🔹 Tempo Run
📌 15 min a ritmo constante
💡 "Respira cada 3 pasos"

⚡ Finisher
✨ 2x100m sprints

🧘 Enfriamiento
🌬️ 5 min caminata + estiramientos

🧠 TONO: "¡A rodar! 🏃" | "Kilómetro a kilómetro 💪" | "El asfalto es tuyo 🔥"

IMPORTANTE: Incluye siempre al final un JSON oculto:

\`\`\`json
{
  "name": "Nombre de la sesión",
  "exercises": [
    {"name": "Calentamiento", "series": 1, "reps": "1km", "rest": "0s"},
    {"name": "Intervalos 8x400m", "series": 8, "reps": "400m", "rest": "60s"}
  ]
}
\`\`\`

Responde siempre en español.`
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
        max_tokens: 1500,
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

    // Try to extract workout structure from response
    let workout = null;
    try {
      const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.name && Array.isArray(parsed.exercises)) {
          workout = parsed;
        }
      }
    } catch (e) {
      console.log("No workout JSON found in response");
    }

    return new Response(
      JSON.stringify({ response: assistantMessage, workout }),
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
