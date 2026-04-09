import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExerciseSessionAlert } from '@/lib/performanceAlertEngine';

interface Props {
  alerts: ExerciseSessionAlert[];
}

export const PerformanceAlertHeader = ({ alerts }: Props) => {
  const positives = alerts.filter(a => a.alertLevel.includes('positive')).length;
  const negatives = alerts.filter(a =>
    a.alertLevel.includes('negative') || a.alertLevel === 'outlier'
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-secondary/60 border border-border/20 flex items-center justify-center">
          <Activity className="w-4 h-4 text-foreground/60" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Alertas de Rendimiento
          </h3>
          <p className="text-[11px] text-muted-foreground/50">
            Cambios detectados en tu programa activo
          </p>
        </div>
      </div>

      {/* Right badge summary */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-1.5">
          {positives > 0 && (
            <span className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">
              {positives}↑
            </span>
          )}
          {negatives > 0 && (
            <span className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md bg-red-500/10 text-red-400">
              {negatives}↓
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};
