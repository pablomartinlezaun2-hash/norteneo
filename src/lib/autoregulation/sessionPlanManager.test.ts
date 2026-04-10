import { describe, it, expect } from 'vitest';
import {
  sessionPlanReducer,
  sessionContextToBasePlan,
  getPendingRecommendations,
  getAcceptedRecommendations,
  hasUnrespondedRecommendations,
  getSessionSummary,
  type SessionPlanState,
} from './sessionPlanManager';
import type { Recommendation, SessionContext } from './recommendationEngine';

const SESSION: SessionContext = {
  session_id: 'sess-1',
  planned_duration_minutes: 60,
  exercises: [
    { exercise_id: 'ex-1', exercise_name: 'Sentadilla', planned_sets: 4, planned_rir: 0, planned_rep_range: '6-8', target_muscle_group: 'quads', fatigue_cost: 80, has_substitute_available: false },
    { exercise_id: 'ex-2', exercise_name: 'Press banca', planned_sets: 3, planned_rir: 1, planned_rep_range: '8-10', target_muscle_group: 'pecho', fatigue_cost: 60, has_substitute_available: true, substitute_exercise_id: 'ex-3', substitute_exercise_name: 'Press máquina' },
  ],
};

function initState(): SessionPlanState {
  return sessionPlanReducer(
    { basePlan: { session_id: '', exercises: [] }, recommendedPlan: null, activePlan: { session_id: '', exercises: [] }, history: [], midSessionPending: false },
    { type: 'INIT', basePlan: sessionContextToBasePlan(SESSION) }
  );
}

const REMOVE_SET_REC: Recommendation = {
  recommendation_type: 'REMOVE_SET',
  recommendation_reason: 'Fatiga alta',
  exercise_id: 'ex-1',
  recommendation_payload: { exercise_name: 'Sentadilla', original_sets: 4, recommended_sets: 3, sets_removed: 1, triggers: ['high_fatigue'] },
};

const INCREASE_RIR_REC: Recommendation = {
  recommendation_type: 'INCREASE_RIR',
  recommendation_reason: 'Dolor moderado',
  exercise_id: 'ex-2',
  recommendation_payload: { exercise_name: 'Press banca', original_rir: 1, recommended_rir: 2, rir_bump: 1, triggers: ['moderate_pain'] },
};

describe('sessionPlanReducer', () => {
  it('INIT sets base and active plan from session context', () => {
    const state = initState();
    expect(state.basePlan.exercises).toHaveLength(2);
    expect(state.activePlan.exercises).toHaveLength(2);
    expect(state.activePlan.exercises[0].sets).toBe(4);
    expect(state.recommendedPlan).toBeNull();
    expect(state.history).toHaveLength(0);
  });

  it('SET_RECOMMENDED creates pending history entries and recommended plan', () => {
    let state = initState();
    state = sessionPlanReducer(state, {
      type: 'SET_RECOMMENDED',
      recommendations: [REMOVE_SET_REC, INCREASE_RIR_REC],
      readinessScore: 55,
      phase: 'pre_session',
    });
    expect(state.history).toHaveLength(2);
    expect(state.history.every(h => h.status === 'pending')).toBe(true);
    expect(state.recommendedPlan).not.toBeNull();
    expect(state.recommendedPlan!.exercises[0].sets).toBe(3); // REMOVE_SET applied in preview
  });

  it('ACCEPT_RECOMMENDATION applies to active plan', () => {
    let state = initState();
    state = sessionPlanReducer(state, {
      type: 'SET_RECOMMENDED',
      recommendations: [REMOVE_SET_REC],
      readinessScore: 55,
      phase: 'pre_session',
    });
    const recId = state.history[0].id;

    state = sessionPlanReducer(state, { type: 'ACCEPT_RECOMMENDATION', historyId: recId });
    expect(state.activePlan.exercises[0].sets).toBe(3);
    expect(state.activePlan.exercises[0].is_modified).toBe(true);
    expect(state.history[0].status).toBe('accepted');
    expect(state.history[0].responded_at).not.toBeNull();
  });

  it('REJECT_RECOMMENDATION keeps active plan unchanged', () => {
    let state = initState();
    state = sessionPlanReducer(state, {
      type: 'SET_RECOMMENDED',
      recommendations: [REMOVE_SET_REC],
      readinessScore: 55,
      phase: 'pre_session',
    });
    const recId = state.history[0].id;

    state = sessionPlanReducer(state, { type: 'REJECT_RECOMMENDATION', historyId: recId });
    expect(state.activePlan.exercises[0].sets).toBe(4); // unchanged
    expect(state.history[0].status).toBe('rejected');
  });

  it('ACCEPT_ALL_PENDING applies all at once', () => {
    let state = initState();
    state = sessionPlanReducer(state, {
      type: 'SET_RECOMMENDED',
      recommendations: [REMOVE_SET_REC, INCREASE_RIR_REC],
      readinessScore: 55,
      phase: 'pre_session',
    });

    state = sessionPlanReducer(state, { type: 'ACCEPT_ALL_PENDING' });
    expect(state.activePlan.exercises[0].sets).toBe(3);
    expect(state.activePlan.exercises[1].rir).toBe(2);
    expect(state.history.every(h => h.status === 'accepted')).toBe(true);
    expect(state.recommendedPlan).toBeNull();
  });

  it('supports multiple rounds (pre + mid session)', () => {
    let state = initState();
    // Pre-session round
    state = sessionPlanReducer(state, {
      type: 'SET_RECOMMENDED',
      recommendations: [REMOVE_SET_REC],
      readinessScore: 55,
      phase: 'pre_session',
    });
    state = sessionPlanReducer(state, { type: 'ACCEPT_RECOMMENDATION', historyId: state.history[0].id });

    // Mid-session round
    state = sessionPlanReducer(state, {
      type: 'SET_RECOMMENDED',
      recommendations: [INCREASE_RIR_REC],
      readinessScore: 50,
      phase: 'mid_session',
    });
    expect(state.midSessionPending).toBe(true);
    expect(state.history).toHaveLength(2);

    state = sessionPlanReducer(state, { type: 'ACCEPT_RECOMMENDATION', historyId: state.history[1].id });
    expect(state.activePlan.exercises[0].sets).toBe(3);
    expect(state.activePlan.exercises[1].rir).toBe(2);
  });

  it('base plan never changes', () => {
    let state = initState();
    state = sessionPlanReducer(state, {
      type: 'SET_RECOMMENDED',
      recommendations: [REMOVE_SET_REC, INCREASE_RIR_REC],
      readinessScore: 55,
      phase: 'pre_session',
    });
    state = sessionPlanReducer(state, { type: 'ACCEPT_ALL_PENDING' });

    expect(state.basePlan.exercises[0].sets).toBe(4); // original
    expect(state.basePlan.exercises[1].rir).toBe(1);  // original
  });
});

describe('selectors', () => {
  it('getSessionSummary tracks totals', () => {
    let state = initState();
    state = sessionPlanReducer(state, {
      type: 'SET_RECOMMENDED',
      recommendations: [REMOVE_SET_REC, INCREASE_RIR_REC],
      readinessScore: 55,
      phase: 'pre_session',
    });
    state = sessionPlanReducer(state, { type: 'ACCEPT_RECOMMENDATION', historyId: state.history[0].id });
    state = sessionPlanReducer(state, { type: 'REJECT_RECOMMENDATION', historyId: state.history[1].id });

    const summary = getSessionSummary(state);
    expect(summary.total_recommendations).toBe(2);
    expect(summary.accepted).toBe(1);
    expect(summary.rejected).toBe(1);
    expect(summary.pending).toBe(0);
    expect(summary.plan_was_modified).toBe(true);
  });
});
