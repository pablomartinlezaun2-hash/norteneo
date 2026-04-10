import { DailyCheckIn } from './DailyCheckIn';
import { PreWorkoutCheckIn } from './PreWorkoutCheckIn';
import { RecommendationOverlay } from './RecommendationOverlay';
import { useAutoregulation, type AutoregPhase } from '@/hooks/useAutoregulation';
import type { SessionContext } from '@/lib/autoregulation/recommendationEngine';

interface AutoregulationFlowProps {
  session: SessionContext;
  plannedMinutes: number;
  onComplete: (accepted: import('@/lib/autoregulation/recommendationEngine').Recommendation[]) => void;
  onCancel: () => void;
}

export function AutoregulationFlow({ session, plannedMinutes, onComplete, onCancel }: AutoregulationFlowProps) {
  const autoreg = useAutoregulation(session);

  // Auto-start on mount
  if (autoreg.phase === 'idle') {
    autoreg.startFlow();
  }

  const handleProceed = () => {
    autoreg.proceedToSession();
    onComplete(autoreg.acceptedRecommendations);
  };

  switch (autoreg.phase) {
    case 'daily_checkin':
      return (
        <DailyCheckIn
          onSubmit={autoreg.submitDailyCheckIn}
          onSkip={autoreg.skipDailyCheckIn}
        />
      );

    case 'pre_workout_checkin':
      return (
        <PreWorkoutCheckIn
          plannedMinutes={plannedMinutes}
          onSubmit={autoreg.submitPreWorkoutCheckIn}
          onSkip={autoreg.skipPreWorkoutCheckIn}
        />
      );

    case 'recommendations':
      if (!autoreg.engineOutput) return null;
      return (
        <RecommendationOverlay
          engineOutput={autoreg.engineOutput}
          responses={autoreg.responses}
          onAccept={(i) => autoreg.respondToRecommendation(i, 'accepted')}
          onReject={(i) => autoreg.respondToRecommendation(i, 'rejected')}
          onProceed={handleProceed}
          allResponded={autoreg.allResponded}
        />
      );

    default:
      return null;
  }
}
