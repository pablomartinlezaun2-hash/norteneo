import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Waves, Footprints, ChevronDown, ChevronRight,
  Loader2, Check, FolderOpen, CheckCircle2, Play, Clock, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompletedSessions } from '@/hooks/useCompletedSessions';
import { toast } from 'sonner';
import { ExerciseCardNew } from './ExerciseCardNew';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GymStatsSection } from './GymStatsSection';

interface SavedProgram {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  sessions: {
    id: string;
    name: string;
    short_name: string;
    exercises: {
      id: string;
      name: string;
      series: number;
      reps: string;
      rest: string | null;
      technique: string | null;
      execution: string | null;
      video_url: string | null;
      order_index: number;
    }[];
  }[];
}

type WorkoutCategory = 'gym' | 'swimming' | 'running';

export const UnifiedWorkoutsSection = () => {
  const { user } = useAuth();
  const { markSessionComplete, completedSessions, getTotalCompleted, getCyclesCompleted, getProgressInCurrentCycle } = useCompletedSessions();
  const [allWorkouts, setAllWorkouts] = useState<SavedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedActive, setExpandedActive] = useState<WorkoutCategory | null>('gym');
  const [expandedSaved, setExpandedSaved] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [sessionCompleteCheck, setSessionCompleteCheck] = useState<{[key: string]: boolean}>({});
  const [completing, setCompleting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showGymStats, setShowGymStats] = useState(false);

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
          .select('id, name, short_name')
          .eq('program_id', program.id)
          .order('order_index');

        const sessionsWithExercises = [];
        for (const session of sessions || []) {
          const { data: exercises } = await supabase
            .from('exercises')
            .select('id, name, series, reps, rest, technique, execution, video_url, order_index')
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

  const isSessionCompleted = (sessionId: string) => {
    const today = new Date().toDateString();
    return completedSessions.some(s => 
      s.session_id === sessionId && 
      new Date(s.completed_at).toDateString() === today
    );
  };

  const handleCompleteSession = async (sessionId: string) => {
    if (!sessionCompleteCheck[sessionId]) return;
    
    setCompleting(sessionId);
    const result = await markSessionComplete(sessionId);
    
    if (!result.error) {
      toast.success('¡Entreno registrado! 💪', {
        description: 'Tu progreso se ha actualizado'
      });
      setSessionCompleteCheck(prev => ({ ...prev, [sessionId]: false }));
    } else {
      toast.error('Error al registrar el entreno');
    }
    setCompleting(null);
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

  // Render session card with exercises
  const SessionCard = ({ session, workout }: { session: SavedProgram['sessions'][0]; workout: SavedProgram }) => {
    const isActive = activeSession === session.id;
    const isCompleted = isSessionCompleted(session.id);
    const isChecked = sessionCompleteCheck[session.id] || false;
    const isCompletingThis = completing === session.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl overflow-hidden transition-all duration-300",
          isActive ? "bg-card border-2 border-primary/30 apple-shadow" : "bg-muted/30 border border-border"
        )}
      >
        {/* Session Header */}
        <button
          onClick={() => setActiveSession(isActive ? null : session.id)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
              isCompleted 
                ? "bg-green-500/20 text-green-500" 
                : "gradient-primary text-primary-foreground"
            )}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : session.short_name.slice(0, 2)}
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-foreground text-sm">{session.name}</h4>
              <p className="text-xs text-muted-foreground">
                {session.exercises.length} ejercicios
                {isCompleted && ' • Completado hoy'}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isActive ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Session Content */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Exercise List */}
                <div className="space-y-3">
                  {session.exercises.map((exercise, index) => (
                    <ExerciseCardNew 
                      key={exercise.id} 
                      exercise={{
                        ...exercise,
                        session_id: session.id,
                        approach_sets: null,
                        created_at: new Date().toISOString()
                      }} 
                      index={index} 
                    />
                  ))}
                </div>

                {/* Complete Session Section */}
                {!isCompleted && (
                  <div className="gradient-card rounded-xl p-4 border border-border mt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Checkbox 
                        id={`session-complete-${session.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          setSessionCompleteCheck(prev => ({ ...prev, [session.id]: checked === true }))
                        }
                        className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label 
                        htmlFor={`session-complete-${session.id}`}
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        He completado la sesión completa
                      </label>
                    </div>
                    
                    <Button 
                      onClick={() => handleCompleteSession(session.id)}
                      disabled={!isChecked || isCompletingThis}
                      className="w-full gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isCompletingThis ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Registrar entreno
                    </Button>
                  </div>
                )}

                {isCompleted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center"
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-600">
                      ¡Sesión completada hoy! 💪
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const WorkoutCard = ({ workout, showToggle = true }: { workout: SavedProgram; showToggle?: boolean }) => {
    const isToggling = togglingId === workout.id;
    const isExpanded = expandedWorkout === workout.id;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden apple-shadow"
      >
        <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <button
            onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
            className="flex-1 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground block">
                {workout.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {workout.sessions.length} sesiones
              </span>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="ml-auto"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
          
          {showToggle && (
            <button
              onClick={() => toggleWorkoutStatus(workout)}
              disabled={isToggling}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ml-3",
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
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border"
            >
              <div className="p-4 space-y-3">
                {workout.sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin sesiones</p>
                ) : (
                  workout.sessions.map((session) => (
                    <SessionCard key={session.id} session={session} workout={workout} />
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
          <Dumbbell className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Entrenamientos</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Mis Entrenamientos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona tus rutinas activas y guardadas
        </p>
      </div>

      {/* Stats Toggle Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <Button
          variant={showGymStats ? "default" : "outline"}
          onClick={() => setShowGymStats(!showGymStats)}
          className={cn(
            "gap-2 rounded-full",
            showGymStats && "gradient-primary text-primary-foreground"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          {showGymStats ? 'Ocultar estadísticas' : 'Ver estadísticas'}
        </Button>
      </motion.div>

      {/* Gym Stats Section */}
      <AnimatePresence>
        {showGymStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GymStatsSection
              completedSessions={completedSessions}
              totalCompleted={getTotalCompleted()}
              cyclesCompleted={getCyclesCompleted()}
              progressInCycle={getProgressInCurrentCycle()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Workouts by Category */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground px-1 flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          Entrenos Activos
        </h3>
        
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
                  "w-full p-4 rounded-xl flex items-center justify-between transition-all duration-300",
                  isExpanded 
                    ? `bg-gradient-to-r ${category.gradient} text-white apple-shadow` 
                    : "bg-card border border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl",
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
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className={cn(
                    "w-5 h-5",
                    isExpanded ? "text-white" : "text-muted-foreground"
                  )} />
                </motion.div>
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
                    <div className="pt-4 space-y-3">
                      {workouts.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border"
                        >
                          <Icon className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No tienes rutinas de {category.label.toLowerCase()} activas
                          </p>
                        </motion.div>
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
      <div className="pt-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setExpandedSaved(!expandedSaved)}
            className={cn(
              "w-full p-4 rounded-xl flex items-center justify-between transition-all duration-300",
              expandedSaved 
                ? "bg-muted/50 border border-border" 
                : "bg-card border border-border hover:border-muted-foreground/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted">
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-foreground">Entrenamientos Guardados</h4>
                <p className="text-xs text-muted-foreground">
                  {getSavedWorkouts().length} {getSavedWorkouts().length === 1 ? 'rutina guardada' : 'rutinas guardadas'}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: expandedSaved ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
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
                <div className="pt-4 space-y-3">
                  {getSavedWorkouts().length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border"
                    >
                      <FolderOpen className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No tienes entrenamientos guardados
                      </p>
                    </motion.div>
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
