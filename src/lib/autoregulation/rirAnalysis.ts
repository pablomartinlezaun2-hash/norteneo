/**
 * RIR Analysis Module — NEO
 *
 * Computes intensity-adherence metrics from set logs
 * comparing target_rir vs actual_rir.
 * Pure functions, no DB calls.
 */

// ─── Types ────────────────────────────────────────────────────────

export type DeviationReason =
  | 'REGISTER_ERROR'
  | 'DID_NOT_FEEL_WELL'
  | 'PAIN_OR_DISCOMFORT'
  | 'PREFERRED_NOT_TO_PUSH'
  | 'TECHNIQUE_UNSTABLE'
  | 'OTHER';

export interface SetLogInput {
  set_number: number;
  weight: number;
  reps: number;
  target_rir: number;
  actual_rir: number | null;
  is_warmup: boolean;
  deviation_reason?: DeviationReason | null;
}

export interface RirAnalysis {
  /** Total working sets (excluding warmups) */
  total_working_sets: number;
  /** Sets where actual_rir === target_rir */
  sets_on_target_rir: number;
  /** Sets where actual_rir > target_rir (less intense than prescribed) */
  sets_below_target_intensity: number;
  /** Sets where actual_rir < target_rir (more intense than prescribed) */
  sets_above_target_intensity: number;
  /** ratio of sets_on_target / total (1.0 = perfect adherence) */
  intensity_adherence_ratio: number;
  /** avg of |actual_rir - target_rir| across working sets */
  avg_rir_deviation: number;
  /** sets with |deviation| >= 2 */
  high_deviation_set_count: number;
  /** breakdown by deviation reason */
  deviation_reason_counts: Partial<Record<DeviationReason, number>>;
  /** per-set deviation details */
  set_deviations: SetDeviation[];
}

export interface SetDeviation {
  set_number: number;
  target_rir: number;
  actual_rir: number;
  rir_deviation: number;
  deviation_reason?: DeviationReason | null;
}

// ─── Core Analysis ────────────────────────────────────────────────

export function analyzeRirAdherence(sets: SetLogInput[]): RirAnalysis {
  const workingSets = sets.filter(s => !s.is_warmup && s.actual_rir !== null);

  if (workingSets.length === 0) {
    return {
      total_working_sets: 0,
      sets_on_target_rir: 0,
      sets_below_target_intensity: 0,
      sets_above_target_intensity: 0,
      intensity_adherence_ratio: 1.0,
      avg_rir_deviation: 0,
      high_deviation_set_count: 0,
      deviation_reason_counts: {},
      set_deviations: [],
    };
  }

  let onTarget = 0;
  let belowIntensity = 0;
  let aboveIntensity = 0;
  let totalAbsDev = 0;
  let highDevCount = 0;
  const reasonCounts: Partial<Record<DeviationReason, number>> = {};
  const deviations: SetDeviation[] = [];

  for (const s of workingSets) {
    const dev = s.actual_rir! - s.target_rir;
    const absDev = Math.abs(dev);

    if (dev === 0) onTarget++;
    else if (dev > 0) belowIntensity++;  // actual RIR higher = less intense
    else aboveIntensity++;               // actual RIR lower = more intense

    totalAbsDev += absDev;
    if (absDev >= 2) highDevCount++;

    if (s.deviation_reason) {
      reasonCounts[s.deviation_reason] = (reasonCounts[s.deviation_reason] ?? 0) + 1;
    }

    deviations.push({
      set_number: s.set_number,
      target_rir: s.target_rir,
      actual_rir: s.actual_rir!,
      rir_deviation: dev,
      deviation_reason: s.deviation_reason,
    });
  }

  const total = workingSets.length;

  return {
    total_working_sets: total,
    sets_on_target_rir: onTarget,
    sets_below_target_intensity: belowIntensity,
    sets_above_target_intensity: aboveIntensity,
    intensity_adherence_ratio: onTarget / total,
    avg_rir_deviation: totalAbsDev / total,
    high_deviation_set_count: highDevCount,
    deviation_reason_counts: reasonCounts,
    set_deviations: deviations,
  };
}

// ─── Interpretation helpers ───────────────────────────────────────

export type IntensityAdherenceLevel =
  | 'PERFECT'       // ratio >= 0.9 and avg_dev <= 0.3
  | 'GOOD'          // ratio >= 0.7 and avg_dev <= 0.8
  | 'MODERATE'      // ratio >= 0.5 and avg_dev <= 1.5
  | 'LOW'           // below moderate
  | 'INSUFFICIENT'; // no data

export function getIntensityAdherenceLevel(analysis: RirAnalysis): IntensityAdherenceLevel {
  if (analysis.total_working_sets === 0) return 'INSUFFICIENT';
  if (analysis.intensity_adherence_ratio >= 0.9 && analysis.avg_rir_deviation <= 0.3) return 'PERFECT';
  if (analysis.intensity_adherence_ratio >= 0.7 && analysis.avg_rir_deviation <= 0.8) return 'GOOD';
  if (analysis.intensity_adherence_ratio >= 0.5 && analysis.avg_rir_deviation <= 1.5) return 'MODERATE';
  return 'LOW';
}

/**
 * Converts RIR analysis into the PerformanceInput fields
 * that feed into the autoregulation scoring engine.
 */
export function rirAnalysisToPerformanceInputs(analysis: RirAnalysis): {
  intensity_adherence_ratio: number;
  avg_rir_deviation: number;
} {
  return {
    intensity_adherence_ratio: analysis.intensity_adherence_ratio,
    avg_rir_deviation: analysis.avg_rir_deviation,
  };
}

/**
 * Detects dominant deviation patterns to provide contextual feedback.
 */
export interface DeviationPattern {
  pattern: 'consistent_undershoot' | 'pain_driven' | 'technique_issues' | 'mixed' | 'none';
  description: string;
}

export function detectDeviationPattern(analysis: RirAnalysis): DeviationPattern {
  if (analysis.total_working_sets === 0 || analysis.avg_rir_deviation < 0.5) {
    return { pattern: 'none', description: 'La adherencia de intensidad es buena.' };
  }

  const reasons = analysis.deviation_reason_counts;
  const total = analysis.high_deviation_set_count || 1;

  const painCount = (reasons.PAIN_OR_DISCOMFORT ?? 0) + (reasons.DID_NOT_FEEL_WELL ?? 0);
  const techCount = reasons.TECHNIQUE_UNSTABLE ?? 0;
  const preferCount = reasons.PREFERRED_NOT_TO_PUSH ?? 0;

  if (painCount / total >= 0.5) {
    return {
      pattern: 'pain_driven',
      description: 'La mayoría de desviaciones están asociadas a dolor o malestar. El motor priorizará sustitución o reducción de intensidad.',
    };
  }

  if (techCount / total >= 0.5) {
    return {
      pattern: 'technique_issues',
      description: 'La inestabilidad técnica es la causa principal. Considera mantener la carga actual hasta consolidar la ejecución.',
    };
  }

  if (analysis.sets_below_target_intensity > analysis.total_working_sets * 0.6 || preferCount / total >= 0.4) {
    return {
      pattern: 'consistent_undershoot',
      description: 'El usuario tiende a quedarse por debajo de la intensidad prescrita de forma sistemática. Esto puede indicar un target_rir demasiado bajo o fatiga acumulada.',
    };
  }

  return {
    pattern: 'mixed',
    description: 'Las desviaciones son variadas y no siguen un patrón claro.',
  };
}
