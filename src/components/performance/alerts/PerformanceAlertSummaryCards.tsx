import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExerciseSessionAlert } from '@/lib/performanceAlertEngine';

interface Props {
  alerts: ExerciseSessionAlert[];
}

export const PerformanceAlertSummaryCards = ({ alerts }: Props) => {
  // Only count relevant alerts (exclude stable)
  const relevant = alerts.filter(a => a.alertLevel !== 'stable');
  const positives = relevant.filter(a => a.alertLevel.includes('positive'));
  const negatives = relevant.filter(a => a.alertLevel.includes('negative'));

  const best = positives.length > 0
    ? positives.reduce((a, b) => (a.deltaPercent ?? 0) > (b.deltaPercent ?? 0) ? a : b)
    : null;

  const worst = negatives.length > 0
    ? negatives.reduce((a, b) => (a.deltaPercent ?? 0) < (b.deltaPercent ?? 0) ? a : b)
    : null;

  const avgDelta = relevant.length > 0
    ? relevant.reduce((sum, a) => sum + (a.deltaPercent ?? 0), 0) / relevant.length
    : 0;

  const cards = [
    {
      label: 'Relevantes',
      value: `${relevant.length}`,
      icon: Activity,
      color: 'text-foreground',
    },
    {
      label: 'Balance',
      value: `${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)}%`,
      icon: avgDelta >= 0 ? TrendingUp : TrendingDown,
      color: avgDelta >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Mejor',
      value: best ? `+${(best.deltaPercent ?? 0).toFixed(1)}%` : '—',
      subLabel: best?.exerciseName,
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      label: 'En riesgo',
      value: worst ? `${(worst.deltaPercent ?? 0).toFixed(1)}%` : '—',
      subLabel: worst?.exerciseName,
      icon: worst ? AlertTriangle : TrendingDown,
      color: 'text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="relative rounded-xl bg-secondary/40 border border-border/20 p-2.5 overflow-hidden"
        >
          <p className="text-[10px] font-medium text-muted-foreground mb-1">{card.label}</p>
          <p className={cn('text-sm font-bold tabular-nums tracking-tight font-mono', card.color)}>
            {card.value}
          </p>
          {card.subLabel && (
            <p className="text-[9px] text-muted-foreground/60 truncate mt-0.5 leading-tight">
              {card.subLabel}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
};
