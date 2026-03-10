import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VB2FollowUpData {
  vb2_enabled: boolean;
  updated_at: string | null;
  // Latest fatigue
  global_fatigue: number | null;
  readiness_score: number | null;
  recovery_trend: string | null;
  alert_level: string | null;
  // Weekly adherence
  weekly_adherence: number | null;
  // Coach message (safe, non-private)
  coach_message: string | null;
  coach_message_date: string | null;
}

async function rpc(table: string, columns: string, filters: Record<string, any>, orderBy?: string, limit?: number) {
  let q = (supabase as any).from(table).select(columns);
  for (const [k, v] of Object.entries(filters)) {
    if (Array.isArray(v)) q = q.in(k, v);
    else q = q.eq(k, v);
  }
  if (orderBy) q = q.order(orderBy, { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  return { data: data as any[] | null, error };
}

export function useVB2FollowUp() {
  const { user } = useAuth();
  const [data, setData] = useState<VB2FollowUpData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      // Get profile
      const { data: profiles } = await rpc('profiles', 'id, vb2_enabled, updated_at', { user_id: user!.id }, undefined, 1);
      const profile = profiles?.[0];
      if (!profile || !profile.vb2_enabled) {
        setData(null);
        setLoading(false);
        return;
      }

      const pid = profile.id;

      // Fetch in parallel
      const [fatigueRes, metricsRes, adherenceRes] = await Promise.all([
        rpc('fatigue_state', 'global_fatigue, alert_level, recovery_trend, date', { user_id: pid }, 'date', 1),
        rpc('athlete_metrics', 'readiness_score, date', { user_id: pid }, 'date', 1),
        rpc('adherence_logs', 'total_adherence, date', { user_id: pid }, 'date', 7),
      ]);

      const fatigue = fatigueRes.data?.[0];
      const metrics = metricsRes.data?.[0];
      const adherenceLogs = adherenceRes.data ?? [];

      // Compute weekly avg adherence
      const weeklyAdherence = adherenceLogs.length > 0
        ? Math.round(adherenceLogs.reduce((s: number, a: any) => s + (a.total_adherence ?? 0), 0) / adherenceLogs.length)
        : null;

      // Note: coach_notes are coach-only (RLS blocks athlete reads).
      // We don't query them here. If a safe "follow-up message" field is needed
      // in the future, it should be stored on a separate athlete-visible table.

      setData({
        vb2_enabled: true,
        updated_at: profile.updated_at,
        global_fatigue: fatigue?.global_fatigue ?? null,
        readiness_score: metrics?.readiness_score ?? null,
        recovery_trend: fatigue?.recovery_trend ?? null,
        alert_level: fatigue?.alert_level ?? null,
        weekly_adherence: weeklyAdherence,
        coach_message: null, // Future: from a dedicated athlete-visible table
        coach_message_date: null,
      });
    } catch (err) {
      console.error('VB2 follow-up fetch error:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, refetch: fetchData };
}
