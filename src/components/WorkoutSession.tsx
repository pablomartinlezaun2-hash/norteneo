import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { WorkoutSession as WorkoutSessionType } from '@/data/workouts';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2 } from 'lucide-react';
import { useSetValidation } from '@/contexts/SetValidationContext';
import { useAllSetLogs } from '@/hooks/useAllSetLogs';
import { SetValidationBanner } from './SetValidationBanner';

interface WorkoutSessionProps {
  session: WorkoutSessionType;
  onComplete: (sessionId: string) => void;
}

export const WorkoutSessionComponent = ({ session, onComplete }: WorkoutSessionProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { alerts, checkExerciseCompletion, acknowledge } = useSetValidation();
  const { logs } = useAllSetLogs();

  const handleCheckboxChange = (checked: boolean) => {
    setIsCompleted(checked);
  };

  const runSessionCompletenessCheck = () => {
    // For each exercise in the session, check if planned sets were completed.
    // Counts only non-warmup logs that exist in the local state.
    session.exercises.forEach((ex, idx) => {
      // exercise id from data/workouts is a string identifier, may not match DB exercise id.
      // We rely on the exercise name + planned series count.
      const exId = (ex as unknown as { id?: string }).id ?? `${session.id}:${idx}`;
      const exName = ex.name;
      const planned = ex.series ?? 0;
      const effectiveLogged = logs.filter(
        l => l.exercise_id === exId && !l.is_warmup,
      ).length;
      checkExerciseCompletion({
        exerciseId: exId,
        exerciseName: exName,
        totalSetsPlanned: planned,
        effectiveSetsLogged: effectiveLogged,
      });
    });
  };

  const handleComplete = () => {
    if (!isCompleted) return;
    // Surface any missing-set warnings BEFORE confirming. These banners are
    // persistent: navigation is not blocked, but the user sees them clearly.
    runSessionCompletenessCheck();

    onComplete(session.id);
    setIsCompleted(false);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 2000);
  };

  // Surface session-level alerts (missing sets) at the top of the session.
  const sessionLevelAlerts = alerts.filter(a => a.kind === 'missing_sets');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{session.name}</h2>
          <p className="text-sm text-muted-foreground">{session.exercises.length} ejercicios</p>
        </div>
      </div>

      {sessionLevelAlerts.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sessionLevelAlerts.map(a => (
              <SetValidationBanner key={a.id} alert={a} onAccept={acknowledge} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="space-y-3">
        {session.exercises.map((exercise, index) => (
          <ExerciseCard key={index} exercise={exercise} index={index} />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="gradient-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Checkbox 
              id="session-complete"
              checked={isCompleted}
              onCheckedChange={handleCheckboxChange}
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label 
              htmlFor="session-complete" 
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              He completado la sesión completa
            </label>
          </div>
          
          <Button 
            onClick={handleComplete}
            disabled={!isCompleted}
            className="w-full gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Registrar entreno
          </Button>

          {showConfirmation && (
            <div className="mt-3 p-3 bg-success/20 border border-success/30 rounded-lg text-center animate-slide-up">
              <p className="text-sm text-success font-medium">
                ¡Entreno registrado! 💪
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
