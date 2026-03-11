import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Helper to query tables not yet in generated types
async function rpcSelect(table: string, columns: string, filters: Record<string, any> = {}, orderBy?: string, limit?: number) {
  let query = (supabase as any).from(table).select(columns);
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  }
  if (orderBy) query = query.order(orderBy, { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  return { data: data as any[] | null, error };
}

async function rpcInsert(table: string, row: Record<string, any>) {
  const { data, error } = await (supabase as any).from(table).insert(row).select();
  return { data: data as any[] | null, error };
}

export interface AthleteDetailData {
  // Fatigue state
  fatigue: {
    muscular_fatigue: number | null;
    neuro_fatigue: number | null;
    connective_fatigue: number | null;
    global_fatigue: number | null;
    alert_level: string | null;
    recovery_trend: string | null;
    date: string | null;
  } | null;
  // Adherence
  adherence: {
    training_adherence: number | null;
    nutrition_adherence: number | null;
    sleep_adherence: number | null;
    supplement_adherence: number | null;
    total_adherence: number | null;
    microcycle_adherence: number | null;
    date: string | null;
  } | null;
  // Metrics
  metrics: {
    weight: number | null;
    sleep_hours: number | null;
    sleep_quality: string | null;
    stress_level: string | null;
    fatigue_subjective: number | null;
    readiness_score: number | null;
    mental_load: string | null;
    injuries_or_discomfort: string | null;
    date: string | null;
  } | null;
  // Training sessions
  trainingSessions: {
    id: string;
    date: string;
    session_type: string | null;
    microcycle_name: string | null;
    planned: boolean;
    completed: boolean;
    deviation_score: number | null;
    notes: string | null;
  }[];
  // Nutrition daily
  nutrition: {
    calories_target: number | null;
    calories_actual: number | null;
    protein_target: number | null;
    protein_actual: number | null;
    carbs_target: number | null;
    carbs_actual: number | null;
    fats_target: number | null;
    fats_actual: number | null;
    hydration_status: string | null;
    date: string | null;
  } | null;
  // Alerts
  alerts: {
    id: string;
    date: string;
    alert_type: string | null;
    alert_title: string | null;
    alert_message: string | null;
    severity: string | null;
    is_active: boolean;
  }[];
  // History (last 14 days)
  fatigueHistory: { date: string; global_fatigue: number | null }[];
  adherenceHistory: { date: string; total_adherence: number | null }[];
  weightHistory: { date: string; weight: number | null }[];
  // Coach notes
  coachNotes: {
    id: string;
    note: string | null;
    priority: string | null;
    created_at: string;
  }[];
}

export function useAthleteDetail(athleteProfileId: string | null) {
  const { user } = useAuth();
  const [data, setData] = useState<AthleteDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteProfileId || !user) {
      setData(null);
      setLoading(false);
      return;
    }
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteProfileId, user]);

  async function fetchDetail() {
    if (!athleteProfileId || !user) return;
    setLoading(true);
    setError(null);

    try {
      // Get coach profile id for notes
      const { data: coachProfiles } = await rpcSelect('profiles', 'id', { user_id: user.id });
      const coachProfileId = coachProfiles?.[0]?.id;

      // Fetch all data in parallel
      const [
        fatigueRes,
        adherenceRes,
        metricsRes,
        trainingRes,
        nutritionRes,
        alertsRes,
        fatigueHistRes,
        adherenceHistRes,
        weightHistRes,
        notesRes,
      ] = await Promise.all([
        rpcSelect('fatigue_state', '*', { user_id: athleteProfileId }, 'date', 1),
        rpcSelect('adherence_logs', '*', { user_id: athleteProfileId }, 'date', 1),
        rpcSelect('athlete_metrics', '*', { user_id: athleteProfileId }, 'date', 1),
        rpcSelect('coach_training_sessions', '*', { user_id: athleteProfileId }, 'date', 10),
        rpcSelect('nutrition_daily', '*', { user_id: athleteProfileId }, 'date', 1),
        rpcSelect('coach_performance_alerts', '*', { user_id: athleteProfileId, is_active: true }, 'date'),
        rpcSelect('fatigue_state', 'date, global_fatigue', { user_id: athleteProfileId }, 'date', 14),
        rpcSelect('adherence_logs', 'date, total_adherence', { user_id: athleteProfileId }, 'date', 14),
        rpcSelect('athlete_metrics', 'date, weight', { user_id: athleteProfileId }, 'date', 14),
        coachProfileId
          ? rpcSelect('coach_notes', '*', { athlete_id: athleteProfileId, coach_id: coachProfileId }, 'created_at')
          : Promise.resolve({ data: [], error: null }),
      ]);

      const f = fatigueRes.data?.[0];
      const a = adherenceRes.data?.[0];
      const m = metricsRes.data?.[0];
      const n = nutritionRes.data?.[0];

      setData({
        fatigue: f ? {
          muscular_fatigue: f.muscular_fatigue,
          neuro_fatigue: f.neuro_fatigue,
          connective_fatigue: f.connective_fatigue,
          global_fatigue: f.global_fatigue,
          alert_level: f.alert_level,
          recovery_trend: f.recovery_trend,
          date: f.date,
        } : null,
        adherence: a ? {
          training_adherence: a.training_adherence,
          nutrition_adherence: a.nutrition_adherence,
          sleep_adherence: a.sleep_adherence,
          supplement_adherence: a.supplement_adherence,
          total_adherence: a.total_adherence,
          microcycle_adherence: a.microcycle_adherence,
          date: a.date,
        } : null,
        metrics: m ? {
          weight: m.weight,
          sleep_hours: m.sleep_hours,
          sleep_quality: m.sleep_quality,
          stress_level: m.stress_level,
          fatigue_subjective: m.fatigue_subjective,
          readiness_score: m.readiness_score,
          mental_load: m.mental_load,
          date: m.date,
        } : null,
        trainingSessions: (trainingRes.data ?? []).map((t: any) => ({
          id: t.id,
          date: t.date,
          session_type: t.session_type,
          microcycle_name: t.microcycle_name,
          planned: t.planned,
          completed: t.completed,
          deviation_score: t.deviation_score,
          notes: t.notes,
        })),
        nutrition: n ? {
          calories_target: n.calories_target,
          calories_actual: n.calories_actual,
          protein_target: n.protein_target,
          protein_actual: n.protein_actual,
          carbs_target: n.carbs_target,
          carbs_actual: n.carbs_actual,
          fats_target: n.fats_target,
          fats_actual: n.fats_actual,
          hydration_status: n.hydration_status,
          date: n.date,
        } : null,
        alerts: (alertsRes.data ?? []).map((al: any) => ({
          id: al.id,
          date: al.date,
          alert_type: al.alert_type,
          alert_title: al.alert_title,
          alert_message: al.alert_message,
          severity: al.severity,
          is_active: al.is_active,
        })),
        fatigueHistory: (fatigueHistRes.data ?? []).map((r: any) => ({ date: r.date, global_fatigue: r.global_fatigue })).reverse(),
        adherenceHistory: (adherenceHistRes.data ?? []).map((r: any) => ({ date: r.date, total_adherence: r.total_adherence })).reverse(),
        weightHistory: (weightHistRes.data ?? []).map((r: any) => ({ date: r.date, weight: r.weight })).reverse(),
        coachNotes: (notesRes.data ?? []).map((n: any) => ({
          id: n.id,
          note: n.note,
          priority: n.priority,
          created_at: n.created_at,
        })),
      });
    } catch (err) {
      console.error('Athlete detail fetch error:', err);
      setError('Error cargando datos del atleta');
    } finally {
      setLoading(false);
    }
  }

  async function addNote(note: string, priority: string) {
    if (!athleteProfileId || !user) return { error: 'No auth' };
    const { data: coachProfiles } = await rpcSelect('profiles', 'id', { user_id: user.id });
    const coachProfileId = coachProfiles?.[0]?.id;
    if (!coachProfileId) return { error: 'No coach profile' };

    const { error: insertErr } = await rpcInsert('coach_notes', {
      athlete_id: athleteProfileId,
      coach_id: coachProfileId,
      note,
      priority,
    });

    if (!insertErr) {
      await fetchDetail();
    }
    return { error: insertErr?.message ?? null };
  }

  return { data, loading, error, refetch: fetchDetail, addNote };
}
