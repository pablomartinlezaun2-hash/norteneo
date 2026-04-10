/**
 * Performance Alert Engine — Production-ready scoring system for NEO.
 *
 * Scores each set using: weight, reps, RIR, and rep-range compliance.
 * Compares exercise session scores against a robust baseline (median of last 3).
 * Generates human-readable explanations for every alert.
 */

// ── Types ──

export interface SetInput {
  weight: number;
  reps: number;
  rir: number;
  repRangeMin?: number;
  repRangeMax?: number;
  isWarmup?: boolean;
}

export type AlertLevel =
  | 'none'
  | 'stable'
  | 'positive_level_1'
  | 'positive_level_2'
  | 'positive_level_3'
  | 'positive_outlier'
  | 'negative_level_1'
  | 'negative_level_2'
  | 'negative_level_3'
  | 'negative_outlier'
  // Legacy compat
  | 'moderate_positive'
  | 'strong_positive'
  | 'moderate_negative'
  | 'strong_negative'
  | 'outlier';

export interface ExerciseSessionAlert {
  exerciseId: string;
  exerciseName: string;
  sessionDate: string;
  score: number;
  topSetScores: number[];
  baselineScore: number | null;
  deltaPercent: number | null;
  alertLevel: AlertLevel;
  explanation: string | null;
  // Context for explanation generation
  latestAvgWeight: number;
  baselineAvgWeight: number;
  latestAvgReps: number;
  baselineAvgReps: number;
  latestAvgRir: number;
  baselineAvgRir: number;
}

// ── Set scoring ──

/**
 * scoreBase = weight * (1 + (reps + rir) / 30)
 * factorRango adjusts for rep-range compliance.
 */
export function scoreSet(input: SetInput): number {
  const { weight, reps, rir, repRangeMin, repRangeMax } = input;
  if (weight <= 0 || reps <= 0) return 0;

  const scoreBase = weight * (1 + (reps + rir) / 30);
  const factorRango = computeRangeFactor(reps, repRangeMin, repRangeMax);
  return round2(scoreBase * factorRango);
}

function computeRangeFactor(
  reps: number,
  repRangeMin?: number,
  repRangeMax?: number,
): number {
  if (repRangeMin == null || repRangeMax == null) return 1.0;
  if (reps >= repRangeMin && reps <= repRangeMax) return 1.0;

  const distance = reps < repRangeMin
    ? repRangeMin - reps
    : reps - repRangeMax;

  if (distance === 1) return 0.97;
  if (distance === 2) return 0.94;
  return 0.90; // 3+
}

// ── Session-level scoring ──

/**
 * Takes all valid (non-warmup) sets for an exercise in a session.
 * Returns the average of the top 2 set scores (or the single score if only 1).
 */
export function scoreExerciseSession(sets: SetInput[]): {
  score: number;
  topSetScores: number[];
  avgWeight: number;
  avgReps: number;
  avgRir: number;
} {
  const valid = sets.filter(s => !s.isWarmup && s.weight > 0 && s.reps > 0 && s.rir != null);
  if (valid.length === 0) {
    return { score: 0, topSetScores: [], avgWeight: 0, avgReps: 0, avgRir: 0 };
  }

  const scores = valid.map(s => scoreSet(s)).sort((a, b) => b - a);
  const topN = scores.slice(0, 2);
  const score = round2(topN.reduce((a, b) => a + b, 0) / topN.length);

  const avgWeight = round2(valid.reduce((a, s) => a + s.weight, 0) / valid.length);
  const avgReps = round2(valid.reduce((a, s) => a + s.reps, 0) / valid.length);
  const avgRir = round2(valid.reduce((a, s) => a + s.rir!, 0) / valid.length);

  return { score, topSetScores: topN, avgWeight, avgReps, avgRir };
}

// ── Baseline: median of last 3 valid sessions ──

export function computeBaseline(previousScores: number[]): number | null {
  if (previousScores.length < 2) return null;
  const last3 = previousScores.slice(-3);
  return round2(median(last3));
}

// ── Delta & alert level ──

export function classifyAlert(deltaPercent: number | null): AlertLevel {
  if (deltaPercent == null) return 'none';
  const abs = Math.abs(deltaPercent);

  // Outlier check
  if (abs > 30) return 'outlier';

  if (abs < 5) return 'none';
  if (deltaPercent >= 10) return 'strong_positive';
  if (deltaPercent >= 5) return 'moderate_positive';
  if (deltaPercent <= -10) return 'strong_negative';
  if (deltaPercent <= -5) return 'moderate_negative';
  return 'none';
}

// ── Explanation generator ──

export function generateExplanation(alert: {
  alertLevel: AlertLevel;
  deltaPercent: number | null;
  latestAvgWeight: number;
  baselineAvgWeight: number;
  latestAvgReps: number;
  baselineAvgReps: number;
  latestAvgRir: number;
  baselineAvgRir: number;
}): string | null {
  const { alertLevel, deltaPercent, latestAvgWeight, baselineAvgWeight, latestAvgReps, baselineAvgReps, latestAvgRir, baselineAvgRir } = alert;

  if (alertLevel === 'none') return null;
  if (alertLevel === 'outlier') return 'Cambio inusual (>30%). Posible error de registro.';

  const isPositive = alertLevel.includes('positive');
  const prefix = isPositive ? 'Mejora detectada' : 'Caída detectada';

  const weightDiff = round2(latestAvgWeight - baselineAvgWeight);
  const repsDiff = round2(latestAvgReps - baselineAvgReps);
  const rirDiff = round2(latestAvgRir - baselineAvgRir);

  const sameWeight = Math.abs(weightDiff) < 1;
  const sameReps = Math.abs(repsDiff) < 0.5;
  const sameRir = Math.abs(rirDiff) < 0.5;

  const parts: string[] = [];

  if (isPositive) {
    if (sameWeight && repsDiff > 0) {
      parts.push(`misma carga, +${repsDiff.toFixed(0)} reps`);
    } else if (sameWeight && sameReps && rirDiff < 0) {
      parts.push(`misma carga con menor RIR (más intenso)`);
    } else if (weightDiff > 0) {
      parts.push(`+${weightDiff.toFixed(1)} kg de carga`);
      if (repsDiff >= 0) parts.push(`manteniendo reps`);
    } else if (sameWeight && repsDiff > 0 && rirDiff < 0) {
      parts.push(`más reps con mayor intensidad`);
    } else {
      parts.push(`rendimiento general superior`);
    }
  } else {
    if (sameWeight && repsDiff < 0) {
      parts.push(`${Math.abs(repsDiff).toFixed(0)} reps menos respecto a tu media reciente`);
    } else if (weightDiff < 0 && repsDiff <= 0) {
      parts.push(`menor carga y menor rendimiento total`);
    } else if (sameWeight && sameReps && rirDiff > 0) {
      parts.push(`mismo trabajo pero con más RIR (menos intenso)`);
    } else {
      parts.push(`rendimiento general inferior`);
    }
  }

  return `${prefix}: ${parts.join(', ')}`;
}

// ── Full pipeline: process all exercises ──

export interface SessionSetGroup {
  exerciseId: string;
  exerciseName: string;
  sessionDate: string;
  sets: SetInput[];
}

/**
 * Process grouped session data into alerts.
 * Groups should be sorted by date (oldest first) per exercise.
 */
export function computeAllAlerts(
  sessionGroups: SessionSetGroup[],
): ExerciseSessionAlert[] {
  // Group by exerciseId
  const byExercise = new Map<string, SessionSetGroup[]>();
  for (const group of sessionGroups) {
    if (!byExercise.has(group.exerciseId)) byExercise.set(group.exerciseId, []);
    byExercise.get(group.exerciseId)!.push(group);
  }

  const alerts: ExerciseSessionAlert[] = [];

  for (const [exerciseId, groups] of byExercise) {
    // Sort by date
    const sorted = groups.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));

    const sessionScores: { score: number; avgWeight: number; avgReps: number; avgRir: number }[] = [];

    for (const group of sorted) {
      const result = scoreExerciseSession(group.sets);
      if (result.score === 0) continue; // skip sessions with no valid data
      sessionScores.push(result);
    }

    if (sessionScores.length < 1) continue;

    const latest = sessionScores[sessionScores.length - 1];
    const previousScores = sessionScores.slice(0, -1).map(s => s.score);
    const baseline = computeBaseline(previousScores);

    const deltaPercent = baseline != null && baseline > 0
      ? round2(((latest.score - baseline) / baseline) * 100)
      : null;

    const alertLevel = classifyAlert(deltaPercent);

    // Compute baseline averages for explanation
    const baselineEntries = sessionScores.slice(0, -1).slice(-3);
    const baselineAvgWeight = baselineEntries.length > 0
      ? round2(baselineEntries.reduce((a, s) => a + s.avgWeight, 0) / baselineEntries.length)
      : latest.avgWeight;
    const baselineAvgReps = baselineEntries.length > 0
      ? round2(baselineEntries.reduce((a, s) => a + s.avgReps, 0) / baselineEntries.length)
      : latest.avgReps;
    const baselineAvgRir = baselineEntries.length > 0
      ? round2(baselineEntries.reduce((a, s) => a + s.avgRir, 0) / baselineEntries.length)
      : latest.avgRir;

    const alertData = {
      alertLevel,
      deltaPercent,
      latestAvgWeight: latest.avgWeight,
      baselineAvgWeight,
      latestAvgReps: latest.avgReps,
      baselineAvgReps,
      latestAvgRir: latest.avgRir,
      baselineAvgRir,
    };

    const explanation = generateExplanation(alertData);
    const lastGroup = sorted[sorted.length - 1];

    alerts.push({
      exerciseId,
      exerciseName: lastGroup.exerciseName,
      sessionDate: lastGroup.sessionDate,
      score: latest.score,
      topSetScores: [], // Could be enriched if needed
      baselineScore: baseline,
      deltaPercent,
      alertLevel,
      explanation,
      latestAvgWeight: latest.avgWeight,
      baselineAvgWeight,
      latestAvgReps: latest.avgReps,
      baselineAvgReps,
      latestAvgRir: latest.avgRir,
      baselineAvgRir,
    });
  }

  // Only return alerts that are not 'none'
  return alerts.filter(a => a.alertLevel !== 'none');
}

// ── Parse rep range from exercise.reps text field ──

export function parseRepRange(repsText: string): { min: number; max: number } | null {
  if (!repsText) return null;
  // Handle formats like "6-8", "8-10", "10-15", "1 x 6-8 / 1 x 8-10"
  // Extract all ranges and use the widest
  const ranges = repsText.match(/(\d+)\s*[-–]\s*(\d+)/g);
  if (!ranges || ranges.length === 0) {
    // Try single number
    const single = repsText.match(/(\d+)/);
    if (single) {
      const n = parseInt(single[1]);
      return { min: n, max: n };
    }
    return null;
  }

  let globalMin = Infinity;
  let globalMax = -Infinity;
  for (const range of ranges) {
    const m = range.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (m) {
      const lo = parseInt(m[1]);
      const hi = parseInt(m[2]);
      if (lo < globalMin) globalMin = lo;
      if (hi > globalMax) globalMax = hi;
    }
  }

  return globalMin !== Infinity ? { min: globalMin, max: globalMax } : null;
}

// ── Validation ──

export function isValidSet(s: { weight: number; reps: number; rir: number | null }): boolean {
  if (s.weight <= 0 || s.reps <= 0) return false;
  if (s.rir == null) return false;
  // Absurd values
  if (s.weight > 500) return false;
  if (s.reps > 100) return false;
  if (s.rir < 0 || s.rir > 10) return false;
  return true;
}

// ── Utilities ──

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
