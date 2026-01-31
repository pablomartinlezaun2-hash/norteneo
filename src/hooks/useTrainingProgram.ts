import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TrainingProgram, WorkoutSession, Exercise } from '@/types/database';

export interface ProgramWithSessions extends TrainingProgram {
  sessions: (WorkoutSession & { exercises: Exercise[] })[];
}

export const useTrainingProgram = () => {
  const { user } = useAuth();
  const [program, setProgram] = useState<ProgramWithSessions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgram = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get active program
      const { data: programs, error: programError } = await supabase
        .from('training_programs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (programError) throw programError;

      if (!programs || programs.length === 0) {
        setProgram(null);
        setLoading(false);
        return;
      }

      const activeProgram = programs[0];

      // Get sessions for this program
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('program_id', activeProgram.id)
        .order('order_index', { ascending: true });

      if (sessionsError) throw sessionsError;

      // Get exercises for all sessions
      const sessionIds = sessions?.map(s => s.id) || [];
      
      let exercises: Exercise[] = [];
      if (sessionIds.length > 0) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .in('session_id', sessionIds)
          .order('order_index', { ascending: true });

        if (exercisesError) throw exercisesError;
        exercises = exercisesData || [];
      }

      // Combine data
      const sessionsWithExercises = (sessions || []).map(session => ({
        ...session,
        exercises: exercises.filter(e => e.session_id === session.id),
      }));

      setProgram({
        ...activeProgram,
        sessions: sessionsWithExercises,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar programa');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const createDefaultProgram = async () => {
    if (!user) return { error: 'No autenticado' };

    try {
      // Create program
      const { data: newProgram, error: programError } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          name: 'Mi Programa',
          description: 'Programa de entrenamiento personalizado',
          is_active: true,
        })
        .select()
        .single();

      if (programError) throw programError;

      await fetchProgram();
      return { data: newProgram, error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al crear programa' };
    }
  };

  return {
    program,
    loading,
    error,
    refetch: fetchProgram,
    createDefaultProgram,
  };
};
