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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-secondary/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <PerformanceAlertHeader alerts={sortedAlerts} />

        {/* Empty state */}
        {sortedAlerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-10 h-10 rounded-2xl bg-secondary/40 border border-border/20 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-5 h-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground/50 font-medium">Sin alertas</p>
            <p className="text-[11px] text-muted-foreground/30 mt-1 max-w-[240px] mx-auto leading-relaxed">
              Se necesitan al menos 3 sesiones por ejercicio con peso, reps y RIR registrados
            </p>
          </motion.div>
        ) : (
          <>
            {/* Summary KPIs */}
            <PerformanceAlertSummaryCards alerts={sortedAlerts} />

            {/* Filters */}
            <PerformanceAlertFilters
              value={filter}
              onChange={setFilter}
              counts={counts}
            />

            {/* Alert cards */}
            <div className="space-y-2">
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
                  className="text-center text-xs text-muted-foreground/40 py-6"
                >
                  Sin alertas en esta categoría
                </motion.p>
              )}
            </div>
          </>
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
