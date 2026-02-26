import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VolumeEntry {
  date: string;
  muscleId: string;
  muscleName: string;
  sets: number;
  exerciseId: string;
  exerciseName: string;
}

export interface MuscleVolume {
  id: string;
  name: string;
  totalSets: number;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    totalSets: number;
    totalReps: number;
    maxWeight: number;
    lastDate: string;
    logs: { date: string; sets: number; weight: number; reps: number; rir?: number; partialReps?: number }[];
  }[];
}

interface SetLogRow {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  logged_at: string;
  is_warmup: boolean | null;
  rir: number | null;
  partial_reps: number | null;
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

// Normalize string for matching: lowercase, remove accents
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Extract significant words (3+ chars) from a string
function getWords(s: string): string[] {
  return normalize(s).split(/\s+/).filter(w => w.length >= 3);
}

// Find best matching catalog entry for an exercise name
function findBestMatch(
  exerciseName: string,
  catalog: { name: string; normalizedWords: string[]; muscleId: string; muscleName: string }[]
): { muscleId: string; muscleName: string } | null {
  const exWords = getWords(exerciseName);
  if (exWords.length === 0) return null;

  let bestMatch: typeof catalog[0] | null = null;
  let bestScore = 0;

  for (const entry of catalog) {
    // Count overlapping words
    let score = 0;
    for (const w of exWords) {
      if (entry.normalizedWords.some(cw => cw.includes(w) || w.includes(cw))) {
        score++;
      }
    }
    // Require at least 1 significant word match
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Require at least 1 match to accept
  if (bestMatch && bestScore >= 1) {
    return { muscleId: bestMatch.muscleId, muscleName: bestMatch.muscleName };
  }
  return null;
}

export const useVolumeData = () => {
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
      // Fetch all user set_logs (non-warmup)
      const { data: logs, error: logsErr } = await supabase
        .from('set_logs')
        .select('id, exercise_id, set_number, weight, reps, logged_at, is_warmup, rir, partial_reps')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });
      if (logsErr) throw logsErr;

      // Get unique exercise IDs
      const exerciseIds = [...new Set((logs || []).map(l => l.exercise_id))];

      // Fetch exercise names
      let exData: ExerciseRow[] = [];
      if (exerciseIds.length > 0) {
        const { data, error: exErr } = await supabase
          .from('exercises')
          .select('id, name')
          .in('id', exerciseIds);
        if (exErr) throw exErr;
        exData = data || [];
      }

      // Fetch exercise catalog with muscle groups
      const { data: catalog, error: catErr } = await supabase
        .from('exercise_catalog')
        .select('id, name, primary_muscle_id, muscle_groups:muscle_groups!exercise_catalog_primary_muscle_id_fkey(id, name)')
        .not('primary_muscle_id', 'is', null);
      if (catErr) throw catErr;

      // Build catalog lookup for matching
      const catalogEntries = (catalog || [])
        .filter((c: any) => c.primary_muscle_id && c.muscle_groups)
        .map((c: any) => ({
          name: c.name,
          normalizedWords: getWords(c.name),
          muscleId: c.muscle_groups.id,
          muscleName: c.muscle_groups.name,
        }));

      // Build exercise -> muscle mapping
      const mapping = new Map<string, { muscleId: string; muscleName: string }>();
      for (const ex of exData) {
        const match = findBestMatch(ex.name, catalogEntries);
        if (match) {
          mapping.set(ex.id, match);
        }
      }

      setSetLogs(logs || []);
      setExercises(exData);
      setCatalogMap(mapping);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos de volumen');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build exercise name lookup
  const exerciseNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const ex of exercises) m.set(ex.id, ex.name);
    return m;
  }, [exercises]);

  // Get volume entries (one per set_log, grouped by date/muscle)
  const getVolumeEntries = useCallback((startDate?: string, endDate?: string): VolumeEntry[] => {
    const filtered = setLogs.filter(l => {
      if (l.is_warmup) return false;
      const d = l.logged_at.split('T')[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    const entries: VolumeEntry[] = [];
    for (const log of filtered) {
      const mapping = catalogMap.get(log.exercise_id);
      if (!mapping) continue; // Skip exercises without muscle mapping
      entries.push({
        date: log.logged_at.split('T')[0],
        muscleId: mapping.muscleId,
        muscleName: mapping.muscleName,
        sets: 1, // Each set_log row = 1 set
        exerciseId: log.exercise_id,
        exerciseName: exerciseNameMap.get(log.exercise_id) || 'Ejercicio desconocido',
      });
    }
    return entries;
  }, [setLogs, catalogMap, exerciseNameMap]);

  // Get aggregated volume per muscle for a date range
  const getMuscleVolume = useCallback((startDate?: string, endDate?: string) => {
    const entries = getVolumeEntries(startDate, endDate);
    const totals = new Map<string, { name: string; sets: number }>();
    for (const e of entries) {
      const existing = totals.get(e.muscleId) || { name: e.muscleName, sets: 0 };
      existing.sets += 1;
      totals.set(e.muscleId, existing);
    }
    return totals;
  }, [getVolumeEntries]);

  // Get detailed muscle data for MuscleDetail page
  const getMuscleDetail = useCallback((muscleId: string, startDate?: string, endDate?: string): MuscleVolume | null => {
    const filtered = setLogs.filter(l => {
      if (l.is_warmup) return false;
      const mapping = catalogMap.get(l.exercise_id);
      if (!mapping || mapping.muscleId !== muscleId) return false;
      const d = l.logged_at.split('T')[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    if (filtered.length === 0) return null;

    // Find muscle name
    const firstMapping = [...catalogMap.values()].find(m => m.muscleId === muscleId);
    const muscleName = firstMapping?.muscleName || 'Músculo';

    // Group by exercise
    const byExercise = new Map<string, typeof filtered>();
    for (const log of filtered) {
      const arr = byExercise.get(log.exercise_id) || [];
      arr.push(log);
      byExercise.set(log.exercise_id, arr);
    }

    const exercises: MuscleVolume['exercises'] = [];
    for (const [exId, logs] of byExercise) {
      const exName = exerciseNameMap.get(exId) || 'Ejercicio';
      const totalSets = logs.length;
      const totalReps = logs.reduce((a, b) => a + b.reps, 0);
      const maxWeight = Math.max(...logs.map(l => l.weight));
      const lastDate = logs.reduce((latest, l) => l.logged_at > latest ? l.logged_at : latest, '');

      // Group logs by date for sparkline
      const byDate = new Map<string, { sets: number; weight: number; reps: number; rir?: number; partialReps?: number }>();
      for (const log of logs) {
        const d = log.logged_at.split('T')[0];
        const existing = byDate.get(d) || { sets: 0, weight: 0, reps: 0 };
        existing.sets += 1;
        existing.weight = Math.max(existing.weight, log.weight);
        existing.reps += log.reps;
        if (log.rir != null) existing.rir = log.rir;
        if (log.partial_reps != null && log.partial_reps > 0) existing.partialReps = (existing.partialReps || 0) + log.partial_reps;
        byDate.set(d, existing);
      }

      exercises.push({
        exerciseId: exId,
        exerciseName: exName,
        totalSets,
        totalReps,
        maxWeight,
        lastDate,
        logs: [...byDate.entries()].map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
      });
    }

    exercises.sort((a, b) => b.totalSets - a.totalSets);

    return {
      id: muscleId,
      name: muscleName,
      totalSets: filtered.length,
      exercises,
    };
  }, [setLogs, catalogMap, exerciseNameMap]);

  // Get unmapped exercise count
  const unmappedCount = useMemo(() => {
    const exerciseIds = new Set(setLogs.map(l => l.exercise_id));
    let count = 0;
    for (const id of exerciseIds) {
      if (!catalogMap.has(id)) count++;
    }
    return count;
  }, [setLogs, catalogMap]);

  return {
    loading,
    error,
    getMuscleVolume,
    getMuscleDetail,
    getVolumeEntries,
    unmappedCount,
    refetch: fetchData,
  };
};
