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
  created_at: string;
  updated_at: string;
}

export interface PeriodizationState {
  activeMesocycle: Mesocycle | null;
  activeMicrocycle: Microcycle | null;
  allMesocycles: Mesocycle[];
  allMicrocycles: Microcycle[];
  loading: boolean;
}

export const usePeriodization = (programId?: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<PeriodizationState>({
    activeMesocycle: null,
    activeMicrocycle: null,
    allMesocycles: [],
    allMicrocycles: [],
    loading: true,
  });

  const fetchPeriodization = useCallback(async () => {
    if (!user || !programId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Fetch all mesocycles for this program
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
      }

      setState({
        activeMesocycle: activeMesocycle as Mesocycle | null,
        activeMicrocycle,
        allMesocycles: (mesocycles || []) as Mesocycle[],
        allMicrocycles,
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

  // Create initial mesocycle + first microcycle for a program
  const initializePeriodization = async (totalMicrocycles: number = 4) => {
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
          status: 'active',
        });

      if (microErr) throw microErr;

      await fetchPeriodization();
      return { data: meso, error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error initializing periodization' };
    }
  };

  // Complete current microcycle and auto-advance
  const completeMicrocycle = async () => {
    if (!user || !state.activeMesocycle || !state.activeMicrocycle) {
      return { error: 'No active microcycle' };
    }

    try {
      // Mark current microcycle as completed
      await supabase
        .from('microcycles')
        .update({ status: 'completed', end_date: new Date().toISOString().split('T')[0] })
        .eq('id', state.activeMicrocycle.id);

      const nextMicroNum = state.activeMicrocycle.microcycle_number + 1;
      const totalMicros = state.activeMesocycle.total_microcycles;

      if (nextMicroNum <= totalMicros) {
        // Create next microcycle in same mesocycle
        await supabase
          .from('microcycles')
          .insert({
            user_id: user.id,
            mesocycle_id: state.activeMesocycle.id,
            microcycle_number: nextMicroNum,
            status: 'active',
          });
      } else {
        // Complete mesocycle and create new one
        await supabase
          .from('mesocycles')
          .update({ status: 'completed', end_date: new Date().toISOString().split('T')[0] })
          .eq('id', state.activeMesocycle.id);

        const newMesoNum = state.activeMesocycle.mesocycle_number + 1;

        const { data: newMeso, error: newMesoErr } = await supabase
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

        if (newMesoErr) throw newMesoErr;

        await supabase
          .from('microcycles')
          .insert({
            user_id: user.id,
            mesocycle_id: newMeso.id,
            microcycle_number: 1,
            status: 'active',
          });
      }

      await fetchPeriodization();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error completing microcycle' };
    }
  };

  // Update total microcycles for current mesocycle
  const updateTotalMicrocycles = async (total: number) => {
    if (!state.activeMesocycle) return;
    await supabase
      .from('mesocycles')
      .update({ total_microcycles: total })
      .eq('id', state.activeMesocycle.id);
    await fetchPeriodization();
  };

  return {
    ...state,
    initializePeriodization,
    completeMicrocycle,
    updateTotalMicrocycles,
    refetch: fetchPeriodization,
  };
};
