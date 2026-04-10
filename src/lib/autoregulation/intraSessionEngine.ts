/**
 * Intra-Session Evaluation Engine — NEO
 *
 * Monitors live set data and triggers mid-session recommendations
 * after the first 1–2 working sets of each exercise.
 *
 * Pure logic, no DB calls. Never applies changes automatically.
 */

import type { Recommendation, ExerciseContext, SessionContext } from './recommendationEngine';
import type { PreWorkoutCheckInInput } from './scoring';

// ─── Types ────────────────────────────────────────────────────────

export interface LiveSetData {
  set_number: number;
  weight: number;
  reps: number;
  target_rir: number;
  actual_rir: number;
  is_warmup: boolean;
}

export interface ExerciseBaseline {
  exercise_id: string;
  avg_weight: number;
  avg_reps: number;
  avg_estimated_1rm: number;
}

export interface IntraSessionInput {
  exercise: ExerciseContext;
  completedSets: LiveSetData[];
  baseline?: ExerciseBaseline;
  preWorkout?: PreWorkoutCheckInInput;
  /** Running accumulation across exercises already done this session */
  sessionFatigueAccumulated?: number;
}

export interface IntraSessionAlert {
  alert_type:
    | 'performance_below_expected'
    | 'sharp_dropoff'
    | 'pain_emerged'
    | 'rir_pattern_deviation'
    | 'cumulative_fatigue';
  severity: 'warning' | 'critical';
  detail: string;
  value: number;
  threshold: number;
}

export interface IntraSessionResult {
  should_trigger: boolean;
  alerts: IntraSessionAlert[];
  recommendations: Recommendation[];
  /** Estimated performance ratio for this exercise so far */
  current_performance_ratio: number;
  /** Avg RIR deviation across completed working sets */
  avg_rir_deviation: number;
}

// ─── Constants ────────────────────────────────────────────────────

const PERF_RATIO_WARNING = 0.90;
const PERF_RATIO_CRITICAL = 0.82;
const DROPOFF_WARNING_PERCENT = 20;
const DROPOFF_CRITICAL_PERCENT = 30;
const RIR_DEVIATION_THRESHOLD = 1.5;
const PAIN_THRESHOLD = 6;
const MIN_WORKING_SETS_TO_EVALUATE = 1;

// ─── Core Evaluation ─────────────────────────────────────────────

export function evaluateIntraSession(input: IntraSessionInput): IntraSessionResult {
  const workingSets = input.completedSets.filter(s => !s.is_warmup);

  if (workingSets.length < MIN_WORKING_SETS_TO_EVALUATE) {
    return {
      should_trigger: false,
      alerts: [],
      recommendations: [],
      current_performance_ratio: 1.0,
      avg_rir_deviation: 0,
    };
  }

  const alerts: IntraSessionAlert[] = [];

  // ── 1. Performance vs expected ──
  const perfRatio = computePerformanceRatio(workingSets, input.baseline);

  if (perfRatio < PERF_RATIO_CRITICAL) {
    alerts.push({
      alert_type: 'performance_below_expected',
      severity: 'critical',
      detail: `Rendimiento al ${Math.round(perfRatio * 100)}% de lo esperado. Caída significativa detectada.`,
      value: perfRatio,
      threshold: PERF_RATIO_CRITICAL,
    });
  } else if (perfRatio < PERF_RATIO_WARNING) {
    alerts.push({
      alert_type: 'performance_below_expected',
      severity: 'warning',
      detail: `Rendimiento al ${Math.round(perfRatio * 100)}% de lo esperado.`,
      value: perfRatio,
      threshold: PERF_RATIO_WARNING,
    });
  }

  // ── 2. Sharp dropoff between sets ──
  const dropoff = computeDropoff(workingSets);

  if (dropoff > DROPOFF_CRITICAL_PERCENT) {
    alerts.push({
      alert_type: 'sharp_dropoff',
      severity: 'critical',
      detail: `Caída del ${Math.round(dropoff)}% entre series. Fatiga intra-sesión excesiva.`,
      value: dropoff,
      threshold: DROPOFF_CRITICAL_PERCENT,
    });
  } else if (dropoff > DROPOFF_WARNING_PERCENT) {
    alerts.push({
      alert_type: 'sharp_dropoff',
      severity: 'warning',
      detail: `Caída del ${Math.round(dropoff)}% entre series.`,
      value: dropoff,
      threshold: DROPOFF_WARNING_PERCENT,
    });
  }

  // ── 3. Pain emerged ──
  if (input.preWorkout && input.preWorkout.specific_pain_or_discomfort >= PAIN_THRESHOLD) {
    alerts.push({
      alert_type: 'pain_emerged',
      severity: input.preWorkout.specific_pain_or_discomfort >= 8 ? 'critical' : 'warning',
      detail: `Dolor o molestia reportada: ${input.preWorkout.specific_pain_or_discomfort}/10.`,
      value: input.preWorkout.specific_pain_or_discomfort,
      threshold: PAIN_THRESHOLD,
    });
  }

  // ── 4. RIR pattern deviation ──
  const avgRirDev = computeAvgRirDeviation(workingSets);

  if (avgRirDev >= RIR_DEVIATION_THRESHOLD) {
    alerts.push({
      alert_type: 'rir_pattern_deviation',
      severity: avgRirDev >= 2.5 ? 'critical' : 'warning',
      detail: `Desviación media de RIR: ${avgRirDev.toFixed(1)}. El usuario se queda consistentemente lejos de la intensidad pautada.`,
      value: avgRirDev,
      threshold: RIR_DEVIATION_THRESHOLD,
    });
  }

  // ── 5. Cumulative fatigue ──
  if (input.sessionFatigueAccumulated !== undefined && input.sessionFatigueAccumulated > 75) {
    alerts.push({
      alert_type: 'cumulative_fatigue',
      severity: input.sessionFatigueAccumulated > 90 ? 'critical' : 'warning',
      detail: `Fatiga acumulada de sesión: ${Math.round(input.sessionFatigueAccumulated)}%.`,
      value: input.sessionFatigueAccumulated,
      threshold: 75,
    });
  }

  // ── Build recommendations from alerts ──
  const recommendations = buildRecommendationsFromAlerts(alerts, input);

  return {
    should_trigger: alerts.length > 0,
    alerts,
    recommendations,
    current_performance_ratio: perfRatio,
    avg_rir_deviation: avgRirDev,
  };
}

// ─── Performance Ratio ────────────────────────────────────────────

function computePerformanceRatio(workingSets: LiveSetData[], baseline?: ExerciseBaseline): number {
  if (!baseline || baseline.avg_estimated_1rm === 0) return 1.0;

  // Use first set (or avg of first two) to estimate current e1RM
  const evalSets = workingSets.slice(0, 2);
  const avgE1rm = evalSets.reduce((sum, s) => {
    const e1rm = s.weight * (1 + s.reps / 30);
    return sum + e1rm;
  }, 0) / evalSets.length;

  return avgE1rm / baseline.avg_estimated_1rm;
}

// ─── Dropoff ──────────────────────────────────────────────────────

function computeDropoff(workingSets: LiveSetData[]): number {
  if (workingSets.length < 2) return 0;

  const firstVolume = workingSets[0].weight * workingSets[0].reps;
  const lastVolume = workingSets[workingSets.length - 1].weight * workingSets[workingSets.length - 1].reps;

  if (firstVolume === 0) return 0;
  return Math.max(0, ((firstVolume - lastVolume) / firstVolume) * 100);
}

// ─── RIR Deviation ────────────────────────────────────────────────

function computeAvgRirDeviation(workingSets: LiveSetData[]): number {
  if (workingSets.length === 0) return 0;
  const totalDev = workingSets.reduce((sum, s) => sum + Math.abs(s.actual_rir - s.target_rir), 0);
  return totalDev / workingSets.length;
}

// ─── Recommendation Builder ──────────────────────────────────────

function buildRecommendationsFromAlerts(
  alerts: IntraSessionAlert[],
  input: IntraSessionInput,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const ex = input.exercise;

  const hasCritical = alerts.some(a => a.severity === 'critical');
  const hasPain = alerts.some(a => a.alert_type === 'pain_emerged');
  const hasDropoff = alerts.some(a => a.alert_type === 'sharp_dropoff');
  const hasPerfDrop = alerts.some(a => a.alert_type === 'performance_below_expected');
  const hasRirDev = alerts.some(a => a.alert_type === 'rir_pattern_deviation');
  const hasCumulativeFatigue = alerts.some(a => a.alert_type === 'cumulative_fatigue' && a.severity === 'critical');

  // Multiple critical alerts → RESTRUCTURE
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  if (criticalCount >= 2 || hasCumulativeFatigue) {
    recs.push({
      recommendation_type: 'RESTRUCTURE_SESSION',
      recommendation_reason: 'Múltiples señales críticas detectadas durante la sesión. Se recomienda simplificar el resto de la sesión manteniendo solo ejercicios principales con volumen reducido.',
      recommendation_payload: {
        suggestion: 'simplify_remaining',
        triggers: alerts.map(a => a.alert_type),
        source: 'intra_session',
      },
    });
    return recs;
  }

  // Pain → SUBSTITUTE (if available) or INCREASE_RIR
  if (hasPain && ex.has_substitute_available) {
    recs.push({
      recommendation_type: 'SUBSTITUTE_EXERCISE',
      recommendation_reason: `Dolor emergente durante ${ex.exercise_name}. Se recomienda sustituir por ${ex.substitute_exercise_name} para el resto de series.`,
      exercise_id: ex.exercise_id,
      recommendation_payload: {
        original_exercise_id: ex.exercise_id,
        original_exercise_name: ex.exercise_name,
        substitute_exercise_id: ex.substitute_exercise_id,
        substitute_exercise_name: ex.substitute_exercise_name,
        keep_sets: Math.max(1, ex.planned_sets - input.completedSets.filter(s => !s.is_warmup).length),
        keep_rep_range: ex.planned_rep_range,
        keep_rir: Math.min(ex.planned_rir + 1, 4),
        triggers: ['pain_emerged'],
        source: 'intra_session',
      },
    });
    return recs;
  }

  // Sharp dropoff or critical perf drop → REMOVE_SET
  if ((hasDropoff && alerts.find(a => a.alert_type === 'sharp_dropoff')?.severity === 'critical') ||
      (hasPerfDrop && alerts.find(a => a.alert_type === 'performance_below_expected')?.severity === 'critical')) {
    const workingDone = input.completedSets.filter(s => !s.is_warmup).length;
    const remaining = Math.max(0, ex.planned_sets - workingDone);
    if (remaining > 0) {
      const setsToRemove = Math.min(remaining, Math.ceil(remaining / 2));
      recs.push({
        recommendation_type: 'REMOVE_SET',
        recommendation_reason: `Caída de rendimiento significativa en ${ex.exercise_name}. Se recomienda reducir las series restantes.`,
        exercise_id: ex.exercise_id,
        recommendation_payload: {
          exercise_name: ex.exercise_name,
          original_sets: ex.planned_sets,
          recommended_sets: ex.planned_sets - setsToRemove,
          sets_removed: setsToRemove,
          sets_already_completed: workingDone,
          triggers: alerts.filter(a => a.severity === 'critical').map(a => a.alert_type),
          source: 'intra_session',
        },
      });
    }
  }

  // RIR deviation or warning-level perf/dropoff → INCREASE_RIR
  if (hasRirDev || (hasPerfDrop && !hasCritical) || (hasPain && !ex.has_substitute_available)) {
    const bump = hasCritical ? 2 : 1;
    const recommendedRir = Math.min(ex.planned_rir + bump, 4);
    if (recommendedRir > ex.planned_rir) {
      recs.push({
        recommendation_type: 'INCREASE_RIR',
        recommendation_reason: `Se detecta desviación en la ejecución de ${ex.exercise_name}. Se recomienda moderar la intensidad subiendo el RIR de ${ex.planned_rir} a ${recommendedRir} en las series restantes.`,
        exercise_id: ex.exercise_id,
        recommendation_payload: {
          exercise_name: ex.exercise_name,
          original_rir: ex.planned_rir,
          recommended_rir: recommendedRir,
          rir_bump: bump,
          triggers: alerts.map(a => a.alert_type),
          source: 'intra_session',
        },
      });
    }
  }

  return recs;
}

// ─── Session-level tracker ────────────────────────────────────────

export interface SessionTracker {
  exerciseResults: Map<string, IntraSessionResult>;
  cumulativeFatigue: number;
}

export function createSessionTracker(): SessionTracker {
  return { exerciseResults: new Map(), cumulativeFatigue: 0 };
}

/**
 * Call after each set to check if a mid-session recommendation should fire.
 * Returns null if no trigger, or an IntraSessionResult with recommendations.
 */
export function trackSetAndEvaluate(
  tracker: SessionTracker,
  input: IntraSessionInput,
): IntraSessionResult | null {
  const workingSets = input.completedSets.filter(s => !s.is_warmup);

  // Only evaluate after 1+ working sets
  if (workingSets.length < MIN_WORKING_SETS_TO_EVALUATE) return null;

  // Only trigger evaluation at set 1 and set 2 (not on every subsequent set)
  if (workingSets.length > 2) {
    // Already evaluated this exercise — only re-evaluate if pain emerged
    const prev = tracker.exerciseResults.get(input.exercise.exercise_id);
    if (prev && !input.preWorkout) return null;
  }

  // Update cumulative fatigue based on exercise fatigue_cost
  const fatigueDelta = (input.exercise.fatigue_cost / 100) * (workingSets.length * 10);
  tracker.cumulativeFatigue = Math.min(100, tracker.cumulativeFatigue + fatigueDelta);

  const enrichedInput: IntraSessionInput = {
    ...input,
    sessionFatigueAccumulated: tracker.cumulativeFatigue,
  };

  const result = evaluateIntraSession(enrichedInput);
  tracker.exerciseResults.set(input.exercise.exercise_id, result);

  if (!result.should_trigger) return null;
  return result;
}
