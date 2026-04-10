import { useState, useCallback, useMemo } from 'react';
import {
  computeRecommendations,
  type EngineInput,
  type EngineOutput,
  type Recommendation,
  type SessionContext,
} from '@/lib/autoregulation/recommendationEngine';
import type { DailyCheckInInput, PreWorkoutCheckInInput } from '@/lib/autoregulation/scoring';

export type AutoregPhase =
  | 'idle'
  | 'daily_checkin'
  | 'pre_workout_checkin'
  | 'recommendations'
  | 'session_active';

export interface AutoregState {
  phase: AutoregPhase;
  dailyData: DailyCheckInInput | null;
  preWorkoutData: PreWorkoutCheckInInput | null;
  engineOutput: EngineOutput | null;
  responses: Map<number, 'accepted' | 'rejected'>;
}

export function useAutoregulation(session: SessionContext | null) {
  const [state, setState] = useState<AutoregState>({
    phase: 'idle',
    dailyData: null,
    preWorkoutData: null,
    engineOutput: null,
    responses: new Map(),
  });

  const startFlow = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'daily_checkin', engineOutput: null, responses: new Map() }));
  }, []);

  const submitDailyCheckIn = useCallback((data: DailyCheckInInput) => {
    setState(prev => ({ ...prev, dailyData: data, phase: 'pre_workout_checkin' }));
  }, []);

  const skipDailyCheckIn = useCallback(() => {
    setState(prev => ({ ...prev, dailyData: null, phase: 'pre_workout_checkin' }));
  }, []);

  const submitPreWorkoutCheckIn = useCallback((data: PreWorkoutCheckInInput) => {
    if (!session) return;
    const input: EngineInput = {
      daily: state.dailyData ?? undefined,
      preWorkout: data,
      session,
    };
    const output = computeRecommendations(input);
    setState(prev => ({
      ...prev,
      preWorkoutData: data,
      engineOutput: output,
      phase: 'recommendations',
    }));
  }, [session, state.dailyData]);

  const skipPreWorkoutCheckIn = useCallback(() => {
    if (!session) return;
    const input: EngineInput = {
      daily: state.dailyData ?? undefined,
      session,
    };
    const output = computeRecommendations(input);
    setState(prev => ({
      ...prev,
      preWorkoutData: null,
      engineOutput: output,
      phase: 'recommendations',
    }));
  }, [session, state.dailyData]);

  const respondToRecommendation = useCallback((index: number, response: 'accepted' | 'rejected') => {
    setState(prev => {
      const next = new Map(prev.responses);
      next.set(index, response);
      return { ...prev, responses: next };
    });
  }, []);

  const proceedToSession = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'session_active' }));
  }, []);

  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      dailyData: null,
      preWorkoutData: null,
      engineOutput: null,
      responses: new Map(),
    });
  }, []);

  /** Recompute recommendations mid-session with updated performance data */
  const recomputeMidSession = useCallback((updatedInput: Partial<EngineInput>) => {
    if (!session) return;
    const input: EngineInput = {
      daily: state.dailyData ?? undefined,
      preWorkout: state.preWorkoutData ?? undefined,
      ...updatedInput,
      session: updatedInput.session ?? session,
    };
    const output = computeRecommendations(input);
    setState(prev => ({
      ...prev,
      engineOutput: output,
      phase: 'recommendations',
      responses: new Map(),
    }));
  }, [session, state.dailyData, state.preWorkoutData]);

  const acceptedRecommendations = useMemo(() => {
    if (!state.engineOutput) return [];
    return state.engineOutput.recommendations.filter((_, i) => state.responses.get(i) === 'accepted');
  }, [state.engineOutput, state.responses]);

  const allResponded = useMemo(() => {
    if (!state.engineOutput) return false;
    const actionable = state.engineOutput.recommendations.filter(r => r.recommendation_type !== 'KEEP_PLAN');
    if (actionable.length === 0) return true;
    return actionable.every((_, i) => state.responses.has(i));
  }, [state.engineOutput, state.responses]);

  return {
    ...state,
    startFlow,
    submitDailyCheckIn,
    skipDailyCheckIn,
    submitPreWorkoutCheckIn,
    skipPreWorkoutCheckIn,
    respondToRecommendation,
    proceedToSession,
    reset,
    recomputeMidSession,
    acceptedRecommendations,
    allResponded,
  };
}
