import { useMemo } from 'react';
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
        <div className="bg-foreground/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-primary-foreground font-semibold text-sm">
            {format(data.date, 'dd MMMM yyyy', { locale: es })}
          </p>
          <p className="text-primary-foreground/80 text-sm mt-1">
            {data.sessions > 0 ? `${data.sessions} entreno(s) este día` : 'Sin entrenos'}
          </p>
          <p className="text-primary-foreground/70 text-xs mt-0.5">
            Total acumulado: {data.cumulative}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="gradient-card rounded-xl p-4 border border-border text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
          <p className="text-xs text-muted-foreground">Entrenos totales</p>
        </div>
        
        <div className="gradient-card rounded-xl p-4 border border-border text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{cyclesCompleted}</p>
          <p className="text-xs text-muted-foreground">Ciclos completos</p>
        </div>
        
        <div className="gradient-card rounded-xl p-4 border border-border text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{progressInCycle}/4</p>
          <p className="text-xs text-muted-foreground">Ciclo actual</p>
        </div>
      </div>

      {/* Progress bar for current cycle */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progreso del ciclo</span>
          <span>{progressInCycle} de 4 sesiones</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full gradient-primary rounded-full transition-all duration-500"
            style={{ width: `${(progressInCycle / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="gradient-card rounded-xl p-4 border border-border">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Progreso últimos 30 días
        </h3>
        
        {chartData.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Reference lines for cycles */}
                {[4, 8, 12, 16, 20].map(cycle => (
                  <ReferenceLine
                    key={cycle}
                    y={cycle}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.3}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'white', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
            Completa tu primer entreno para ver el progreso
          </div>
        )}
      </div>
    </div>
  );
};
