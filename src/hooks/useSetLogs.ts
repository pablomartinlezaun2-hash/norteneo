import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SetLog } from '@/types/database';

export const useSetLogs = (exerciseId: string) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!user || !exerciseId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('set_logs')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar registros');
    } finally {
      setLoading(false);
    }
  }, [user, exerciseId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async (setNumber: number, weight: number, reps: number, partialReps: number = 0, rir: number | null = null, isWarmup: boolean = false) => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { data, error } = await supabase
        .from('set_logs')
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          set_number: setNumber,
          weight,
          reps,
          partial_reps: partialReps,
          rir,
          is_warmup: isWarmup,
        })
        .select()
        .single();

      if (error) throw error;
      setLogs(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al guardar registro' };
    }
  };

  const deleteLog = async (logId: string) => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { error } = await supabase
        .from('set_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) throw error;
      setLogs(prev => prev.filter(log => log.id !== logId));
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al eliminar registro' };
    }
  };

  const getLogsBySetNumber = (setNumber: number) => {
    return logs.filter(log => log.set_number === setNumber && !log.is_warmup);
  };

  const getWarmupLogs = () => {
    return logs.filter(log => log.is_warmup);
  };

  const getLastLogForSet = (setNumber: number): SetLog | null => {
    const setLogs = getLogsBySetNumber(setNumber);
    return setLogs[0] || null;
  };

  const getBestWeightForSet = (setNumber: number): number => {
    const setLogs = getLogsBySetNumber(setNumber);
    if (setLogs.length === 0) return 0;
    return Math.max(...setLogs.map(log => log.weight));
  };

  return {
    logs,
    loading,
    error,
    addLog,
    deleteLog,
    getLogsBySetNumber,
    getWarmupLogs,
    getLastLogForSet,
    getBestWeightForSet,
    refetch: fetchLogs,
  };
};
