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
        <div className="bg-foreground/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-primary-foreground font-semibold text-sm">
            {format(new Date(data.date), 'dd MMM yyyy', { locale: es })}
          </p>
          <div className="mt-1 space-y-0.5">
            <p className="text-primary-foreground/90 text-sm">
              <span className="font-medium">{data.weight} kg</span> × {data.reps} reps
            </p>
            {data.rir !== null && (
              <p className="text-primary-foreground/70 text-xs">
                RIR {data.rir}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'kg',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
            activeDot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'white', r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
