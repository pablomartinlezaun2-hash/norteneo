import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProgramTemplate } from '@/data/programTemplates';

export const useProgramImport = () => {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importProgram = async (template: ProgramTemplate) => {
    if (!user) {
      setError('No autenticado');
      return { error: 'No autenticado' };
    }

    setImporting(true);
    setError(null);

    try {
      // 1. Deactivate any existing active programs
      await supabase
        .from('training_programs')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // 2. Create the new program
      const { data: program, error: programError } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          name: template.name,
          description: template.description,
          is_active: true,
        })
        .select()
        .single();

      if (programError) throw programError;

      // 3. Create all sessions
      const sessionsToInsert = template.sessions.map((session, index) => ({
        program_id: program.id,
        name: session.name,
        short_name: session.short_name,
        order_index: index,
      }));

      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .insert(sessionsToInsert)
        .select();

      if (sessionsError) throw sessionsError;

      // 4. Create all exercises for each session
      const exercisesToInsert = template.sessions.flatMap((sessionTemplate, sessionIndex) => {
        const session = sessions.find(s => s.order_index === sessionIndex);
        if (!session) return [];
        
        return sessionTemplate.exercises.map((exercise, exerciseIndex) => ({
          session_id: session.id,
          name: exercise.name,
          series: exercise.series,
          reps: exercise.reps,
          approach_sets: exercise.approach_sets,
          rest: exercise.rest,
          technique: exercise.technique,
          execution: exercise.execution,
          video_url: exercise.video_url,
          order_index: exerciseIndex,
        }));
      });

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;

      return { data: program, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al importar programa';
      setError(message);
      return { error: message };
    } finally {
      setImporting(false);
    }
  };

  return {
    importProgram,
    importing,
    error,
  };
};
