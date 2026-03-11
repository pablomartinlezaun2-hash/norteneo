import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CompletedSession } from '@/types/database';
import { syncTrainingToCoach } from '@/lib/syncTrainingToCoach';
import { CompletedSession } from '@/types/database';

export const useCompletedSessions = () => {
  const { user } = useAuth();
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedSessions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('completed_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setCompletedSessions(data || []);
    } catch (err) {
      console.error('Error fetching completed sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompletedSessions();
  }, [fetchCompletedSessions]);

  const markSessionComplete = async (sessionId: string, opts?: { sessionName?: string; sessionType?: string; microcycleName?: string }) => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { data, error } = await supabase
        .from('completed_sessions')
        .insert({
          user_id: user.id,
          session_id: sessionId,
        })
        .select()
        .single();

      if (error) throw error;
      setCompletedSessions(prev => [data, ...prev]);

      // Sync to coach_training_sessions (fire and forget)
      const sessionName = opts?.sessionName;
      if (!sessionName) {
        // Try to get session name from DB
        const { data: ws } = await supabase
          .from('workout_sessions')
          .select('name')
          .eq('id', sessionId)
          .maybeSingle();
        syncTrainingToCoach({
          sessionName: ws?.name ?? undefined,
          sessionType: opts?.sessionType ?? 'Gimnasio',
          microcycleName: opts?.microcycleName,
          completed: true,
        });
      } else {
        syncTrainingToCoach({
          sessionName,
          sessionType: opts?.sessionType ?? 'Gimnasio',
          microcycleName: opts?.microcycleName,
          completed: true,
        });
      }

      return { data, error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al marcar sesión' };
    }
  };

  const getTotalCompleted = () => completedSessions.length;
  
  const getCyclesCompleted = () => Math.floor(completedSessions.length / 4);
  
  const getProgressInCurrentCycle = () => completedSessions.length % 4;

  return {
    completedSessions,
    loading,
    markSessionComplete,
    getTotalCompleted,
    getCyclesCompleted,
    getProgressInCurrentCycle,
    refetch: fetchCompletedSessions,
  };
};
