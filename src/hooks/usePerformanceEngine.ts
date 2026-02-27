/**
 * usePerformanceEngine — React hook that wraps PerformanceEngine for global consumption.
 * Fetches set_logs, computes metrics, persists summaries, and exposes results.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  calculateSetMetrics,
  aggregateSessionExercise,
  calculateBaseline,
  calculateFatigue,
  detectAlerts,
  getPointColor,
  getRecoveryGroup,
  DEFAULT_CONFIG,
  type PerformanceConfig,
  type SessionExerciseMetrics,
  type BaselineResult,
  type FatigueState,
  type PerformanceAlert,
  type ChartPointData,
} from '@/lib/performanceEngine';

// ── Types ──

interface SetLogRow {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number | null;
  partial_reps: number | null;
  is_warmup: boolean | null;
  logged_at: string;
  est_1rm_set: number | null;
  iem_set: number | null;
}

interface ExerciseRow {
  id: string;
  name: string;
}

interface CatalogEntry {
  id: string;
  name: string;
  primary_muscle_id: string | null;
  muscle_groups: { id: string; name: string } | null;
}

export interface ExercisePerformance {
  exerciseId: string;
  exerciseName: string;
  sessions: SessionWithBaseline[];
  currentBaseline: number;
  latestPctChange: number;
  alerts: PerformanceAlert[];
  totalSets: number;
  totalReps: number;
  bestEst1rm: number;
  bestWeight: number;
  lastDate: string;
}

interface SessionWithBaseline extends SessionExerciseMetrics {
  baseline: number;
  pct_change: number;
  adjusted_pct: number;
}

export interface MusclePerformance {
  muscleId: string;
  muscleName: string;
  totalSets: number;
  totalIEM: number;
  exercises: ExercisePerformance[];
  fatigue: FatigueState;
}

// Normalize for matching
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}
function getWords(s: string): string[] {
  return normalize(s).split(/\s+/).filter(w => w.length >= 3);
}
function findBestMatch(
  exerciseName: string,
  catalog: { name: string; normalizedWords: string[]; muscleId: string; muscleName: string }[]
): { muscleId: string; muscleName: string } | null {
  const exWords = getWords(exerciseName);
  if (exWords.length === 0) return null;
  let best: typeof catalog[0] | null = null;
  let bestScore = 0;
  for (const entry of catalog) {
    let score = 0;
    for (const w of exWords) {
      if (entry.normalizedWords.some(cw => cw.includes(w) || w.includes(cw))) score++;
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  return best && bestScore >= 1 ? { muscleId: best.muscleId, muscleName: best.muscleName } : null;
}

export const usePerformanceEngine = (config: PerformanceConfig = DEFAULT_CONFIG) => {
  const { user } = useAuth();
  const [setLogs, setSetLogs] = useState<SetLogRow[]>([]);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [catalogMap, setCatalogMap] = useState<Map<string, { muscleId: string; muscleName: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: logs, error: logsErr } = await supabase
        .from('set_logs')
        .select('id, exercise_id, set_number, weight, reps, logged_at, is_warmup, rir, partial_reps, est_1rm_set, iem_set')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true });
      if (logsErr) throw logsErr;

      const exerciseIds = [...new Set((logs || []).map(l => l.exercise_id))];
      let exData: ExerciseRow[] = [];
      if (exerciseIds.length > 0) {
        const { data, error: exErr } = await supabase
          .from('exercises')
          .select('id, name')
          .in('id', exerciseIds);
        if (exErr) throw exErr;
        exData = data || [];
      }

      const { data: catalog, error: catErr } = await supabase
        .from('exercise_catalog')
        .select('id, name, primary_muscle_id, muscle_groups:muscle_groups!exercise_catalog_primary_muscle_id_fkey(id, name)')
        .not('primary_muscle_id', 'is', null);
      if (catErr) throw catErr;

      const catalogEntries = (catalog || [])
        .filter((c: any) => c.primary_muscle_id && c.muscle_groups)
        .map((c: any) => ({
          name: c.name,
          normalizedWords: getWords(c.name),
          muscleId: c.muscle_groups.id,
          muscleName: c.muscle_groups.name,
        }));

      const mapping = new Map<string, { muscleId: string; muscleName: string }>();
      for (const ex of exData) {
        const match = findBestMatch(ex.name, catalogEntries);
        if (match) mapping.set(ex.id, match);
      }

      setSetLogs(logs || []);
      setExercises(exData);
      setCatalogMap(mapping);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Exercise name lookup
  const exerciseNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const ex of exercises) m.set(ex.id, ex.name);
    return m;
  }, [exercises]);

  // Compute all exercise performances with PerformanceEngine
  const computeExercisePerformances = useCallback((
    startDate?: string, endDate?: string
  ): Map<string, ExercisePerformance> => {
    const result = new Map<string, ExercisePerformance>();
    
    // Filter logs by date
    const filtered = setLogs.filter(l => {
      if (l.is_warmup) return false;
      const d = l.logged_at.split('T')[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    // Group by exercise → session date
    const byExercise = new Map<string, Map<string, SetLogRow[]>>();
    for (const log of filtered) {
      if (!byExercise.has(log.exercise_id)) byExercise.set(log.exercise_id, new Map());
      const byDate = byExercise.get(log.exercise_id)!;
      const d = log.logged_at.split('T')[0];
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(log);
    }

    for (const [exId, byDate] of byExercise) {
      const exName = exerciseNameMap.get(exId) || 'Ejercicio';
      const sortedDates = [...byDate.keys()].sort();
      
      const sessions: SessionWithBaseline[] = [];
      const est1rmHistory: number[] = [];
      
      for (const date of sortedDates) {
        const logs = byDate.get(date)!;
        const sessionMetrics = aggregateSessionExercise(
          exId, date,
          logs.map(l => ({ weight: l.weight, reps: l.reps, rir: l.rir, is_warmup: !!l.is_warmup })),
          config
        );
        
        const baselineResult = calculateBaseline(
          sessionMetrics.session_est_1rm,
          est1rmHistory,
          config
        );
        
        est1rmHistory.push(sessionMetrics.session_est_1rm);
        
        sessions.push({
          ...sessionMetrics,
          baseline: baselineResult.baseline,
          pct_change: baselineResult.pct_change,
          adjusted_pct: baselineResult.adjusted_pct,
        });
      }

      const alerts = detectAlerts(
        exId, exName,
        sessions.map(s => s.session_est_1rm),
        0, // systemic fatigue placeholder
        config
      );

      result.set(exId, {
        exerciseId: exId,
        exerciseName: exName,
        sessions,
        currentBaseline: sessions.length > 0 ? sessions[sessions.length - 1].baseline : 0,
        latestPctChange: sessions.length > 0 ? sessions[sessions.length - 1].pct_change : 0,
        alerts,
        totalSets: filtered.filter(l => l.exercise_id === exId).length,
        totalReps: sessions.reduce((a, s) => a + s.totalReps, 0),
        bestEst1rm: sessions.length > 0 ? Math.max(...sessions.map(s => s.session_est_1rm)) : 0,
        bestWeight: sessions.length > 0 ? Math.max(...sessions.map(s => s.bestWeight)) : 0,
        lastDate: sortedDates[sortedDates.length - 1] || '',
      });
    }

    return result;
  }, [setLogs, exerciseNameMap, config]);

  // Compute muscle-level aggregation
  const computeMusclePerformances = useCallback((
    startDate?: string, endDate?: string
  ): Map<string, MusclePerformance> => {
    const exercisePerfs = computeExercisePerformances(startDate, endDate);
    const muscles = new Map<string, MusclePerformance>();

    for (const [exId, exPerf] of exercisePerfs) {
      const mapping = catalogMap.get(exId);
      if (!mapping) continue;

      if (!muscles.has(mapping.muscleId)) {
        // Get last trained date for fatigue
        const lastDate = exPerf.lastDate || null;
        const fatigue = calculateFatigue(mapping.muscleName, lastDate, 50, config);
        fatigue.muscleId = mapping.muscleId;

        muscles.set(mapping.muscleId, {
          muscleId: mapping.muscleId,
          muscleName: mapping.muscleName,
          totalSets: 0,
          totalIEM: 0,
          exercises: [],
          fatigue,
        });
      }

      const muscle = muscles.get(mapping.muscleId)!;
      muscle.totalSets += exPerf.totalSets;
      muscle.totalIEM += exPerf.sessions.reduce((a, s) => a + s.session_iem, 0);
      muscle.exercises.push(exPerf);

      // Update fatigue with most recent date
      const latestDate = exPerf.lastDate;
      if (latestDate && latestDate > (muscle.fatigue.hours_since_last === 999 ? '' : '')) {
        const newFatigue = calculateFatigue(mapping.muscleName, latestDate, 50, config);
        newFatigue.muscleId = mapping.muscleId;
        muscle.fatigue = newFatigue;
      }
    }

    return muscles;
  }, [computeExercisePerformances, catalogMap, config]);

  // Build chart points for a specific exercise
  const getExerciseChartPoints = useCallback((
    exerciseId: string, startDate?: string, endDate?: string
  ): ChartPointData[] => {
    const perfs = computeExercisePerformances(startDate, endDate);
    const exPerf = perfs.get(exerciseId);
    if (!exPerf) return [];

    return exPerf.sessions.map(s => ({
      date: s.sessionDate,
      best_weight: s.bestWeight,
      best_reps: s.bestReps,
      best_rir: s.sets.length > 0 ? s.sets[0].rir : null,
      est_1rm_set: s.session_est_1rm,
      session_iem: s.session_iem,
      baseline: s.baseline,
      pct_change: s.pct_change,
      adjusted_pct: s.adjusted_pct,
      rir_estimated: false,
      color: getPointColor(s.pct_change),
    }));
  }, [computeExercisePerformances]);

  // Volume data compatible with old useVolumeData
  const getMuscleVolume = useCallback((startDate?: string, endDate?: string) => {
    const muscles = computeMusclePerformances(startDate, endDate);
    const totals = new Map<string, { name: string; sets: number }>();
    for (const [id, m] of muscles) {
      totals.set(id, { name: m.muscleName, sets: m.totalSets });
    }
    return totals;
  }, [computeMusclePerformances]);

  const getMuscleDetail = useCallback((muscleId: string, startDate?: string, endDate?: string) => {
    const muscles = computeMusclePerformances(startDate, endDate);
    return muscles.get(muscleId) || null;
  }, [computeMusclePerformances]);

  // Unmapped count
  const unmappedCount = useMemo(() => {
    const exerciseIds = new Set(setLogs.map(l => l.exercise_id));
    let count = 0;
    for (const id of exerciseIds) {
      if (!catalogMap.has(id)) count++;
    }
    return count;
  }, [setLogs, catalogMap]);

  // All alerts across exercises
  const getAllAlerts = useCallback((startDate?: string, endDate?: string): PerformanceAlert[] => {
    const perfs = computeExercisePerformances(startDate, endDate);
    const allAlerts: PerformanceAlert[] = [];
    for (const exPerf of perfs.values()) {
      allAlerts.push(...exPerf.alerts);
    }
    return allAlerts;
  }, [computeExercisePerformances]);

  return {
    loading,
    error,
    // Engine methods
    computeExercisePerformances,
    computeMusclePerformances,
    getExerciseChartPoints,
    getAllAlerts,
    // Backward-compatible methods (replace useVolumeData)
    getMuscleVolume,
    getMuscleDetail,
    unmappedCount,
    refetch: fetchData,
    // Config
    config,
  };
};
