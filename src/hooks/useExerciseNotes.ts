import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ExerciseNote } from '@/types/database';

export const useExerciseNotes = (exerciseId: string) => {
  const { user } = useAuth();
  const [note, setNote] = useState<ExerciseNote | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNote = useCallback(async () => {
    if (!user || !exerciseId) return;

    try {
      const { data, error } = await supabase
        .from('exercise_notes')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setNote(data);
    } catch (err) {
      console.error('Error fetching note:', err);
    } finally {
      setLoading(false);
    }
  }, [user, exerciseId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const saveNote = async (noteText: string) => {
    if (!user) return { error: 'No autenticado' };

    try {
      if (note) {
        // Update existing note
        const { data, error } = await supabase
          .from('exercise_notes')
          .update({ note: noteText })
          .eq('id', note.id)
          .select()
          .single();

        if (error) throw error;
        setNote(data);
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('exercise_notes')
          .insert({
            user_id: user.id,
            exercise_id: exerciseId,
            note: noteText,
          })
          .select()
          .single();

        if (error) throw error;
        setNote(data);
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al guardar nota' };
    }
  };

  const deleteNote = async () => {
    if (!user || !note) return { error: 'No hay nota que eliminar' };

    try {
      const { error } = await supabase
        .from('exercise_notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;
      setNote(null);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al eliminar nota' };
    }
  };

  return {
    note,
    loading,
    saveNote,
    deleteNote,
    refetch: fetchNote,
  };
};
