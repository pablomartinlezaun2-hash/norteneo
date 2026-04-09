import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
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
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/8 border border-primary/10 flex items-center justify-center">
          <Activity className="w-3.5 h-3.5 text-primary/70" />
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-foreground tracking-tight leading-none">
            Alertas de Rendimiento
          </h3>
          <p className="text-[10px] text-muted-foreground/40 mt-0.5 leading-none">
            Programa activo
          </p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="flex items-center gap-1">
          {positives > 0 && (
            <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-emerald-500/8 text-emerald-400/80 border border-emerald-500/10">
              {positives}↑
            </span>
          )}
          {negatives > 0 && (
            <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-red-500/8 text-red-400/80 border border-red-500/10">
              {negatives}↓
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};
