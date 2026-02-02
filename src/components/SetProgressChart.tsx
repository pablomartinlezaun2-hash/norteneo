import { useMemo } from 'react';
import { SetLog } from '@/types/database';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SetProgressChartProps {
  logs: SetLog[];
  setNumber: number;
}

export const SetProgressChart = ({ logs, setNumber }: SetProgressChartProps) => {
  const chartData = useMemo(() => {
    const filteredLogs = logs
      .filter(log => log.set_number === setNumber && !log.is_warmup)
      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

    return filteredLogs.map(log => ({
      date: log.logged_at,
      weight: log.weight,
      reps: log.reps,
      rir: log.rir,
      formattedDate: format(new Date(log.logged_at), 'dd MMM', { locale: es }),
    }));
  }, [logs, setNumber]);

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground text-center px-4">
          Aún no hay registros para esta serie
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10">
          <p className="text-primary-foreground font-bold text-sm mb-2">
            {format(new Date(data.date), 'dd MMMM yyyy', { locale: es })}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-primary text-lg font-bold">{data.weight}</span>
              <span className="text-primary-foreground/60 text-xs">kg</span>
              <span className="text-primary-foreground/40">×</span>
              <span className="text-primary-foreground font-semibold">{data.reps}</span>
              <span className="text-primary-foreground/60 text-xs">reps</span>
            </div>
            {data.rir !== null && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] uppercase tracking-wider text-primary-foreground/50">RIR</span>
                <span className="text-primary-foreground/80 text-sm font-medium">{data.rir}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-52 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
          <defs>
            <linearGradient id={`weightGradient-${setNumber}`} x1="0" y1="0" x2="0" y2="1">
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
            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 5', 'dataMax + 5']}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ 
              fill: 'hsl(var(--primary))', 
              strokeWidth: 3, 
              stroke: 'hsl(var(--background))',
              r: 5 
            }}
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
  );
};
