import { useReducer, useCallback, useMemo } from 'react';
import {
  sessionPlanReducer,
  sessionContextToBasePlan,
  getPendingRecommendations,
  getAcceptedRecommendations,
  getRejectedRecommendations,
  hasUnrespondedRecommendations,
  getSessionSummary,
  type SessionPlanState,
  type SessionPlan,
  type RecommendationHistoryEntry,
} from '@/lib/autoregulation/sessionPlanManager';
import type { Recommendation, SessionContext } from '@/lib/autoregulation/recommendationEngine';

const INITIAL_STATE: SessionPlanState = {
  basePlan: { session_id: '', exercises: [] },
  recommendedPlan: null,
  activePlan: { session_id: '', exercises: [] },
  history: [],
  midSessionPending: false,
};

export function useSessionPlan() {
  const [state, dispatch] = useReducer(sessionPlanReducer, INITIAL_STATE);

  const initPlan = useCallback((session: SessionContext) => {
    dispatch({ type: 'INIT', basePlan: sessionContextToBasePlan(session) });
  }, []);

  const setRecommendations = useCallback((
    recommendations: Recommendation[],
    readinessScore: number,
    phase: 'pre_session' | 'mid_session',
  ) => {
    dispatch({ type: 'SET_RECOMMENDED', recommendations, readinessScore, phase });
  }, []);

  const acceptRecommendation = useCallback((historyId: string) => {
    dispatch({ type: 'ACCEPT_RECOMMENDATION', historyId });
  }, []);

  const rejectRecommendation = useCallback((historyId: string) => {
    dispatch({ type: 'REJECT_RECOMMENDATION', historyId });
  }, []);

  const acceptAll = useCallback(() => {
    dispatch({ type: 'ACCEPT_ALL_PENDING' });
  }, []);

  const rejectAll = useCallback(() => {
    dispatch({ type: 'REJECT_ALL_PENDING' });
  }, []);

  const commit = useCallback(() => {
    dispatch({ type: 'COMMIT_RESPONSES' });
  }, []);

  const clearMidSession = useCallback(() => {
    dispatch({ type: 'CLEAR_MID_SESSION' });
  }, []);

  const pending = useMemo(() => getPendingRecommendations(state), [state]);
  const accepted = useMemo(() => getAcceptedRecommendations(state), [state]);
  const rejected = useMemo(() => getRejectedRecommendations(state), [state]);
  const hasPending = useMemo(() => hasUnrespondedRecommendations(state), [state]);
  const summary = useMemo(() => getSessionSummary(state), [state]);

  return {
    basePlan: state.basePlan,
    recommendedPlan: state.recommendedPlan,
    activePlan: state.activePlan,
    history: state.history,
    midSessionPending: state.midSessionPending,
    pending,
    accepted,
    rejected,
    hasPending,
    summary,
    initPlan,
    setRecommendations,
    acceptRecommendation,
    rejectRecommendation,
    acceptAll,
    rejectAll,
    commit,
    clearMidSession,
  };
}
