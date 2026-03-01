import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Mesocycle {
  id: string;
  user_id: string;
  program_id: string;
  mesocycle_number: number;
  total_microcycles: number;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Microcycle {
  id: string;
  user_id: string;
  mesocycle_id: string;
  microcycle_number: number;
  duration_weeks: number;
  start_date: string;
  end_date: string | null;
  status: string;
  fatigue_index: number | null;
  performance_trend: number | null;
  recommendation: string;
  created_at: string;
  updated_at: string;
}

export interface MicrocycleSessionStatus {
  sessionId: string;
  sessionName: string;
  completedInCurrentMicrocycle: boolean;
  fatigueScore: number | null;
}

export interface PeriodizationState {
  activeMesocycle: Mesocycle | null;
  activeMicrocycle: Microcycle | null;
  allMesocycles: Mesocycle[];
  allMicrocycles: Microcycle[];
  sessionStatuses: MicrocycleSessionStatus[];
  loading: boolean;
}

/**
 * Calculate fatigue score for a session from its set logs.
 * fatigueScore = totalVolume × (1 + (3 - avgRir) × 0.1)
 */
const calculateFatigueScore = (setLogs: { weight: number; reps: number; rir: number | null }[]): number => {
  if (setLogs.length === 0) return 0;
  const totalVolume = setLogs.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const rirsWithValue = setLogs.filter(s => s.rir !== null);
  const avgRir = rirsWithValue.length > 0
    ? rirsWithValue.reduce((sum, s) => sum + (s.rir ?? 3), 0) / rirsWithValue.length
    : 3;
  return totalVolume * (1 + (3 - avgRir) * 0.1);
};

export const usePeriodization = (programId?: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<PeriodizationState>({
    activeMesocycle: null,
    activeMicrocycle: null,
    allMesocycles: [],
    allMicrocycles: [],
    sessionStatuses: [],
    loading: true,
  });

  const fetchPeriodization = useCallback(async () => {
    if (!user || !programId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Fetch mesocycles
      const { data: mesocycles, error: mesoErr } = await supabase
        .from('mesocycles')
        .select('*')
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .order('mesocycle_number', { ascending: true });

      if (mesoErr) throw mesoErr;

      const activeMesocycle = (mesocycles || []).find(m => m.status === 'active') || null;

      let allMicrocycles: Microcycle[] = [];
      let activeMicrocycle: Microcycle | null = null;
      let sessionStatuses: MicrocycleSessionStatus[] = [];

      if (activeMesocycle) {
        const { data: microcycles, error: microErr } = await supabase
          .from('microcycles')
          .select('*')
          .eq('user_id', user.id)
          .eq('mesocycle_id', activeMesocycle.id)
          .order('microcycle_number', { ascending: true });

        if (microErr) throw microErr;
        allMicrocycles = (microcycles || []) as Microcycle[];
        activeMicrocycle = allMicrocycles.find(m => m.status === 'active') || null;

        // Fetch program sessions to build status
        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('id, name')
          .eq('program_id', programId)
          .order('order_index');

        if (sessions && activeMicrocycle) {
          // Fetch completed_sessions for this microcycle
          const { data: completed } = await supabase
            .from('completed_sessions')
            .select('session_id, fatigue_score')
            .eq('user_id', user.id)
            .eq('microcycle_id', activeMicrocycle.id);

          const completedMap = new Map((completed || []).map(c => [c.session_id, c.fatigue_score]));

          sessionStatuses = sessions.map(s => ({
            sessionId: s.id,
            sessionName: s.name,
            completedInCurrentMicrocycle: completedMap.has(s.id),
            fatigueScore: completedMap.get(s.id) ?? null,
          }));
        }
      }

      setState({
        activeMesocycle: activeMesocycle as Mesocycle | null,
        activeMicrocycle,
        allMesocycles: (mesocycles || []) as Mesocycle[],
        allMicrocycles,
        sessionStatuses,
        loading: false,
      });
    } catch (err) {
      console.error('Error fetching periodization:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, programId]);

  useEffect(() => {
    fetchPeriodization();
  }, [fetchPeriodization]);

  // Create initial mesocycle + first microcycle
  const initializePeriodization = async (totalMicrocycles: number = 4, durationWeeks: number = 8) => {
    if (!user || !programId) return { error: 'Not authenticated' };

    try {
      const { data: meso, error: mesoErr } = await supabase
        .from('mesocycles')
        .insert({
          user_id: user.id,
          program_id: programId,
          mesocycle_number: 1,
          total_microcycles: totalMicrocycles,
          status: 'active',
        })
        .select()
        .single();

      if (mesoErr) throw mesoErr;

      const { error: microErr } = await supabase
        .from('microcycles')
        .insert({
          user_id: user.id,
          mesocycle_id: meso.id,
          microcycle_number: 1,
          duration_weeks: durationWeeks,
          status: 'active',
        });

      if (microErr) throw microErr;

      await fetchPeriodization();
      return { data: meso, error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error initializing periodization' };
    }
  };

  /**
   * Called when user completes a session. Calculates fatigueScore, saves it,
   * and checks if microcycle is now fully complete.
   */
  const completeSessionWithPeriodization = async (sessionId: string) => {
    if (!user || !state.activeMicrocycle) {
      return { error: 'No active microcycle', microcycleCompleted: false };
    }

    try {
      // 1. Fetch set_logs for this session's exercises logged today
      const { data: exercises } = await supabase
        .from('exercises')
        .select('id')
        .eq('session_id', sessionId);

      const exerciseIds = (exercises || []).map(e => e.id);
      
      let fatigueScore = 0;
      if (exerciseIds.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const { data: setLogs } = await supabase
          .from('set_logs')
          .select('weight, reps, rir')
          .eq('user_id', user.id)
          .in('exercise_id', exerciseIds)
          .gte('logged_at', today + 'T00:00:00')
          .lte('logged_at', today + 'T23:59:59');

        fatigueScore = calculateFatigueScore(setLogs || []);
      }

      // 2. Insert completed_session with microcycle_id and fatigue_score
      const { error: insertErr } = await supabase
        .from('completed_sessions')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          microcycle_id: state.activeMicrocycle.id,
          fatigue_score: fatigueScore,
        });

      if (insertErr) throw insertErr;

      // 3. Check if all sessions are now completed for this microcycle
      const { data: programSessions } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('program_id', programId!);

      const totalSessions = (programSessions || []).length;

      const { data: completedInMicro } = await supabase
        .from('completed_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('microcycle_id', state.activeMicrocycle.id);

      const completedCount = (completedInMicro || []).length;

      if (completedCount >= totalSessions && totalSessions > 0) {
        // Microcycle fully completed — auto-advance
        await finalizeMicrocycle();
        await fetchPeriodization();
        return { error: null, microcycleCompleted: true, fatigueScore };
      }

      await fetchPeriodization();
      return { error: null, microcycleCompleted: false, fatigueScore };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error', microcycleCompleted: false };
    }
  };

  /**
   * Finalize current microcycle: calculate metrics, detect deload, auto-advance.
   */
  const finalizeMicrocycle = async () => {
    if (!user || !state.activeMesocycle || !state.activeMicrocycle) return;

    const microId = state.activeMicrocycle.id;
    const mesoId = state.activeMesocycle.id;

    // 1. Calculate fatigueIndex = avg fatigue_score of completed sessions
    const { data: completedSessions } = await supabase
      .from('completed_sessions')
      .select('fatigue_score')
      .eq('user_id', user.id)
      .eq('microcycle_id', microId);

    const scores = (completedSessions || [])
      .map(c => c.fatigue_score)
      .filter((s): s is number => s !== null);
    const fatigueIndex = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // 2. Calculate performanceTrend: compare e1RM with previous microcycle
    let performanceTrend = 0;
    const prevMicroNum = state.activeMicrocycle.microcycle_number - 1;
    
    if (prevMicroNum >= 1) {
      const prevMicro = state.allMicrocycles.find(m => m.microcycle_number === prevMicroNum);
      if (prevMicro) {
        // Get exercise IDs from this program
        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('id')
          .eq('program_id', programId!);
        const sessionIds = (sessions || []).map(s => s.id);

        if (sessionIds.length > 0) {
          const { data: exercises } = await supabase
            .from('exercises')
            .select('id')
            .in('session_id', sessionIds);
          const exerciseIds = (exercises || []).map(e => e.id);

          if (exerciseIds.length > 0) {
            // Get set_logs for current microcycle period
            const { data: currentLogs } = await supabase
              .from('set_logs')
              .select('weight, reps')
              .eq('user_id', user.id)
              .in('exercise_id', exerciseIds)
              .gte('logged_at', state.activeMicrocycle.start_date)
              .order('logged_at', { ascending: false });

            // Get set_logs for previous microcycle period
            const { data: prevLogs } = await supabase
              .from('set_logs')
              .select('weight, reps')
              .eq('user_id', user.id)
              .in('exercise_id', exerciseIds)
              .gte('logged_at', prevMicro.start_date)
              .lt('logged_at', state.activeMicrocycle.start_date)
              .order('logged_at', { ascending: false });

            const calcAvgE1rm = (logs: { weight: number; reps: number }[]) => {
              if (logs.length === 0) return 0;
              const e1rms = logs.map(l => l.weight * (1 + l.reps / 30));
              return e1rms.reduce((a, b) => a + b, 0) / e1rms.length;
            };

            const currentAvg = calcAvgE1rm(currentLogs || []);
            const prevAvg = calcAvgE1rm(prevLogs || []);
            
            if (prevAvg > 0) {
              performanceTrend = ((currentAvg - prevAvg) / prevAvg) * 100;
            }
          }
        }
      }
    }

    // 3. Determine recommendation
    let recommendation = 'optimal';
    if (fatigueIndex > 85 && performanceTrend <= 0) {
      recommendation = 'deload';
    } else if (performanceTrend < -5) {
      recommendation = 'block_change';
    }

    // 4. Update microcycle with metrics
    await supabase
      .from('microcycles')
      .update({
        status: 'completed',
        end_date: new Date().toISOString().split('T')[0],
        fatigue_index: Math.round(fatigueIndex * 100) / 100,
        performance_trend: Math.round(performanceTrend * 100) / 100,
        recommendation,
      })
      .eq('id', microId);

    // 5. Auto-advance
    const nextMicroNum = state.activeMicrocycle.microcycle_number + 1;
    const totalMicros = state.activeMesocycle.total_microcycles;

    if (nextMicroNum <= totalMicros) {
      await supabase
        .from('microcycles')
        .insert({
          user_id: user.id,
          mesocycle_id: mesoId,
          microcycle_number: nextMicroNum,
          duration_weeks: state.activeMicrocycle.duration_weeks,
          status: 'active',
        });
    } else {
      // Complete mesocycle, create new one
      await supabase
        .from('mesocycles')
        .update({ status: 'completed', end_date: new Date().toISOString().split('T')[0] })
        .eq('id', mesoId);

      const newMesoNum = state.activeMesocycle.mesocycle_number + 1;
      const { data: newMeso } = await supabase
        .from('mesocycles')
        .insert({
          user_id: user.id,
          program_id: programId!,
          mesocycle_number: newMesoNum,
          total_microcycles: totalMicros,
          status: 'active',
        })
        .select()
        .single();

      if (newMeso) {
        await supabase
          .from('microcycles')
          .insert({
            user_id: user.id,
            mesocycle_id: newMeso.id,
            microcycle_number: 1,
            duration_weeks: state.activeMicrocycle.duration_weeks,
            status: 'active',
          });
      }
    }
  };

  // Check if a session is already completed in the current microcycle
  const isSessionCompletedInMicrocycle = (sessionId: string): boolean => {
    return state.sessionStatuses.some(s => s.sessionId === sessionId && s.completedInCurrentMicrocycle);
  };

  // Get last completed microcycle (for showing metrics)
  const getLastCompletedMicrocycle = (): Microcycle | null => {
    const completed = state.allMicrocycles
      .filter(m => m.status === 'completed')
      .sort((a, b) => b.microcycle_number - a.microcycle_number);
    return completed[0] || null;
  };

  return {
    ...state,
    initializePeriodization,
    completeSessionWithPeriodization,
    isSessionCompletedInMicrocycle,
    getLastCompletedMicrocycle,
    refetch: fetchPeriodization,
  };
};
