import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePerformanceAlerts } from '@/hooks/usePerformanceAlerts';
import type { ExerciseSessionAlert, AlertLevel } from '@/lib/performanceAlertEngine';
import { ExerciseTrendChart } from './ExerciseTrendChart';

const ALERT_CONFIG: Record<AlertLevel, {
  icon: typeof TrendingUp;
  pctColor: string;
  badgeColor: string;
  badgeText: string;
}> = {
  strong_positive: {
    icon: TrendingUp,
    pctColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badgeText: 'Mejora fuerte',
  },
  moderate_positive: {
    icon: TrendingUp,
    pctColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badgeText: 'Mejora',
  },
  moderate_negative: {
    icon: TrendingDown,
    pctColor: 'text-red-500',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400',
    badgeText: 'Caída',
  },
  strong_negative: {
    icon: TrendingDown,
    pctColor: 'text-red-500',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400',
    badgeText: 'Caída fuerte',
  },
  outlier: {
    icon: AlertTriangle,
    pctColor: 'text-amber-500',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    badgeText: 'Outlier',
  },
  none: {
    icon: Activity,
    pctColor: 'text-muted-foreground',
    badgeColor: '',
    badgeText: '',
  },
};

const SEVERITY_ORDER: Record<AlertLevel, number> = {
  strong_negative: 0,
  outlier: 1,
  moderate_negative: 2,
  strong_positive: 3,
  moderate_positive: 4,
  none: 5,
};

export const PerformanceAlertsPanel = () => {
  const { alerts, loading } = usePerformanceAlerts();
  const [selectedAlert, setSelectedAlert] = useState<ExerciseSessionAlert | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedAlerts = [...alerts].sort(
    (a, b) => SEVERITY_ORDER[a.alertLevel] - SEVERITY_ORDER[b.alertLevel]
  );

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
          {sortedAlerts.length > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground/60">
              {sortedAlerts.length}
            </span>
          )}
        </div>

        {/* Empty state */}
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-10">
            <Activity className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/50">Sin alertas</p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              Se necesitan al menos 3 sesiones por ejercicio con peso, reps y RIR
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {sortedAlerts.map((alert, i) => {
                const config = ALERT_CONFIG[alert.alertLevel];
                const Icon = config.icon;
                const pctStr = alert.deltaPercent != null
                  ? `${alert.deltaPercent > 0 ? '+' : ''}${alert.deltaPercent.toFixed(1)}%`
                  : null;
                const isExpanded = expandedId === alert.exerciseId;

                return (
                  <motion.div
                    key={`${alert.alertLevel}-${alert.exerciseId}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alert.exerciseId)}
                      className={cn(
                        "flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all",
                        "border border-border/30 bg-card/50",
                        "cursor-pointer active:scale-[0.98] hover:bg-card"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />

                      <span className="flex-1 text-left text-[15px] font-medium text-foreground/90 truncate">
                        {alert.exerciseName}
                      </span>

                      {pctStr && (
                        <span className={cn(
                          "text-lg font-semibold tabular-nums tracking-tight font-mono",
                          config.pctColor
                        )}>
                          {pctStr}
                        </span>
                      )}

                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
                      </motion.div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pt-3 pb-4 space-y-3">
                            {/* Badge */}
                            <span className={cn(
                              "inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full",
                              config.badgeColor
                            )}>
                              {config.badgeText}
                            </span>

                            {/* Explanation */}
                            {alert.explanation && (
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {alert.explanation}
                              </p>
                            )}

                            {/* Score context */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-muted/30 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Peso medio</p>
                                <p className="text-sm font-semibold text-foreground">
                                  {alert.latestAvgWeight.toFixed(1)} kg
                                </p>
                                {alert.baselineAvgWeight !== alert.latestAvgWeight && (
                                  <p className="text-[10px] text-muted-foreground/60">
                                    vs {alert.baselineAvgWeight.toFixed(1)}
                                  </p>
                                )}
                              </div>
                              <div className="bg-muted/30 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Reps media</p>
                                <p className="text-sm font-semibold text-foreground">
                                  {alert.latestAvgReps.toFixed(1)}
                                </p>
                                {Math.abs(alert.baselineAvgReps - alert.latestAvgReps) >= 0.5 && (
                                  <p className="text-[10px] text-muted-foreground/60">
                                    vs {alert.baselineAvgReps.toFixed(1)}
                                  </p>
                                )}
                              </div>
                              <div className="bg-muted/30 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">RIR medio</p>
                                <p className="text-sm font-semibold text-foreground">
                                  {alert.latestAvgRir.toFixed(1)}
                                </p>
                                {Math.abs(alert.baselineAvgRir - alert.latestAvgRir) >= 0.5 && (
                                  <p className="text-[10px] text-muted-foreground/60">
                                    vs {alert.baselineAvgRir.toFixed(1)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* View trend button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlert(alert);
                              }}
                              className="w-full py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                              Ver tendencia →
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
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
            exerciseName={selectedAlert.exerciseName}
            onClose={() => setSelectedAlert(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
