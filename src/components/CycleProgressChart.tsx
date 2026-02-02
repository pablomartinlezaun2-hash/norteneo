import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CompletedSession } from '@/types/database';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { format, startOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Award, Target } from 'lucide-react';

interface CycleProgressChartProps {
  completedSessions: CompletedSession[];
  totalCompleted: number;
  cyclesCompleted: number;
  progressInCycle: number;
}

export const CycleProgressChart = ({ 
  completedSessions,
  totalCompleted, 
  cyclesCompleted, 
  progressInCycle 
}: CycleProgressChartProps) => {
  const chartData = useMemo(() => {
    // Get last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Count sessions per day
    const sessionsByDay = new Map<string, number>();
    completedSessions.forEach(session => {
      const dayKey = format(new Date(session.completed_at), 'yyyy-MM-dd');
      sessionsByDay.set(dayKey, (sessionsByDay.get(dayKey) || 0) + 1);
    });

    // Cumulative count
    let cumulative = 0;
    const olderSessions = completedSessions.filter(
      s => new Date(s.completed_at) < startDate
    ).length;
    cumulative = olderSessions;

    return days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const count = sessionsByDay.get(dayKey) || 0;
      cumulative += count;
      
      return {
        date: day,
        formattedDate: format(day, 'dd MMM', { locale: es }),
        sessions: count,
        cumulative,
      };
    });
  }, [completedSessions]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10">
          <p className="text-primary-foreground font-bold text-sm mb-2">
            {format(data.date, 'EEEE, dd MMMM', { locale: es })}
          </p>
          <div className="space-y-1.5">
            {data.sessions > 0 ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-primary-foreground font-semibold">{data.sessions}</span>
                <span className="text-primary-foreground/60 text-xs">entreno{data.sessions > 1 ? 's' : ''}</span>
              </div>
            ) : (
              <p className="text-primary-foreground/50 text-xs italic">Día de descanso</p>
            )}
            <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
              <span className="text-primary-foreground/50 text-[10px] uppercase tracking-wider">Total</span>
              <span className="text-primary font-bold">{data.cumulative}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gradient-card rounded-2xl p-4 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalCompleted}</p>
          <p className="text-xs text-muted-foreground mt-1">Entrenos</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gradient-card rounded-2xl p-4 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{cyclesCompleted}</p>
          <p className="text-xs text-muted-foreground mt-1">Ciclos</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gradient-card rounded-2xl p-4 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{progressInCycle}<span className="text-muted-foreground text-lg">/4</span></p>
          <p className="text-xs text-muted-foreground mt-1">Actual</p>
        </motion.div>
      </div>

      {/* Progress bar for current cycle */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-foreground">Progreso del ciclo actual</span>
          <span className="text-primary font-bold">{progressInCycle}/4</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`flex-1 h-4 rounded-full transition-all duration-500 origin-left ${
                i < progressInCycle 
                  ? 'gradient-primary glow-primary' 
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {progressInCycle === 4 
            ? '🎉 ¡Ciclo completado!' 
            : `${4 - progressInCycle} entreno${4 - progressInCycle > 1 ? 's' : ''} para completar`
          }
        </p>
      </motion.div>

      {/* Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Evolución últimos 30 días
        </h3>
        
        {chartData.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3} 
                  vertical={false}
                />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  interval={6}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Reference lines for cycles */}
                {[4, 8, 12, 16, 20].map(cycle => (
                  <ReferenceLine
                    key={cycle}
                    y={cycle}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="5 5"
                    strokeOpacity={0.2}
                    label={{ 
                      value: `${cycle / 4}c`, 
                      position: 'right',
                      style: { fontSize: 9, fill: 'hsl(var(--muted-foreground))' }
                    }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ 
                    fill: 'hsl(var(--primary))', 
                    strokeWidth: 3, 
                    stroke: 'white', 
                    r: 7,
                    className: 'drop-shadow-lg'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center">
            <div className="text-center">
              <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Completa tu primer entreno para ver el progreso
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
