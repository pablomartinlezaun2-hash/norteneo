import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { usePerformanceAlerts } from '@/hooks/usePerformanceAlerts';
import type { ExerciseSessionAlert } from '@/lib/performanceAlertEngine';
import { ExerciseTrendChart } from './ExerciseTrendChart';
import { PerformanceAlertHeader } from './alerts/PerformanceAlertHeader';
import { PerformanceAlertSummaryCards } from './alerts/PerformanceAlertSummaryCards';
import { PerformanceAlertFilters, type AlertFilter } from './alerts/PerformanceAlertFilters';
import { PerformanceAlertCard } from './alerts/PerformanceAlertCard';

const SEVERITY_ORDER: Record<string, number> = {
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
  const [filter, setFilter] = useState<AlertFilter>('all');

  const sortedAlerts = useMemo(
    () => [...alerts].sort((a, b) => SEVERITY_ORDER[a.alertLevel] - SEVERITY_ORDER[b.alertLevel]),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return sortedAlerts;
    if (filter === 'positive') return sortedAlerts.filter(a => a.alertLevel.includes('positive'));
    return sortedAlerts.filter(a => a.alertLevel.includes('negative') || a.alertLevel === 'outlier');
  }, [sortedAlerts, filter]);

  const counts = useMemo(() => ({
    all: sortedAlerts.length,
    positive: sortedAlerts.filter(a => a.alertLevel.includes('positive')).length,
    negative: sortedAlerts.filter(a => a.alertLevel.includes('negative') || a.alertLevel === 'outlier').length,
  }), [sortedAlerts]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-muted/8 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <PerformanceAlertHeader alerts={sortedAlerts} />

        {sortedAlerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10"
          >
            <div className="w-9 h-9 rounded-xl bg-muted/10 border border-border/8 flex items-center justify-center mx-auto mb-2.5">
              <Activity className="w-4 h-4 text-muted-foreground/20" />
            </div>
            <p className="text-[12px] text-muted-foreground/40 font-medium">Sin alertas</p>
            <p className="text-[10px] text-muted-foreground/25 mt-1 max-w-[220px] mx-auto leading-relaxed">
              Se necesitan al menos 3 sesiones con peso, reps y RIR
            </p>
          </motion.div>
        ) : (
          <>
            <PerformanceAlertSummaryCards alerts={sortedAlerts} />

            <PerformanceAlertFilters value={filter} onChange={setFilter} counts={counts} />

            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {filteredAlerts.map((alert, i) => (
                  <PerformanceAlertCard
                    key={`${alert.alertLevel}-${alert.exerciseId}`}
                    alert={alert}
                    index={i}
                    onViewTrend={setSelectedAlert}
                  />
                ))}
              </AnimatePresence>

              {filteredAlerts.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[11px] text-muted-foreground/30 py-5"
                >
                  Sin alertas en esta categoría
                </motion.p>
              )}
            </div>
          </>
        )}
      </div>

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
