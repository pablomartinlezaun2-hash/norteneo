import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { usePerformanceAlerts } from '@/hooks/usePerformanceAlerts';
import type { ExerciseSessionAlert, AlertLevel } from '@/lib/performanceAlertEngine';
import { ExerciseTrendChart } from './ExerciseTrendChart';
import { PerformanceAlertHeader } from './alerts/PerformanceAlertHeader';
import { PerformanceAlertSummaryCards } from './alerts/PerformanceAlertSummaryCards';
import { PerformanceAlertFilters, type AlertFilter } from './alerts/PerformanceAlertFilters';
import { PerformanceAlertCard } from './alerts/PerformanceAlertCard';

const SEVERITY_ORDER: Record<string, number> = {
  negative_outlier: 0,
  negative_level_3: 1,
  negative_level_2: 2,
  negative_level_1: 3,
  positive_outlier: 4,
  positive_level_3: 5,
  positive_level_2: 6,
  positive_level_1: 7,
  stable: 8,
  // Legacy
  strong_negative: 0,
  outlier: 1,
  moderate_negative: 2,
  strong_positive: 4,
  moderate_positive: 6,
  none: 9,
};

function isPositiveAlert(level: AlertLevel) {
  return level.includes('positive');
}
function isNegativeAlert(level: AlertLevel) {
  return level.includes('negative');
}
function isAtypicalAlert(level: AlertLevel) {
  return level === 'positive_level_3' || level === 'positive_outlier' ||
         level === 'negative_level_3' || level === 'negative_outlier' ||
         level === 'outlier';
}

export const PerformanceAlertsPanel = () => {
  const { alerts, loading } = usePerformanceAlerts();
  const [selectedAlert, setSelectedAlert] = useState<ExerciseSessionAlert | null>(null);
  const [filter, setFilter] = useState<AlertFilter>('all');

  const sortedAlerts = useMemo(
    () => [...alerts].sort((a, b) => (SEVERITY_ORDER[a.alertLevel] ?? 9) - (SEVERITY_ORDER[b.alertLevel] ?? 9)),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return sortedAlerts;
    if (filter === 'positive') return sortedAlerts.filter(a => isPositiveAlert(a.alertLevel));
    if (filter === 'negative') return sortedAlerts.filter(a => isNegativeAlert(a.alertLevel));
    if (filter === 'atypical') return sortedAlerts.filter(a => isAtypicalAlert(a.alertLevel));
    if (filter === 'stable') return sortedAlerts.filter(a => a.alertLevel === 'stable');
    return sortedAlerts;
  }, [sortedAlerts, filter]);

  const counts = useMemo(() => ({
    all: sortedAlerts.length,
    positive: sortedAlerts.filter(a => isPositiveAlert(a.alertLevel)).length,
    negative: sortedAlerts.filter(a => isNegativeAlert(a.alertLevel)).length,
    atypical: sortedAlerts.filter(a => isAtypicalAlert(a.alertLevel)).length,
    stable: sortedAlerts.filter(a => a.alertLevel === 'stable').length,
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
        <PerformanceAlertHeader alerts={sortedAlerts} />

        {sortedAlerts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
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
            <PerformanceAlertSummaryCards alerts={sortedAlerts} />

            <PerformanceAlertFilters value={filter} onChange={setFilter} counts={counts} />

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
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-muted-foreground/40 py-6">
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
