/**
 * Autoregulation Scoring Engine — NEO
 * 
 * Pure math functions. No DB, no side effects.
 * Every score outputs 0–100.
 */

// ─── Normalization helpers ────────────────────────────────────────

export const positiveScore = (value: number): number =>
  Math.max(0, Math.min(100, ((value - 1) / 9) * 100));

export const negativeScore = (value: number): number =>
  Math.max(0, Math.min(100, ((10 - value) / 9) * 100));

export const sleepHoursScore = (hours: number): number => {
  if (hours >= 8) return 100;
  if (hours >= 7) return 85;
  if (hours >= 6) return 70;
  if (hours >= 5) return 50;
  if (hours >= 4) return 30;
  return 10;
};

export const timeAvailabilityScore = (
  availableMinutes: number,
  plannedSessionMinutes: number,
): number => {
  if (plannedSessionMinutes <= 0) return 100;
  const ratio = availableMinutes / plannedSessionMinutes;
  if (ratio >= 1.0) return 100;
  if (ratio >= 0.9) return 85;
  if (ratio >= 0.75) return 65;
  if (ratio >= 0.6) return 40;
  return 15;
};

// ─── Daily Score ──────────────────────────────────────────────────

export interface DailyCheckInInput {
  sleep_hours: number;
  sleep_quality: number;       // 1-10 positive
  general_energy: number;      // 1-10 positive
  mental_stress: number;       // 1-10 negative
  general_soreness: number;    // 1-10 negative
  motivation: number;          // 1-10 positive
  joint_discomfort: number;    // 1-10 negative
}

export const computeDailyScore = (d: DailyCheckInInput): number =>
  0.20 * sleepHoursScore(d.sleep_hours) +
  0.15 * positiveScore(d.sleep_quality) +
  0.20 * positiveScore(d.general_energy) +
  0.15 * negativeScore(d.mental_stress) +
  0.10 * negativeScore(d.general_soreness) +
  0.10 * positiveScore(d.motivation) +
  0.10 * negativeScore(d.joint_discomfort);

// ─── Pre-Workout Score ────────────────────────────────────────────

export interface PreWorkoutCheckInInput {
  expected_strength: number;                // 1-10 positive
  general_freshness: number;                // 1-10 positive
  local_fatigue_target_muscle: number;      // 1-10 negative
  specific_pain_or_discomfort: number;      // 1-10 negative
  willingness_to_push: number;              // 1-10 positive
  available_time_minutes: number;
  planned_session_minutes: number;
}

export const computePreWorkoutScore = (p: PreWorkoutCheckInInput): number =>
  0.25 * positiveScore(p.expected_strength) +
  0.20 * positiveScore(p.general_freshness) +
  0.20 * negativeScore(p.local_fatigue_target_muscle) +
  0.15 * negativeScore(p.specific_pain_or_discomfort) +
  0.10 * positiveScore(p.willingness_to_push) +
  0.10 * timeAvailabilityScore(p.available_time_minutes, p.planned_session_minutes);

// ─── Performance Sub-Scores ──────────────────────────────────────

/** ratio = current session score / baseline. 1.0 = same, 1.05 = +5% */
export const performanceVsBaselineScore = (ratio: number): number => {
  if (ratio >= 1.10) return 100;
  if (ratio >= 1.05) return 90;
  if (ratio >= 1.00) return 80;
  if (ratio >= 0.95) return 65;
  if (ratio >= 0.90) return 45;
  if (ratio >= 0.85) return 25;
  return 10;
};

/** percent drop in reps from first to last working set (0 = no drop) */
export const dropoffScore = (dropPercent: number): number => {
  if (dropPercent <= 5) return 100;
  if (dropPercent <= 10) return 85;
  if (dropPercent <= 20) return 65;
  if (dropPercent <= 30) return 40;
  return 15;
};

/** ratio of completed sets / planned sets */
export const planCompletionScore = (ratio: number): number => {
  if (ratio >= 1.0) return 100;
  if (ratio >= 0.9) return 85;
  if (ratio >= 0.75) return 65;
  if (ratio >= 0.5) return 35;
  return 10;
};

/** ratio of actual avg intensity / planned avg intensity */
export const intensityAdherenceScore = (ratio: number): number => {
  if (ratio >= 0.98 && ratio <= 1.02) return 100;
  if (ratio >= 0.95 && ratio <= 1.05) return 85;
  if (ratio >= 0.90 && ratio <= 1.10) return 65;
  if (ratio >= 0.85 && ratio <= 1.15) return 40;
  return 15;
};

/** average |actual_rir - target_rir| across sets */
export const rirDeviationScore = (avgDeviation: number): number => {
  if (avgDeviation <= 0.5) return 100;
  if (avgDeviation <= 1.0) return 85;
  if (avgDeviation <= 1.5) return 65;
  if (avgDeviation <= 2.0) return 45;
  if (avgDeviation <= 3.0) return 25;
  return 10;
};

// ─── Performance Score (composite) ────────────────────────────────

export interface PerformanceInput {
  performance_vs_baseline_ratio: number;
  rep_drop_between_sets_percent: number;
  plan_completion_ratio: number;
  intensity_adherence_ratio: number;
  avg_rir_deviation: number;
}

export const computePerformanceScore = (p: PerformanceInput): number =>
  0.30 * performanceVsBaselineScore(p.performance_vs_baseline_ratio) +
  0.20 * dropoffScore(p.rep_drop_between_sets_percent) +
  0.20 * planCompletionScore(p.plan_completion_ratio) +
  0.20 * intensityAdherenceScore(p.intensity_adherence_ratio) +
  0.10 * rirDeviationScore(p.avg_rir_deviation);

// ─── Fatigue Score ────────────────────────────────────────────────

export interface FatigueInput {
  recent_volume_load_score: number;        // 0-100 (100 = low volume)
  local_fatigue_history_score: number;     // 0-100 (100 = well recovered)
  performance_decline_score: number;       // 0-100 (100 = no decline)
  recovery_penalty_score: number;          // 0-100 (100 = good recovery)
}

export const computeFatigueScore = (f: FatigueInput): number =>
  0.35 * f.recent_volume_load_score +
  0.25 * f.local_fatigue_history_score +
  0.20 * f.performance_decline_score +
  0.20 * f.recovery_penalty_score;

// ─── Readiness ────────────────────────────────────────────────────

export type ReadinessState =
  | 'READY_TO_PROGRESS'
  | 'READY_TO_MAINTAIN'
  | 'MODERATE_FATIGUE'
  | 'HIGH_FATIGUE';

export interface ReadinessInput {
  dailyScore: number;
  preWorkoutScore: number;
  performanceScore: number;
  fatigueScore: number;
}

export const computeReadinessScore = (r: ReadinessInput): number =>
  0.25 * r.dailyScore +
  0.35 * r.preWorkoutScore +
  0.25 * r.performanceScore +
  0.15 * r.fatigueScore;

export const getReadinessState = (score: number): ReadinessState => {
  if (score >= 80) return 'READY_TO_PROGRESS';
  if (score >= 65) return 'READY_TO_MAINTAIN';
  if (score >= 50) return 'MODERATE_FATIGUE';
  return 'HIGH_FATIGUE';
};

// ─── Veto Rules ───────────────────────────────────────────────────

export interface VetoInput {
  specific_pain_or_discomfort: number;
  local_fatigue_target_muscle: number;
  sleep_hours: number;
  sleep_quality: number;
  general_energy: number;
  available_time_minutes: number;
  planned_session_minutes: number;
}

export interface VetoResult {
  vetoed: boolean;
  reasons: string[];
}

export const checkVetoRules = (v: VetoInput): VetoResult => {
  const reasons: string[] = [];

  if (v.specific_pain_or_discomfort >= 8)
    reasons.push('pain_too_high');
  if (v.local_fatigue_target_muscle >= 8)
    reasons.push('local_fatigue_too_high');
  if (v.sleep_hours < 4)
    reasons.push('severe_sleep_deprivation');
  if (v.sleep_quality <= 2 && v.general_energy <= 3)
    reasons.push('poor_sleep_and_energy');
  if (v.planned_session_minutes > 0 && v.available_time_minutes < v.planned_session_minutes * 0.6)
    reasons.push('insufficient_time');

  return { vetoed: reasons.length > 0, reasons };
};
