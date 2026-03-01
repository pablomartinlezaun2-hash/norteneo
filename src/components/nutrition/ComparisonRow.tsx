import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdherenceColor } from './adherenceCalculations';

export type CalculationType = 'nutrition' | 'training' | 'sleep' | 'supplement' | 'timing';

export interface ComparisonRowBreakdown {
  label: string;
  target: number;
  real: number;
  unit: string;
  accuracy: number;
}

interface ComparisonRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  targetValue: number;
  realValue: number;
  unit: string;
  calculationType: CalculationType;
  accuracy: number;
  breakdowns?: ComparisonRowBreakdown[];
  aiAdvice?: string;
  onRequestAI?: () => void;
  aiLoading?: boolean;
}

export const ComparisonRow = ({
  icon,
  title,
  subtitle,
  targetValue,
  realValue,
  unit,
  accuracy,
  breakdowns,
  aiAdvice,
  onRequestAI,
  aiLoading,
}: ComparisonRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.min(accuracy, 100);
  const hasOvershoot = accuracy > 100;
  const barWidth = Math.min(accuracy, 120);
  const color = getAdherenceColor(accuracy);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 min-h-[64px] text-left active:bg-muted/50 transition-colors"
      >
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {icon}
        </div>

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0 mr-2">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {targetValue}{unit} obj · {realValue}{unit} real
          </p>
        </div>

        {/* Bar + percentage */}
        <div className="flex items-center gap-2 shrink-0" style={{ width: '40%' }}>
          <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden relative">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(barWidth, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {hasOvershoot && (
              <motion.div
                className="absolute top-0 h-full rounded-r-full opacity-40"
                style={{ backgroundColor: color, left: '100%' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(barWidth - 100, 20)}%` }}
                transition={{ duration: 0.5, delay: 0.8 }}
              />
            )}
          </div>
          <span
            className="text-lg font-bold tabular-nums min-w-[48px] text-right"
            style={{ color }}
          >
            {Math.round(accuracy)}%
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform shrink-0",
            expanded && "rotate-180"
          )} />
        </div>
      </button>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {breakdowns && breakdowns.length > 0 && (
                <div className="space-y-2">
                  {breakdowns.map((b, i) => {
                    const bColor = getAdherenceColor(b.accuracy);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">{b.label}</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: bColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(b.accuracy, 100)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold tabular-nums w-16 text-right" style={{ color: bColor }}>
                          {b.target}{b.unit} → {b.real}{b.unit}
                        </span>
                        <span className="text-[11px] font-bold tabular-nums w-10 text-right" style={{ color: bColor }}>
                          {Math.round(b.accuracy)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* AI advice */}
              {aiAdvice ? (
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-xs text-foreground leading-relaxed">{aiAdvice}</p>
                </div>
              ) : onRequestAI ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onRequestAI(); }}
                  disabled={aiLoading}
                  className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  <Sparkles className={cn("w-3.5 h-3.5", aiLoading && "animate-spin")} />
                  {aiLoading ? 'Analizando...' : 'Ver consejo IA'}
                </button>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
