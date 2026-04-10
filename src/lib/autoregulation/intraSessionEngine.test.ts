import { describe, it, expect } from 'vitest';
import {
  evaluateIntraSession,
  createSessionTracker,
  trackSetAndEvaluate,
  type IntraSessionInput,
  type LiveSetData,
  type ExerciseBaseline,
} from './intraSessionEngine';
import type { ExerciseContext } from './recommendationEngine';

const EXERCISE: ExerciseContext = {
  exercise_id: 'ex-1',
  exercise_name: 'Sentadilla',
  planned_sets: 4,
  planned_rir: 0,
  planned_rep_range: '6-8',
  target_muscle_group: 'quads',
  fatigue_cost: 80,
  has_substitute_available: true,
  substitute_exercise_id: 'ex-2',
  substitute_exercise_name: 'Prensa',
};

const BASELINE: ExerciseBaseline = {
  exercise_id: 'ex-1',
  avg_weight: 100,
  avg_reps: 8,
  avg_estimated_1rm: 100 * (1 + 8 / 30), // ~126.67
};

function mkSet(overrides: Partial<LiveSetData> = {}): LiveSetData {
  return {
    set_number: 1, weight: 100, reps: 8,
    target_rir: 0, actual_rir: 0, is_warmup: false,
    ...overrides,
  };
}

describe('evaluateIntraSession', () => {
  it('returns no trigger with insufficient data', () => {
    const result = evaluateIntraSession({
      exercise: EXERCISE,
      completedSets: [],
    });
    expect(result.should_trigger).toBe(false);
    expect(result.recommendations).toHaveLength(0);
  });

  it('returns no trigger when performance is good', () => {
    const result = evaluateIntraSession({
      exercise: EXERCISE,
      completedSets: [mkSet(), mkSet({ set_number: 2 })],
      baseline: BASELINE,
    });
    expect(result.should_trigger).toBe(false);
    expect(result.current_performance_ratio).toBeCloseTo(1.0, 1);
  });

  it('triggers warning on moderate performance drop', () => {
    const result = evaluateIntraSession({
      exercise: EXERCISE,
      completedSets: [
        mkSet({ weight: 85, reps: 7 }),  // e1RM ~104.8 vs baseline ~126.7 → ~0.83
      ],
      baseline: BASELINE,
    });
    expect(result.should_trigger).toBe(true);
    expect(result.alerts.some(a => a.alert_type === 'performance_below_expected')).toBe(true);
  });

  it('triggers on sharp dropoff between sets', () => {
    const result = evaluateIntraSession({
      exercise: EXERCISE,
      completedSets: [
        mkSet({ set_number: 1, weight: 100, reps: 8 }),   // vol = 800
        mkSet({ set_number: 2, weight: 100, reps: 5 }),   // vol = 500 → 37.5% drop
      ],
      baseline: BASELINE,
    });
    expect(result.should_trigger).toBe(true);
    expect(result.alerts.some(a => a.alert_type === 'sharp_dropoff')).toBe(true);
  });

  it('triggers on RIR deviation pattern', () => {
    const result = evaluateIntraSession({
      exercise: EXERCISE,
      completedSets: [
        mkSet({ set_number: 1, target_rir: 0, actual_rir: 2 }),
        mkSet({ set_number: 2, target_rir: 0, actual_rir: 2 }),
      ],
      baseline: BASELINE,
    });
    expect(result.should_trigger).toBe(true);
    expect(result.alerts.some(a => a.alert_type === 'rir_pattern_deviation')).toBe(true);
    expect(result.avg_rir_deviation).toBe(2);
  });

  it('triggers pain-based substitute recommendation', () => {
    const result = evaluateIntraSession({
      exercise: EXERCISE,
      completedSets: [mkSet()],
      preWorkout: {
        expected_strength: 5, general_freshness: 5,
        local_fatigue_target_muscle: 3, specific_pain_or_discomfort: 7,
        willingness_to_push: 5, available_time_minutes: 60, planned_session_minutes: 60,
      },
    });
    expect(result.should_trigger).toBe(true);
    expect(result.recommendations.some(r => r.recommendation_type === 'SUBSTITUTE_EXERCISE')).toBe(true);
  });

  it('recommends RESTRUCTURE on multiple critical alerts', () => {
    const result = evaluateIntraSession({
      exercise: EXERCISE,
      completedSets: [
        mkSet({ set_number: 1, weight: 75, reps: 5 }),  // bad perf
        mkSet({ set_number: 2, weight: 70, reps: 4 }),  // worse + dropoff
      ],
      baseline: BASELINE,
      sessionFatigueAccumulated: 92,
    });
    expect(result.should_trigger).toBe(true);
    expect(result.recommendations.some(r => r.recommendation_type === 'RESTRUCTURE_SESSION')).toBe(true);
  });

  it('recommends REMOVE_SET on critical dropoff', () => {
    const result = evaluateIntraSession({
      exercise: EXERCISE,
      completedSets: [
        mkSet({ set_number: 1, weight: 100, reps: 8 }),
        mkSet({ set_number: 2, weight: 100, reps: 4 }),  // 50% vol drop
      ],
      baseline: BASELINE,
    });
    expect(result.should_trigger).toBe(true);
    const removeRec = result.recommendations.find(r => r.recommendation_type === 'REMOVE_SET');
    expect(removeRec).toBeDefined();
    expect(Number(removeRec!.recommendation_payload.sets_already_completed)).toBe(2);
  });

  it('recommends INCREASE_RIR on warning-level perf + RIR deviation', () => {
    const result = evaluateIntraSession({
      exercise: EXERCISE,
      completedSets: [
        mkSet({ set_number: 1, weight: 90, reps: 7, target_rir: 0, actual_rir: 2 }),
        mkSet({ set_number: 2, weight: 88, reps: 7, target_rir: 0, actual_rir: 2 }),
      ],
      baseline: BASELINE,
    });
    expect(result.should_trigger).toBe(true);
    expect(result.recommendations.some(r => r.recommendation_type === 'INCREASE_RIR')).toBe(true);
  });
});

describe('trackSetAndEvaluate', () => {
  it('returns null when not enough working sets', () => {
    const tracker = createSessionTracker();
    const result = trackSetAndEvaluate(tracker, {
      exercise: EXERCISE,
      completedSets: [mkSet({ is_warmup: true })],
    });
    expect(result).toBeNull();
  });

  it('accumulates fatigue across exercises', () => {
    const tracker = createSessionTracker();
    // First exercise — good performance, still triggers tracking
    trackSetAndEvaluate(tracker, {
      exercise: EXERCISE,
      completedSets: [mkSet(), mkSet({ set_number: 2 })],
      baseline: BASELINE,
    });
    expect(tracker.cumulativeFatigue).toBeGreaterThan(0);
  });
});
