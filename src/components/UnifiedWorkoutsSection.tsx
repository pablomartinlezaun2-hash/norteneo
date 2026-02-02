import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Waves, Footprints, ChevronDown, 
  Loader2, Check, FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SavedProgram {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  sessions: {
    id: string;
    name: string;
    exercises: {
      id: string;
      name: string;
      series: number;
      reps: string;
      rest: string | null;
      technique: string | null;
    }[];
  }[];
}

type WorkoutCategory = 'gym' | 'swimming' | 'running';

export const UnifiedWorkoutsSection = () => {
  const { user } = useAuth();
  const [allWorkouts, setAllWorkouts] = useState<SavedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedActive, setExpandedActive] = useState<WorkoutCategory | null>('gym');
  const [expandedSaved, setExpandedSaved] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAllWorkouts();
    }
  }, [user]);

  const fetchAllWorkouts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: programs, error } = await supabase
        .from('training_programs')
        .select(`
          id,
          name,
          description,
          is_active,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const programsWithDetails: SavedProgram[] = [];
      
      for (const program of programs || []) {
        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('id, name')
          .eq('program_id', program.id);

        const sessionsWithExercises = [];
        for (const session of sessions || []) {
          const { data: exercises } = await supabase
            .from('exercises')
            .select('id, name, series, reps, rest, technique')
            .eq('session_id', session.id)
            .order('order_index');
          
          sessionsWithExercises.push({
            ...session,
            exercises: exercises || []
          });
        }

        programsWithDetails.push({
          ...program,
          sessions: sessionsWithExercises
        });
      }

      setAllWorkouts(programsWithDetails);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeWorkout = (description: string | null): WorkoutCategory => {
    if (!description) return 'gym';
    const desc = description.toLowerCase();
    if (desc.includes('natación') || desc.includes('swimming') || desc.includes('piscina')) return 'swimming';
    if (desc.includes('running') || desc.includes('carrera') || desc.includes('correr')) return 'running';
    return 'gym';
  };

  const getActiveWorkouts = (category: WorkoutCategory) => {
    return allWorkouts.filter(w => w.is_active && categorizeWorkout(w.description) === category);
  };

  const getSavedWorkouts = () => {
    return allWorkouts.filter(w => !w.is_active);
  };

  const toggleWorkoutStatus = async (workout: SavedProgram) => {
    if (!user) return;
    
    setTogglingId(workout.id);
    
    try {
      const newStatus = !workout.is_active;
      
      const { error } = await supabase
        .from('training_programs')
        .update({ is_active: newStatus })
        .eq('id', workout.id);

      if (error) throw error;
      
      if (newStatus) {
        toast.success('¡Entrenamiento activado! 💪', {
          description: workout.name
        });
      } else {
        toast.error('Entrenamiento desactivado', {
          description: workout.name
        });
      }
      
      await fetchAllWorkouts();
    } catch (error) {
      console.error('Error toggling workout:', error);
      toast.error('Error al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  const categories: { id: WorkoutCategory; label: string; icon: typeof Dumbbell; gradient: string }[] = [
    { id: 'gym', label: 'Gimnasio', icon: Dumbbell, gradient: 'from-primary to-primary/80' },
    { id: 'swimming', label: 'Natación', icon: Waves, gradient: 'from-blue-500 to-cyan-400' },
    { id: 'running', label: 'Running', icon: Footprints, gradient: 'from-green-500 to-emerald-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const WorkoutCard = ({ workout, showToggle = true }: { workout: SavedProgram; showToggle?: boolean }) => {
    const isToggling = togglingId === workout.id;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card border border-border rounded-lg overflow-hidden"
      >
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
          <button
            onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
            className="flex-1 flex items-center gap-2 text-left"
          >
            <span className="text-sm font-medium text-foreground">
              {workout.name}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              expandedWorkout === workout.id && "rotate-180"
            )} />
          </button>
          
          {showToggle && (
            <button
              onClick={() => toggleWorkoutStatus(workout)}
              disabled={isToggling}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                workout.is_active 
                  ? "bg-green-500 hover:bg-red-500" 
                  : "bg-muted hover:bg-green-500",
                isToggling && "opacity-50 cursor-not-allowed"
              )}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Check className={cn(
                  "w-4 h-4 transition-colors",
                  workout.is_active ? "text-white" : "text-muted-foreground"
                )} />
              )}
            </button>
          )}
        </div>

        <AnimatePresence>
          {expandedWorkout === workout.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border"
            >
              <div className="p-3 space-y-2">
                {workout.sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin sesiones</p>
                ) : (
                  workout.sessions.map((session) => (
                    <div key={session.id} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {session.name}
                      </p>
                      <div className="space-y-1">
                        {session.exercises.map((ex, i) => (
                          <div 
                            key={ex.id}
                            className="text-xs text-foreground bg-muted/50 rounded px-2 py-1"
                          >
                            {i + 1}. {ex.name} - {ex.series}x{ex.reps}
                            {ex.rest && ` | ${ex.rest}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
        >
          <Dumbbell className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Entrenamientos</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Mis Entrenamientos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona tus rutinas activas y guardadas
        </p>
      </div>

      {/* Active Workouts by Category */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground px-1">Entrenos Activos</h3>
        
        {categories.map((category, index) => {
          const Icon = category.icon;
          const isExpanded = expandedActive === category.id;
          const workouts = getActiveWorkouts(category.id);

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => setExpandedActive(isExpanded ? null : category.id)}
                className={cn(
                  "w-full p-4 rounded-xl flex items-center justify-between transition-all",
                  isExpanded 
                    ? `bg-gradient-to-r ${category.gradient} text-white` 
                    : "bg-card border border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isExpanded ? "bg-white/20" : "bg-muted"
                  )}>
                    <Icon className={cn("w-5 h-5", isExpanded ? "text-white" : "text-foreground")} />
                  </div>
                  <div className="text-left">
                    <h4 className={cn("font-semibold", isExpanded ? "text-white" : "text-foreground")}>
                      {category.label}
                    </h4>
                    <p className={cn("text-xs", isExpanded ? "text-white/80" : "text-muted-foreground")}>
                      {workouts.length} {workouts.length === 1 ? 'rutina activa' : 'rutinas activas'}
                    </p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 transition-transform",
                  isExpanded && "rotate-180",
                  isExpanded ? "text-white" : "text-muted-foreground"
                )} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 pl-4 space-y-2">
                      {workouts.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          No tienes rutinas de {category.label.toLowerCase()} activas
                        </p>
                      ) : (
                        workouts.map((workout) => (
                          <WorkoutCard key={workout.id} workout={workout} />
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Saved/Inactive Workouts */}
      <div className="pt-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setExpandedSaved(!expandedSaved)}
            className={cn(
              "w-full p-4 rounded-xl flex items-center justify-between transition-all",
              expandedSaved 
                ? "bg-muted border border-border" 
                : "bg-card border border-border hover:border-muted-foreground/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-foreground">Entrenamientos Guardados</h4>
                <p className="text-xs text-muted-foreground">
                  {getSavedWorkouts().length} {getSavedWorkouts().length === 1 ? 'rutina guardada' : 'rutinas guardadas'}
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              expandedSaved && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {expandedSaved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-3 pl-4 space-y-2">
                  {getSavedWorkouts().length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No tienes entrenamientos guardados
                    </p>
                  ) : (
                    getSavedWorkouts().map((workout) => (
                      <WorkoutCard key={workout.id} workout={workout} />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};
