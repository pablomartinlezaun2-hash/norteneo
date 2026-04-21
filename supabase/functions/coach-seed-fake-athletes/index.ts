/**
 * coach-seed-fake-athletes
 *
 * Crea 3 atletas fake vinculados al coach Marta y siembra varios eventos
 * de intervención por atleta (mezcla de tipos para audio + texto).
 *
 * Idempotente: si los emails ya existen, reutiliza los perfiles.
 *
 * Llamar SIN body. Devuelve el resumen de IDs creados.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COACH_PROFILE_ID = "ab5265b7-6b0f-4a44-91a3-b3ff310cee18"; // Marta

interface AthleteSeed {
  email: string;
  display_name: string;
  full_name: string;
  active_model: "VB1" | "VB2";
  vb2_enabled: boolean;
  age: number;
  weight: number;
  height: number;
  disciplines: string[];
  years_training: string;
  main_goal: string;
}

const ATHLETES: AthleteSeed[] = [
  {
    email: "alvaro.fake@neo.app",
    display_name: "Álvaro Ruiz",
    full_name: "Álvaro Ruiz Pérez",
    active_model: "VB2",
    vb2_enabled: true,
    age: 28, weight: 82, height: 178,
    disciplines: ["gym", "running"],
    years_training: "3-5",
    main_goal: "Ganar masa muscular",
  },
  {
    email: "lucia.fake@neo.app",
    display_name: "Lucía Fernández",
    full_name: "Lucía Fernández García",
    active_model: "VB1",
    vb2_enabled: false,
    age: 24, weight: 58, height: 164,
    disciplines: ["gym"],
    years_training: "<1",
    main_goal: "Perder grasa",
  },
  {
    email: "carlos.fake@neo.app",
    display_name: "Carlos Méndez",
    full_name: "Carlos Méndez Soler",
    active_model: "VB2",
    vb2_enabled: true,
    age: 31, weight: 90, height: 183,
    disciplines: ["gym", "running", "swimming"],
    years_training: "5+",
    main_goal: "Mejorar rendimiento",
  },
];

// Eventos por atleta: mezcla de audio (low_sleep, performance_drop, high_fatigue,
// low_adherence, progress_milestone) y texto (reps_out_of_range, missing_set,
// load_drop, low_protein, calorie_off_target).
type EventType =
  | "low_sleep" | "performance_drop" | "high_fatigue" | "low_adherence" | "progress_milestone"
  | "reps_out_of_range" | "missing_set" | "load_drop" | "low_protein" | "calorie_off_target";

interface SeedEvent {
  event_type: EventType;
  severity: "low" | "medium" | "high";
  summary: string;
  metadata: Record<string, unknown>;
}

const EVENTS_BY_EMAIL: Record<string, SeedEvent[]> = {
  "alvaro.fake@neo.app": [
    {
      event_type: "low_sleep", severity: "high",
      summary: "Sueño bajo: media de 5h en los últimos 3 días",
      metadata: { avg_sleep_hours: 5.2, days: 3 },
    },
    {
      event_type: "performance_drop", severity: "high",
      summary: "Caída de rendimiento del 12% en press banca",
      metadata: { exercise: "Press banca", drop_pct: 12 },
    },
    {
      event_type: "load_drop", severity: "medium",
      summary: "Bajada de carga en sentadilla (-10kg vs sesión previa)",
      metadata: { exercise: "Sentadilla", delta_kg: -10 },
    },
  ],
  "lucia.fake@neo.app": [
    {
      event_type: "low_adherence", severity: "high",
      summary: "Adherencia 58% esta semana (3 sesiones perdidas)",
      metadata: { adherence_pct: 58, missed_sessions: 3 },
    },
    {
      event_type: "low_protein", severity: "medium",
      summary: "Proteína por debajo del objetivo 4 días seguidos",
      metadata: { avg_protein_g: 62, target_g: 110 },
    },
    {
      event_type: "missing_set", severity: "low",
      summary: "Serie no registrada en última sesión de pull",
      metadata: { exercise: "Remo polea", set: 3 },
    },
  ],
  "carlos.fake@neo.app": [
    {
      event_type: "high_fatigue", severity: "high",
      summary: "Fatiga acumulada alta tras pico de volumen",
      metadata: { fatigue_index: 84, trend: "rising" },
    },
    {
      event_type: "progress_milestone", severity: "low",
      summary: "Nuevo récord en peso muerto: 180kg x 3",
      metadata: { exercise: "Peso muerto", weight_kg: 180, reps: 3 },
    },
    {
      event_type: "calorie_off_target", severity: "medium",
      summary: "Calorías 18% por debajo del objetivo en día de gym",
      metadata: { delta_pct: -18, day_type: "training" },
    },
    {
      event_type: "reps_out_of_range", severity: "low",
      summary: "Reps fuera del rango pautado en curl bíceps",
      metadata: { exercise: "Curl bíceps", target: "8-10", actual: 14 },
    },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Array<Record<string, unknown>> = [];

    for (const seed of ATHLETES) {
      // 1) Asegurar usuario en auth.users
      let userId: string | null = null;

      // listUsers no permite filtro por email directamente; intentamos crearlo
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: seed.email,
        email_confirm: true,
        password: crypto.randomUUID(), // contraseña aleatoria, atleta fake
        user_metadata: { full_name: seed.full_name, fake: true },
      });

      if (createErr) {
        // Si ya existe, lo buscamos paginando (máx 200 usuarios para este seed)
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = list?.users?.find((u) => u.email === seed.email);
        if (!found) {
          results.push({ email: seed.email, error: createErr.message });
          continue;
        }
        userId = found.id;
      } else {
        userId = created.user!.id;
      }

      // 2) Asegurar perfil
      let { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!profile) {
        const { data: newProfile, error: profErr } = await admin
          .from("profiles")
          .insert({
            user_id: userId,
            display_name: seed.display_name,
            full_name: seed.full_name,
            email: seed.email,
            role: "athlete",
            active_model: seed.active_model,
            vb2_enabled: seed.vb2_enabled,
            coach_id: COACH_PROFILE_ID,
            age: seed.age, weight: seed.weight, height: seed.height,
            disciplines: seed.disciplines,
            years_training: seed.years_training,
            main_goal: seed.main_goal,
          })
          .select("id")
          .single();
        if (profErr) {
          results.push({ email: seed.email, error: `profile: ${profErr.message}` });
          continue;
        }
        profile = newProfile;
      } else {
        // Asegurar vínculo con coach
        await admin
          .from("profiles")
          .update({ coach_id: COACH_PROFILE_ID })
          .eq("id", profile.id);
      }

      // 3) Sembrar eventos (idempotente: borra los previos del mismo coach+atleta+source_table='seed')
      await admin
        .from("coach_intervention_events")
        .delete()
        .eq("coach_id", COACH_PROFILE_ID)
        .eq("athlete_id", profile.id)
        .eq("source_table", "seed");

      const events = EVENTS_BY_EMAIL[seed.email] ?? [];
      const rows = events.map((e) => ({
        coach_id: COACH_PROFILE_ID,
        athlete_id: profile!.id,
        event_type: e.event_type,
        severity: e.severity,
        summary: e.summary,
        metadata: e.metadata,
        source_table: "seed",
        status: "pending",
      }));

      const { data: inserted, error: evErr } = await admin
        .from("coach_intervention_events")
        .insert(rows)
        .select("id, event_type");

      results.push({
        email: seed.email,
        profile_id: profile.id,
        user_id: userId,
        events_inserted: inserted?.length ?? 0,
        events: inserted,
        event_error: evErr?.message ?? null,
      });
    }

    return new Response(JSON.stringify({ ok: true, coach_id: COACH_PROFILE_ID, results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[coach-seed-fake-athletes] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
