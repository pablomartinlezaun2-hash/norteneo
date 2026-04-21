/**
 * SetValidationContext — Holds active (un-acknowledged) validation alerts
 * for the current workout session. Alerts persist in memory until the user
 * accepts them manually. Strong-severity alerts are also persisted to the
 * `performance_alerts` table for downstream analytics.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  SetValidationAlert,
  ValidatedSetInput,
  ExerciseProgressInput,
} from '@/lib/setValidationEngine';
import {
  validateLoggedSet,
  validateExerciseCompletion,
} from '@/lib/setValidationEngine';

interface SetValidationContextValue {
  /** All unacknowledged alerts, newest first */
  alerts: SetValidationAlert[];
  /** Alerts filtered for a specific exercise */
  alertsForExercise: (exerciseId: string) => SetValidationAlert[];
  /** Run validation after a set was logged. Returns generated alerts. */
  validateSet: (input: ValidatedSetInput) => SetValidationAlert[];
  /** Check exercise completion. Adds alert if sets are missing. */
  checkExerciseCompletion: (input: ExerciseProgressInput) => SetValidationAlert | null;
  /** Acknowledge (dismiss) a specific alert by id */
  acknowledge: (id: string) => void;
  /** Acknowledge all alerts for an exercise (e.g. after completing it) */
  acknowledgeExercise: (exerciseId: string) => void;
  /** Clear everything (e.g. after closing session) */
  clearAll: () => void;
}

const SetValidationContext = createContext<SetValidationContextValue | null>(null);

const persistStrongAlert = async (
  userId: string,
  alert: SetValidationAlert,
): Promise<void> => {
  try {
    await supabase.from('performance_alerts').insert({
      user_id: userId,
      alert_type: `set_validation:${alert.kind}`,
      severity: 'strong',
      metadata: {
        exercise_id: alert.exerciseId,
        exercise_name: alert.exerciseName,
        set_number: alert.setNumber,
        precision: alert.precision,
        title: alert.title,
        description: alert.description,
        action_hint: alert.actionHint,
        context: alert.context,
      },
    });
  } catch (err) {
    // Non-blocking: keep UX flowing even if DB write fails
    console.warn('[SetValidation] Failed to persist strong alert', err);
  }
};

export const SetValidationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SetValidationAlert[]>([]);

  const upsertAlerts = useCallback((incoming: SetValidationAlert[]) => {
    if (incoming.length === 0) return;
    setAlerts(prev => {
      const map = new Map(prev.map(a => [a.id, a]));
      // Newer evaluation overwrites older one for the same id
      incoming.forEach(a => map.set(a.id, a));
      const merged = Array.from(map.values()).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
      return merged;
    });
  }, []);

  const validateSet = useCallback(
    (input: ValidatedSetInput) => {
      const generated = validateLoggedSet(input);
      if (generated.length === 0) return [];
      upsertAlerts(generated);
      // Persist strong-severity alerts to performance_alerts (hybrid storage)
      if (user) {
        generated
          .filter(a => a.severity === 'strong')
          .forEach(a => void persistStrongAlert(user.id, a));
      }
      return generated;
    },
    [upsertAlerts, user],
  );

  const checkExerciseCompletion = useCallback(
    (input: ExerciseProgressInput) => {
      const alert = validateExerciseCompletion(input);
      if (!alert) return null;
      upsertAlerts([alert]);
      if (user && alert.severity === 'strong') {
        void persistStrongAlert(user.id, alert);
      }
      return alert;
    },
    [upsertAlerts, user],
  );

  const acknowledge = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const acknowledgeExercise = useCallback((exerciseId: string) => {
    setAlerts(prev => prev.filter(a => a.exerciseId !== exerciseId));
  }, []);

  const clearAll = useCallback(() => setAlerts([]), []);

  const alertsForExercise = useCallback(
    (exerciseId: string) => alerts.filter(a => a.exerciseId === exerciseId),
    [alerts],
  );

  const value = useMemo<SetValidationContextValue>(
    () => ({
      alerts,
      alertsForExercise,
      validateSet,
      checkExerciseCompletion,
      acknowledge,
      acknowledgeExercise,
      clearAll,
    }),
    [
      alerts,
      alertsForExercise,
      validateSet,
      checkExerciseCompletion,
      acknowledge,
      acknowledgeExercise,
      clearAll,
    ],
  );

  return (
    <SetValidationContext.Provider value={value}>
      {children}
    </SetValidationContext.Provider>
  );
};

export const useSetValidation = (): SetValidationContextValue => {
  const ctx = useContext(SetValidationContext);
  if (!ctx) {
    throw new Error('useSetValidation must be used within SetValidationProvider');
  }
  return ctx;
};
