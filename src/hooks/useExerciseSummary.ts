import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SetLogForSummary {
  date: string;
  weight: number;
  reps: number;
  rir: number | null;
  est_1rm: number | null;
}

export const useExerciseSummary = () => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async (
    exerciseName: string,
    setLogs: SetLogForSummary[],
    pctChange: number | null,
    alertType: string,
  ) => {
    if (loading) return;
    setSummary(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('exercise-summary', {
        body: { exerciseName, setLogs, pctChange, alertType },
      });

      if (error) throw error;
      setSummary(data?.summary ?? 'No se pudo generar un resumen.');
    } catch (e: any) {
      console.error('Exercise summary error:', e);
      const msg = e?.message || 'Error al generar resumen';
      toast.error(msg);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const reset = useCallback(() => {
    setSummary(null);
    setLoading(false);
  }, []);

  return { summary, loading, fetchSummary, reset };
};
