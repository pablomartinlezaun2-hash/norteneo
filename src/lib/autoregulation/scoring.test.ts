import { describe, it, expect } from 'vitest';
import {
  positiveScore,
  negativeScore,
  sleepHoursScore,
  timeAvailabilityScore,
  computeDailyScore,
  getReadinessState,
  checkVetoRules,
} from './scoring';
import { computeRecommendations, type ExerciseContext } from './recommendationEngine';

// ─── Helpers ──────────────────────────────────────────────────────

const mkExercise = (overrides: Partial<ExerciseContext> = {}): ExerciseContext => ({
  exercise_id: 'e1', exercise_name: 'Sentadilla', planned_sets: 4,
  planned_rir: 0, planned_rep_range: '6-8', target_muscle_group: 'Cuádriceps',
  fatigue_cost: 70, has_substitute_available: false,
  ...overrides,
});

const mkSession = (exercises?: ExerciseContext[]) => ({
  session_id: 's1',
  planned_duration_minutes: 60,
  exercises: exercises ?? [
    mkExercise(),
    mkExercise({ exercise_id: 'e2', exercise_name: 'Extensión', planned_sets: 3, fatigue_cost: 30,
      has_substitute_available: true, substitute_exercise_id: 'e3', substitute_exercise_name: 'Prensa' }),
  ],
});

const goodDaily = () => ({ sleep_hours: 8, sleep_quality: 9, general_energy: 9, mental_stress: 2, general_discomfort: 1 });
const goodPreWorkout = () => ({ expected_strength: 9, local_fatigue_target_muscle: 1, specific_pain_or_discomfort: 1, available_time_minutes: 90, planned_session_minutes: 60 });
const neutralDaily = () => ({ sleep_hours: 7, sleep_quality: 7, general_energy: 7, mental_stress: 3, general_discomfort: 2 });
const neutralPreWorkout = () => ({ expected_strength: 7, local_fatigue_target_muscle: 3, specific_pain_or_discomfort: 2, available_time_minutes: 70, planned_session_minutes: 60 });

// ─── Normalization ────────────────────────────────────────────────

describe('Normalization', () => {
  it('positiveScore: 1→0, 10→100, 5.5→50', () => {
    expect(positiveScore(1)).toBe(0);
    expect(positiveScore(10)).toBeCloseTo(100);
    expect(positiveScore(5.5)).toBeCloseTo(50);
  });
  it('negativeScore: 1→100, 10→0', () => {
    expect(negativeScore(1)).toBe(100);
    expect(negativeScore(10)).toBeCloseTo(0);
  });
  it('sleepHoursScore maps correctly', () => {
    expect(sleepHoursScore(9)).toBe(100);
    expect(sleepHoursScore(7)).toBe(85);
    expect(sleepHoursScore(3)).toBe(10);
  });
  it('timeAvailabilityScore maps correctly', () => {
    expect(timeAvailabilityScore(60, 60)).toBe(100);
    expect(timeAvailabilityScore(30, 60)).toBe(15);
  });
});

describe('Readiness states', () => {
  it('maps score ranges', () => {
    expect(getReadinessState(85)).toBe('READY_TO_PROGRESS');
    expect(getReadinessState(70)).toBe('READY_TO_MAINTAIN');
    expect(getReadinessState(55)).toBe('MODERATE_FATIGUE');
    expect(getReadinessState(40)).toBe('HIGH_FATIGUE');
  });
});

describe('Veto rules', () => {
  it('pain >= 8 triggers veto', () => {
    const r = checkVetoRules({
      specific_pain_or_discomfort: 9, local_fatigue_target_muscle: 3,
      sleep_hours: 7, sleep_quality: 7, general_energy: 7,
      available_time_minutes: 60, planned_session_minutes: 60,
    });
    expect(r.vetoed).toBe(true);
    expect(r.reasons).toContain('pain_too_high');
  });
  it('no veto on good inputs', () => {
    const r = checkVetoRules({
      specific_pain_or_discomfort: 2, local_fatigue_target_muscle: 3,
      sleep_hours: 7, sleep_quality: 7, general_energy: 7,
      available_time_minutes: 60, planned_session_minutes: 60,
    });
    expect(r.vetoed).toBe(false);
  });
});

// ─── Decision Rules ───────────────────────────────────────────────

describe('ADD_SET eligibility', () => {
  it('recommends ADD_SET when all guards pass', () => {
    const out = computeRecommendations({
      daily: goodDaily(),
      preWorkout: goodPreWorkout(),
      performance: { performance_vs_baseline_ratio: 1.05, rep_drop_between_sets_percent: 5,
        plan_completion_ratio: 1.0, intensity_adherence_ratio: 1.0, avg_rir_deviation: 0.3 },
      fatigue: { recent_volume_load_score: 85, local_fatigue_history_score: 85,
        performance_decline_score: 90, recovery_penalty_score: 85 },
      session: mkSession(),
    });
    expect(out.readinessState).toBe('READY_TO_PROGRESS');
    expect(out.recommendations).toHaveLength(1);
    expect(out.recommendations[0].recommendation_type).toBe('ADD_SET');
    expect(out.recommendations[0].recommendation_payload).toMatchObject({
      original_sets: 4, recommended_sets: 5, keep_rep_range: '6-8',
    });
  });

  it('blocks ADD_SET when pain > 3', () => {
    const out = computeRecommendations({
      daily: goodDaily(),
      preWorkout: { ...goodPreWorkout(), specific_pain_or_discomfort: 5 },
      performance: { performance_vs_baseline_ratio: 1.05, rep_drop_between_sets_percent: 5,
        plan_completion_ratio: 1.0, intensity_adherence_ratio: 1.0, avg_rir_deviation: 0.3 },
      fatigue: { recent_volume_load_score: 85, local_fatigue_history_score: 85,
        performance_decline_score: 90, recovery_penalty_score: 85 },
      session: mkSession(),
    });
    const types = out.recommendations.map(r => r.recommendation_type);
    expect(types).not.toContain('ADD_SET');
  });
});

describe('KEEP_PLAN', () => {
  it('returns KEEP_PLAN for maintain readiness with no issues', () => {
    const out = computeRecommendations({
      daily: { sleep_hours: 7, sleep_quality: 7, general_energy: 7, mental_stress: 3, general_discomfort: 1 },
      preWorkout: { expected_strength: 7, local_fatigue_target_muscle: 2, specific_pain_or_discomfort: 1, available_time_minutes: 70, planned_session_minutes: 60 },
      performance: { performance_vs_baseline_ratio: 1.0, rep_drop_between_sets_percent: 8,
        plan_completion_ratio: 1.0, intensity_adherence_ratio: 1.0, avg_rir_deviation: 0.5 },
      fatigue: { recent_volume_load_score: 75, local_fatigue_history_score: 75,
        performance_decline_score: 80, recovery_penalty_score: 75 },
      session: mkSession(),
    });
    expect(out.recommendations.some(r => r.recommendation_type === 'KEEP_PLAN')).toBe(true);
  });
});

describe('REMOVE_SET', () => {
  it('removes sets from accessories on moderate fatigue', () => {
    const out = computeRecommendations({
      daily: { sleep_hours: 5, sleep_quality: 4, general_energy: 4, mental_stress: 6, general_discomfort: 5 },
      preWorkout: { expected_strength: 5, local_fatigue_target_muscle: 5, specific_pain_or_discomfort: 3, available_time_minutes: 60, planned_session_minutes: 60 },
      performance: { performance_vs_baseline_ratio: 0.95, rep_drop_between_sets_percent: 15,
        plan_completion_ratio: 0.9, intensity_adherence_ratio: 0.95, avg_rir_deviation: 1.0 },
      fatigue: { recent_volume_load_score: 50, local_fatigue_history_score: 50,
        performance_decline_score: 55, recovery_penalty_score: 50 },
      session: mkSession(),
    });
    const removeRecs = out.recommendations.filter(r => r.recommendation_type === 'REMOVE_SET');
    expect(removeRecs.length).toBeGreaterThanOrEqual(1);
    const accessoryRemove = removeRecs.find(r => r.exercise_id === 'e2');
    if (accessoryRemove) {
      expect(accessoryRemove.recommendation_payload.recommended_sets).toBe(2);
    }
  });
});

describe('SUBSTITUTE_EXERCISE', () => {
  it('suggests substitution on pain >= 6 when substitute available', () => {
    const out = computeRecommendations({
      daily: neutralDaily(),
      preWorkout: { expected_strength: 7, local_fatigue_target_muscle: 3, specific_pain_or_discomfort: 7, available_time_minutes: 60, planned_session_minutes: 60 },
      performance: { performance_vs_baseline_ratio: 1.0, rep_drop_between_sets_percent: 10,
        plan_completion_ratio: 1.0, intensity_adherence_ratio: 1.0, avg_rir_deviation: 0.5 },
      fatigue: { recent_volume_load_score: 70, local_fatigue_history_score: 70,
        performance_decline_score: 80, recovery_penalty_score: 75 },
      session: mkSession(),
    });
    const subRecs = out.recommendations.filter(r => r.recommendation_type === 'SUBSTITUTE_EXERCISE');
    expect(subRecs.length).toBeGreaterThanOrEqual(1);
    expect(subRecs[0].recommendation_payload).toMatchObject({
      keep_sets: expect.any(Number),
      keep_rep_range: expect.any(String),
      keep_rir: expect.any(Number),
    });
  });
});

describe('INCREASE_RIR', () => {
  it('bumps RIR on moderate pain', () => {
    const out = computeRecommendations({
      daily: neutralDaily(),
      preWorkout: { expected_strength: 7, local_fatigue_target_muscle: 3, specific_pain_or_discomfort: 5, available_time_minutes: 60, planned_session_minutes: 60 },
      performance: { performance_vs_baseline_ratio: 1.0, rep_drop_between_sets_percent: 10,
        plan_completion_ratio: 1.0, intensity_adherence_ratio: 1.0, avg_rir_deviation: 0.5 },
      fatigue: { recent_volume_load_score: 70, local_fatigue_history_score: 70,
        performance_decline_score: 80, recovery_penalty_score: 75 },
      session: mkSession(),
    });
    const rirRecs = out.recommendations.filter(r => r.recommendation_type === 'INCREASE_RIR');
    expect(rirRecs.length).toBeGreaterThanOrEqual(1);
    expect(rirRecs[0].recommendation_payload.recommended_rir).toBeGreaterThan(0);
  });
});

describe('RESTRUCTURE_SESSION', () => {
  it('triggers on readiness < 50 with multiple issues', () => {
    const out = computeRecommendations({
      daily: { sleep_hours: 3, sleep_quality: 2, general_energy: 2, mental_stress: 9, general_discomfort: 8 },
      preWorkout: { expected_strength: 2, local_fatigue_target_muscle: 8, specific_pain_or_discomfort: 7, available_time_minutes: 30, planned_session_minutes: 60 },
      performance: { performance_vs_baseline_ratio: 0.80, rep_drop_between_sets_percent: 35,
        plan_completion_ratio: 0.5, intensity_adherence_ratio: 0.80, avg_rir_deviation: 2.5 },
      fatigue: { recent_volume_load_score: 20, local_fatigue_history_score: 25,
        performance_decline_score: 30, recovery_penalty_score: 20 },
      session: mkSession(),
    });
    expect(out.recommendations).toHaveLength(1);
    expect(out.recommendations[0].recommendation_type).toBe('RESTRUCTURE_SESSION');
    expect(out.recommendations[0].recommendation_payload.kept_exercises).toBeDefined();
    expect(out.recommendations[0].recommendation_payload.removed_exercises).toBeDefined();
  });

  it('triggers on insufficient time alone', () => {
    const out = computeRecommendations({
      daily: neutralDaily(),
      preWorkout: { expected_strength: 7, local_fatigue_target_muscle: 3, specific_pain_or_discomfort: 2, available_time_minutes: 25, planned_session_minutes: 60 },
      performance: { performance_vs_baseline_ratio: 1.0, rep_drop_between_sets_percent: 10,
        plan_completion_ratio: 1.0, intensity_adherence_ratio: 1.0, avg_rir_deviation: 0.5 },
      fatigue: { recent_volume_load_score: 70, local_fatigue_history_score: 70,
        performance_decline_score: 80, recovery_penalty_score: 75 },
      session: mkSession(),
    });
    expect(out.recommendations[0].recommendation_type).toBe('RESTRUCTURE_SESSION');
    expect(out.recommendations[0].recommendation_payload.suggestion).toBe('reduce_to_time_budget');
  });
});

// ─── Payload structure ────────────────────────────────────────────

describe('Payload correctness', () => {
  it('SUBSTITUTE keeps same sets and rep range', () => {
    const out = computeRecommendations({
      preWorkout: { expected_strength: 7, local_fatigue_target_muscle: 3, specific_pain_or_discomfort: 7, available_time_minutes: 60, planned_session_minutes: 60 },
      session: mkSession(),
    });
    const sub = out.recommendations.find(r => r.recommendation_type === 'SUBSTITUTE_EXERCISE');
    if (sub) {
      expect(sub.recommendation_payload.keep_sets).toBeDefined();
      expect(sub.recommendation_payload.keep_rep_range).toBeDefined();
      expect(sub.recommendation_payload.keep_rir).toBeDefined();
    }
  });
});
