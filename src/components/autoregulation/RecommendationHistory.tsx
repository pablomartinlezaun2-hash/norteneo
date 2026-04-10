import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RecommendationHistoryEntry } from '@/lib/autoregulation/sessionPlanManager';

interface RecommendationHistoryProps {
  history: RecommendationHistoryEntry[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  accepted: { label: 'Aplicado', className: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]' },
  rejected: { label: 'Rechazado', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pendiente', className: 'bg-[hsl(35,92%,50%)]/15 text-[hsl(35,92%,50%)]' },
};

export function RecommendationHistory({ history }: RecommendationHistoryProps) {
  if (history.length === 0) return null;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Historial de ajustes ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {history.map(entry => {
          const config = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.pending;
          return (
            <div key={entry.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">
                  {entry.recommendation.recommendation_type.replace(/_/g, ' ')}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {entry.recommendation.recommendation_reason.slice(0, 80)}…
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={cn('text-[10px]', config.className)}>
                  {config.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                  {entry.phase === 'pre_session' ? 'Pre' : 'Mid'}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
