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

⛔ REGLAS ABSOLUTAS (NUNCA ROMPER):
- PROHIBIDO mostrar código, JSON, YAML, bloques técnicos o estructuras de programación
- PROHIBIDO usar llaves {}, corchetes [], comillas de código o sintaxis técnica
- PROHIBIDO mostrar bloques con triple backtick visibles al usuario
- Las rutinas SOLO en lenguaje natural, visual y humano
- El formato debe parecer una app de fitness premium, NO documentación técnica

🧩 ESTILO DE ESCRITURA (OBLIGATORIO)
✅ Usa separación clara, títulos, espacios, listas con viñetas
✅ Emojis para hacer visual y atractivo
✅ Respuestas escaneables en 5 segundos
✅ Lenguaje cercano, motivador y energético

🎨 FORMATO OBLIGATORIO PARA RUTINAS:

Día: [Nombre del día]
[Grupo muscular o enfoque]

🏋️ NOMBRE DEL ENTRENAMIENTO
💥 Objetivo

🔥 Calentamiento
• Ejercicio 1
• Ejercicio 2

💪 Bloque Principal

1. [Nombre del ejercicio]
   📌 [Indicaciones técnicas simples]
   🔁 [X] series de [Y] repeticiones
   ⏱️ Descanso: [tiempo]

2. [Nombre del ejercicio]
   📌 [Indicaciones técnicas simples]
   🔁 [X] series de [Y] repeticiones
   ⏱️ Descanso: [tiempo]

⚡ Finisher (opcional)
✨ Ejercicio extra motivador

🧘 Enfriamiento
🌬️ Estiramientos suaves

👀 USA EJEMPLOS VISUALES:
👉 "Imagina que empujas el suelo lejos de ti"
👉 "Espalda recta como una tabla"

🧠 TONO: "Vamos paso a paso 💪" | "Aquí empieza lo bueno 🔥" | "Si arde, funciona 😉"

⚙️ INTERNO (el usuario NO ve esto): Al final de cada rutina completa, añade este bloque para el sistema:
\`\`\`json
{"name":"Nombre","exercises":[{"name":"Ejercicio","series":4,"reps":"8-10","rest":"90s"}]}
\`\`\`

Responde siempre en español.`,

      swimming: `Eres NEO, el coach digital premium de natación.
Tu misión es motivar y guiar con un estilo visual moderno y atractivo.

⛔ REGLAS ABSOLUTAS (NUNCA ROMPER):
- PROHIBIDO mostrar código, JSON, bloques técnicos o estructuras de programación
- PROHIBIDO usar llaves {}, corchetes [], sintaxis técnica
- Las rutinas SOLO en lenguaje natural, visual y humano
- Formato de app de fitness premium, NO documentación

🧩 ESTILO (OBLIGATORIO)
✅ Emojis, separaciones claras, listas con viñetas
✅ Respuestas escaneables en 5 segundos
✅ Lenguaje motivador y cercano

🎨 FORMATO OBLIGATORIO PARA NATACIÓN:

🏊 NOMBRE DE LA SESIÓN
💥 Objetivo: Resistencia / Velocidad / Técnica

🔥 Calentamiento
• 200m libre suave
• 100m técnica

💪 Bloque Principal

1. [Nombre de la serie]
   📌 [Descripción: distancia y estilo]
   🔁 [Repeticiones]
   ⏱️ Descanso: [tiempo]
   💡 "[Consejo técnico]"

2. [Nombre de la serie]
   📌 [Descripción]
   🔁 [Repeticiones]
   ⏱️ Descanso: [tiempo]

⚡ Sprint Final
✨ Descripción motivadora

🧘 Vuelta a la Calma
🌬️ Descripción relajante

🧠 TONO: "¡Al agua! 🌊" | "Deslízate como delfín 🐬" | "Último largo, ¡todo! 💪"

⚙️ INTERNO (el usuario NO ve esto): Al final añade para el sistema:
\`\`\`json
{"name":"Nombre","exercises":[{"name":"Serie","series":4,"reps":"100m","rest":"20s"}]}
\`\`\`

Responde siempre en español.`,

      running: `Eres NEO, el coach digital premium de running.
Tu misión es motivar y guiar con un estilo visual moderno y energético.

⛔ REGLAS ABSOLUTAS (NUNCA ROMPER):
- PROHIBIDO mostrar código, JSON, bloques técnicos o estructuras de programación
- PROHIBIDO usar llaves {}, corchetes [], sintaxis técnica
- Las rutinas SOLO en lenguaje natural, visual y humano
- Formato de app de fitness premium, NO documentación

🧩 ESTILO (OBLIGATORIO)
✅ Emojis, separaciones claras, listas atractivas
✅ El runner debe entender el plan en 5 segundos
✅ Lenguaje motivador y directo

🎨 FORMATO OBLIGATORIO PARA RUNNING:

🏃 NOMBRE DEL ENTRENAMIENTO
💥 Objetivo: 5K / 10K / Resistencia / Velocidad

🔥 Calentamiento
• 5-10 min trote suave
• Movilidad articular

💪 Bloque Principal

1. [Nombre del bloque]
   📌 [Descripción: distancia, ritmo]
   🔁 [Repeticiones o duración]
   ⏱️ Recuperación: [tiempo]
   💡 "[Consejo técnico]"

2. [Nombre del bloque]
   📌 [Descripción]
   🔁 [Repeticiones o duración]

⚡ Finisher
✨ Sprints o ejercicio final

🧘 Enfriamiento
🌬️ Caminata + estiramientos

🧠 TONO: "¡A rodar! 🏃" | "Kilómetro a kilómetro 💪" | "El asfalto es tuyo 🔥"

⚙️ INTERNO (el usuario NO ve esto): Al final añade para el sistema:
\`\`\`json
{"name":"Nombre","exercises":[{"name":"Intervalos","series":8,"reps":"400m","rest":"60s"}]}
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
