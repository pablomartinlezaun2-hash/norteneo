import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, TrendingUp, TrendingDown, Minus, ChevronRight, Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyExercisesSectionProps {
  setLogs: any[];
  exercises: any[];
}

type SortOption = 'volume' | 'progress' | 'frequency';

export const KeyExercisesSection = ({ setLogs, exercises }: KeyExercisesSectionProps) => {
  const [sortBy, setSortBy] = useState<SortOption>('volume');

  const exerciseStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const stats = exercises.map(exercise => {
      const exerciseLogs = setLogs.filter(log => log.exercise_id === exercise.id);
      
      const currentPeriodLogs = exerciseLogs.filter(log => 
        new Date(log.logged_at) >= thirtyDaysAgo
      );
      
      const previousPeriodLogs = exerciseLogs.filter(log => {
        const date = new Date(log.logged_at);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      });

      const currentVolume = currentPeriodLogs.reduce((acc, log) => 
        acc + (log.weight || 0) * (log.reps || 0), 0
      );

      const previousVolume = previousPeriodLogs.reduce((acc, log) => 
        acc + (log.weight || 0) * (log.reps || 0), 0
      );

      const currentMaxWeight = Math.max(...currentPeriodLogs.map(log => log.weight || 0), 0);
      const previousMaxWeight = Math.max(...previousPeriodLogs.map(log => log.weight || 0), 0);

      const currentSets = currentPeriodLogs.length;
      const previousSets = previousPeriodLogs.length;

      const weightProgress = previousMaxWeight > 0 
        ? ((currentMaxWeight - previousMaxWeight) / previousMaxWeight) * 100 
        : currentMaxWeight > 0 ? 100 : 0;

      return {
        id: exercise.id,
        name: exercise.name,
        sessionName: exercise.sessionName,
        currentVolume,
        previousVolume,
        currentMaxWeight,
        previousMaxWeight,
        currentSets,
        previousSets,
        weightProgress,
        totalSets: exerciseLogs.length,
      };
    });

    // Sort based on selected option
    return stats
      .filter(s => s.currentSets > 0 || s.previousSets > 0)
      .sort((a, b) => {
        switch (sortBy) {
          case 'volume':
            return b.currentVolume - a.currentVolume;
          case 'progress':
            return b.weightProgress - a.weightProgress;
          case 'frequency':
            return b.currentSets - a.currentSets;
        }
      })
      .slice(0, 10);
  }, [setLogs, exercises, sortBy]);

  const getProgressIcon = (progress: number) => {
    if (progress > 5) return <TrendingUp className="w-4 h-4 text-success" />;
    if (progress < -5) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getProgressColor = (progress: number) => {
    if (progress > 5) return 'text-success';
    if (progress < -5) return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Sort Options */}
      <div className="gradient-card rounded-2xl p-4 border border-border apple-shadow">
        <h3 className="text-sm font-semibold text-foreground mb-3">Ordenar por</h3>
        <div className="flex gap-2">
          {[
            { id: 'volume' as SortOption, label: 'Volumen', icon: TrendingUp },
            { id: 'progress' as SortOption, label: 'Progreso', icon: Award },
            { id: 'frequency' as SortOption, label: 'Frecuencia', icon: Target },
          ].map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                  sortBy === option.id
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise List */}
      <div className="gradient-card rounded-2xl p-4 border border-border apple-shadow">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Ejercicios Clave (Últimos 30 días)
        </h3>

        {exerciseStats.length === 0 ? (
          <div className="text-center py-8">
            <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aún no hay datos de ejercicios
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {exerciseStats.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {exercise.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {exercise.sessionName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getProgressIcon(exercise.weightProgress)}
                    <span className={cn("text-xs font-medium", getProgressColor(exercise.weightProgress))}>
                      {exercise.weightProgress > 0 ? '+' : ''}
                      {exercise.weightProgress.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">
                      {exercise.currentMaxWeight} kg
                    </p>
                    <p className="text-[10px] text-muted-foreground">Peso máx.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">
                      {exercise.currentVolume >= 1000 
                        ? `${(exercise.currentVolume / 1000).toFixed(1)}k` 
                        : exercise.currentVolume}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Volumen (kg)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">{exercise.currentSets}</p>
                    <p className="text-[10px] text-muted-foreground">Series</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
