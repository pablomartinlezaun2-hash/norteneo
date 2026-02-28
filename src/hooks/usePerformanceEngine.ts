/**
 * usePerformanceEngine — React hook that wraps PerformanceEngine for global consumption.
 * Fetches set_logs + cardio_session_logs, computes metrics, and exposes results.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  calculateSetMetrics,
  aggregateSessionExercise,
  calculateBaseline,
  calculateFatigue,
  calculateRunningLoad,
  calculateSwimmingLoad,
  applyInterference,
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
  type RunningLoadResult,
  type SwimmingLoadResult,
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

interface CardioSessionRow {
  id: string;
  activity_type: string;
  session_name: string | null;
  total_distance_m: number;
  total_duration_seconds: number | null;
  avg_pace_seconds_per_unit: number | null;
  completed_at: string;
  notes: string | null;
}

export interface CardioLoadEntry {
  sessionId: string;
  activityType: 'running' | 'swimming';
  date: string;
  durationMinutes: number;
  distanceM: number;
  intensityRel: number;
  sessionType: string;
  trimp?: number;
  swimLoad?: number;
  totalLoad: number;
  muscleLoads: Record<string, number>;
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
  cardioLoad: number;
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

// ── Cardio intensity estimation ──
// Estimates relative intensity (0-1) from pace data. Faster pace = higher intensity.
function estimateRunningIntensity(avgPaceSecPerKm: number | null, durationMin: number): number {
  if (!avgPaceSecPerKm || avgPaceSecPerKm <= 0) {
    // Fallback: longer sessions tend to be lower intensity
    if (durationMin > 60) return 0.55;
    if (durationMin > 40) return 0.65;
    return 0.70;
  }
  // Rough scale: 3:00/km = elite (1.0), 7:00/km = easy walk (0.3)
  const paceMin = avgPaceSecPerKm / 60;
  const intensity = Math.max(0.3, Math.min(1.0, 1.2 - paceMin * 0.13));
  return Math.round(intensity * 100) / 100;
}

function estimateSwimmingIntensity(avgPaceSecPer100m: number | null, durationMin: number): number {
  if (!avgPaceSecPer100m || avgPaceSecPer100m <= 0) {
    if (durationMin > 45) return 0.55;
    if (durationMin > 30) return 0.65;
    return 0.70;
  }
  // Rough scale: 1:00/100m = elite (1.0), 3:00/100m = easy (0.3)
  const paceMin = avgPaceSecPer100m / 60;
  const intensity = Math.max(0.3, Math.min(1.0, 1.3 - paceMin * 0.35));
  return Math.round(intensity * 100) / 100;
}

function inferSessionType(name: string | null, notes: string | null): string {
  const text = normalize(`${name || ''} ${notes || ''}`);
  if (text.includes('serie') || text.includes('interval')) return 'series_pista';
  if (text.includes('tempo') || text.includes('umbral')) return 'tempo';
  if (text.includes('long') || text.includes('largo') || text.includes('tirada')) return 'long';
  if (text.includes('easy') || text.includes('facil') || text.includes('suave')) return 'easy';
  return 'rodaje';
}

export const usePerformanceEngine = (config: PerformanceConfig = DEFAULT_CONFIG) => {
  const { user } = useAuth();
  const [setLogs, setSetLogs] = useState<SetLogRow[]>([]);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [catalogMap, setCatalogMap] = useState<Map<string, { muscleId: string; muscleName: string }>>(new Map());
  const [cardioSessions, setCardioSessions] = useState<CardioSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch strength + cardio in parallel
      const [logsRes, cardioRes] = await Promise.all([
        supabase
          .from('set_logs')
          .select('id, exercise_id, set_number, weight, reps, logged_at, is_warmup, rir, partial_reps, est_1rm_set, iem_set')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: true }),
        (supabase as any)
          .from('cardio_session_logs')
          .select('id, activity_type, session_name, total_distance_m, total_duration_seconds, avg_pace_seconds_per_unit, completed_at, notes')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: true }),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (cardioRes.error) throw cardioRes.error;

      const exerciseIds = [...new Set((logsRes.data || []).map(l => l.exercise_id))];
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

      setSetLogs(logsRes.data || []);
      setExercises(exData);
      setCatalogMap(mapping);
      setCardioSessions(cardioRes.data || []);
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

  // ── Cardio load computation ──
  const computeCardioLoads = useCallback((
    startDate?: string, endDate?: string
  ): CardioLoadEntry[] => {
    return cardioSessions
      .filter(s => {
        const d = s.completed_at.split('T')[0];
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      })
      .map(s => {
        const durationMin = (s.total_duration_seconds || 0) / 60;
        const activityType = s.activity_type as 'running' | 'swimming';
        const date = s.completed_at.split('T')[0];
        const sessionType = inferSessionType(s.session_name, s.notes);

        if (activityType === 'running') {
          // Convert avg_pace to per-km if stored differently
          const avgPacePerKm = s.avg_pace_seconds_per_unit
            ? s.avg_pace_seconds_per_unit // assume stored as sec/km
            : null;
          const intensity = estimateRunningIntensity(avgPacePerKm, durationMin);
          const result = calculateRunningLoad(durationMin, intensity, sessionType, config);
          return {
            sessionId: s.id,
            activityType,
            date,
            durationMinutes: durationMin,
            distanceM: s.total_distance_m,
            intensityRel: intensity,
            sessionType,
            trimp: result.trimp,
            totalLoad: result.running_load,
            muscleLoads: result.muscle_loads,
          };
        } else {
          // Swimming
          const avgPacePer100m = s.avg_pace_seconds_per_unit
            ? s.avg_pace_seconds_per_unit
            : null;
          const intensity = estimateSwimmingIntensity(avgPacePer100m, durationMin);
          const result = calculateSwimmingLoad(durationMin, intensity, 1.0, config);
          return {
            sessionId: s.id,
            activityType,
            date,
            durationMinutes: durationMin,
            distanceM: s.total_distance_m,
            intensityRel: intensity,
            sessionType: 'freestyle',
            swimLoad: result.swim_load,
            totalLoad: result.swim_load,
            muscleLoads: result.muscle_loads,
          };
        }
      });
  }, [cardioSessions, config]);

  // Compute all exercise performances with PerformanceEngine
  const computeExercisePerformances = useCallback((
    startDate?: string, endDate?: string
  ): Map<string, ExercisePerformance> => {
    const result = new Map<string, ExercisePerformance>();
    
    const filtered = setLogs.filter(l => {
      if (l.is_warmup) return false;
      const d = l.logged_at.split('T')[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

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

      // Calculate systemic fatigue from cardio for interference
      const cardioLoads = computeCardioLoads(startDate, endDate);
      const systemicFatigue = cardioLoads.reduce((sum, c) => sum + c.totalLoad, 0) / Math.max(1, cardioLoads.length);

      const alerts = detectAlerts(
        exId, exName,
        sessions.map(s => s.session_est_1rm),
        Math.min(100, systemicFatigue),
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
  }, [setLogs, exerciseNameMap, config, computeCardioLoads]);

  // Compute muscle-level aggregation (strength + cardio)
  const computeMusclePerformances = useCallback((
    startDate?: string, endDate?: string
  ): Map<string, MusclePerformance> => {
    const exercisePerfs = computeExercisePerformances(startDate, endDate);
    const muscles = new Map<string, MusclePerformance>();

    // 1. Strength contributions
    for (const [exId, exPerf] of exercisePerfs) {
      const mapping = catalogMap.get(exId);
      if (!mapping) continue;

      if (!muscles.has(mapping.muscleId)) {
        const lastDate = exPerf.lastDate || null;
        const fatigue = calculateFatigue(mapping.muscleName, lastDate, 50, config);
        fatigue.muscleId = mapping.muscleId;

        muscles.set(mapping.muscleId, {
          muscleId: mapping.muscleId,
          muscleName: mapping.muscleName,
          totalSets: 0,
          totalIEM: 0,
          cardioLoad: 0,
          exercises: [],
          fatigue,
        });
      }

      const muscle = muscles.get(mapping.muscleId)!;
      muscle.totalSets += exPerf.totalSets;
      muscle.totalIEM += exPerf.sessions.reduce((a, s) => a + s.session_iem, 0);
      muscle.exercises.push(exPerf);

      const latestDate = exPerf.lastDate;
      if (latestDate && latestDate > (muscle.fatigue.hours_since_last === 999 ? '' : '')) {
        const newFatigue = calculateFatigue(mapping.muscleName, latestDate, 50, config);
        newFatigue.muscleId = mapping.muscleId;
        muscle.fatigue = newFatigue;
      }
    }

    // 2. Cardio contributions — distribute muscle loads from TRIMP/swim_load
    const cardioLoads = computeCardioLoads(startDate, endDate);
    
    // Map cardio muscle names to actual muscle_groups entries
    const muscleGroupNameToId = new Map<string, string>();
    for (const [, mapping] of catalogMap) {
      const n = normalize(mapping.muscleName);
      muscleGroupNameToId.set(n, mapping.muscleId);
    }

    // Aggregate cardio muscle loads per muscle name
    const cardioMuscleAccum = new Map<string, { load: number; lastDate: string; muscleName: string }>();
    for (const entry of cardioLoads) {
      for (const [muscleName, load] of Object.entries(entry.muscleLoads)) {
        const existing = cardioMuscleAccum.get(muscleName);
        if (existing) {
          existing.load += load;
          if (entry.date > existing.lastDate) existing.lastDate = entry.date;
        } else {
          cardioMuscleAccum.set(muscleName, { load, lastDate: entry.date, muscleName });
        }
      }
    }

    // Merge cardio loads into muscle performances
    for (const [muscleName, accum] of cardioMuscleAccum) {
      const n = normalize(muscleName);
      let muscleId = muscleGroupNameToId.get(n);
      
      // Try partial match
      if (!muscleId) {
        for (const [key, id] of muscleGroupNameToId) {
          if (key.includes(n) || n.includes(key)) { muscleId = id; break; }
        }
      }

      if (muscleId && muscles.has(muscleId)) {
        const muscle = muscles.get(muscleId)!;
        muscle.cardioLoad += accum.load;
        // Apply interference: cardio load increases effective fatigue
        const overlapping = cardioLoads.length > 0 ? [cardioLoads[0].activityType] : [];
        const adjustedLoad = applyInterference(50 + accum.load * 0.5, 'strength', overlapping, config);
        // Recalculate fatigue with combined load
        if (accum.lastDate > (muscle.fatigue.hours_since_last === 999 ? '' : muscle.fatigue.muscleName)) {
          const newFatigue = calculateFatigue(
            muscle.muscleName, accum.lastDate, Math.min(100, adjustedLoad), config
          );
          newFatigue.muscleId = muscleId;
          // Only update if cardio date is more recent
          if (newFatigue.hours_since_last < muscle.fatigue.hours_since_last) {
            muscle.fatigue = newFatigue;
          }
        }
      } else if (!muscleId) {
        // Create a virtual muscle entry for cardio-only muscles (e.g. calves from running)
        const virtualId = `cardio_${muscleName}`;
        if (!muscles.has(virtualId)) {
          const fatigue = calculateFatigue(muscleName, accum.lastDate, Math.min(100, accum.load), config);
          fatigue.muscleId = virtualId;
          muscles.set(virtualId, {
            muscleId: virtualId,
            muscleName: muscleName.charAt(0).toUpperCase() + muscleName.slice(1),
            totalSets: 0,
            totalIEM: 0,
            cardioLoad: accum.load,
            exercises: [],
            fatigue,
          });
        }
      }
    }

    return muscles;
  }, [computeExercisePerformances, catalogMap, config, computeCardioLoads]);

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

  // ── Cardio-specific summaries ──
  const getCardioSummary = useCallback((startDate?: string, endDate?: string) => {
    const loads = computeCardioLoads(startDate, endDate);
    const running = loads.filter(l => l.activityType === 'running');
    const swimming = loads.filter(l => l.activityType === 'swimming');
    return {
      running: {
        sessions: running.length,
        totalTrimp: running.reduce((a, r) => a + (r.trimp || 0), 0),
        totalLoad: running.reduce((a, r) => a + r.totalLoad, 0),
        totalDistanceKm: running.reduce((a, r) => a + r.distanceM, 0) / 1000,
        totalMinutes: running.reduce((a, r) => a + r.durationMinutes, 0),
        avgIntensity: running.length > 0 ? running.reduce((a, r) => a + r.intensityRel, 0) / running.length : 0,
      },
      swimming: {
        sessions: swimming.length,
        totalSwimLoad: swimming.reduce((a, s) => a + (s.swimLoad || 0), 0),
        totalLoad: swimming.reduce((a, s) => a + s.totalLoad, 0),
        totalDistanceM: swimming.reduce((a, s) => a + s.distanceM, 0),
        totalMinutes: swimming.reduce((a, s) => a + s.durationMinutes, 0),
        avgIntensity: swimming.length > 0 ? swimming.reduce((a, s) => a + s.intensityRel, 0) / swimming.length : 0,
      },
      totalSessions: loads.length,
      totalLoad: loads.reduce((a, l) => a + l.totalLoad, 0),
    };
  }, [computeCardioLoads]);

  return {
    loading,
    error,
    // Engine methods
    computeExercisePerformances,
    computeMusclePerformances,
    getExerciseChartPoints,
    getAllAlerts,
    // Cardio
    computeCardioLoads,
    getCardioSummary,
    // Backward-compatible methods
    getMuscleVolume,
    getMuscleDetail,
    unmappedCount,
    refetch: fetchData,
    // Config
    config,
  };
};
