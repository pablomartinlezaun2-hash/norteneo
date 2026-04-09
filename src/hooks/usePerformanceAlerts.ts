/**
 * usePerformanceAlerts — Fetches real set_logs + exercise rep ranges,
 * runs the performanceAlertEngine, and returns production-ready alerts.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  computeAllAlerts,
  parseRepRange,
  isValidSet,
  type ExerciseSessionAlert,
  type SessionSetGroup,
  type SetInput,
} from '@/lib/performanceAlertEngine';

interface SetLogRow {
  exercise_id: string;
  weight: number;
  reps: number;
  rir: number | null;
  is_warmup: boolean | null;
  logged_at: string;
}

interface ExerciseRow {
  id: string;
  name: string;
  reps: string; // text field with rep range like "6-8"
}

export function usePerformanceAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ExerciseSessionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndCompute = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch set_logs (all, non-warmup filtering done later)
      const { data: logs, error: logsErr } = await supabase
        .from('set_logs')
        .select('exercise_id, weight, reps, rir, is_warmup, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true });

      if (logsErr) throw logsErr;
      if (!logs || logs.length === 0) {
        setAlerts([]);
        return;
      }

      // Get unique exercise IDs
      const exerciseIds = [...new Set(logs.map(l => l.exercise_id))];

      // Fetch exercises with names and rep ranges
      const { data: exercises, error: exErr } = await supabase
        .from('exercises')
        .select('id, name, reps')
        .in('id', exerciseIds);

      if (exErr) throw exErr;

      const exerciseMap = new Map<string, ExerciseRow>();
      for (const ex of (exercises || [])) {
        exerciseMap.set(ex.id, ex);
      }

      // Group logs by exercise + session date
      const groupKey = (exId: string, date: string) => `${exId}|${date}`;
      const groupMap = new Map<string, { exId: string; date: string; sets: SetLogRow[] }>();

      for (const log of logs) {
        const date = log.logged_at.split('T')[0];
        const key = groupKey(log.exercise_id, date);
        if (!groupMap.has(key)) {
          groupMap.set(key, { exId: log.exercise_id, date, sets: [] });
        }
        groupMap.get(key)!.sets.push(log);
      }

      // Build SessionSetGroup array
      const sessionGroups: SessionSetGroup[] = [];

      for (const group of groupMap.values()) {
        const exercise = exerciseMap.get(group.exId);
        if (!exercise) continue;

        const repRange = parseRepRange(exercise.reps);

        const validSets: SetInput[] = group.sets
          .filter(s => !s.is_warmup && isValidSet(s))
          .map(s => ({
            weight: s.weight,
            reps: s.reps,
            rir: s.rir!,
            repRangeMin: repRange?.min,
            repRangeMax: repRange?.max,
            isWarmup: false,
          }));

        if (validSets.length === 0) continue;

        sessionGroups.push({
          exerciseId: group.exId,
          exerciseName: exercise.name,
          sessionDate: group.date,
          sets: validSets,
        });
      }

      const computed = computeAllAlerts(sessionGroups);
      setAlerts(computed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculando alertas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAndCompute();
  }, [fetchAndCompute]);

  return { alerts, loading, error, refetch: fetchAndCompute };
}
