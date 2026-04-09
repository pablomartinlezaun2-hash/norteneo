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
  labelColor: string;
  pctColor: string;
  isPositive?: boolean;
}> = {
  strong_positive: {
    icon: TrendingUp,
    label: 'Mejora fuerte',
    labelColor: 'text-emerald-400/80 bg-emerald-500/8 border-emerald-500/10',
    pctColor: 'text-emerald-400',
    isPositive: true,
  },
  moderate_positive: {
    icon: TrendingUp,
    label: 'Mejora',
    labelColor: 'text-emerald-400/80 bg-emerald-500/8 border-emerald-500/10',
    pctColor: 'text-emerald-400',
    isPositive: true,
  },
  moderate_negative: {
    icon: TrendingDown,
    label: 'Caída',
    labelColor: 'text-red-400/80 bg-red-500/8 border-red-500/10',
    pctColor: 'text-red-400',
    isPositive: false,
  },
  strong_negative: {
    icon: TrendingDown,
    label: 'Caída fuerte',
    labelColor: 'text-red-400/80 bg-red-500/8 border-red-500/10',
    pctColor: 'text-red-400',
    isPositive: false,
  },
  outlier: {
    icon: AlertTriangle,
    label: 'Outlier',
    labelColor: 'text-amber-400/80 bg-amber-500/8 border-amber-500/10',
    pctColor: 'text-amber-400',
  },
  none: {
    icon: Activity,
    label: '',
    labelColor: '',
    pctColor: 'text-muted-foreground',
  },
};

function buildSparkValues(alert: ExerciseSessionAlert): number[] {
  const base = alert.baselineScore ?? alert.score;
  const latest = alert.score;
  const mid1 = base + (latest - base) * 0.25;
  const mid2 = base + (latest - base) * 0.55;
  const mid3 = base + (latest - base) * 0.75;
  return [base, mid1, mid2, mid3, latest];
}

export const PerformanceAlertCard = ({ alert, index, onViewTrend }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const meta = LEVEL_META[alert.alertLevel];
  const Icon = meta.icon;

  const pctStr = alert.deltaPercent != null
    ? `${alert.deltaPercent > 0 ? '+' : ''}${alert.deltaPercent.toFixed(1)}%`
    : null;

  const sparkValues = buildSparkValues(alert);

  const closedSummary = alert.explanation
    ? alert.explanation.replace(/^(Mejora|Caída) detectada:\s*/i, '')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl transition-all duration-200',
          'bg-muted/8 border border-border/8',
          'hover:bg-muted/15 active:scale-[0.995]',
          expanded && 'bg-muted/15 border-border/15'
        )}
      >
        {/* Icon */}
        <div className={cn(
          'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
          meta.isPositive === true && 'bg-emerald-500/8',
          meta.isPositive === false && 'bg-red-500/8',
          meta.isPositive === undefined && 'bg-amber-500/8',
        )}>
          <Icon className={cn(
            'w-3 h-3',
            meta.isPositive === true && 'text-emerald-400/60',
            meta.isPositive === false && 'text-red-400/60',
            meta.isPositive === undefined && 'text-amber-400/60',
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-foreground/90 truncate leading-none">
              {alert.exerciseName}
            </span>
            <span className={cn(
              'text-[9px] font-medium px-1.5 py-px rounded border leading-none',
              meta.labelColor
            )}>
              {meta.label}
            </span>
          </div>
          {closedSummary && !expanded && (
            <p className="text-[10px] text-muted-foreground/40 truncate mt-1 leading-none">
              {closedSummary}
            </p>
          )}
        </div>

        {/* Right: sparkline + pct */}
        <div className="flex items-center gap-2 shrink-0">
          <PerformanceSparkline
            values={sparkValues}
            positive={meta.isPositive}
            width={36}
            height={14}
          />
          {pctStr && (
            <span className={cn(
              'text-[13px] font-bold tabular-nums tracking-tight font-mono min-w-[44px] text-right leading-none',
              meta.pctColor
            )}>
              {pctStr}
            </span>
          )}
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-3 h-3 text-muted-foreground/20" />
          </motion.div>
        </div>
      </button>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pt-2.5 pb-3 space-y-2.5">
              {alert.explanation && (
                <p className="text-[11px] text-foreground/60 leading-relaxed">
                  {alert.explanation}
                </p>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-1.5">
                <MetricCompare label="Peso" current={alert.latestAvgWeight} previous={alert.baselineAvgWeight} unit="kg" />
                <MetricCompare label="Reps" current={alert.latestAvgReps} previous={alert.baselineAvgReps} />
                <MetricCompare label="RIR" current={alert.latestAvgRir} previous={alert.baselineAvgRir} invertColor />
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onViewTrend(alert); }}
                className={cn(
                  'flex items-center justify-center gap-1.5 w-full py-2 rounded-lg',
                  'bg-muted/10 border border-border/8',
                  'text-[11px] font-medium text-muted-foreground/50 hover:text-foreground/70 hover:bg-muted/20',
                  'transition-all duration-200'
                )}
              >
                Ver tendencia
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function MetricCompare({
  label, current, previous, unit, invertColor,
}: {
  label: string; current: number; previous: number; unit?: string; invertColor?: boolean;
}) {
  const diff = current - previous;
  const significant = Math.abs(diff) >= (unit === 'kg' ? 1 : 0.5);
  const isUp = diff > 0;
  const isGood = invertColor ? !isUp : isUp;

  return (
    <div className="rounded-lg bg-muted/10 border border-border/6 p-2 text-center">
      <p className="text-[9px] text-muted-foreground/40 mb-0.5 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-[13px] font-bold text-foreground/80 tabular-nums leading-none">
        {current.toFixed(1)}{unit ? <span className="text-[10px] text-muted-foreground/40 ml-0.5">{unit}</span> : ''}
      </p>
      {significant && (
        <p className={cn(
          'text-[9px] font-medium tabular-nums mt-1 leading-none',
          isGood ? 'text-emerald-400/60' : 'text-red-400/60'
        )}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit ? ` ${unit}` : ''}
        </p>
      )}
    </div>
  );
}
