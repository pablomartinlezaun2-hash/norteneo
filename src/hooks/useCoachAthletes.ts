import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CoachAthlete {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  active_model: string | null;
  vb2_enabled: boolean;
  age: number | null;
  weight: number | null;
  height: number | null;
  disciplines: string[] | null;
  years_training: string | null;
  main_goal: string | null;
  updated_at: string;
  coach_id: string | null;
  fatigue_level: 'Alta' | 'Media' | 'Baja' | 'Sin datos';
  global_fatigue: number | null;
  total_adherence: number | null;
  last_activity_date: string | null;
  active_alerts_count: number;
  latest_metrics: {
    sleep_hours: number | null;
    stress_level: string | null;
    readiness_score: number | null;
  } | null;
}

export type CoachFilter = 'all' | 'vb1' | 'vb2' | 'high_fatigue' | 'low_adherence';
export type CoachSort = 'adherence' | 'fatigue' | 'last_activity';

function classifyFatigue(value: number | null): 'Alta' | 'Media' | 'Baja' | 'Sin datos' {
  if (value == null) return 'Sin datos';
  if (value >= 70) return 'Alta';
  if (value >= 40) return 'Media';
  return 'Baja';
}

// Helper to query tables not yet in generated types
async function rpcSelect(table: string, columns: string, filters: Record<string, any> = {}, orderBy?: string) {
  let query = (supabase as any).from(table).select(columns);
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  }
  if (orderBy) {
    query = query.order(orderBy, { ascending: false });
  }
  const { data, error } = await query;
  return { data: data as any[] | null, error };
}

export function useCoachAthletes() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<CoachAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CoachFilter>('all');
  const [sort, setSort] = useState<CoachSort>('adherence');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchAthletes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchAthletes() {
    setLoading(true);
    setError(null);

    try {
      // 1. Get or create coach's profile
      let { data: coachProfiles } = await rpcSelect('profiles', 'id, role', { user_id: user!.id });
      let coachProfile = coachProfiles?.[0];

      if (!coachProfile) {
        // Auto-create profile for the coach
        const { data: created, error: createErr } = await (supabase as any)
          .from('profiles')
          .insert({ user_id: user!.id, email: user!.email, role: 'coach' })
          .select('id, role')
          .single();
        if (createErr) {
          console.error('Failed to create coach profile:', createErr);
          setError('Error creando perfil de coach');
          setLoading(false);
          return;
        }
        coachProfile = created;
      } else if (coachProfile.role !== 'coach') {
        // Fix role if not coach
        await (supabase as any)
          .from('profiles')
          .update({ role: 'coach' })
          .eq('user_id', user!.id);
        coachProfile.role = 'coach';
      }

      const coachProfileId = coachProfile.id;

      // 2. Get athletes assigned to this coach
      const { data: athleteProfiles, error: apErr } = await rpcSelect('profiles', '*', { coach_id: coachProfileId });

      if (apErr) {
        setError('Error cargando atletas');
        setLoading(false);
        return;
      }

      if (!athleteProfiles || athleteProfiles.length === 0) {
        setAthletes([]);
        setLoading(false);
        return;
      }

      const profileIds = athleteProfiles.map((p: any) => p.id);

      // 3. Fetch latest data for each athlete in parallel
      const [fatigueRes, adherenceRes, metricsRes, alertsRes] = await Promise.all([
        rpcSelect('fatigue_state', 'user_id, date, global_fatigue', { user_id: profileIds }, 'date'),
        rpcSelect('adherence_logs', 'user_id, date, total_adherence', { user_id: profileIds }, 'date'),
        rpcSelect('athlete_metrics', 'user_id, date, sleep_hours, stress_level, readiness_score', { user_id: profileIds }, 'date'),
        rpcSelect('coach_performance_alerts', 'user_id', { user_id: profileIds, is_active: true }),
      ]);

      // Build lookup maps (latest per user)
      const latestFatigue = new Map<string, { global_fatigue: number | null; date: string }>();
      for (const row of fatigueRes.data ?? []) {
        if (!latestFatigue.has(row.user_id)) {
          latestFatigue.set(row.user_id, { global_fatigue: row.global_fatigue, date: row.date });
        }
      }

      const latestAdherence = new Map<string, { total_adherence: number | null; date: string }>();
      for (const row of adherenceRes.data ?? []) {
        if (!latestAdherence.has(row.user_id)) {
          latestAdherence.set(row.user_id, { total_adherence: row.total_adherence, date: row.date });
        }
      }

      const latestMetrics = new Map<string, { sleep_hours: number | null; stress_level: string | null; readiness_score: number | null }>();
      for (const row of metricsRes.data ?? []) {
        if (!latestMetrics.has(row.user_id)) {
          latestMetrics.set(row.user_id, {
            sleep_hours: row.sleep_hours,
            stress_level: row.stress_level,
            readiness_score: row.readiness_score,
          });
        }
      }

      const alertCounts = new Map<string, number>();
      for (const row of alertsRes.data ?? []) {
        alertCounts.set(row.user_id, (alertCounts.get(row.user_id) ?? 0) + 1);
      }

      // 4. Build athlete objects
      const result: CoachAthlete[] = athleteProfiles.map((p: any) => {
        const fatigue = latestFatigue.get(p.id);
        const adherence = latestAdherence.get(p.id);
        const metrics = latestMetrics.get(p.id);
        const alertCount = alertCounts.get(p.id) ?? 0;

        const dates = [fatigue?.date, adherence?.date].filter(Boolean) as string[];
        const lastActivity = dates.length > 0
          ? dates.sort((a, b) => b.localeCompare(a))[0]
          : null;

        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name ?? p.display_name,
          email: p.email,
          active_model: p.active_model,
          vb2_enabled: p.vb2_enabled ?? false,
          age: p.age,
          weight: p.weight,
          height: p.height,
          disciplines: p.disciplines,
          years_training: p.years_training,
          main_goal: p.main_goal,
          updated_at: p.updated_at,
          fatigue_level: classifyFatigue(fatigue?.global_fatigue ?? null),
          global_fatigue: fatigue?.global_fatigue ?? null,
          total_adherence: adherence?.total_adherence ?? null,
          last_activity_date: lastActivity,
          active_alerts_count: alertCount,
          latest_metrics: metrics ?? null,
        } as CoachAthlete;
      });

      setAthletes(result);
    } catch (err) {
      console.error('Coach athletes fetch error:', err);
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  const filteredAthletes = useMemo(() => {
    let list = [...athletes];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.full_name ?? '').toLowerCase().includes(q) ||
        (a.email ?? '').toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case 'vb1':
        list = list.filter(a => a.active_model === 'VB1');
        break;
      case 'vb2':
        list = list.filter(a => a.active_model === 'VB2');
        break;
      case 'high_fatigue':
        list = list.filter(a => a.fatigue_level === 'Alta');
        break;
      case 'low_adherence':
        list = list.filter(a => (a.total_adherence ?? 0) < 70);
        break;
    }

    switch (sort) {
      case 'adherence':
        list.sort((a, b) => (a.total_adherence ?? 0) - (b.total_adherence ?? 0));
        break;
      case 'fatigue':
        list.sort((a, b) => (b.global_fatigue ?? 0) - (a.global_fatigue ?? 0));
        break;
      case 'last_activity':
        list.sort((a, b) => (b.last_activity_date ?? '').localeCompare(a.last_activity_date ?? ''));
        break;
    }

    return list;
  }, [athletes, filter, sort, search]);

  const kpis = useMemo(() => {
    const total = athletes.length;
    const vb1 = athletes.filter(a => a.active_model === 'VB1').length;
    const vb2 = athletes.filter(a => a.active_model === 'VB2').length;
    const highFatigue = athletes.filter(a => a.fatigue_level === 'Alta').length;
    const avgAdherence = total > 0
      ? Math.round(athletes.reduce((s, a) => s + (a.total_adherence ?? 0), 0) / total)
      : 0;
    const activeAlerts = athletes.reduce((s, a) => s + a.active_alerts_count, 0);
    return { total, vb1, vb2, highFatigue, avgAdherence, activeAlerts };
  }, [athletes]);

  return {
    athletes: filteredAthletes,
    allAthletes: athletes,
    loading,
    error,
    kpis,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    refetch: fetchAthletes,
  };
}
