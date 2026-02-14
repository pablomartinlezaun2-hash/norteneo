import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Area, AreaChart, ComposedChart } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Route, Gauge, Timer, Waves, Footprints } from 'lucide-react';
import { CardioSessionLog } from '@/hooks/useCardioLogs';

interface CardioProgressChartProps {
  sessions: CardioSessionLog[];
  activityType: 'running' | 'swimming';
}

const formatPace = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const CardioProgressChart = ({ sessions, activityType }: CardioProgressChartProps) => {
  const isRunning = activityType === 'running';
  const accentColor = isRunning ? 'hsl(142, 71%, 45%)' : 'hsl(199, 89%, 48%)';
  const Icon = isRunning ? Footprints : Waves;

  const totalDistance = useMemo(() => {
    return sessions.reduce((sum, s) => sum + Number(s.total_distance_m), 0);
  }, [sessions]);

  const avgPace = useMemo(() => {
    const withPace = sessions.filter(s => s.avg_pace_seconds_per_unit);
    if (withPace.length === 0) return null;
    return withPace.reduce((sum, s) => sum + Number(s.avg_pace_seconds_per_unit!), 0) / withPace.length;
  }, [sessions]);

  const bestPace = useMemo(() => {
    const withPace = sessions.filter(s => s.avg_pace_seconds_per_unit);
    if (withPace.length === 0) return null;
    return Math.min(...withPace.map(s => Number(s.avg_pace_seconds_per_unit!)));
  }, [sessions]);

  const chartData = useMemo(() => {
    return [...sessions].reverse().map(s => ({
      date: format(new Date(s.completed_at), 'dd/MM', { locale: es }),
      fullDate: format(new Date(s.completed_at), "d 'de' MMMM", { locale: es }),
      distance: isRunning ? Number(s.total_distance_m) / 1000 : Number(s.total_distance_m),
      pace: s.avg_pace_seconds_per_unit ? Number(s.avg_pace_seconds_per_unit) : null,
      name: s.session_name || '',
    }));
  }, [sessions, isRunning]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
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
          {d.pace && (
            <div className="flex items-center gap-2">
              <Gauge className="w-3 h-3 text-primary-foreground/60" />
              <span className="text-primary-foreground text-xs font-semibold">
                {formatPace(d.pace)}/{isRunning ? 'km' : '100m'}
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
          <p className="text-[10px] text-muted-foreground">Ritmo medio</p>
        </div>
        <div className="gradient-card rounded-2xl p-3 border border-border text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
          <p className="text-lg font-bold text-foreground">
            {bestPace ? formatPace(bestPace) : '--'}
          </p>
          <p className="text-[10px] text-muted-foreground">Mejor ritmo</p>
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

      {/* Pace chart */}
      {chartData.some(d => d.pace) && (
        <div className="gradient-card rounded-2xl p-4 border border-border">
          <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" style={{ color: accentColor }} />
            Ritmo por sesión ({isRunning ? 'min/km' : 'min/100m'})
          </h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id={`pace-${activityType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0.05} />
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
                <Area
                  type="monotone"
                  dataKey="pace"
                  stroke={accentColor}
                  strokeWidth={2}
                  fill={`url(#pace-${activityType})`}
                  connectNulls
                  dot={{ fill: accentColor, r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
};
