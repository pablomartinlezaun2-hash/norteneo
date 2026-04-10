/**
 * Autoregulation Recommendation Engine v2 — NEO
 *
 * Granular decision rules with strict eligibility guards.
 * Priority order: RESTRUCTURE > SUBSTITUTE > INCREASE_RIR > REMOVE_SET > ADD_SET > KEEP_PLAN
 * Pure logic, no DB calls.
 */

import {
  type ReadinessState,
  type VetoResult,
  getReadinessState,
  computeReadinessScore,
  checkVetoRules,
  computeDailyScore,
  computePreWorkoutScore,
  computePerformanceScore,
  computeFatigueScore,
  type DailyCheckInInput,
  type PreWorkoutCheckInInput,
  type PerformanceInput,
  type FatigueInput,
} from './scoring';

// ─── Types ────────────────────────────────────────────────────────

export type RecommendationType =
  | 'ADD_SET'
  | 'REMOVE_SET'
  | 'SUBSTITUTE_EXERCISE'
  | 'INCREASE_RIR'
  | 'RESTRUCTURE_SESSION'
  | 'KEEP_PLAN';

export interface Recommendation {
  recommendation_type: RecommendationType;
  recommendation_reason: string;
  exercise_id?: string;
  recommendation_payload: Record<string, unknown>;
}

export interface ExerciseContext {
  exercise_id: string;
  exercise_name: string;
  planned_sets: number;
  planned_rir: number;
  planned_rep_range: string;
  target_muscle_group: string;
  fatigue_cost: number;              // 0-100
  has_substitute_available: boolean;
  substitute_exercise_id?: string;
  substitute_exercise_name?: string;
  /** per-exercise performance ratio vs baseline (optional, for intra-session) */
  performance_ratio?: number;
  /** rep drop % between first and last set (optional) */
  rep_drop_percent?: number;
}

export interface SessionContext {
  session_id: string;
  exercises: ExerciseContext[];
  planned_duration_minutes: number;
}

export interface EngineInput {
  daily?: DailyCheckInInput;
  preWorkout?: PreWorkoutCheckInInput;
  performance?: PerformanceInput;
  fatigue?: FatigueInput;
  session: SessionContext;
}

export interface EngineOutput {
  dailyScore: number;
  preWorkoutScore: number;
  performanceScore: number;
  fatigueScore: number;
  readinessScore: number;
  readinessState: ReadinessState;
  veto: VetoResult;
  recommendations: Recommendation[];
}

// ─── Defaults (when check-in is skipped) ──────────────────────────

const DEFAULT_DAILY: DailyCheckInInput = {
  sleep_hours: 7, sleep_quality: 6, general_energy: 6,
  mental_stress: 4, general_soreness: 3, motivation: 6, joint_discomfort: 2,
};

const DEFAULT_PRE_WORKOUT: PreWorkoutCheckInInput = {
  expected_strength: 6, general_freshness: 6,
  local_fatigue_target_muscle: 3, specific_pain_or_discomfort: 1,
  willingness_to_push: 6, available_time_minutes: 90, planned_session_minutes: 60,
};

const DEFAULT_PERFORMANCE: PerformanceInput = {
  performance_vs_baseline_ratio: 1.0, rep_drop_between_sets_percent: 10,
  plan_completion_ratio: 1.0, intensity_adherence_ratio: 1.0, avg_rir_deviation: 0.5,
};

const DEFAULT_FATIGUE: FatigueInput = {
  recent_volume_load_score: 70, local_fatigue_history_score: 70,
  performance_decline_score: 80, recovery_penalty_score: 75,
};

// ─── Engine ───────────────────────────────────────────────────────

export function computeRecommendations(input: EngineInput): EngineOutput {
  const daily = input.daily ?? DEFAULT_DAILY;
  const preWorkout = input.preWorkout ?? {
    ...DEFAULT_PRE_WORKOUT,
    planned_session_minutes: input.session.planned_duration_minutes,
    available_time_minutes: input.session.planned_duration_minutes,
  };
  const performance = input.performance ?? DEFAULT_PERFORMANCE;
  const fatigue = input.fatigue ?? DEFAULT_FATIGUE;

  const dailyScore = computeDailyScore(daily);
  const preWorkoutScore = computePreWorkoutScore(preWorkout);
  const performanceScore = computePerformanceScore(performance);
  const fatigueScore = computeFatigueScore(fatigue);

  const readinessScore = computeReadinessScore({
    dailyScore, preWorkoutScore, performanceScore, fatigueScore,
  });

  const readinessState = getReadinessState(readinessScore);

  const veto = checkVetoRules({
    specific_pain_or_discomfort: preWorkout.specific_pain_or_discomfort,
    local_fatigue_target_muscle: preWorkout.local_fatigue_target_muscle,
    sleep_hours: daily.sleep_hours,
    sleep_quality: daily.sleep_quality,
    general_energy: daily.general_energy,
    available_time_minutes: preWorkout.available_time_minutes,
    planned_session_minutes: preWorkout.planned_session_minutes,
  });

  const ctx: DecisionContext = {
    readinessScore, readinessState, veto,
    performanceScore, fatigueScore,
    daily, preWorkout, performance, session: input.session,
  };

  const recommendations = runDecisionPipeline(ctx);

  return {
    dailyScore, preWorkoutScore, performanceScore, fatigueScore,
    readinessScore, readinessState, veto, recommendations,
  };
}

// ─── Decision Context ─────────────────────────────────────────────

interface DecisionContext {
  readinessScore: number;
  readinessState: ReadinessState;
  veto: VetoResult;
  performanceScore: number;
  fatigueScore: number;
  daily: DailyCheckInInput;
  preWorkout: PreWorkoutCheckInInput;
  performance: PerformanceInput;
  session: SessionContext;
}

// ─── Decision Pipeline ────────────────────────────────────────────
// Priority: RESTRUCTURE → SUBSTITUTE → INCREASE_RIR → REMOVE_SET → ADD_SET → KEEP_PLAN

function runDecisionPipeline(ctx: DecisionContext): Recommendation[] {
  const recs: Recommendation[] = [];

  // ── P1: RESTRUCTURE_SESSION ──
  const restructure = evaluateRestructure(ctx);
  if (restructure) {
    recs.push(restructure);
    // Restructure is terminal — don't add per-exercise recs
    return recs;
  }

  // ── P2–P4: Per-exercise evaluation ──
  for (const ex of ctx.session.exercises) {
    // P2: SUBSTITUTE_EXERCISE
    const sub = evaluateSubstitute(ctx, ex);
    if (sub) { recs.push(sub); continue; } // skip other recs for this exercise

    // P3: INCREASE_RIR
    const rir = evaluateIncreaseRir(ctx, ex);
    if (rir) recs.push(rir);

    // P4: REMOVE_SET
    const rem = evaluateRemoveSet(ctx, ex);
    if (rem) recs.push(rem);
  }

  // ── P5: ADD_SET (only if no negative recs emitted) ──
  if (recs.length === 0) {
    const add = evaluateAddSet(ctx);
    if (add) {
      recs.push(add);
      return recs;
    }
  }

  // ── P6: KEEP_PLAN (fallback if nothing else) ──
  if (recs.length === 0) {
    recs.push({
      recommendation_type: 'KEEP_PLAN',
      recommendation_reason: keepPlanReason(ctx),
      recommendation_payload: { readiness_state: ctx.readinessState },
    });
  }

  return recs;
}

// ─── P1: RESTRUCTURE_SESSION ──────────────────────────────────────

function evaluateRestructure(ctx: DecisionContext): Recommendation | null {
  const reasons: string[] = [];

  if (ctx.readinessScore < 50)
    reasons.push('readiness_below_50');
  if (ctx.veto.reasons.length >= 2)
    reasons.push('multiple_vetos');
  if (ctx.veto.reasons.includes('insufficient_time'))
    reasons.push('insufficient_time');
  if (ctx.preWorkout.specific_pain_or_discomfort >= 7 && ctx.preWorkout.local_fatigue_target_muscle >= 7)
    reasons.push('pain_and_fatigue_combined');
  if (ctx.fatigueScore < 30)
    reasons.push('extreme_fatigue_accumulation');

  if (reasons.length === 0) return null;

  // Determine suggestion type
  let suggestion: string;
  let reasonText: string;

  if (reasons.includes('insufficient_time')) {
    suggestion = 'reduce_to_time_budget';
    reasonText = `Tiempo disponible insuficiente (${ctx.preWorkout.available_time_minutes} min vs ${ctx.preWorkout.planned_session_minutes} min). Se recomienda simplificar la sesión eliminando ejercicios accesorios.`;
  } else if (reasons.includes('extreme_fatigue_accumulation')) {
    suggestion = 'keep_compounds_only';
    reasonText = 'Fatiga acumulada muy alta. Se recomienda mantener solo los ejercicios principales con volumen mínimo.';
  } else if (reasons.includes('pain_and_fatigue_combined')) {
    suggestion = 'minimal_session';
    reasonText = 'Dolor y fatiga local elevados simultáneamente. Se recomienda una sesión mínima con ejercicios de baja demanda.';
  } else {
    suggestion = 'reduce_volume_globally';
    reasonText = 'Múltiples señales negativas detectadas. Se recomienda reducir el volumen global de la sesión.';
  }

  // Build recommended exercise list
  const keptExercises = ctx.session.exercises
    .filter(e => e.fatigue_cost >= 50)
    .map(e => ({
      exercise_id: e.exercise_id,
      exercise_name: e.exercise_name,
      recommended_sets: Math.max(1, e.planned_sets - 1),
      recommended_rir: Math.min(e.planned_rir + 2, 4),
      keep_rep_range: e.planned_rep_range,
    }));

  const removedExercises = ctx.session.exercises
    .filter(e => e.fatigue_cost < 50)
    .map(e => ({ exercise_id: e.exercise_id, exercise_name: e.exercise_name }));

  return {
    recommendation_type: 'RESTRUCTURE_SESSION',
    recommendation_reason: reasonText,
    recommendation_payload: {
      suggestion,
      triggers: reasons,
      available_minutes: ctx.preWorkout.available_time_minutes,
      planned_minutes: ctx.preWorkout.planned_session_minutes,
      kept_exercises: keptExercises,
      removed_exercises: removedExercises,
    },
  };
}

// ─── P2: SUBSTITUTE_EXERCISE ──────────────────────────────────────

function evaluateSubstitute(ctx: DecisionContext, ex: ExerciseContext): Recommendation | null {
  if (!ex.has_substitute_available) return null;

  const reasons: string[] = [];

  if (ctx.preWorkout.specific_pain_or_discomfort >= 6)
    reasons.push('moderate_to_high_pain');
  if (ex.fatigue_cost >= 70)
    reasons.push('high_fatigue_cost');
  if (ctx.preWorkout.local_fatigue_target_muscle >= 7 && ex.fatigue_cost >= 50)
    reasons.push('low_tolerance_today');

  if (reasons.length === 0) return null;

  let reasonText: string;
  if (reasons.includes('moderate_to_high_pain')) {
    reasonText = `Molestia/dolor elevado (${ctx.preWorkout.specific_pain_or_discomfort}/10). Se recomienda sustituir ${ex.exercise_name} por una alternativa equivalente menos agresiva.`;
  } else if (reasons.includes('low_tolerance_today')) {
    reasonText = `Fatiga local alta en ${ex.target_muscle_group} y coste del ejercicio elevado. Se recomienda una alternativa con menor demanda mecánica.`;
  } else {
    reasonText = `Coste de fatiga del ejercicio muy alto (${ex.fatigue_cost}/100). Se recomienda sustituir por una variante equivalente.`;
  }

  return {
    recommendation_type: 'SUBSTITUTE_EXERCISE',
    recommendation_reason: reasonText,
    exercise_id: ex.exercise_id,
    recommendation_payload: {
      original_exercise_id: ex.exercise_id,
      original_exercise_name: ex.exercise_name,
      substitute_exercise_id: ex.substitute_exercise_id,
      substitute_exercise_name: ex.substitute_exercise_name,
      keep_sets: ex.planned_sets,
      keep_rep_range: ex.planned_rep_range,
      keep_rir: ex.planned_rir,
      triggers: reasons,
    },
  };
}

// ─── P3: INCREASE_RIR ────────────────────────────────────────────

function evaluateIncreaseRir(ctx: DecisionContext, ex: ExerciseContext): Recommendation | null {
  let rirBump = 0;
  const reasons: string[] = [];

  // Moderate pain (not enough for substitute but notable)
  if (ctx.preWorkout.specific_pain_or_discomfort >= 4 && ctx.preWorkout.specific_pain_or_discomfort < 6) {
    rirBump = Math.max(rirBump, 1);
    reasons.push('moderate_pain');
  }

  // Moderate fatigue
  if (ctx.readinessState === 'MODERATE_FATIGUE') {
    rirBump = Math.max(rirBump, 1);
    reasons.push('moderate_fatigue');
  }

  // High fatigue
  if (ctx.readinessState === 'HIGH_FATIGUE') {
    rirBump = Math.max(rirBump, 2);
    reasons.push('high_fatigue');
  }

  // Local fatigue high
  if (ctx.preWorkout.local_fatigue_target_muscle >= 6 && ctx.preWorkout.local_fatigue_target_muscle < 8) {
    rirBump = Math.max(rirBump, 1);
    reasons.push('local_fatigue_moderate');
  }
  if (ctx.preWorkout.local_fatigue_target_muscle >= 8) {
    rirBump = Math.max(rirBump, 2);
    reasons.push('local_fatigue_high');
  }

  // Performance initially worse than expected
  if (ex.performance_ratio !== undefined && ex.performance_ratio < 0.92) {
    rirBump = Math.max(rirBump, 1);
    reasons.push('poor_initial_performance');
  }

  // Sleep/energy veto (still train but back off)
  if (ctx.veto.reasons.includes('severe_sleep_deprivation') || ctx.veto.reasons.includes('poor_sleep_and_energy')) {
    rirBump = Math.max(rirBump, 2);
    reasons.push('sleep_or_energy_deficit');
  }

  if (rirBump === 0) return null;

  const recommendedRir = Math.min(ex.planned_rir + rirBump, 4);
  if (recommendedRir === ex.planned_rir) return null;

  return {
    recommendation_type: 'INCREASE_RIR',
    recommendation_reason: `Se recomienda subir el RIR de ${ex.exercise_name} de ${ex.planned_rir} a ${recommendedRir} para moderar la intensidad.`,
    exercise_id: ex.exercise_id,
    recommendation_payload: {
      exercise_name: ex.exercise_name,
      original_rir: ex.planned_rir,
      recommended_rir: recommendedRir,
      rir_bump: rirBump,
      triggers: reasons,
    },
  };
}

// ─── P4: REMOVE_SET ───────────────────────────────────────────────

function evaluateRemoveSet(ctx: DecisionContext, ex: ExerciseContext): Recommendation | null {
  if (ex.planned_sets <= 1) return null;

  const reasons: string[] = [];
  let setsToRemove = 0;

  // Moderate fatigue → remove 1 from accessories
  if (ctx.readinessScore >= 50 && ctx.readinessScore < 65 && ex.fatigue_cost < 50) {
    setsToRemove = 1;
    reasons.push('moderate_fatigue_accessory');
  }

  // High fatigue → remove 1 from all
  if (ctx.readinessScore < 50) {
    setsToRemove = 1;
    reasons.push('high_fatigue');
  }

  // High local fatigue
  if (ctx.preWorkout.local_fatigue_target_muscle >= 7) {
    setsToRemove = Math.max(setsToRemove, 1);
    reasons.push('local_fatigue_high');
  }

  // Excessive rep drop between sets
  if (ex.rep_drop_percent !== undefined && ex.rep_drop_percent > 25) {
    setsToRemove = Math.max(setsToRemove, 1);
    reasons.push('excessive_rep_drop');
  }

  // Poor initial performance
  if (ex.performance_ratio !== undefined && ex.performance_ratio < 0.88) {
    setsToRemove = Math.max(setsToRemove, 1);
    reasons.push('poor_initial_performance');
  }

  if (setsToRemove === 0) return null;

  const recommendedSets = Math.max(1, ex.planned_sets - setsToRemove);

  return {
    recommendation_type: 'REMOVE_SET',
    recommendation_reason: `Se recomienda reducir ${ex.exercise_name} de ${ex.planned_sets} a ${recommendedSets} series.`,
    exercise_id: ex.exercise_id,
    recommendation_payload: {
      exercise_name: ex.exercise_name,
      original_sets: ex.planned_sets,
      recommended_sets: recommendedSets,
      sets_removed: ex.planned_sets - recommendedSets,
      triggers: reasons,
    },
  };
}

// ─── P5: ADD_SET ──────────────────────────────────────────────────

function evaluateAddSet(ctx: DecisionContext): Recommendation | null {
  // Strict eligibility guards
  if (ctx.readinessScore < 80) return null;
  if (ctx.preWorkout.specific_pain_or_discomfort > 3) return null;
  if (ctx.preWorkout.local_fatigue_target_muscle > 4) return null;
  if (ctx.performance.intensity_adherence_ratio < 0.85) return null;
  if (ctx.performance.avg_rir_deviation > 0.5) return null;
  if (ctx.performanceScore < 75) return null;
  if (ctx.fatigueScore < 65) return null;
  if (ctx.veto.vetoed) return null;

  // Pick the best candidate: highest fatigue_cost compound
  const candidate = [...ctx.session.exercises]
    .filter(e => e.fatigue_cost >= 30)
    .sort((a, b) => b.fatigue_cost - a.fatigue_cost)[0];

  if (!candidate) return null;

  return {
    recommendation_type: 'ADD_SET',
    recommendation_reason: `Readiness óptimo (${Math.round(ctx.readinessScore)}/100). Se recomienda añadir una serie a ${candidate.exercise_name} para maximizar el estímulo.`,
    exercise_id: candidate.exercise_id,
    recommendation_payload: {
      exercise_name: candidate.exercise_name,
      original_sets: candidate.planned_sets,
      recommended_sets: candidate.planned_sets + 1,
      keep_rep_range: candidate.planned_rep_range,
      keep_rir: candidate.planned_rir,
      readiness_score: Math.round(ctx.readinessScore),
      performance_score: Math.round(ctx.performanceScore),
      fatigue_score: Math.round(ctx.fatigueScore),
    },
  };
}

// ─── P6: KEEP_PLAN ────────────────────────────────────────────────

function keepPlanReason(ctx: DecisionContext): string {
  if (ctx.readinessScore >= 65)
    return 'Readiness bueno. El plan actual es adecuado, mantén el volumen e intensidad previstos.';
  return 'No se detectan ajustes necesarios. El plan original se mantiene.';
}
