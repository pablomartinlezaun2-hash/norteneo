import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MuscleRadarChartProps {
  setLogs: any[];
  exercises: any[];
}

type TimeRange = '7d' | '30d' | '90d' | '365d';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: '365d', label: 'Último año' },
];

const MUSCLE_GROUPS = [
  { key: 'back', label: 'Espalda', keywords: ['dorsal', 'espalda', 'remo', 'pulldown', 'dominada', 'trapecio'] },
  { key: 'chest', label: 'Pecho', keywords: ['pecho', 'press', 'aperturas', 'bench', 'fly'] },
  { key: 'core', label: 'Core', keywords: ['abdominal', 'core', 'plank', 'crunch', 'oblicuo'] },
  { key: 'shoulders', label: 'Hombros', keywords: ['hombro', 'deltoides', 'lateral', 'frontal', 'militar'] },
  { key: 'arms', label: 'Brazos', keywords: ['biceps', 'triceps', 'curl', 'extensión', 'brazo', 'antebrazo'] },
  { key: 'legs', label: 'Piernas', keywords: ['pierna', 'cuadriceps', 'isquio', 'glúteo', 'sentadilla', 'squat', 'leg', 'gemelo', 'pantorrilla'] },
];

export const MuscleRadarChart = ({ setLogs, exercises }: MuscleRadarChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [isOpen, setIsOpen] = useState(false);

  const getDaysFromRange = (range: TimeRange): number => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '365d': return 365;
    }
  };

  const { currentData, previousData, stats } = useMemo(() => {
    const now = new Date();
    const days = getDaysFromRange(timeRange);
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

    const exerciseMap = new Map(exercises.map(e => [e.id, e.name?.toLowerCase() || '']));

    const countByMuscle = (logs: any[], startDate: Date, endDate: Date) => {
      const counts: Record<string, number> = {};
      MUSCLE_GROUPS.forEach(g => counts[g.key] = 0);

      logs.forEach(log => {
        const logDate = new Date(log.logged_at);
        if (logDate >= startDate && logDate <= endDate) {
          const exerciseName = exerciseMap.get(log.exercise_id) || '';
          MUSCLE_GROUPS.forEach(group => {
            if (group.keywords.some(kw => exerciseName.includes(kw))) {
              counts[group.key] += 1;
            }
          });
        }
      });

      return counts;
    };

    const currentCounts = countByMuscle(setLogs, currentStart, now);
    const previousCounts = countByMuscle(setLogs, previousStart, currentStart);

    const currentLogs = setLogs.filter(log => new Date(log.logged_at) >= currentStart);
    const totalSets = currentLogs.length;
    const totalVolume = currentLogs.reduce((acc, log) => acc + (log.weight || 0) * (log.reps || 0), 0);
    const workoutDays = new Set(currentLogs.map(log => new Date(log.logged_at).toDateString())).size;

    const maxValue = Math.max(...Object.values(currentCounts), ...Object.values(previousCounts), 1);

    return {
      currentData: MUSCLE_GROUPS.map(g => ({
        muscle: g.label,
        current: Math.round((currentCounts[g.key] / maxValue) * 100),
        previous: Math.round((previousCounts[g.key] / maxValue) * 100),
        rawCurrent: currentCounts[g.key],
        rawPrevious: previousCounts[g.key],
      })),
      previousData: previousCounts,
      stats: {
        workouts: workoutDays,
        duration: Math.round(workoutDays * 45), // Estimated minutes
        volume: Math.round(totalVolume),
        sets: totalSets,
      }
    };
  }, [setLogs, exercises, timeRange]);

  const selectedLabel = TIME_RANGES.find(r => r.value === timeRange)?.label || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
    >
      {/* Header with selector */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Mapa Muscular</h3>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              {selectedLabel}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="end">
            {TIME_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => {
                  setTimeRange(range.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                  timeRange === range.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {range.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Radar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={currentData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="muscle" 
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Periodo anterior"
              dataKey="previous"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="Periodo actual"
              dataKey="current"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Periodo actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">Periodo anterior</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-muted/50 rounded-xl p-3 text-center"
        >
          <p className="text-lg font-bold text-foreground">{stats.workouts}</p>
          <p className="text-[10px] text-muted-foreground">Entrenos</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-muted/50 rounded-xl p-3 text-center"
        >
          <p className="text-lg font-bold text-foreground">{stats.duration}</p>
          <p className="text-[10px] text-muted-foreground">Minutos</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-muted/50 rounded-xl p-3 text-center"
        >
          <p className="text-lg font-bold text-foreground">{stats.volume >= 1000 ? `${(stats.volume / 1000).toFixed(1)}k` : stats.volume}</p>
          <p className="text-[10px] text-muted-foreground">kg Vol.</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-muted/50 rounded-xl p-3 text-center"
        >
          <p className="text-lg font-bold text-foreground">{stats.sets}</p>
          <p className="text-[10px] text-muted-foreground">Series</p>
        </motion.div>
      </div>
    </motion.div>
  );
};
