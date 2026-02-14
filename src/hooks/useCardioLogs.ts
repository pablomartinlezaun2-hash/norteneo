import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CardioInterval {
  id?: string;
  interval_order: number;
  distance_m: number;
  duration_seconds?: number;
  pace_seconds_per_unit?: number;
  pace_unit_m: number;
  rest_seconds?: number;
  notes?: string;
}

export interface CardioSessionLog {
  id: string;
  user_id: string;
  activity_type: 'running' | 'swimming';
  session_name?: string;
  total_distance_m: number;
  total_duration_seconds?: number;
  avg_pace_seconds_per_unit?: number;
  notes?: string;
  completed_at: string;
  created_at: string;
  intervals?: CardioInterval[];
}

export const useCardioLogs = (activityType: 'running' | 'swimming') => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CardioSessionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await (supabase as any)
        .from('cardio_session_logs')
        .select('*, cardio_session_intervals(*)')
        .eq('user_id', user.id)
        .eq('activity_type', activityType)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((s: any) => ({
        ...s,
        intervals: (s.cardio_session_intervals || []).sort(
          (a: any, b: any) => a.interval_order - b.interval_order
        ),
      }));
      setSessions(mapped);
    } catch (err) {
      console.error('Error fetching cardio logs:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activityType]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const saveSession = async (
    sessionData: {
      session_name?: string;
      total_distance_m: number;
      total_duration_seconds?: number;
      avg_pace_seconds_per_unit?: number;
      notes?: string;
    },
    intervals: CardioInterval[]
  ) => {
    if (!user) return { error: 'No autenticado' };
    try {
      const { data: session, error: sessionError } = await (supabase as any)
        .from('cardio_session_logs')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          ...sessionData,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      if (intervals.length > 0) {
        const intervalsToInsert = intervals.map((iv, idx) => ({
          session_log_id: session.id,
          interval_order: idx,
          distance_m: iv.distance_m,
          duration_seconds: iv.duration_seconds || null,
          pace_seconds_per_unit: iv.pace_seconds_per_unit || null,
          pace_unit_m: iv.pace_unit_m,
          rest_seconds: iv.rest_seconds || null,
          notes: iv.notes || null,
        }));

        const { error: ivError } = await (supabase as any)
          .from('cardio_session_intervals')
          .insert(intervalsToInsert);

        if (ivError) throw ivError;
      }

      await fetchSessions();
      return { error: null };
    } catch (err) {
      console.error('Error saving cardio session:', err);
      return { error: err instanceof Error ? err.message : 'Error al guardar' };
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await (supabase as any)
        .from('cardio_session_logs')
        .delete()
        .eq('id', sessionId);
      await fetchSessions();
    } catch (err) {
      console.error('Error deleting cardio session:', err);
    }
  };

  return { sessions, loading, saveSession, deleteSession, refetch: fetchSessions };
};
