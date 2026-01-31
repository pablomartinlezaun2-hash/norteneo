import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

  const markSessionComplete = async (sessionId: string) => {
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
