import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const buildSystemPrompt = (userName?: string) => {
  const greeting = userName ? `El usuario se llama **${userName}**. Dirígete a él/ella por su nombre de forma natural.` : '';
  
  return `Eres NEO, asistente técnico de NEO Training. ${greeting}

ESTILO OBLIGATORIO:
- Respuestas BREVES: máximo 2-3 frases por punto. Ve directo al grano.
- Tono profesional y técnico, sin rodeos ni introducciones innecesarias.
- Usa negritas para conceptos clave. Máximo 1 emoji por respuesta.
- Si preguntan algo que no existe en la app, dilo directamente.
- Para dudas de entrenamiento (no de la app), responde brevemente y sugiere el Asistente IA de Entrenamientos.

CONOCIMIENTO DE LA APP:

**Entrenamientos**: Rutinas del programa activo con ejercicios pautados (series, reps, RIR). Registro por serie con peso/reps/RIR real. Temporizador de descanso. Marcado de sesión completada.

**Diseñador de Rutinas**: Creación de programas desde cero. Sesiones con ejercicios del catálogo, series, rango de reps, descanso y técnicas especiales.

**Catálogo de Ejercicios**: Base de datos filtrable por músculo/equipamiento. Incluye ejecución técnica, músculos implicados y consejos.

**Progreso y Análisis**: Gráficos de evolución por ejercicio. **Alertas de Rendimiento** con clasificación automática (Estable <4%, Mejora clara 4-6%, Mejora fuerte 6-8.5%, Mejora atípica 8.5-12%, Muy atípica >12%; equivalente para caídas; >30% = posible error). Sparklines, explicaciones técnicas y recomendaciones. **Análisis de Microciclo** por IA. **Resumen Mensual**. **Radar Muscular** de balance de carga.

**Nutrición**: Objetivos calóricos/macros. Registro de comidas con catálogo. Anillos de progreso. Análisis de adherencia. Suplementos con recordatorios. Registro de sueño. Recetas.

**Autorregulación**: Check-in pre-entreno (energía, dolor, estrés, motivación, sueño). NEO recomienda ajustes de RIR o series. Cambios aceptados se muestran con etiqueta "RIR X Neo" en rojo.

**Periodización**: Mesociclos y microciclos para planificación a largo plazo.

**Coach (Premium)**: Chat coach-atleta en tiempo real. Métricas de fatiga/adherencia/readiness. Notas privadas y alertas compartidas.

**Mapa de Fatiga**: Modelo anatómico 2D con colores (verde→rojo) indicando fatiga acumulada por grupo muscular.

**Asistente IA de Entrenamientos**: Chat IA para diseño de rutinas de gym, natación y running con guardado directo.

**Perfil**: Datos personales, tema claro/oscuro, idioma, exportación de datos, suscripción.`;
};


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Servicio temporalmente no disponible." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: buildSystemPrompt(userName) },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[neo-help-assistant] AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Espera un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Error al procesar tu solicitud." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[neo-help-assistant] Internal error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno. Intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
