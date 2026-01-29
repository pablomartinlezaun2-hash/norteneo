import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';

interface ProgressChartProps {
  totalCompleted: number;
  cyclesCompleted: number;
  progressInCycle: number;
}

export const ProgressChart = ({ totalCompleted, cyclesCompleted, progressInCycle }: ProgressChartProps) => {
  // Generate data points for the chart
  const generateChartData = () => {
    const data = [];
    for (let i = 0; i <= totalCompleted; i++) {
      data.push({
        entreno: i,
        progreso: i,
        ciclo: Math.floor(i / 4) + 1
      });
    }
    // Add at least one point if no progress
    if (data.length === 0) {
      data.push({ entreno: 0, progreso: 0, ciclo: 1 });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="gradient-card rounded-lg p-4 border border-border text-center">
          <p className="text-3xl font-bold text-gradient">{totalCompleted}</p>
          <p className="text-xs text-muted-foreground mt-1">Entrenos totales</p>
        </div>
        <div className="gradient-card rounded-lg p-4 border border-border text-center">
          <p className="text-3xl font-bold text-gradient">{cyclesCompleted}</p>
          <p className="text-xs text-muted-foreground mt-1">Ciclos completados</p>
        </div>
      </div>

      {/* Cycle Progress */}
      <div className="gradient-card rounded-lg p-4 border border-border">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-foreground font-medium">Progreso del ciclo actual</span>
          <span className="text-sm text-primary font-bold">{progressInCycle}/4</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                i < progressInCycle 
                  ? 'gradient-primary glow-primary' 
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {progressInCycle === 4 ? '¡Ciclo completado!' : `${4 - progressInCycle} entrenos para completar el ciclo`}
        </p>
      </div>

      {/* Chart */}
      <div className="gradient-card rounded-lg p-4 border border-border">
        <h3 className="text-sm font-medium text-foreground mb-4">Evolución de entrenos</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(16 100% 60%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(16 100% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="entreno" 
                tick={{ fill: 'hsl(0 0% 60%)', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(0 0% 20%)' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(0 0% 60%)', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(0 0% 20%)' }}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0 0% 10%)', 
                  border: '1px solid hsl(0 0% 20%)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: 'hsl(0 0% 60%)' }}
                itemStyle={{ color: 'hsl(16 100% 60%)' }}
              />
              <Area 
                type="monotone" 
                dataKey="progreso" 
                stroke="hsl(16 100% 60%)" 
                strokeWidth={3}
                fill="url(#progressGradient)"
                dot={{ fill: 'hsl(16 100% 60%)', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: 'hsl(16 100% 60%)', strokeWidth: 0, r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
