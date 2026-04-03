import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MicrocycleExercise {
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
}

export interface CustomMicrocycle {
  id: string;
  name: string;
  exercises: MicrocycleExercise[];
  createdAt: string;
  updatedAt: string;
}

export const useCustomMicrocycles = () => {
  const { user } = useAuth();
  const [microcycles, setMicrocycles] = useState<CustomMicrocycle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMicrocycles = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: mcs, error } = await supabase
      .from('custom_microcycles')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching microcycles:', error);
      setLoading(false);
      return;
    }

    const result: CustomMicrocycle[] = [];

    for (const mc of mcs || []) {
      const { data: exercises } = await supabase
        .from('custom_microcycle_exercises')
        .select('*, exercise_catalog(*,  muscle_groups(name))')
        .eq('microcycle_id', mc.id)
        .order('order_index');

      result.push({
        id: mc.id,
        name: mc.name,
        createdAt: mc.created_at,
        updatedAt: mc.updated_at,
        exercises: (exercises || []).map((ex: any) => ({
          id: ex.id,
          exerciseCatalogId: ex.exercise_catalog_id,
          name: ex.exercise_catalog?.name || '',
          group: ex.exercise_catalog?.muscle_groups?.name || '',
          videoUrl: ex.exercise_catalog?.video_url || null,
          description: ex.exercise_catalog?.description || null,
          sets: ex.sets,
          repRangeMin: ex.rep_range_min,
          repRangeMax: ex.rep_range_max,
          orderIndex: ex.order_index,
        })),
      });
    }

    setMicrocycles(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMicrocycles();
  }, [fetchMicrocycles]);

  const createMicrocycle = async (name: string, exercises: MicrocycleExercise[]) => {
    if (!user) return null;

    const { data: mc, error } = await supabase
      .from('custom_microcycles')
      .insert({ user_id: user.id, name })
      .select()
      .single();

    if (error || !mc) {
      toast.error('Error al crear microciclo');
      return null;
    }

    if (exercises.length > 0) {
      const { error: exError } = await supabase
        .from('custom_microcycle_exercises')
        .insert(
          exercises.map((ex, i) => ({
            microcycle_id: mc.id,
            exercise_catalog_id: ex.exerciseCatalogId,
            sets: ex.sets,
            rep_range_min: ex.repRangeMin,
            rep_range_max: ex.repRangeMax,
            order_index: i,
          }))
        );

      if (exError) {
        toast.error('Error al guardar ejercicios');
        return null;
      }
    }

    toast.success('Microciclo creado');
    await fetchMicrocycles();
    return mc.id;
  };

  const updateMicrocycle = async (id: string, name: string, exercises: MicrocycleExercise[]) => {
    if (!user) return false;

    const { error } = await supabase
      .from('custom_microcycles')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Error al actualizar microciclo');
      return false;
    }

    // Delete old exercises and re-insert
    await supabase.from('custom_microcycle_exercises').delete().eq('microcycle_id', id);

    if (exercises.length > 0) {
      const { error: exError } = await supabase
        .from('custom_microcycle_exercises')
        .insert(
          exercises.map((ex, i) => ({
            microcycle_id: id,
            exercise_catalog_id: ex.exerciseCatalogId,
            sets: ex.sets,
            rep_range_min: ex.repRangeMin,
            rep_range_max: ex.repRangeMax,
            order_index: i,
          }))
        );

      if (exError) {
        toast.error('Error al guardar ejercicios');
        return false;
      }
    }

    toast.success('Microciclo actualizado');
    await fetchMicrocycles();
    return true;
  };

  const deleteMicrocycle = async (id: string) => {
    const { error } = await supabase.from('custom_microcycles').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar microciclo');
      return false;
    }
    toast.success('Microciclo eliminado');
    await fetchMicrocycles();
    return true;
  };

  return {
    microcycles,
    loading,
    createMicrocycle,
    updateMicrocycle,
    deleteMicrocycle,
    refetch: fetchMicrocycles,
  };
};
