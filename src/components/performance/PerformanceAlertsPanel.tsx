import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePerformanceEngine } from '@/hooks/usePerformanceEngine';
import type { PerformanceAlert, AlertType } from '@/lib/performanceEngine';

const ALERT_CONFIG: Record<AlertType, {
  icon: typeof TrendingUp;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  label: string;
}> = {
  improvement: {
    icon: TrendingUp,
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    iconClass: 'text-emerald-500',
    label: 'Mejora',
  },
  stagnation: {
    icon: Activity,
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    iconClass: 'text-amber-500',
    label: 'Estancamiento',
  },
  regression: {
    icon: TrendingDown,
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    iconClass: 'text-red-500',
    label: 'Retroceso',
  },
  overtraining: {
    icon: AlertTriangle,
    bgClass: 'bg-red-600/10',
    borderClass: 'border-red-600/30',
    iconClass: 'text-red-600',
    label: 'Sobreentrenamiento',
  },
};

const SEVERITY_ORDER = { error: 0, warn: 1, info: 2 };

export const PerformanceAlertsPanel = () => {
  const { getAllAlerts, loading } = usePerformanceEngine();

  const alerts = useMemo(() => {
    if (loading) return [];
    return getAllAlerts()
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [getAllAlerts, loading]);

  const grouped = useMemo(() => {
    const map = new Map<AlertType, PerformanceAlert[]>();
    for (const a of alerts) {
      if (!map.has(a.type)) map.set(a.type, []);
      map.get(a.type)!.push(a);
    }
    return map;
  }, [alerts]);

  const summary = useMemo(() => ({
    improvements: grouped.get('improvement')?.length || 0,
    stagnations: grouped.get('stagnation')?.length || 0,
    regressions: grouped.get('regression')?.length || 0,
    overtraining: grouped.get('overtraining')?.length || 0,
  }), [grouped]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-3" />
        <div className="space-y-2">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">Alertas de Rendimiento</h3>
        {alerts.length > 0 && (
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {alerts.length}
          </span>
        )}
      </div>

      {/* Summary pills */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.improvements > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              {summary.improvements} mejora{summary.improvements > 1 ? 's' : ''}
            </span>
          )}
          {summary.stagnations > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Activity className="w-3 h-3" />
              {summary.stagnations} estancamiento{summary.stagnations > 1 ? 's' : ''}
            </span>
          )}
          {summary.regressions > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              <TrendingDown className="w-3 h-3" />
              {summary.regressions} retroceso{summary.regressions > 1 ? 's' : ''}
            </span>
          )}
          {summary.overtraining > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-600/10 text-red-600 border border-red-600/20">
              <AlertTriangle className="w-3 h-3" />
              {summary.overtraining} sobreentrenamiento
            </span>
          )}
        </div>
      )}

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Sin alertas activas</p>
          <p className="text-xs mt-1">Se necesitan al menos 4 sesiones por ejercicio para detectar tendencias</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {alerts.map((alert, i) => {
              const cfg = ALERT_CONFIG[alert.type];
              const Icon = cfg.icon;
              const pctDisplay = alert.pct_change != null
                ? `${alert.pct_change > 0 ? '+' : ''}${(alert.pct_change * 100).toFixed(1)}%`
                : null;

              return (
                <motion.div
                  key={`${alert.type}-${alert.exerciseId}-${i}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                    cfg.bgClass, cfg.borderClass
                  )}
                >
                  <div className={cn("p-1.5 rounded-lg", cfg.bgClass)}>
                    <Icon className={cn("w-4 h-4", cfg.iconClass)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wider", cfg.iconClass)}>
                        {cfg.label}
                      </span>
                      {pctDisplay && (
                        <span className={cn("text-[10px] font-mono", cfg.iconClass)}>
                          {pctDisplay}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-0.5 leading-snug">
                      {alert.message}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
