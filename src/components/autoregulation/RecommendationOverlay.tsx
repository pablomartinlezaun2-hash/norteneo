import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RecommendationCard } from './RecommendationCard';
import type { EngineOutput, Recommendation } from '@/lib/autoregulation/recommendationEngine';

interface RecommendationOverlayProps {
  engineOutput: EngineOutput;
  responses: Map<number, 'accepted' | 'rejected'>;
  onAccept: (index: number, rec: Recommendation) => void;
  onReject: (index: number, rec: Recommendation) => void;
  onProceed: () => void;
  allResponded: boolean;
  isMidSession?: boolean;
}

function ReadinessIndicator({ score, state }: { score: number; state: string }) {
  const stateConfig: Record<string, { label: string; className: string }> = {
    READY_TO_PROGRESS: { label: 'Listo para progresar', className: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30' },
    READY_TO_MAINTAIN: { label: 'Mantener plan', className: 'bg-muted text-foreground border-border' },
    MODERATE_FATIGUE: { label: 'Fatiga moderada', className: 'bg-[hsl(35,92%,50%)]/15 text-[hsl(35,92%,50%)] border-[hsl(35,92%,50%)]/30' },
    HIGH_FATIGUE: { label: 'Fatiga alta', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  };

  const config = stateConfig[state] ?? stateConfig.READY_TO_MAINTAIN;

  return (
    <div className="flex items-center justify-between px-1">
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">Readiness</p>
        <p className="text-2xl font-bold text-foreground tabular-nums">{Math.round(score)}</p>
      </div>
      <Badge variant="outline" className={cn('text-xs', config.className)}>
        {config.label}
      </Badge>
    </div>
  );
}

export function RecommendationOverlay({
  engineOutput,
  responses,
  onAccept,
  onReject,
  onProceed,
  allResponded,
  isMidSession = false,
}: RecommendationOverlayProps) {
  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-foreground">
          {isMidSession ? 'Ajuste detectado' : 'Análisis de sesión'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isMidSession
            ? 'Neo ha detectado cambios durante la sesión'
            : 'Neo ha analizado tu estado y tiene sugerencias'
          }
        </p>
      </div>

      <ReadinessIndicator
        score={engineOutput.readinessScore}
        state={engineOutput.readinessState}
      />

      {engineOutput.veto.vetoed && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Se detectaron señales de alerta que limitan la progresión hoy.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {engineOutput.recommendations.map((rec, i) => (
          <RecommendationCard
            key={`${rec.recommendation_type}-${rec.exercise_id ?? i}`}
            recommendation={rec}
            onAccept={() => onAccept(i, rec)}
            onReject={() => onReject(i, rec)}
          />
        ))}
      </div>

      <Button
        className="w-full"
        onClick={onProceed}
        disabled={!allResponded}
      >
        {isMidSession ? 'Continuar sesión' : 'Empezar sesión'}
      </Button>
    </div>
  );
}
