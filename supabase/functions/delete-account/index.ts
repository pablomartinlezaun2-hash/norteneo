import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to get their ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Use service role to delete all user data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete all user data from all tables
    const tables = [
      "supplement_notification_history",
      "supplement_logs",
      "supplement_reminders",
      "user_supplements",
      "food_logs",
      "nutrition_goals",
      "set_logs",
      "exercise_notes",
      "completed_sessions",
      "activity_completions",
      "cardio_session_intervals",
      "cardio_session_logs",
      "profiles",
    ];

    for (const table of tables) {
      await adminClient.from(table).delete().eq("user_id", userId);
    }

    // Delete cardio intervals via session logs (they use session_log_id, not user_id)
    // Already handled: cardio_session_intervals are deleted via cascade or we delete session_logs after

    // Delete exercises -> sessions -> programs (cascading order)
    const { data: programs } = await adminClient
      .from("training_programs")
      .select("id")
      .eq("user_id", userId);

    if (programs && programs.length > 0) {
      const programIds = programs.map((p) => p.id);

      const { data: sessions } = await adminClient
        .from("workout_sessions")
        .select("id")
        .in("program_id", programIds);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);
        await adminClient.from("exercises").delete().in("session_id", sessionIds);
        await adminClient.from("workout_sessions").delete().in("program_id", programIds);
      }

      await adminClient.from("training_programs").delete().eq("user_id", userId);
    }

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
