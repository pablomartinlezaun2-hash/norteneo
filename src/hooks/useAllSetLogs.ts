import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SetLog } from '@/types/database';

export const useAllSetLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('set_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar registros');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  };
};
