import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExerciseSessionAlert } from '@/lib/performanceAlertEngine';

interface Props {
  alerts: ExerciseSessionAlert[];
}

export const PerformanceAlertSummaryCards = ({ alerts }: Props) => {
  const positives = alerts.filter(a => a.alertLevel.includes('positive'));
  const negatives = alerts.filter(a => a.alertLevel.includes('negative') || a.alertLevel === 'outlier');

  const best = positives.length > 0
    ? positives.reduce((a, b) => (a.deltaPercent ?? 0) > (b.deltaPercent ?? 0) ? a : b)
    : null;

  const worst = negatives.length > 0
    ? negatives.reduce((a, b) => (a.deltaPercent ?? 0) < (b.deltaPercent ?? 0) ? a : b)
    : null;

  const avgDelta = alerts.length > 0
    ? alerts.reduce((sum, a) => sum + (a.deltaPercent ?? 0), 0) / alerts.length
    : 0;

  const cards = [
    {
      label: 'Activas',
      value: `${alerts.length}`,
      icon: Activity,
      color: 'text-foreground/80',
      iconColor: 'text-muted-foreground/50',
    },
    {
      label: 'Balance',
      value: `${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)}%`,
      icon: avgDelta >= 0 ? TrendingUp : TrendingDown,
      color: avgDelta >= 0 ? 'text-emerald-400' : 'text-red-400',
      iconColor: avgDelta >= 0 ? 'text-emerald-400/40' : 'text-red-400/40',
    },
    {
      label: 'Mejor',
      value: best ? `+${(best.deltaPercent ?? 0).toFixed(1)}%` : '—',
      subLabel: best?.exerciseName,
      icon: TrendingUp,
      color: 'text-emerald-400',
      iconColor: 'text-emerald-400/40',
    },
    {
      label: 'En riesgo',
      value: worst ? `${(worst.deltaPercent ?? 0).toFixed(1)}%` : '—',
      subLabel: worst?.exerciseName,
      icon: worst ? AlertTriangle : TrendingDown,
      color: 'text-red-400',
      iconColor: 'text-red-400/40',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            className="rounded-lg bg-muted/15 border border-border/8 p-2 relative overflow-hidden"
          >
            <div className="flex items-center gap-1 mb-1">
              <Icon className={cn('w-2.5 h-2.5', card.iconColor)} />
              <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">{card.label}</p>
            </div>
            <p className={cn('text-[13px] font-bold tabular-nums tracking-tight font-mono leading-none', card.color)}>
              {card.value}
            </p>
            {card.subLabel && (
              <p className="text-[8px] text-muted-foreground/40 truncate mt-1 leading-none">
                {card.subLabel}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
