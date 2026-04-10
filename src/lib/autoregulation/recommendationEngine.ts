/**
 * Autoregulation Recommendation Engine — NEO
 *
 * Takes scores + context → outputs typed recommendations.
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
  fatigue_cost: number;             // 0-100
  has_substitute_available: boolean;
  substitute_exercise_id?: string;
  substitute_exercise_name?: string;
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
  sleep_hours: 7,
  sleep_quality: 6,
  general_energy: 6,
  mental_stress: 4,
  general_soreness: 3,
  motivation: 6,
  joint_discomfort: 2,
};

const DEFAULT_PRE_WORKOUT: PreWorkoutCheckInInput = {
  expected_strength: 6,
  general_freshness: 6,
  local_fatigue_target_muscle: 3,
  specific_pain_or_discomfort: 1,
  willingness_to_push: 6,
  available_time_minutes: 90,
  planned_session_minutes: 60,
};

const DEFAULT_PERFORMANCE: PerformanceInput = {
  performance_vs_baseline_ratio: 1.0,
  rep_drop_between_sets_percent: 10,
  plan_completion_ratio: 1.0,
  intensity_adherence_ratio: 1.0,
  avg_rir_deviation: 0.5,
};

const DEFAULT_FATIGUE: FatigueInput = {
  recent_volume_load_score: 70,
  local_fatigue_history_score: 70,
  performance_decline_score: 80,
  recovery_penalty_score: 75,
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
    dailyScore,
    preWorkoutScore,
    performanceScore,
    fatigueScore,
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

  const recommendations = generateRecommendations(
    readinessState,
    veto,
    input.session,
    preWorkout,
    daily,
    fatigueScore,
  );

  return {
    dailyScore,
    preWorkoutScore,
    performanceScore,
    fatigueScore,
    readinessScore,
    readinessState,
    veto,
    recommendations,
  };
}

// ─── Recommendation Logic ─────────────────────────────────────────

function generateRecommendations(
  state: ReadinessState,
  veto: VetoResult,
  session: SessionContext,
  preWorkout: PreWorkoutCheckInInput,
  daily: DailyCheckInInput,
  fatigueScore: number,
): Recommendation[] {
  const recs: Recommendation[] = [];

  // ── Veto-based recommendations (override state) ──

  if (veto.vetoed) {
    if (veto.reasons.includes('pain_too_high')) {
      // Suggest substitution for exercises targeting the painful area
      for (const ex of session.exercises) {
        if (ex.has_substitute_available) {
          recs.push({
            recommendation_type: 'SUBSTITUTE_EXERCISE',
            recommendation_reason: 'Dolor específico elevado (≥8/10). Se recomienda sustituir el ejercicio por una alternativa que no agrave la molestia.',
            exercise_id: ex.exercise_id,
            recommendation_payload: {
              original_exercise: ex.exercise_name,
              substitute_exercise_id: ex.substitute_exercise_id,
              substitute_exercise_name: ex.substitute_exercise_name,
              keep_sets: ex.planned_sets,
              keep_rep_range: ex.planned_rep_range,
            },
          });
        } else {
          recs.push({
            recommendation_type: 'REMOVE_SET',
            recommendation_reason: 'Dolor específico elevado sin alternativa disponible. Se recomienda reducir volumen.',
            exercise_id: ex.exercise_id,
            recommendation_payload: {
              original_sets: ex.planned_sets,
              recommended_sets: Math.max(1, ex.planned_sets - 1),
            },
          });
        }
      }
    }

    if (veto.reasons.includes('local_fatigue_too_high')) {
      for (const ex of session.exercises) {
        if (ex.fatigue_cost >= 60) {
          recs.push({
            recommendation_type: 'INCREASE_RIR',
            recommendation_reason: 'Fatiga local muy alta en el músculo objetivo (≥8/10). Se recomienda subir el RIR para reducir la demanda mecánica.',
            exercise_id: ex.exercise_id,
            recommendation_payload: {
              original_rir: ex.planned_rir,
              recommended_rir: Math.min(ex.planned_rir + 2, 4),
            },
          });
        }
      }
    }

    if (veto.reasons.includes('insufficient_time')) {
      recs.push({
        recommendation_type: 'RESTRUCTURE_SESSION',
        recommendation_reason: `Tiempo disponible insuficiente (${preWorkout.available_time_minutes} min vs ${preWorkout.planned_session_minutes} min planificados). Se recomienda simplificar la sesión.`,
        recommendation_payload: {
          available_minutes: preWorkout.available_time_minutes,
          planned_minutes: preWorkout.planned_session_minutes,
          suggestion: 'reduce_accessories',
        },
      });
    }

    if (veto.reasons.includes('severe_sleep_deprivation') || veto.reasons.includes('poor_sleep_and_energy')) {
      for (const ex of session.exercises) {
        recs.push({
          recommendation_type: 'INCREASE_RIR',
          recommendation_reason: 'Privación de sueño o energía muy baja detectada. Se recomienda moderar la intensidad global.',
          exercise_id: ex.exercise_id,
          recommendation_payload: {
            original_rir: ex.planned_rir,
            recommended_rir: Math.min(ex.planned_rir + 2, 4),
          },
        });
      }
    }

    return recs;
  }

  // ── State-based recommendations (no veto) ──

  switch (state) {
    case 'READY_TO_PROGRESS': {
      // Find the highest-fatigue-cost compound exercise and suggest +1 set
      const candidate = [...session.exercises]
        .filter(e => e.fatigue_cost >= 30)
        .sort((a, b) => b.fatigue_cost - a.fatigue_cost)[0];

      if (candidate) {
        recs.push({
          recommendation_type: 'ADD_SET',
          recommendation_reason: 'Readiness óptimo. Se recomienda añadir una serie al ejercicio principal para maximizar el estímulo.',
          exercise_id: candidate.exercise_id,
          recommendation_payload: {
            original_sets: candidate.planned_sets,
            recommended_sets: candidate.planned_sets + 1,
          },
        });
      } else {
        recs.push({
          recommendation_type: 'KEEP_PLAN',
          recommendation_reason: 'Readiness óptimo. El plan actual es adecuado para progresar.',
          recommendation_payload: {},
        });
      }
      break;
    }

    case 'READY_TO_MAINTAIN': {
      recs.push({
        recommendation_type: 'KEEP_PLAN',
        recommendation_reason: 'Readiness bueno. El plan actual es adecuado, mantén el volumen e intensidad previstos.',
        recommendation_payload: {},
      });
      break;
    }

    case 'MODERATE_FATIGUE': {
      // Reduce last (accessory) exercise by 1 set, increase RIR +1 globally
      const accessories = session.exercises.filter(e => e.fatigue_cost < 40);
      if (accessories.length > 0) {
        const last = accessories[accessories.length - 1];
        recs.push({
          recommendation_type: 'REMOVE_SET',
          recommendation_reason: 'Fatiga moderada detectada. Se recomienda reducir una serie del ejercicio accesorio para gestionar la carga acumulada.',
          exercise_id: last.exercise_id,
          recommendation_payload: {
            original_sets: last.planned_sets,
            recommended_sets: Math.max(1, last.planned_sets - 1),
          },
        });
      }

      for (const ex of session.exercises) {
        recs.push({
          recommendation_type: 'INCREASE_RIR',
          recommendation_reason: 'Fatiga moderada. Se recomienda moderar la intensidad ligeramente.',
          exercise_id: ex.exercise_id,
          recommendation_payload: {
            original_rir: ex.planned_rir,
            recommended_rir: Math.min(ex.planned_rir + 1, 3),
          },
        });
      }
      break;
    }

    case 'HIGH_FATIGUE': {
      // Remove 1 set from each exercise, increase RIR +2
      for (const ex of session.exercises) {
        if (ex.planned_sets > 1) {
          recs.push({
            recommendation_type: 'REMOVE_SET',
            recommendation_reason: 'Fatiga alta detectada. Se recomienda reducir el volumen para priorizar la recuperación.',
            exercise_id: ex.exercise_id,
            recommendation_payload: {
              original_sets: ex.planned_sets,
              recommended_sets: Math.max(1, ex.planned_sets - 1),
            },
          });
        }

        recs.push({
          recommendation_type: 'INCREASE_RIR',
          recommendation_reason: 'Fatiga alta. Se recomienda moderar significativamente la intensidad.',
          exercise_id: ex.exercise_id,
          recommendation_payload: {
            original_rir: ex.planned_rir,
            recommended_rir: Math.min(ex.planned_rir + 2, 4),
          },
        });
      }

      // If fatigue is extreme, suggest restructuring
      if (fatigueScore < 30) {
        recs.push({
          recommendation_type: 'RESTRUCTURE_SESSION',
          recommendation_reason: 'Fatiga acumulada muy alta. Se recomienda simplificar la sesión: mantener solo los ejercicios principales con volumen mínimo.',
          recommendation_payload: {
            suggestion: 'keep_compounds_only',
          },
        });
      }
      break;
    }
  }

  return recs;
}
