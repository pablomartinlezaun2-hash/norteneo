import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle, TrendingDown, TrendingUp, RefreshCw,
  Minus, Plus, Shield, Check, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Recommendation, RecommendationType } from '@/lib/autoregulation/recommendationEngine';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: (rec: Recommendation) => void;
  onReject: (rec: Recommendation) => void;
}

const TYPE_CONFIG: Record<RecommendationType, {
  icon: React.ReactNode;
  badgeLabel: string;
  badgeClass: string;
  borderClass: string;
}> = {
  RESTRUCTURE_SESSION: {
    icon: <AlertTriangle className="w-5 h-5" />,
    badgeLabel: 'Reestructurar',
    badgeClass: 'bg-destructive/15 text-destructive border-destructive/30',
    borderClass: 'border-destructive/30',
  },
  SUBSTITUTE_EXERCISE: {
    icon: <RefreshCw className="w-5 h-5" />,
    badgeLabel: 'Sustituir',
    badgeClass: 'bg-[hsl(35,92%,50%)]/15 text-[hsl(35,92%,50%)] border-[hsl(35,92%,50%)]/30',
    borderClass: 'border-[hsl(35,92%,50%)]/30',
  },
  INCREASE_RIR: {
    icon: <TrendingDown className="w-5 h-5" />,
    badgeLabel: 'Bajar intensidad',
    badgeClass: 'bg-[hsl(35,92%,50%)]/15 text-[hsl(35,92%,50%)] border-[hsl(35,92%,50%)]/30',
    borderClass: 'border-[hsl(35,92%,50%)]/30',
  },
  REMOVE_SET: {
    icon: <Minus className="w-5 h-5" />,
    badgeLabel: 'Quitar serie',
    badgeClass: 'bg-[hsl(35,92%,50%)]/15 text-[hsl(35,92%,50%)] border-[hsl(35,92%,50%)]/30',
    borderClass: 'border-[hsl(35,92%,50%)]/30',
  },
  ADD_SET: {
    icon: <Plus className="w-5 h-5" />,
    badgeLabel: 'Añadir serie',
    badgeClass: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30',
    borderClass: 'border-[hsl(var(--success))]/30',
  },
  KEEP_PLAN: {
    icon: <Shield className="w-5 h-5" />,
    badgeLabel: 'Plan OK',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    borderClass: 'border-border',
  },
};

function ImpactDetail({ recommendation }: { recommendation: Recommendation }) {
  const p = recommendation.recommendation_payload;
  const type = recommendation.recommendation_type;

  if (type === 'REMOVE_SET' || type === 'ADD_SET') {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground line-through tabular-nums">
          {String(p.original_sets)} series
        </span>
        <span className="text-foreground">→</span>
        <span className="font-semibold text-foreground tabular-nums">
          {String(p.recommended_sets)} series
        </span>
      </div>
    );
  }

  if (type === 'INCREASE_RIR') {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground line-through tabular-nums">
          RIR {String(p.original_rir)}
        </span>
        <span className="text-foreground">→</span>
        <span className="font-semibold text-foreground tabular-nums">
          RIR {String(p.recommended_rir)}
        </span>
      </div>
    );
  }

  if (type === 'SUBSTITUTE_EXERCISE') {
    return (
      <div className="text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground line-through">{String(p.original_exercise_name)}</span>
          <span className="text-foreground">→</span>
          <span className="font-semibold text-foreground">{String(p.substitute_exercise_name)}</span>
        </div>
        <p className="text-muted-foreground text-xs">
          Manteniendo {String(p.keep_sets)} series · {String(p.keep_rep_range)} reps · RIR {String(p.keep_rir)}
        </p>
      </div>
    );
  }

  if (type === 'RESTRUCTURE_SESSION') {
    const kept = p.kept_exercises as Array<{ exercise_name: string; recommended_sets: number }> | undefined;
    const removed = p.removed_exercises as Array<{ exercise_name: string }> | undefined;
    return (
      <div className="text-sm space-y-2">
        {kept && kept.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Se mantienen:</p>
            {kept.map((e, i) => (
              <p key={i} className="text-foreground">{e.exercise_name} — {e.recommended_sets} series</p>
            ))}
          </div>
        )}
        {removed && removed.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Se eliminan:</p>
            {removed.map((e, i) => (
              <p key={i} className="text-muted-foreground line-through">{e.exercise_name}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function RecommendationCard({ recommendation, onAccept, onReject }: RecommendationCardProps) {
  const [responded, setResponded] = useState<'accepted' | 'rejected' | null>(null);
  const config = TYPE_CONFIG[recommendation.recommendation_type];

  const handleAccept = () => {
    setResponded('accepted');
    onAccept(recommendation);
  };

  const handleReject = () => {
    setResponded('rejected');
    onReject(recommendation);
  };

  if (recommendation.recommendation_type === 'KEEP_PLAN') {
    return (
      <Card className={cn('border bg-card', config.borderClass)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-muted-foreground mt-0.5">{config.icon}</div>
            <div className="space-y-1 flex-1">
              <Badge variant="outline" className={cn('text-[11px]', config.badgeClass)}>
                {config.badgeLabel}
              </Badge>
              <p className="text-sm text-foreground">{recommendation.recommendation_reason}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border bg-card transition-all', config.borderClass, responded && 'opacity-60')}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="text-foreground mt-0.5">{config.icon}</div>
          <div className="space-y-2 flex-1">
            <Badge variant="outline" className={cn('text-[11px]', config.badgeClass)}>
              {config.badgeLabel}
            </Badge>
            <p className="text-sm text-foreground leading-relaxed">
              {recommendation.recommendation_reason}
            </p>
            <ImpactDetail recommendation={recommendation} />
          </div>
        </div>

        {!responded ? (
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleReject}>
              <X className="w-3.5 h-3.5" />
              Mantener plan
            </Button>
            <Button size="sm" className="flex-1 gap-1.5" onClick={handleAccept}>
              <Check className="w-3.5 h-3.5" />
              Aplicar cambio
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-1">
            <Badge variant="outline" className={cn('text-xs',
              responded === 'accepted'
                ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]'
                : 'bg-muted text-muted-foreground'
            )}>
              {responded === 'accepted' ? 'Cambio aplicado' : 'Plan mantenido'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
