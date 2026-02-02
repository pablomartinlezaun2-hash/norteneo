import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Award, Target, Calendar, Dumbbell, Flame } from 'lucide-react';
import { CompletedSession } from '@/types/database';

interface GymStatsSectionProps {
  completedSessions: CompletedSession[];
  totalCompleted: number;
  cyclesCompleted: number;
  progressInCycle: number;
}

export const GymStatsSection = ({ 
  completedSessions,
  totalCompleted,
  cyclesCompleted,
  progressInCycle
}: GymStatsSectionProps) => {
  // Calculate stats
  const thisWeekSessions = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return completedSessions.filter(c => new Date(c.completed_at) >= weekStart).length;
  }, [completedSessions]);

  const currentStreak = useMemo(() => {
    if (completedSessions.length === 0) return 0;
    
    const sortedCompletions = [...completedSessions].sort(
      (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const completion of sortedCompletions) {
      const completionDate = new Date(completion.completed_at);
      completionDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = completionDate;
      } else {
        break;
      }
    }
    
    return streak;
  }, [completedSessions]);

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weeks = eachWeekOfInterval({
      start: subDays(today, 56), // 8 weeks
      end: today
    }, { weekStartsOn: 1 });

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const count = completedSessions.filter(c => {
        const date = new Date(c.completed_at);
        return date >= weekStart && date <= weekEnd;
      }).length;

      return {
        week: weekStart,
        count,
        label: format(weekStart, 'dd MMM', { locale: es })
      };
    });
  }, [completedSessions]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10">
          <p className="text-primary-foreground font-bold text-sm mb-2">
            Semana del {data.label}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-primary-foreground font-semibold">{data.count}</span>
            <span className="text-primary-foreground/60 text-xs">sesiones</span>
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
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gradient-card rounded-2xl p-4 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{thisWeekSessions}</p>
          <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gradient-card rounded-2xl p-4 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
            <Flame className="w-6 h-6 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground mt-1">Racha</p>
        </motion.div>
      </div>

      {/* Cycle Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Ciclo actual</span>
          </div>
          <span className="text-primary font-bold">{progressInCycle}/4</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className={`flex-1 h-4 rounded-full transition-all duration-500 origin-left ${
                i < progressInCycle 
                  ? 'gradient-primary glow-primary' 
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-muted-foreground">
            {progressInCycle === 4 
              ? '🎉 ¡Ciclo completado!' 
              : `${4 - progressInCycle} sesión${4 - progressInCycle > 1 ? 'es' : ''} más`
            }
          </p>
          <p className="text-xs font-medium text-primary">
            {cyclesCompleted} ciclos completos
          </p>
        </div>
      </motion.div>

      {/* Weekly Progress Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-primary" />
          Progreso semanal
        </h3>
        
        {weeklyData.some(d => d.count > 0) ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="gymGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3} 
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
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
                  dataKey="count"
                  fill="url(#gymGradient)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Completa tu primera sesión para ver el progreso
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
