import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PlanningMesocycle, PlanningMicrocycle } from './usePlanningMesocycles';

export const useActivateMesocycle = () => {
  const { user } = useAuth();
  const [activating, setActivating] = useState(false);

  const activateMicrocycle = async (mesocycle: PlanningMesocycle, microcycle: PlanningMicrocycle): Promise<boolean> => {
    if (!user) return false;
    if (microcycle.sessions.length === 0) {
      toast.error('Este microciclo no tiene sesiones configuradas');
      return false;
    }

    setActivating(true);
    try {
      // 1. Deactivate all current programs
      await supabase
        .from('training_programs')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // 2. Create new training program from the microcycle
      const programName = `${mesocycle.name} — ${microcycle.name}`;
      const { data: program, error: progErr } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          name: programName,
          description: mesocycle.goal || `Microciclo activado desde planificación`,
          is_active: true,
          source_planning_mesocycle_id: mesocycle.id,
        } as any)
        .select()
        .single();
      if (progErr) throw progErr;

      // 3. Create workout sessions and exercises
      for (const session of microcycle.sessions) {
        const shortName = session.name.length > 3
          ? session.name.substring(0, 3).toUpperCase()
          : session.name.toUpperCase();

        const { data: wsRow, error: wsErr } = await supabase
          .from('workout_sessions')
          .insert({
            program_id: program.id,
            name: session.name,
            short_name: shortName,
            order_index: session.orderIndex,
          })
          .select()
          .single();
        if (wsErr) throw wsErr;

        if (session.exercises.length > 0) {
          const exerciseInserts = session.exercises.map((ex) => ({
            session_id: wsRow.id,
            name: ex.name,
            series: ex.sets,
            reps: `${ex.repRangeMin}-${ex.repRangeMax}`,
            order_index: ex.orderIndex,
            video_url: ex.videoUrl || null,
            execution: ex.description || null,
          }));

          const { error: exErr } = await supabase
            .from('exercises')
            .insert(exerciseInserts);
          if (exErr) throw exErr;
        }
      }

      toast.success(`"${programName}" activado como entrenamiento`);
      return true;
    } catch (err) {
      console.error('Error activating mesocycle:', err);
      toast.error('Error al activar el microciclo');
      return false;
    } finally {
      setActivating(false);
    }
  };

  return { activateMicrocycle, activating };
};
