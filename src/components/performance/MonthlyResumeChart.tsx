import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, TrendingUp, Dumbbell, Target } from 'lucide-react';

interface MonthlyResumeChartProps {
  setLogs: any[];
  completedSessions: any[];
}

export const MonthlyResumeChart = ({ setLogs, completedSessions }: MonthlyResumeChartProps) => {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(now), 5),
      end: now,
    });

    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      
      const monthLogs = setLogs.filter(log => {
        const date = new Date(log.logged_at);
        return date >= monthStart && date <= monthEnd;
      });

      const monthSessions = completedSessions.filter(session => {
        const date = new Date(session.completed_at);
        return date >= monthStart && date <= monthEnd;
      });

      const volume = monthLogs.reduce((acc, log) => 
        acc + (log.weight || 0) * (log.reps || 0), 0
      );

      const workoutDays = new Set(
        monthLogs.map(log => new Date(log.logged_at).toDateString())
      ).size;

      return {
        month: format(monthStart, 'MMM', { locale: es }),
        fullMonth: format(monthStart, 'MMMM yyyy', { locale: es }),
        workouts: monthSessions.length,
        sets: monthLogs.length,
        volume: Math.round(volume),
        workoutDays,
      };
    });
  }, [setLogs, completedSessions]);

  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10">
          <p className="text-primary-foreground font-bold text-sm mb-2 capitalize">
            {data.fullMonth}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-primary-foreground font-semibold">{data.workouts}</span>
              <span className="text-primary-foreground/60 text-xs">entrenos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-foreground font-semibold">{data.sets}</span>
              <span className="text-primary-foreground/60 text-xs">series</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-foreground font-semibold">
                {data.volume >= 1000 ? `${(data.volume / 1000).toFixed(1)}k` : data.volume}
              </span>
              <span className="text-primary-foreground/60 text-xs">kg volumen</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Current Month Stats */}
      <div className="gradient-card rounded-2xl p-5 border border-border apple-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Resumen Mensual</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-muted/50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              <span className={`text-xs font-medium ${
                getChange(currentMonth?.workouts || 0, previousMonth?.workouts || 0) >= 0 
                  ? 'text-success' 
                  : 'text-destructive'
              }`}>
                {getChange(currentMonth?.workouts || 0, previousMonth?.workouts || 0) >= 0 ? '+' : ''}
                {getChange(currentMonth?.workouts || 0, previousMonth?.workouts || 0)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{currentMonth?.workouts || 0}</p>
            <p className="text-xs text-muted-foreground">Entrenos este mes</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-muted/50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-primary" />
              <span className={`text-xs font-medium ${
                getChange(currentMonth?.sets || 0, previousMonth?.sets || 0) >= 0 
                  ? 'text-success' 
                  : 'text-destructive'
              }`}>
                {getChange(currentMonth?.sets || 0, previousMonth?.sets || 0) >= 0 ? '+' : ''}
                {getChange(currentMonth?.sets || 0, previousMonth?.sets || 0)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{currentMonth?.sets || 0}</p>
            <p className="text-xs text-muted-foreground">Series totales</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-muted/50 rounded-xl p-4 col-span-2"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className={`text-xs font-medium ${
                getChange(currentMonth?.volume || 0, previousMonth?.volume || 0) >= 0 
                  ? 'text-success' 
                  : 'text-destructive'
              }`}>
                {getChange(currentMonth?.volume || 0, previousMonth?.volume || 0) >= 0 ? '+' : ''}
                {getChange(currentMonth?.volume || 0, previousMonth?.volume || 0)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {(currentMonth?.volume || 0) >= 1000 
                ? `${((currentMonth?.volume || 0) / 1000).toFixed(1)}k` 
                : currentMonth?.volume || 0} kg
            </p>
            <p className="text-xs text-muted-foreground">Volumen total</p>
          </motion.div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="gradient-card rounded-2xl p-5 border border-border apple-shadow">
        <h3 className="text-sm font-semibold text-foreground mb-4">Evolución (últimos 6 meses)</h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3} 
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                dy={8}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="workouts" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Entrenos"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};
