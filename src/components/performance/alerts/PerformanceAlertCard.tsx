import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExerciseSessionAlert, AlertLevel } from '@/lib/performanceAlertEngine';
import { PerformanceSparkline } from './PerformanceSparkline';

interface Props {
  alert: ExerciseSessionAlert;
  index: number;
  onViewTrend: (alert: ExerciseSessionAlert) => void;
}

const LEVEL_META: Record<AlertLevel, {
  icon: typeof TrendingUp;
  label: string;
  dotColor: string;
  pctColor: string;
  isPositive?: boolean;
}> = {
  strong_positive: {
    icon: TrendingUp,
    label: 'Mejora fuerte',
    dotColor: 'bg-emerald-400',
    pctColor: 'text-emerald-400',
    isPositive: true,
  },
  moderate_positive: {
    icon: TrendingUp,
    label: 'Mejora',
    dotColor: 'bg-emerald-400',
    pctColor: 'text-emerald-400',
    isPositive: true,
  },
  moderate_negative: {
    icon: TrendingDown,
    label: 'Caída',
    dotColor: 'bg-red-400',
    pctColor: 'text-red-400',
    isPositive: false,
  },
  strong_negative: {
    icon: TrendingDown,
    label: 'Caída fuerte',
    dotColor: 'bg-red-400',
    pctColor: 'text-red-400',
    isPositive: false,
  },
  outlier: {
    icon: AlertTriangle,
    label: 'Outlier',
    dotColor: 'bg-amber-400',
    pctColor: 'text-amber-400',
  },
  none: {
    icon: Activity,
    label: '',
    dotColor: 'bg-muted-foreground',
    pctColor: 'text-muted-foreground',
  },
};

/** Generate fake sparkline from alert data */
function buildSparkValues(alert: ExerciseSessionAlert): number[] {
  const base = alert.baselineScore ?? alert.score;
  const latest = alert.score;
  // Create a simple 4-point trend
  const mid1 = base + (latest - base) * 0.3;
  const mid2 = base + (latest - base) * 0.6;
  return [base, mid1, mid2, latest];
}

export const PerformanceAlertCard = ({ alert, index, onViewTrend }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const meta = LEVEL_META[alert.alertLevel];
  const Icon = meta.icon;

  const pctStr = alert.deltaPercent != null
    ? `${alert.deltaPercent > 0 ? '+' : ''}${alert.deltaPercent.toFixed(1)}%`
    : null;

  const sparkValues = buildSparkValues(alert);

  // Build 1-line summary for closed state
  const closedSummary = alert.explanation
    ? alert.explanation.replace(/^(Mejora|Caída) detectada:\s*/i, '')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group"
    >
      {/* Closed card */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-3 w-full px-3.5 py-3 rounded-2xl transition-all',
          'bg-secondary/30 border border-border/15',
          'hover:bg-secondary/50 active:scale-[0.99]',
          expanded && 'bg-secondary/50 border-border/30'
        )}
      >
        {/* Status dot */}
        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', meta.dotColor)} />

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground truncate">
              {alert.exerciseName}
            </span>
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-md',
              meta.isPositive === true && 'bg-emerald-500/10 text-emerald-400',
              meta.isPositive === false && 'bg-red-500/10 text-red-400',
              meta.isPositive === undefined && 'bg-amber-500/10 text-amber-400',
            )}>
              {meta.label}
            </span>
          </div>
          {closedSummary && !expanded && (
            <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5 leading-tight">
              {closedSummary}
            </p>
          )}
        </div>

        {/* Right side: sparkline + pct */}
        <div className="flex items-center gap-2.5 shrink-0">
          <PerformanceSparkline
            values={sparkValues}
            positive={meta.isPositive}
            width={40}
            height={18}
          />
          {pctStr && (
            <span className={cn(
              'text-base font-bold tabular-nums tracking-tight font-mono min-w-[52px] text-right',
              meta.pctColor
            )}>
              {pctStr}
            </span>
          )}
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
          </motion.div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-4 space-y-3">
              {/* Explanation */}
              {alert.explanation && (
                <p className="text-[13px] text-foreground/75 leading-relaxed">
                  {alert.explanation}
                </p>
              )}

              {/* Metrics comparison */}
              <div className="grid grid-cols-3 gap-2">
                <MetricCompare
                  label="Peso"
                  current={alert.latestAvgWeight}
                  previous={alert.baselineAvgWeight}
                  unit="kg"
                />
                <MetricCompare
                  label="Reps"
                  current={alert.latestAvgReps}
                  previous={alert.baselineAvgReps}
                />
                <MetricCompare
                  label="RIR"
                  current={alert.latestAvgRir}
                  previous={alert.baselineAvgRir}
                  invertColor
                />
              </div>

              {/* CTA */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTrend(alert);
                }}
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl',
                  'bg-secondary/50 border border-border/20',
                  'text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-secondary/70',
                  'transition-all'
                )}
              >
                Ver tendencia completa
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/** Mini metric comparison chip */
function MetricCompare({
  label,
  current,
  previous,
  unit,
  invertColor,
}: {
  label: string;
  current: number;
  previous: number;
  unit?: string;
  invertColor?: boolean;
}) {
  const diff = current - previous;
  const significant = Math.abs(diff) >= (unit === 'kg' ? 1 : 0.5);
  const isUp = diff > 0;
  // For RIR, lower is better, so invert the color logic
  const isGood = invertColor ? !isUp : isUp;

  return (
    <div className="rounded-xl bg-muted/20 border border-border/10 p-2.5 text-center">
      <p className="text-[10px] text-muted-foreground/60 mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground tabular-nums">
        {current.toFixed(1)}{unit ? ` ${unit}` : ''}
      </p>
      {significant && (
        <p className={cn(
          'text-[10px] font-medium tabular-nums mt-0.5',
          isGood ? 'text-emerald-400/70' : 'text-red-400/70'
        )}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit ? ` ${unit}` : ''}
        </p>
      )}
      {!significant && previous !== current && (
        <p className="text-[10px] text-muted-foreground/40 mt-0.5">
          ≈ {previous.toFixed(1)}
        </p>
      )}
    </div>
  );
}
