import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Target, Dumbbell, Calendar, TrendingUp, Award } from 'lucide-react';
import { useTrainingProgram } from '@/hooks/useTrainingProgram';
import { useCompletedSessions } from '@/hooks/useCompletedSessions';
import { useAllSetLogs } from '@/hooks/useAllSetLogs';
import { MuscleRadarChart } from './MuscleRadarChart';
import { MuscleLoadChart } from './MuscleLoadChart';
import { MonthlyResumeChart } from './MonthlyResumeChart';
import { KeyExercisesSection } from './KeyExercisesSection';
import { cn } from '@/lib/utils';

type PerformanceTab = 'radar' | 'load' | 'exercises' | 'monthly';

interface TabConfig {
  id: PerformanceTab;
  label: string;
  icon: typeof Activity;
}

const TABS: TabConfig[] = [
  { id: 'radar', label: 'Mapa Muscular', icon: Target },
  { id: 'load', label: 'Carga', icon: Dumbbell },
  { id: 'exercises', label: 'Ejercicios', icon: Activity },
  { id: 'monthly', label: 'Mensual', icon: Calendar },
];

export const PerformanceSection = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTab>('radar');
  const { program } = useTrainingProgram();
  const { completedSessions, getTotalCompleted, getCyclesCompleted } = useCompletedSessions();
  const { logs: allSetLogs } = useAllSetLogs();

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

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentLogs = allSetLogs.filter(log => 
      new Date(log.logged_at) >= thirtyDaysAgo
    );

    const totalVolume = recentLogs.reduce((acc, log) => 
      acc + (log.weight || 0) * (log.reps || 0), 0
    );

    const workoutDays = new Set(
      recentLogs.map(log => new Date(log.logged_at).toDateString())
    ).size;

    return {
      totalWorkouts: getTotalCompleted(),
      cycles: getCyclesCompleted(),
      volume: totalVolume,
      workoutDays,
      totalSets: recentLogs.length,
    };
  }, [allSetLogs, getTotalCompleted, getCyclesCompleted]);

  const renderContent = () => {
    switch (activeTab) {
      case 'radar':
        return <MuscleRadarChart setLogs={allSetLogs} exercises={allExercises} />;
      case 'load':
        return <MuscleLoadChart setLogs={allSetLogs} exercises={allExercises} />;
      case 'exercises':
        return <KeyExercisesSection setLogs={allSetLogs} exercises={allExercises} />;
      case 'monthly':
        return <MonthlyResumeChart setLogs={allSetLogs} completedSessions={completedSessions} />;
      default:
        return null;
    }
  };

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
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Rendimiento</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Análisis de Rendimiento</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Estadísticas detalladas de tu entrenamiento
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gradient-card rounded-2xl p-3 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 mb-2">
            <Dumbbell className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground">{stats.totalWorkouts}</p>
          <p className="text-[10px] text-muted-foreground">Entrenos</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="gradient-card rounded-2xl p-3 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 mb-2">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground">{stats.cycles}</p>
          <p className="text-[10px] text-muted-foreground">Ciclos</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gradient-card rounded-2xl p-3 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground">
            {stats.volume >= 1000 ? `${(stats.volume / 1000).toFixed(0)}k` : stats.volume}
          </p>
          <p className="text-[10px] text-muted-foreground">kg Vol.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="gradient-card rounded-2xl p-3 border border-border text-center apple-shadow"
        >
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 mb-2">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground">{stats.totalSets}</p>
          <p className="text-[10px] text-muted-foreground">Series</p>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {TABS.map((tab) => {
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

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </motion.div>
  );
};
