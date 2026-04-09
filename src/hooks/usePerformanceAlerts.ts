/**
 * usePerformanceAlerts — Fetches real set_logs + exercise rep ranges
 * ONLY from the user's active training program,
 * runs the performanceAlertEngine, and returns production-ready alerts.
 */
import { useState, useEffect, useCallback } from 'react';
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
  reps: string;
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
      // 1. Get user's active training program
      const { data: activeProgram, error: progErr } = await supabase
        .from('training_programs')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (progErr) throw progErr;
      if (!activeProgram) {
        setAlerts([]);
        return;
      }

      // 2. Get exercise IDs from the active program's sessions
      const { data: sessions, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('program_id', activeProgram.id);

      if (sessErr) throw sessErr;
      if (!sessions || sessions.length === 0) {
        setAlerts([]);
        return;
      }

      const sessionIds = sessions.map(s => s.id);

      // 3. Get exercises ONLY from those sessions
      const { data: exercises, error: exErr } = await supabase
        .from('exercises')
        .select('id, name, reps')
        .in('session_id', sessionIds);

      if (exErr) throw exErr;
      if (!exercises || exercises.length === 0) {
        setAlerts([]);
        return;
      }

      const exerciseIds = exercises.map(e => e.id);
      const exerciseMap = new Map<string, ExerciseRow>();
      for (const ex of exercises) {
        exerciseMap.set(ex.id, ex);
      }

      // 4. Fetch set_logs ONLY for those exercises
      const { data: logs, error: logsErr } = await supabase
        .from('set_logs')
        .select('exercise_id, weight, reps, rir, is_warmup, logged_at')
        .eq('user_id', user.id)
        .in('exercise_id', exerciseIds)
        .order('logged_at', { ascending: true });

      if (logsErr) throw logsErr;
      if (!logs || logs.length === 0) {
        setAlerts([]);
        return;
      }

      // 5. Group logs by exercise + session date
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

      // 6. Build SessionSetGroup array
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
