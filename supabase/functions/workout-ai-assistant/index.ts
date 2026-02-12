import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { gymPrompt, swimmingPrompt, runningPrompt, nutritionPrompt } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  gym: gymPrompt,
  swimming: swimmingPrompt,
  running: runningPrompt,
  nutrition: nutritionPrompt,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, workoutType, requestWorkoutStructure } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("[workout-ai-assistant] API key not configured");
      return new Response(
        JSON.stringify({ error: "Servicio temporalmente no disponible." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[workout-ai-assistant] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Por favor, espera un momento." }),
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
        JSON.stringify({ error: "Error al procesar tu solicitud. Inténtalo de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    console.error("[workout-ai-assistant] Internal error:", error);
    
    return new Response(
      JSON.stringify({ error: "Error procesando tu solicitud. Intenta de nuevo más tarde." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
