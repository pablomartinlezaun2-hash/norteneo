import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Area, AreaChart, Cell, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Route, Gauge, Timer, Waves, Footprints, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { CardioSessionLog } from '@/hooks/useCardioLogs';
import { PaceUnitSelector } from './cardio/PaceUnitSelector';
import { formatPace, convertPace, calculatePace, DEFAULT_PACE_UNIT, formatUnitLabel } from './cardio/paceUtils';

interface CardioProgressChartProps {
  sessions: CardioSessionLog[];
  activityType: 'running' | 'swimming';
}

export const CardioProgressChart = ({ sessions, activityType }: CardioProgressChartProps) => {
  const isRunning = activityType === 'running';
  const accentColor = isRunning ? 'hsl(142, 71%, 45%)' : 'hsl(199, 89%, 48%)';
  const Icon = isRunning ? Footprints : Waves;
  const defaultUnit = DEFAULT_PACE_UNIT[activityType];
  const [paceUnit, setPaceUnit] = useState(defaultUnit);

  // Calculate pace from time/distance, falling back to stored pace
  const getPaceForSession = (s: CardioSessionLog): number | null => {
    const dist = Number(s.total_distance_m);
    const time = Number(s.total_duration_seconds);
    // Prefer calculating from raw time/distance for accuracy
    if (time > 0 && dist > 0) {
      return calculatePace(time, dist, paceUnit) ?? null;
    }
    // Fallback to stored pace converted to selected unit
    if (s.avg_pace_seconds_per_unit && Number(s.avg_pace_seconds_per_unit) > 0) {
      return convertPace(Number(s.avg_pace_seconds_per_unit), defaultUnit, paceUnit);
    }
    return null;
  };

  const totalDistance = useMemo(() => {
    return sessions.reduce((sum, s) => sum + Number(s.total_distance_m), 0);
  }, [sessions]);

  const avgPace = useMemo(() => {
    const paces = sessions.map(getPaceForSession).filter((p): p is number => p !== null);
    if (paces.length === 0) return null;
    return paces.reduce((s, p) => s + p, 0) / paces.length;
  }, [sessions, paceUnit, defaultUnit]);

  const bestPace = useMemo(() => {
    const paces = sessions.map(getPaceForSession).filter((p): p is number => p !== null);
    if (paces.length === 0) return null;
    return Math.min(...paces);
  }, [sessions, paceUnit, defaultUnit]);

  const chartData = useMemo(() => {
    const sorted = [...sessions].reverse(); // chronological order
    return sorted.map((s, idx) => {
      const pace = getPaceForSession(s);
      const prevPace = idx > 0 ? getPaceForSession(sorted[idx - 1]) : null;
      // delta: negative = improved (less time), positive = worsened
      let delta: number | null = null;
      if (pace !== null && prevPace !== null) {
        delta = pace - prevPace;
      }
      return {
        date: format(new Date(s.completed_at), 'dd/MM', { locale: es }),
        fullDate: format(new Date(s.completed_at), "d 'de' MMMM", { locale: es }),
        distance: isRunning ? Number(s.total_distance_m) / 1000 : Number(s.total_distance_m),
        pace,
        delta,
        // improved = lower pace than previous
        status: delta === null ? 'neutral' : delta < -0.5 ? 'improved' : delta > 0.5 ? 'worsened' : 'same',
        name: s.session_name || '',
      };
    });
  }, [sessions, isRunning, paceUnit, defaultUnit]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const statusColor = d.status === 'improved' ? 'text-green-400' : d.status === 'worsened' ? 'text-red-400' : 'text-primary-foreground/60';
      const StatusIcon = d.status === 'improved' ? ArrowDown : d.status === 'worsened' ? ArrowUp : Minus;
      return (
        <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-white/10 space-y-1">
          <p className="text-primary-foreground font-bold text-xs">{d.fullDate}</p>
          {d.name && <p className="text-primary-foreground/70 text-[10px]">{d.name}</p>}
          <div className="flex items-center gap-2">
            <Route className="w-3 h-3 text-primary-foreground/60" />
            <span className="text-primary-foreground text-xs font-semibold">
              {d.distance.toFixed(isRunning ? 2 : 0)} {isRunning ? 'km' : 'm'}
            </span>
          </div>
          {d.pace !== null && (
            <div className="flex items-center gap-2">
              <Gauge className="w-3 h-3 text-primary-foreground/60" />
              <span className="text-primary-foreground text-xs font-semibold">
                {formatPace(d.pace)}/{formatUnitLabel(paceUnit)}
              </span>
            </div>
          )}
          {d.delta !== null && (
            <div className={`flex items-center gap-1 text-[10px] font-semibold ${statusColor}`}>
              <StatusIcon className="w-3 h-3" />
              <span>
                {d.status === 'improved' ? 'Mejora' : d.status === 'worsened' ? 'Empeora' : 'Similar'}
                {' '}({d.delta > 0 ? '+' : ''}{formatPace(Math.abs(d.delta))})
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <Icon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Registra tu primera sesión para ver las gráficas</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Pace unit selector */}
      <PaceUnitSelector activityType={activityType} value={paceUnit} onChange={setPaceUnit} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="gradient-card rounded-2xl p-3 border border-border text-center">
          <Route className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
          <p className="text-lg font-bold text-foreground">
            {isRunning ? (totalDistance / 1000).toFixed(1) : totalDistance.toFixed(0)}
          </p>
          <p className="text-[10px] text-muted-foreground">{isRunning ? 'km total' : 'm total'}</p>
        </div>
        <div className="gradient-card rounded-2xl p-3 border border-border text-center">
          <Gauge className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
          <p className="text-lg font-bold text-foreground">
            {avgPace ? formatPace(avgPace) : '--'}
          </p>
          <p className="text-[10px] text-muted-foreground">Ritmo medio/{formatUnitLabel(paceUnit)}</p>
        </div>
        <div className="gradient-card rounded-2xl p-3 border border-border text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
          <p className="text-lg font-bold text-foreground">
            {bestPace ? formatPace(bestPace) : '--'}
          </p>
          <p className="text-[10px] text-muted-foreground">Mejor ritmo/{formatUnitLabel(paceUnit)}</p>
        </div>
      </div>

      {/* Distance chart */}
      <div className="gradient-card rounded-2xl p-4 border border-border">
        <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Route className="w-3.5 h-3.5" style={{ color: accentColor }} />
          Distancia por sesión
        </h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id={`dist-${activityType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={1} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="distance" fill={`url(#dist-${activityType})`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pace chart - reversed Y axis: lower = better */}
      {chartData.some(d => d.pace) && (
        <div className="gradient-card rounded-2xl p-4 border border-border">
          <h4 className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" style={{ color: accentColor }} />
            Ritmo por sesión (min/{formatUnitLabel(paceUnit)})
          </h4>
          <p className="text-[9px] text-muted-foreground mb-3 flex items-center gap-1">
            <ArrowDown className="w-3 h-3 text-green-500" />
            Más abajo = más rápido = mejor rendimiento
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id={`pace-improved-${activityType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id={`pace-worsened-${activityType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id={`pace-neutral-${activityType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  reversed
                  tickFormatter={(v) => formatPace(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                {avgPace && (
                  <ReferenceLine
                    y={avgPace}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: `Media ${formatPace(avgPace)}`, fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  />
                )}
                <Bar dataKey="pace" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.status === 'improved'
                          ? `url(#pace-improved-${activityType})`
                          : entry.status === 'worsened'
                          ? `url(#pace-worsened-${activityType})`
                          : `url(#pace-neutral-${activityType})`
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
              Mejora
            </div>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              Empeora
            </div>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accentColor }} />
              Primera / Similar
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
