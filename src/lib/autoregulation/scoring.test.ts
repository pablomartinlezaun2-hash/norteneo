import { describe, it, expect } from 'vitest';
import {
  positiveScore,
  negativeScore,
  sleepHoursScore,
  timeAvailabilityScore,
  computeDailyScore,
  computePreWorkoutScore,
  computeReadinessScore,
  getReadinessState,
  checkVetoRules,
} from './scoring';
import { computeRecommendations } from './recommendationEngine';

describe('Normalization', () => {
  it('positiveScore: 1→0, 10→100', () => {
    expect(positiveScore(1)).toBe(0);
    expect(positiveScore(10)).toBeCloseTo(100);
    expect(positiveScore(5.5)).toBeCloseTo(50);
  });

  it('negativeScore: 1→100, 10→0', () => {
    expect(negativeScore(1)).toBe(100);
    expect(negativeScore(10)).toBeCloseTo(0);
  });
});

describe('sleepHoursScore', () => {
  it('maps correctly', () => {
    expect(sleepHoursScore(9)).toBe(100);
    expect(sleepHoursScore(7)).toBe(85);
    expect(sleepHoursScore(6)).toBe(70);
    expect(sleepHoursScore(3)).toBe(10);
  });
});

describe('timeAvailabilityScore', () => {
  it('100% ratio → 100', () => {
    expect(timeAvailabilityScore(60, 60)).toBe(100);
  });
  it('50% ratio → 15', () => {
    expect(timeAvailabilityScore(30, 60)).toBe(15);
  });
});

describe('computeDailyScore', () => {
  it('perfect day → high score', () => {
    const score = computeDailyScore({
      sleep_hours: 8, sleep_quality: 9, general_energy: 9,
      mental_stress: 2, general_soreness: 1, motivation: 9, joint_discomfort: 1,
    });
    expect(score).toBeGreaterThan(85);
  });
  it('bad day → low score', () => {
    const score = computeDailyScore({
      sleep_hours: 4, sleep_quality: 2, general_energy: 2,
      mental_stress: 9, general_soreness: 9, motivation: 2, joint_discomfort: 9,
    });
    expect(score).toBeLessThan(30);
  });
});

describe('Readiness states', () => {
  it('maps score ranges correctly', () => {
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

describe('computeRecommendations', () => {
  const baseSession = {
    session_id: 's1',
    planned_duration_minutes: 60,
    exercises: [
      {
        exercise_id: 'e1', exercise_name: 'Sentadilla', planned_sets: 4,
        planned_rir: 0, planned_rep_range: '6-8', target_muscle_group: 'Cuádriceps',
        fatigue_cost: 70, has_substitute_available: false,
      },
      {
        exercise_id: 'e2', exercise_name: 'Extensión', planned_sets: 3,
        planned_rir: 0, planned_rep_range: '10-12', target_muscle_group: 'Cuádriceps',
        fatigue_cost: 30, has_substitute_available: true,
        substitute_exercise_id: 'e3', substitute_exercise_name: 'Prensa',
      },
    ],
  };

  it('good readiness → KEEP_PLAN or ADD_SET', () => {
    const out = computeRecommendations({
      daily: {
        sleep_hours: 8, sleep_quality: 9, general_energy: 9,
        mental_stress: 2, general_soreness: 1, motivation: 9, joint_discomfort: 1,
      },
      preWorkout: {
        expected_strength: 9, general_freshness: 9, local_fatigue_target_muscle: 1,
        specific_pain_or_discomfort: 1, willingness_to_push: 9,
        available_time_minutes: 90, planned_session_minutes: 60,
      },
      performance: {
        performance_vs_baseline_ratio: 1.05, rep_drop_between_sets_percent: 5,
        plan_completion_ratio: 1.0, intensity_adherence_ratio: 1.0, avg_rir_deviation: 0.3,
      },
      fatigue: {
        recent_volume_load_score: 85, local_fatigue_history_score: 85,
        performance_decline_score: 90, recovery_penalty_score: 85,
      },
      session: baseSession,
    });

    expect(out.readinessState).toBe('READY_TO_PROGRESS');
    expect(out.recommendations.some(r => r.recommendation_type === 'ADD_SET' || r.recommendation_type === 'KEEP_PLAN')).toBe(true);
  });

  it('pain veto → SUBSTITUTE or REMOVE_SET', () => {
    const out = computeRecommendations({
      daily: {
        sleep_hours: 7, sleep_quality: 7, general_energy: 7,
        mental_stress: 3, general_soreness: 3, motivation: 7, joint_discomfort: 2,
      },
      preWorkout: {
        expected_strength: 7, general_freshness: 7, local_fatigue_target_muscle: 3,
        specific_pain_or_discomfort: 9, willingness_to_push: 5,
        available_time_minutes: 60, planned_session_minutes: 60,
      },
      session: baseSession,
    });

    expect(out.veto.vetoed).toBe(true);
    expect(out.recommendations.some(r =>
      r.recommendation_type === 'SUBSTITUTE_EXERCISE' || r.recommendation_type === 'REMOVE_SET'
    )).toBe(true);
  });
});
