import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PlanningExercise {
  id?: string;
  exerciseCatalogId: string;
  name: string;
  group: string;
  videoUrl: string | null;
  description: string | null;
  sets: number;
  repRangeMin: number;
  repRangeMax: number;
  orderIndex: number;
  notes?: string;
}

export interface PlanningSession {
  id?: string;
  name: string;
  orderIndex: number;
  exercises: PlanningExercise[];
}

export interface PlanningMicrocycle {
  id?: string;
  name: string;
  orderIndex: number;
  sessions: PlanningSession[];
}

export interface PlanningMesocycle {
  id: string;
  name: string;
  durationWeeks: number;
  microcycleCount: number;
  goal: string | null;
  microcycles: PlanningMicrocycle[];
  createdAt: string;
  updatedAt: string;
}

export const usePlanningMesocycles = () => {
  const { user } = useAuth();
  const [mesocycles, setMesocycles] = useState<PlanningMesocycle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMesocycles = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data: mesoData, error: mesoErr } = await supabase
        .from('planning_mesocycles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (mesoErr) throw mesoErr;
      if (!mesoData || mesoData.length === 0) {
        setMesocycles([]);
        setLoading(false);
        return;
      }

      const mesoIds = mesoData.map(m => m.id);
      const { data: microData } = await supabase
        .from('planning_microcycles')
        .select('*')
        .in('mesocycle_id', mesoIds)
        .order('order_index');

      const microIds = (microData || []).map(mc => mc.id);
      let sessionsData: any[] = [];
      if (microIds.length > 0) {
        const { data } = await supabase
          .from('planning_sessions')
          .select('*')
          .in('microcycle_id', microIds)
          .order('order_index');
        sessionsData = data || [];
      }

      const sessionIds = sessionsData.map(s => s.id);
      let exercisesData: any[] = [];
      if (sessionIds.length > 0) {
        const { data } = await supabase
          .from('planning_session_exercises')
          .select('*, exercise_catalog(id, name, description, video_url, primary_muscle_id, muscle_groups:primary_muscle_id(name))')
          .in('session_id', sessionIds)
          .order('order_index');
        exercisesData = data || [];
      }

      const result: PlanningMesocycle[] = mesoData.map(meso => {
        const micros = (microData || []).filter(mc => mc.mesocycle_id === meso.id);
        return {
          id: meso.id,
          name: meso.name,
          durationWeeks: meso.duration_weeks,
          microcycleCount: meso.microcycle_count,
          goal: meso.goal,
          createdAt: meso.created_at,
          updatedAt: meso.updated_at,
          microcycles: micros.map(mc => {
            const sessions = sessionsData.filter(s => s.microcycle_id === mc.id);
            return {
              id: mc.id,
              name: mc.name,
              orderIndex: mc.order_index,
              sessions: sessions.map(s => {
                const exs = exercisesData.filter(e => e.session_id === s.id);
                return {
                  id: s.id,
                  name: s.name,
                  orderIndex: s.order_index,
                  exercises: exs.map(e => ({
                    id: e.id,
                    exerciseCatalogId: e.exercise_catalog_id,
                    name: e.exercise_catalog?.name || '',
                    group: e.exercise_catalog?.muscle_groups?.name || '',
                    videoUrl: e.exercise_catalog?.video_url || null,
                    description: e.exercise_catalog?.description || null,
                    sets: e.sets,
                    repRangeMin: e.rep_range_min,
                    repRangeMax: e.rep_range_max,
                    orderIndex: e.order_index,
                    notes: e.notes,
                  })),
                };
              }),
            };
          }),
        };
      });

      setMesocycles(result);
    } catch (err) {
      console.error('Error fetching mesocycles:', err);
      toast.error('Error al cargar mesociclos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchMesocycles(); }, [fetchMesocycles]);

  const saveMesocycle = async (data: {
    name: string;
    durationWeeks: number;
    microcycleCount: number;
    goal?: string;
    microcycles: PlanningMicrocycle[];
  }) => {
    if (!user) return null;
    try {
      const { data: meso, error: mesoErr } = await supabase
        .from('planning_mesocycles')
        .insert({
          user_id: user.id,
          name: data.name,
          duration_weeks: data.durationWeeks,
          microcycle_count: data.microcycleCount,
          goal: data.goal || null,
        })
        .select()
        .single();
      if (mesoErr) throw mesoErr;

      for (const mc of data.microcycles) {
        const { data: microRow, error: microErr } = await supabase
          .from('planning_microcycles')
          .insert({ mesocycle_id: meso.id, name: mc.name, order_index: mc.orderIndex })
          .select()
          .single();
        if (microErr) throw microErr;

        for (const sess of mc.sessions) {
          const { data: sessRow, error: sessErr } = await supabase
            .from('planning_sessions')
            .insert({ microcycle_id: microRow.id, name: sess.name, order_index: sess.orderIndex })
            .select()
            .single();
          if (sessErr) throw sessErr;

          if (sess.exercises.length > 0) {
            const exInserts = sess.exercises.map(ex => ({
              session_id: sessRow.id,
              exercise_catalog_id: ex.exerciseCatalogId,
              sets: ex.sets,
              rep_range_min: ex.repRangeMin,
              rep_range_max: ex.repRangeMax,
              order_index: ex.orderIndex,
              notes: ex.notes || null,
            }));
            const { error: exErr } = await supabase
              .from('planning_session_exercises')
              .insert(exInserts);
            if (exErr) throw exErr;
          }
        }
      }

      toast.success('Mesociclo creado correctamente');
      await fetchMesocycles();
      return meso.id;
    } catch (err) {
      console.error('Error saving mesocycle:', err);
      toast.error('Error al guardar mesociclo');
      return null;
    }
  };

  const deleteMesocycle = async (id: string) => {
    try {
      const { error } = await supabase.from('planning_mesocycles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Mesociclo eliminado');
      setMesocycles(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  return { mesocycles, loading, saveMesocycle, deleteMesocycle, refetch: fetchMesocycles };
};
