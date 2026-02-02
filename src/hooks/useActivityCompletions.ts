import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityCompletion {
  id: string;
  user_id: string;
  activity_type: string;
  activity_name: string;
  completed_at: string;
  created_at: string;
}

export const useActivityCompletions = (activityType: 'swimming' | 'running') => {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<ActivityCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('activity_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_type', activityType)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setCompletions(data || []);
    } catch (err) {
      console.error('Error fetching activity completions:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activityType]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  const markComplete = async (activityName: string) => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { error } = await supabase
        .from('activity_completions')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          activity_name: activityName,
        });

      if (error) throw error;
      
      await fetchCompletions();
      return { error: null };
    } catch (err) {
      console.error('Error marking activity complete:', err);
      return { error: err instanceof Error ? err.message : 'Error al registrar' };
    }
  };

  const getCompletionCount = (activityName: string) => {
    return completions.filter(c => c.activity_name === activityName).length;
  };

  const getTotalCompletions = () => completions.length;

  const getLastCompletion = (activityName: string) => {
    const activityCompletions = completions.filter(c => c.activity_name === activityName);
    return activityCompletions.length > 0 ? activityCompletions[0] : null;
  };

  return {
    completions,
    loading,
    markComplete,
    getCompletionCount,
    getTotalCompletions,
    getLastCompletion,
    refetch: fetchCompletions,
  };
};
