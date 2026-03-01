import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Dot } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, TrendingUp, TrendingDown, Minus, Dumbbell, Zap, Target, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePerformanceEngine } from '@/hooks/usePerformanceEngine';
import { useExerciseSummary } from '@/hooks/useExerciseSummary';
import type { ChartPointData } from '@/lib/performanceEngine';

interface ExerciseTrendChartProps {
  exerciseId: string;
  exerciseName: string;
  onClose: () => void;
}

/** Custom dot that colors green/red/gray based on pct_change */
const TrendDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const color = payload?.color || '#6B7280';
  const isInflection = payload?.isInflection;
  return (
    <g>
      {isInflection && (
        <circle cx={cx} cy={cy} r={10} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} strokeOpacity={0.4} />
      )}
      <circle cx={cx} cy={cy} r={isInflection ? 5 : 3.5} fill={color} stroke="hsl(var(--background))" strokeWidth={2} />
    </g>
  );
};

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ChartPointData & { isInflection?: boolean; inflectionLabel?: string };
  const pctStr = d.pct_change != null ? `${d.pct_change > 0 ? '+' : ''}${(d.pct_change * 100).toFixed(1)}%` : '';
  return (
    <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-white/10 max-w-[200px]">
      <p className="text-primary-foreground font-bold text-xs mb-1.5">
        {format(new Date(d.date), 'dd MMM yyyy', { locale: es })}
      </p>
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-3">
          <span className="text-primary-foreground/60">est 1RM</span>
          <span className="text-primary-foreground font-semibold">{d.est_1rm_set.toFixed(1)} kg</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-primary-foreground/60">Baseline</span>
          <span className="text-primary-foreground font-semibold">{d.baseline.toFixed(1)} kg</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-primary-foreground/60">Cambio</span>
          <span className="font-semibold" style={{ color: d.color }}>{pctStr}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-primary-foreground/60">Peso × Reps</span>
          <span className="text-primary-foreground font-semibold">{d.best_weight}kg × {d.best_reps}</span>
        </div>
        {d.isInflection && (
          <div className="pt-1 mt-1 border-t border-white/10">
            <span className="text-primary font-semibold text-[10px]">⚡ {d.inflectionLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ExerciseTrendChart = ({ exerciseId, exerciseName, onClose }: ExerciseTrendChartProps) => {
  const { getExerciseChartPoints, computeExercisePerformances } = usePerformanceEngine();
  const { summary, loading: summaryLoading, fetchSummary, reset: resetSummary } = useExerciseSummary();
  const [summaryOpen, setSummaryOpen] = useState(false);

  const points = useMemo(() => getExerciseChartPoints(exerciseId), [exerciseId, getExerciseChartPoints]);

  // Detect inflection points: sign change in pct_change between consecutive sessions
  const enrichedPoints = useMemo(() => {
    if (points.length < 3) return points.map(p => ({ ...p, isInflection: false, inflectionLabel: '' }));

    return points.map((p, i) => {
      if (i === 0 || i === points.length - 1) return { ...p, isInflection: false, inflectionLabel: '' };
      const prev = points[i - 1];
      const next = points[i + 1];

      // Direction change: was going up and starts going down, or vice versa
      const delta1 = p.est_1rm_set - prev.est_1rm_set;
      const delta2 = next.est_1rm_set - p.est_1rm_set;
      const isInflection = (delta1 > 0 && delta2 < 0) || (delta1 < 0 && delta2 > 0);

      let inflectionLabel = '';
      if (isInflection) {
        inflectionLabel = delta1 > 0 ? 'Pico' : 'Valle';
      }

      return { ...p, isInflection, inflectionLabel };
    });
  }, [points]);

  // Compute a simple linear trend line
  const trendLine = useMemo(() => {
    if (enrichedPoints.length < 2) return null;
    const n = enrichedPoints.length;
    const xs = enrichedPoints.map((_, i) => i);
    const ys = enrichedPoints.map(p => p.est_1rm_set);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return enrichedPoints.map((p, i) => ({
      ...p,
      trend: Math.round((intercept + slope * i) * 10) / 10,
    }));
  }, [enrichedPoints]);

  const chartData = trendLine || enrichedPoints;

  // Summary stats
  const exPerf = useMemo(() => {
    const perfs = computeExercisePerformances();
    return perfs.get(exerciseId);
  }, [exerciseId, computeExercisePerformances]);

  const inflectionCount = enrichedPoints.filter(p => p.isInflection).length;
  const latestPct = exPerf?.latestPctChange ?? 0;
  const alertType = latestPct > 0.02 ? 'improvement' : latestPct < -0.03 ? 'regression' : 'stagnation';

  const handleToggleSummary = () => {
    const next = !summaryOpen;
    setSummaryOpen(next);
    if (next && !summary && !summaryLoading) {
      const setLogs = points.map(p => ({
        date: p.date,
        weight: p.best_weight,
        reps: p.best_reps,
        rir: p.best_rir,
        est_1rm: p.est_1rm_set,
      }));
      fetchSummary(exerciseName, setLogs, exPerf?.latestPctChange ?? null, alertType);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-lg bg-card rounded-t-3xl border-t border-border shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate">{exerciseName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {points.length} sesiones registradas
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 px-5 mb-4">
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <Dumbbell className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-sm font-bold text-foreground">{exPerf?.bestEst1rm.toFixed(1) ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground">Mejor 1RM</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <p className="text-sm font-bold text-foreground">{inflectionCount}</p>
            <p className="text-[10px] text-muted-foreground">Inflexiones</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            {latestPct > 0 ? <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-500" /> :
             latestPct < 0 ? <TrendingDown className="w-4 h-4 mx-auto mb-1 text-destructive" /> :
             <Minus className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />}
            <p className={cn("text-sm font-bold",
              latestPct > 0 ? "text-emerald-500" : latestPct < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {latestPct > 0 ? '+' : ''}{(latestPct * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">Último cambio</p>
          </div>
        </div>

        {/* Chart */}
        <div className="px-3 pb-6">
          {points.length < 2 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Se necesitan al menos 2 sesiones para generar la gráfica</p>
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(new Date(d), 'dd/MM', { locale: es })}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip content={<ChartTooltip />} />

                  {/* Baseline reference */}
                  {exPerf && exPerf.currentBaseline > 0 && (
                    <ReferenceLine
                      y={exPerf.currentBaseline}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="6 4"
                      strokeOpacity={0.5}
                      label={{
                        value: `Baseline ${exPerf.currentBaseline.toFixed(0)}`,
                        position: 'right',
                        fontSize: 9,
                        fill: 'hsl(var(--primary))',
                      }}
                    />
                  )}

                  {/* Trend line (dashed) */}
                  {trendLine && (
                    <Line
                      type="linear"
                      dataKey="trend"
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      strokeOpacity={0.5}
                      dot={false}
                      activeDot={false}
                    />
                  )}

                  {/* Main est_1RM line */}
                  <Line
                    type="monotone"
                    dataKey="est_1rm_set"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={<TrendDot />}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center mt-3">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-3 h-0.5 bg-primary rounded" />
              est 1RM
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-3 h-0.5 bg-muted-foreground/50 rounded" style={{ borderTop: '1px dashed' }} />
              Tendencia
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/40" />
              Baseline
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
              Inflexión
            </div>
          </div>

          {/* AI Summary collapsible */}
          <div className="mt-4 mx-2">
            <button
              onClick={handleToggleSummary}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground/80 flex-1 text-left">Resumen IA</span>
              <motion.div animate={{ rotate: summaryOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.div>
            </button>

            <AnimatePresence>
              {summaryOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-1 pt-4 pb-2">
                    {summaryLoading ? (
                      <div className="flex items-center gap-2 py-6 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Analizando...</span>
                      </div>
                    ) : summary ? (
                      <p className="text-[15px] leading-[1.7] text-foreground/85">
                        {summary}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/60 text-center py-4">
                        No se pudo generar el resumen
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
