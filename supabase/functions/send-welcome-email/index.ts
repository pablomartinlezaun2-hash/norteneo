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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("[send-welcome-email] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Servicio de email no configurado" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
        <div style="background: #000000; border-radius: 16px; padding: 40px; text-align: center;">
          <div style="background: #ffffff; display: inline-block; border-radius: 12px; padding: 12px 24px; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: 800; color: #000000; letter-spacing: -0.5px;">NEO</span>
          </div>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 16px 0;">
            ¡Bienvenido/a a NEO! 🎉
          </h1>
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Nos alegra mucho que te hayas unido. NEO es tu compañero integral de entrenamiento y nutrición, diseñado para ayudarte a alcanzar tus objetivos fitness.
          </p>
          <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left;">
            <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">
              🚀 ¿Qué puedes hacer con NEO?
            </p>
            <ul style="color: #d1d5db; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
              <li>Crear y gestionar tus programas de entrenamiento</li>
              <li>Registrar tus sesiones de running y natación</li>
              <li>Controlar tu nutrición y suplementación</li>
              <li>Consultar a tu asistente de IA personalizado</li>
              <li>Visualizar tu progreso con gráficas detalladas</li>
            </ul>
          </div>
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
            ¡Empieza creando tu primer plan de entrenamiento y da el primer paso hacia tus metas! 💪
          </p>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          © ${new Date().getFullYear()} NEO Fitness. Todos los derechos reservados.
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NEO Fitness <onboarding@resend.dev>",
        to: [email],
        subject: "¡Bienvenido/a a NEO! 🎉 Tu viaje fitness comienza aquí",
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[send-welcome-email] Resend error:", res.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Error al enviar el email de bienvenida" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-welcome-email] Email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-welcome-email] Internal error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
