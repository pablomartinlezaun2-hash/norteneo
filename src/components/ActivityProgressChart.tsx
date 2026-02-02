import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { format, startOfMonth, eachDayOfInterval, subDays, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Award, Target, Calendar, Waves, Footprints } from 'lucide-react';

interface ActivityCompletion {
  id: string;
  activity_name: string;
  completed_at: string;
}

interface ActivityProgressChartProps {
  completions: ActivityCompletion[];
  activityType: 'swimming' | 'running';
  workoutNames: string[];
}

export const ActivityProgressChart = ({ 
  completions, 
  activityType,
  workoutNames 
}: ActivityProgressChartProps) => {
  const isSwimming = activityType === 'swimming';
  const Icon = isSwimming ? Waves : Footprints;
  const accentColor = isSwimming ? 'hsl(199, 89%, 48%)' : 'hsl(142, 71%, 45%)';
  const gradientId = `${activityType}Gradient`;

  // Calculate stats
  const totalSessions = completions.length;
  const thisWeekSessions = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return completions.filter(c => new Date(c.completed_at) >= weekStart).length;
  }, [completions]);

  const currentStreak = useMemo(() => {
    if (completions.length === 0) return 0;
    
    const sortedCompletions = [...completions].sort(
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
  }, [completions]);

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weeks = eachWeekOfInterval({
      start: subDays(today, 56), // 8 weeks
      end: today
    }, { weekStartsOn: 1 });

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const count = completions.filter(c => {
        const date = new Date(c.completed_at);
        return date >= weekStart && date <= weekEnd;
      }).length;

      return {
        week: weekStart,
        count,
        label: format(weekStart, 'dd MMM', { locale: es })
      };
    });
  }, [completions]);

  // Workout type distribution
  const workoutDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    workoutNames.forEach(name => {
      distribution[name] = completions.filter(c => c.activity_name === name).length;
    });
    return Object.entries(distribution).map(([name, count]) => ({ name, count }));
  }, [completions, workoutNames]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10">
          <p className="text-primary-foreground font-bold text-sm mb-2">
            Semana del {data.label}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
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
          <div 
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <TrendingUp className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalSessions}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gradient-card rounded-2xl p-4 border border-border text-center apple-shadow"
        >
          <div 
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Calendar className="w-6 h-6" style={{ color: accentColor }} />
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
          <div 
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Award className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <p className="text-3xl font-bold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground mt-1">Racha</p>
        </motion.div>
      </div>

      {/* Weekly Progress Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
          Progreso semanal
        </h3>
        
        {weeklyData.some(d => d.count > 0) ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={1} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0.6} />
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
                  fill={`url(#${gradientId})`}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <Icon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Completa tu primera sesión para ver el progreso
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Workout Distribution */}
      {workoutDistribution.some(d => d.count > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Distribución por tipo
          </h3>
          <div className="space-y-3">
            {workoutDistribution.map((item, index) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.count} sesiones</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: totalSessions > 0 
                        ? `${(item.count / totalSessions) * 100}%` 
                        : '0%' 
                    }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
