import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompletedSession } from '@/types/database';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, BarChart, Bar } from 'recharts';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Award, Target, Dumbbell, Waves, Footprints, ChevronRight, X, Activity, Calendar, User, PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { useActivityCompletions } from '@/hooks/useActivityCompletions';
import { useAllSetLogs } from '@/hooks/useAllSetLogs';
import { useTrainingProgram } from '@/hooks/useTrainingProgram';
import { MuscleRadarChart } from './performance/MuscleRadarChart';
import { MuscleLoadChart } from './performance/MuscleLoadChart';
import { MonthlyResumeChart } from './performance/MonthlyResumeChart';
import { KeyExercisesSection } from './performance/KeyExercisesSection';
import { Neo2DAnatomyModel, NeoFatigueMap } from './neo';
import { ProgressChart } from './ProgressChart';

interface ActivityCompletion {
  id: string;
  activity_type: string;
  activity_name: string;
  completed_at: string;
}

interface UnifiedProgressChartProps {
  completedSessions: CompletedSession[];
  totalCompleted: number;
  cyclesCompleted: number;
  progressInCycle: number;
  onNavigateToSession?: (sessionId: string) => void;
}

interface UnifiedWorkout {
  id: string;
  type: 'gym' | 'swimming' | 'running';
  name: string;
  completed_at: string;
  session_id?: string;
}

type ProgressTab = 'overview' | 'radar' | 'load' | 'exercises';

export const UnifiedProgressChart = ({ 
  completedSessions,
  totalCompleted, 
  cyclesCompleted, 
  progressInCycle,
  onNavigateToSession
}: UnifiedProgressChartProps) => {
  const { completions: swimmingCompletions } = useActivityCompletions('swimming');
  const { completions: runningCompletions } = useActivityCompletions('running');
  const { logs: allSetLogs } = useAllSetLogs();
  const { program } = useTrainingProgram();
  const [selectedWorkout, setSelectedWorkout] = useState<UnifiedWorkout | null>(null);
  const [activeTab, setActiveTab] = useState<ProgressTab>('overview');
  const [neoOpen, setNeoOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [fatigueOpen, setFatigueOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);

  // Get all exercises from the program
  const allExercises = useMemo(() => {
    if (!program?.sessions) return [];
    return program.sessions.flatMap(session => 
      session.exercises?.map(ex => ({
        id: ex.id,
        name: ex.name,
        sessionName: session.name,
      })) || []
    );
  }, [program]);

  // Combine all workouts into unified list
  const allWorkouts = useMemo((): UnifiedWorkout[] => {
    const gymWorkouts: UnifiedWorkout[] = completedSessions.map(s => ({
      id: s.id,
      type: 'gym' as const,
      name: 'Sesión de gimnasio',
      completed_at: s.completed_at,
      session_id: s.session_id
    }));

    const swimWorkouts: UnifiedWorkout[] = swimmingCompletions.map(c => ({
      id: c.id,
      type: 'swimming' as const,
      name: c.activity_name,
      completed_at: c.completed_at
    }));

    const runWorkouts: UnifiedWorkout[] = runningCompletions.map(c => ({
      id: c.id,
      type: 'running' as const,
      name: c.activity_name,
      completed_at: c.completed_at
    }));

    return [...gymWorkouts, ...swimWorkouts, ...runWorkouts]
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  }, [completedSessions, swimmingCompletions, runningCompletions]);

  // Calculate totals by type
  const stats = useMemo(() => ({
    gym: completedSessions.length,
    swimming: swimmingCompletions.length,
    running: runningCompletions.length,
    total: completedSessions.length + swimmingCompletions.length + runningCompletions.length
  }), [completedSessions, swimmingCompletions, runningCompletions]);

  // Weekly chart data combining all types
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weeks = eachWeekOfInterval({
      start: subDays(today, 56),
      end: today
    }, { weekStartsOn: 1 });

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const gymCount = completedSessions.filter(c => {
        const date = new Date(c.completed_at);
        return date >= weekStart && date <= weekEnd;
      }).length;

      const swimCount = swimmingCompletions.filter(c => {
        const date = new Date(c.completed_at);
        return date >= weekStart && date <= weekEnd;
      }).length;

      const runCount = runningCompletions.filter(c => {
        const date = new Date(c.completed_at);
        return date >= weekStart && date <= weekEnd;
      }).length;

      return {
        week: weekStart,
        gym: gymCount,
        swimming: swimCount,
        running: runCount,
        total: gymCount + swimCount + runCount,
        label: format(weekStart, 'dd MMM', { locale: es })
      };
    });
  }, [completedSessions, swimmingCompletions, runningCompletions]);

  // Chart data for daily view (last 30 days)
  const dailyData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    let cumulative = 0;
    const olderWorkouts = allWorkouts.filter(w => new Date(w.completed_at) < startDate).length;
    cumulative = olderWorkouts;

    return days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayWorkouts = allWorkouts.filter(w => 
        format(new Date(w.completed_at), 'yyyy-MM-dd') === dayKey
      );
      cumulative += dayWorkouts.length;
      
      return {
        date: day,
        formattedDate: format(day, 'dd MMM', { locale: es }),
        workouts: dayWorkouts,
        count: dayWorkouts.length,
        cumulative,
        gym: dayWorkouts.filter(w => w.type === 'gym').length,
        swimming: dayWorkouts.filter(w => w.type === 'swimming').length,
        running: dayWorkouts.filter(w => w.type === 'running').length,
      };
    });
  }, [allWorkouts]);

  const getTypeIcon = (type: 'gym' | 'swimming' | 'running') => {
    switch (type) {
      case 'gym': return Dumbbell;
      case 'swimming': return Waves;
      case 'running': return Footprints;
    }
  };

  const getTypeColor = (type: 'gym' | 'swimming' | 'running') => {
    switch (type) {
      case 'gym': return 'hsl(var(--primary))';
      case 'swimming': return 'hsl(199, 89%, 48%)';
      case 'running': return 'hsl(142, 71%, 45%)';
    }
  };

  const getTypeBgClass = (type: 'gym' | 'swimming' | 'running') => {
    switch (type) {
      case 'gym': return 'bg-primary/20 text-primary';
      case 'swimming': return 'bg-cyan-500/20 text-cyan-500';
      case 'running': return 'bg-green-500/20 text-green-500';
    }
  };

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const payload = data.activePayload[0].payload;
      if (payload.workouts && payload.workouts.length > 0) {
        setSelectedWorkout(payload.workouts[0]);
      }
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10">
          <p className="text-primary-foreground font-bold text-sm mb-2">
            {format(data.date, 'EEEE, dd MMMM', { locale: es })}
          </p>
          <div className="space-y-1.5">
            {data.count > 0 ? (
              <>
                {data.gym > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor('gym') }} />
                    <span className="text-primary-foreground font-semibold">{data.gym}</span>
                    <span className="text-primary-foreground/60 text-xs">gimnasio</span>
                  </div>
                )}
                {data.swimming > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor('swimming') }} />
                    <span className="text-primary-foreground font-semibold">{data.swimming}</span>
                    <span className="text-primary-foreground/60 text-xs">natación</span>
                  </div>
                )}
                {data.running > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor('running') }} />
                    <span className="text-primary-foreground font-semibold">{data.running}</span>
                    <span className="text-primary-foreground/60 text-xs">running</span>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-primary-foreground/60 text-[10px] italic flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    Toca el punto para ver detalles
                  </p>
                </div>
              </>
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

  const WeeklyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10">
          <p className="text-primary-foreground font-bold text-sm mb-2">
            Semana del {data.label}
          </p>
          <div className="space-y-1.5">
            {data.gym > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor('gym') }} />
                <span className="text-primary-foreground font-semibold">{data.gym}</span>
                <span className="text-primary-foreground/60 text-xs">gimnasio</span>
              </div>
            )}
            {data.swimming > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor('swimming') }} />
                <span className="text-primary-foreground font-semibold">{data.swimming}</span>
                <span className="text-primary-foreground/60 text-xs">natación</span>
              </div>
            )}
            {data.running > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor('running') }} />
                <span className="text-primary-foreground font-semibold">{data.running}</span>
                <span className="text-primary-foreground/60 text-xs">running</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
              <span className="text-primary-foreground/50 text-[10px] uppercase tracking-wider">Total</span>
              <span className="text-primary font-bold">{data.total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const PROGRESS_TABS = [
    { id: 'overview' as ProgressTab, label: 'Resumen', icon: TrendingUp },
    { id: 'radar' as ProgressTab, label: 'Mapa', icon: Target },
    { id: 'load' as ProgressTab, label: 'Carga', icon: Dumbbell },
    { id: 'exercises' as ProgressTab, label: 'Ejercicios', icon: Activity },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
        >
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Progreso Global</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Tu Progreso</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Todos tus entrenamientos en un solo lugar
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {PROGRESS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "gradient-primary text-primary-foreground glow-primary"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'radar' && (
        <MuscleRadarChart setLogs={allSetLogs} exercises={allExercises} />
      )}

      {activeTab === 'load' && (
        <MuscleLoadChart setLogs={allSetLogs} exercises={allExercises} />
      )}

      {activeTab === 'exercises' && (
        <KeyExercisesSection setLogs={allSetLogs} exercises={allExercises} />
      )}

      {activeTab === 'overview' && (
        <>
          {/* Neo Collapsible */}
          <CollapsibleSection
            isOpen={neoOpen}
            onToggle={() => setNeoOpen(!neoOpen)}
            icon={User}
            title="Neo"
            subtitle="Modelo anatómico 2D interactivo"
            gradient="from-indigo-600 to-purple-600"
            delay={0.1}
          >
            <div className="p-4">
              <Neo2DAnatomyModel setLogs={allSetLogs} exercises={allExercises} />
            </div>
          </CollapsibleSection>

          {/* Fatigue Map */}
          <CollapsibleSection
            isOpen={fatigueOpen}
            onToggle={() => setFatigueOpen(!fatigueOpen)}
            icon={Activity}
            title="Mapa de Fatiga"
            subtitle="Estado de recuperación muscular"
            gradient="from-red-500 to-orange-500"
            delay={0.12}
          >
            <div className="p-4">
              <NeoFatigueMap setLogs={allSetLogs} exercises={allExercises} />
            </div>
          </CollapsibleSection>

          {/* Volume Distribution */}
          <CollapsibleSection
            isOpen={volumeOpen}
            onToggle={() => setVolumeOpen(!volumeOpen)}
            icon={PieChartIcon}
            title="Volumen"
            subtitle="Distribución de series por músculo"
            gradient="from-pink-500 to-rose-500"
            delay={0.13}
          >
            <div className="p-4">
              <ProgressChart />
            </div>
          </CollapsibleSection>

          {/* Monthly Collapsible */}
          <CollapsibleSection
            isOpen={monthlyOpen}
            onToggle={() => setMonthlyOpen(!monthlyOpen)}
            icon={Calendar}
            title="Mensual"
            subtitle="Resumen de volumen y entrenos por mes"
            gradient="from-emerald-600 to-teal-600"
            delay={0.15}
          >
            <div className="p-4">
              <MonthlyResumeChart setLogs={allSetLogs} completedSessions={completedSessions} />
            </div>
          </CollapsibleSection>

          {/* Stats Cards - All activities */}
      <div className="grid grid-cols-4 gap-2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gradient-card rounded-2xl p-3 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="gradient-card rounded-2xl p-3 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-2">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.gym}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Gimnasio</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gradient-card rounded-2xl p-3 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 mb-2">
            <Waves className="w-5 h-5 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.swimming}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Natación</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="gradient-card rounded-2xl p-3 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/10 mb-2">
            <Footprints className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.running}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Running</p>
        </motion.div>
      </div>

      {/* Gym cycle progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Ciclo de gimnasio</span>
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
              className={cn(
                "flex-1 h-4 rounded-full transition-all duration-500 origin-left",
                i < progressInCycle ? 'gradient-primary glow-primary' : 'bg-muted'
              )}
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

      {/* Weekly Stacked Bar Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Resumen semanal (últimas 8 semanas)
        </h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
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
              <Tooltip content={<WeeklyTooltip />} />
              <Bar dataKey="gym" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="swimming" stackId="a" fill="hsl(199, 89%, 48%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="running" stackId="a" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="text-xs text-muted-foreground">Gimnasio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-cyan-500" />
            <span className="text-xs text-muted-foreground">Natación</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-xs text-muted-foreground">Running</span>
          </div>
        </div>
      </motion.div>

      {/* Daily Line Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Evolución últimos 30 días
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Toca un punto para ver detalles del entreno
        </p>
        
        {dailyData.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }} onClick={handleChartClick}>
                <defs>
                  <linearGradient id="cumulativeGradientUnified" x1="0" y1="0" x2="0" y2="1">
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
                {[4, 8, 12, 16, 20].map(cycle => (
                  <ReferenceLine
                    key={cycle}
                    y={cycle}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="5 5"
                    strokeOpacity={0.2}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.count > 0) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="hsl(var(--primary))"
                          stroke="white"
                          strokeWidth={2}
                          style={{ cursor: 'pointer' }}
                        />
                      );
                    }
                    return <circle cx={cx} cy={cy} r={0} />;
                  }}
                  activeDot={{ 
                    fill: 'hsl(var(--primary))', 
                    strokeWidth: 3, 
                    stroke: 'white', 
                    r: 8,
                    className: 'drop-shadow-lg cursor-pointer'
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

      {/* Recent workouts list */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Últimos entrenos
        </h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allWorkouts.slice(0, 10).map((workout, index) => {
            const Icon = getTypeIcon(workout.type);
            return (
              <motion.button
                key={workout.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => setSelectedWorkout(workout)}
                className="w-full p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    getTypeBgClass(workout.type)
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{workout.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(workout.completed_at), "EEEE, dd MMM · HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            );
          })}

          {allWorkouts.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay entrenos registrados
              </p>
            </div>
          )}
        </div>
      </motion.div>
        </>
      )}

      {/* Selected workout detail modal */}
      <AnimatePresence>
        {selectedWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedWorkout(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full apple-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  getTypeBgClass(selectedWorkout.type)
                )}>
                  {(() => {
                    const Icon = getTypeIcon(selectedWorkout.type);
                    return <Icon className="w-7 h-7" />;
                  })()}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setSelectedWorkout(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1">
                {selectedWorkout.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {format(new Date(selectedWorkout.completed_at), "EEEE, dd MMMM yyyy · HH:mm", { locale: es })}
              </p>

              <div className="p-3 bg-muted/30 rounded-xl mb-4">
                <p className="text-xs text-muted-foreground mb-1">Tipo de entreno</p>
                <p className="text-sm font-medium text-foreground capitalize">
                  {selectedWorkout.type === 'gym' ? 'Gimnasio' : 
                   selectedWorkout.type === 'swimming' ? 'Natación' : 'Running'}
                </p>
              </div>

              {selectedWorkout.type === 'gym' && selectedWorkout.session_id && onNavigateToSession && (
                <Button
                  className="w-full gradient-primary text-primary-foreground font-semibold"
                  onClick={() => {
                    if (selectedWorkout.session_id) {
                      onNavigateToSession(selectedWorkout.session_id);
                    }
                    setSelectedWorkout(null);
                  }}
                >
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Acceder a la sesión de entreno
                </Button>
              )}

              {(selectedWorkout.type !== 'gym' || !selectedWorkout.session_id) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedWorkout(null)}
                >
                  Cerrar
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
