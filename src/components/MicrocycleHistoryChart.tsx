import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { X, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Microcycle } from '@/hooks/usePeriodization';

interface MicrocycleHistoryChartProps {
  microcycles: Microcycle[];
  onClose: () => void;
  mesocycleNumber: number;
}

const ChartTooltipContent = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-white/10 max-w-[200px]">
      <p className="text-primary-foreground font-bold text-xs mb-1.5">
        Microciclo {d.number}
      </p>
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-3">
          <span className="text-primary-foreground/60">Fatiga</span>
          <span className="text-primary-foreground font-semibold">
            {d.fatigue_index != null ? d.fatigue_index.toFixed(1) : '—'}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-primary-foreground/60">Tendencia</span>
          <span className={cn("font-semibold",
            d.performance_trend > 0 ? "text-emerald-400" : d.performance_trend < 0 ? "text-red-400" : "text-primary-foreground"
          )}>
            {d.performance_trend != null ? `${d.performance_trend > 0 ? '+' : ''}${d.performance_trend.toFixed(1)}%` : '—'}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-primary-foreground/60">Estado</span>
          <span className={cn("font-semibold text-[10px]",
            d.recommendation === 'deload' ? "text-amber-400" :
            d.recommendation === 'block_change' ? "text-red-400" : "text-emerald-400"
          )}>
            {d.recommendation === 'deload' ? 'Deload' : d.recommendation === 'block_change' ? 'Cambio bloque' : 'Óptimo'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const MicrocycleHistoryChart = ({ microcycles, onClose, mesocycleNumber }: MicrocycleHistoryChartProps) => {
  const completedMicrocycles = useMemo(() =>
    microcycles
      .filter(m => m.status === 'completed' && (m.fatigue_index != null || m.performance_trend != null))
      .sort((a, b) => a.microcycle_number - b.microcycle_number)
      .map(m => ({
        number: m.microcycle_number,
        label: `μ${m.microcycle_number}`,
        fatigue_index: m.fatigue_index,
        performance_trend: m.performance_trend,
        recommendation: m.recommendation,
      })),
    [microcycles]
  );

  const avgFatigue = useMemo(() => {
    const vals = completedMicrocycles.filter(m => m.fatigue_index != null).map(m => m.fatigue_index!);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [completedMicrocycles]);

  const avgTrend = useMemo(() => {
    const vals = completedMicrocycles.filter(m => m.performance_trend != null).map(m => m.performance_trend!);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [completedMicrocycles]);

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
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground">Historial Mesociclo {mesocycleNumber}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedMicrocycles.length} microciclos completados
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-2 px-5 mb-4">
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <Activity className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <p className="text-sm font-bold text-foreground">{avgFatigue.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Fatiga media</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className={cn("text-sm font-bold", avgTrend > 0 ? "text-primary" : avgTrend < 0 ? "text-destructive" : "text-muted-foreground")}>
              {avgTrend > 0 ? '+' : ''}{avgTrend.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">Tendencia media</p>
          </div>
        </div>

        {/* Chart */}
        <div className="px-3 pb-6">
          {completedMicrocycles.length < 2 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Se necesitan al menos 2 microciclos completados</p>
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completedMicrocycles} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="fatigue"
                    orientation="left"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="trend"
                    orientation="right"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip content={<ChartTooltipContent />} />

                  <ReferenceLine yAxisId="fatigue" y={85} stroke="hsl(var(--destructive))" strokeDasharray="6 4" strokeOpacity={0.5}
                    label={{ value: 'Deload 85', position: 'left', fontSize: 9, fill: 'hsl(var(--destructive))' }}
                  />

                  <Line
                    yAxisId="fatigue"
                    type="monotone"
                    dataKey="fatigue_index"
                    name="Fatiga"
                    stroke="hsl(var(--chart-2, 30 80% 55%))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(var(--chart-2, 30 80% 55%))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="trend"
                    type="monotone"
                    dataKey="performance_trend"
                    name="Tendencia"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center mt-3">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: 'hsl(30, 80%, 55%)' }} />
              Fatiga
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-3 h-0.5 bg-primary rounded" />
              Tendencia %
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-3 h-0.5 bg-destructive/50 rounded" style={{ borderTop: '1px dashed' }} />
              Umbral deload
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
