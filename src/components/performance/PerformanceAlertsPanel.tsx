import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Bell, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePerformanceEngine } from '@/hooks/usePerformanceEngine';
import type { PerformanceAlert, AlertType } from '@/lib/performanceEngine';
import { ExerciseTrendChart } from './ExerciseTrendChart';

const ALERT_ICON: Record<AlertType, typeof TrendingUp> = {
  improvement: TrendingUp,
  stagnation: Minus,
  regression: TrendingDown,
  overtraining: AlertTriangle,
};

const ALERT_STYLE: Record<AlertType, { pctColor: string }> = {
  improvement: { pctColor: 'text-emerald-500' },
  stagnation: { pctColor: 'text-muted-foreground' },
  regression: { pctColor: 'text-red-500' },
  overtraining: { pctColor: 'text-red-500' },
};

const SEVERITY_ORDER = { error: 0, warn: 1, info: 2 };

export const PerformanceAlertsPanel = () => {
  const { getAllAlerts, loading } = usePerformanceEngine();
  const [selectedAlert, setSelectedAlert] = useState<PerformanceAlert | null>(null);

  const alerts = useMemo(() => {
    if (loading) return [];
    return getAllAlerts().sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [getAllAlerts, loading]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground tracking-wide">
              Alertas
            </span>
          </div>
          {alerts.length > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground/60">
              {alerts.length}
            </span>
          )}
        </div>

        {/* Empty state */}
        {alerts.length === 0 ? (
          <div className="text-center py-10">
            <Activity className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/50">Sin alertas</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {alerts.map((alert, i) => {
                const style = ALERT_STYLE[alert.type];
                const Icon = ALERT_ICON[alert.type];
                const pct = alert.pct_change != null
                  ? `${alert.pct_change > 0 ? '+' : ''}${(alert.pct_change * 100).toFixed(1)}%`
                  : null;
                const isClickable = !!alert.exerciseId;

                return (
                  <motion.button
                    key={`${alert.type}-${alert.exerciseId}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    onClick={() => isClickable && setSelectedAlert(alert)}
                    disabled={!isClickable}
                    className={cn(
                      "flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all",
                      "border border-border/30 bg-card/50",
                      isClickable && "cursor-pointer active:scale-[0.98] hover:bg-card"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />

                    <span className="flex-1 text-left text-[15px] font-medium text-foreground/90 truncate">
                      {alert.exerciseName || 'Ejercicio'}
                    </span>

                    {pct && (
                      <span className={cn(
                        "text-lg font-semibold tabular-nums tracking-tight font-mono",
                        style.pctColor
                      )}>
                        {pct}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Trend chart modal */}
      <AnimatePresence>
        {selectedAlert?.exerciseId && (
          <ExerciseTrendChart
            exerciseId={selectedAlert.exerciseId}
            exerciseName={selectedAlert.exerciseName || 'Ejercicio'}
            onClose={() => setSelectedAlert(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
