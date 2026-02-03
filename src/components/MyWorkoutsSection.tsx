import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Waves, Footprints, ChevronDown, 
  Bookmark, Pencil, Loader2, Play, Trash2, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useProgramImport } from '@/hooks/useProgramImport';
import { ALL_PROGRAMS, ProgramTemplate } from '@/data/programTemplates';

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
type SubCategory = 'saved' | 'designed';

export const MyWorkoutsSection = () => {
  const { user } = useAuth();
  const { importProgram, importing } = useProgramImport();
  const [expandedCategory, setExpandedCategory] = useState<WorkoutCategory | null>(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState<{ category: WorkoutCategory; sub: SubCategory } | null>(null);
  const [designedWorkouts, setDesignedWorkouts] = useState<SavedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [importingKey, setImportingKey] = useState<string | null>(null);

  const predefinedPrograms = Object.entries(ALL_PROGRAMS).map(([key, program]) => ({
    key,
    program,
    totalExercises: program.sessions.reduce((acc, s) => acc + s.exercises.length, 0)
  }));

  const handleImportProgram = async (key: string, program: ProgramTemplate) => {
    setImportingKey(key);
    const result = await importProgram(program);
    setImportingKey(null);
    
    if (!result.error) {
      toast.success(`"${program.name}" cargado correctamente`);
      fetchDesignedWorkouts();
    } else {
      toast.error(result.error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDesignedWorkouts();
    }
  }, [user]);

  const fetchDesignedWorkouts = async () => {
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

      // Fetch sessions and exercises for each program
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

      setDesignedWorkouts(programsWithDetails);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (programId: string) => {
    try {
      const { error } = await supabase
        .from('training_programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;
      
      toast.success('Rutina eliminada');
      fetchDesignedWorkouts();
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Error al eliminar');
    }
  };

  const activateWorkout = async (programId: string) => {
    try {
      // First deactivate all programs
      await supabase
        .from('training_programs')
        .update({ is_active: false })
        .eq('user_id', user?.id);

      // Activate selected program
      const { error } = await supabase
        .from('training_programs')
        .update({ is_active: true })
        .eq('id', programId);

      if (error) throw error;
      
      toast.success('Rutina activada');
      fetchDesignedWorkouts();
    } catch (error) {
      console.error('Error activating workout:', error);
      toast.error('Error al activar');
    }
  };

  const categorizeWorkout = (description: string | null): WorkoutCategory => {
    if (!description) return 'gym';
    const desc = description.toLowerCase();
    if (desc.includes('natación') || desc.includes('swimming')) return 'swimming';
    if (desc.includes('running') || desc.includes('carrera')) return 'running';
    return 'gym';
  };

  const getWorkoutsByCategory = (category: WorkoutCategory) => {
    return designedWorkouts.filter(w => categorizeWorkout(w.description) === category);
  };

  const categories: { id: WorkoutCategory; label: string; icon: typeof Dumbbell; color: string }[] = [
    { id: 'gym', label: 'Gimnasio', icon: Dumbbell, color: 'from-primary to-primary/80' },
    { id: 'swimming', label: 'Natación', icon: Waves, color: 'from-blue-500 to-cyan-400' },
    { id: 'running', label: 'Running', icon: Footprints, color: 'from-green-500 to-emerald-400' },
  ];

  const toggleCategory = (category: WorkoutCategory) => {
    setExpandedCategory(prev => prev === category ? null : category);
    setExpandedSubCategory(null);
  };

  const toggleSubCategory = (category: WorkoutCategory, sub: SubCategory) => {
    setExpandedSubCategory(prev => 
      prev?.category === category && prev?.sub === sub 
        ? null 
        : { category, sub }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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
          <Bookmark className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Mis Entrenamientos</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Entrenamientos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Todos tus entrenamientos guardados y diseñados
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((category, index) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === category.id;
          const workouts = getWorkoutsByCategory(category.id);

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  "w-full p-4 rounded-xl flex items-center justify-between transition-all",
                  isExpanded 
                    ? `bg-gradient-to-r ${category.color} text-white` 
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
                    <h3 className={cn("font-semibold", isExpanded ? "text-white" : "text-foreground")}>
                      {category.label}
                    </h3>
                    <p className={cn("text-xs", isExpanded ? "text-white/80" : "text-muted-foreground")}>
                      {workouts.length} rutinas diseñadas
                    </p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 transition-transform",
                  isExpanded && "rotate-180",
                  isExpanded ? "text-white" : "text-muted-foreground"
                )} />
              </button>

              {/* Category Content */}
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
                      {/* Saved Workouts */}
                      <div>
                        <button
                          onClick={() => toggleSubCategory(category.id, 'saved')}
                          className={cn(
                            "w-full p-3 rounded-lg flex items-center justify-between transition-all",
                            expandedSubCategory?.category === category.id && expandedSubCategory?.sub === 'saved'
                              ? "bg-muted"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Bookmark className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Entrenamientos guardados</span>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            expandedSubCategory?.category === category.id && expandedSubCategory?.sub === 'saved' && "rotate-180"
                          )} />
                        </button>

                        <AnimatePresence>
                          {expandedSubCategory?.category === category.id && expandedSubCategory?.sub === 'saved' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-4 py-2 space-y-2"
                            >
                              {category.id === 'gym' ? (
                                predefinedPrograms.map(({ key, program, totalExercises }) => (
                                  <motion.div
                                    key={key}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-card border border-border rounded-lg p-3"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-foreground truncate">
                                          {program.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {program.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                          {program.sessions.length} sesiones · {totalExercises} ejercicios
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleImportProgram(key, program)}
                                        disabled={importing || importingKey === key}
                                        className="shrink-0 text-xs"
                                      >
                                        {importingKey === key ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <>
                                            <Download className="w-3 h-3 mr-1" />
                                            Cargar
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </motion.div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground italic">
                                  Próximamente: entrenamientos de {category.label.toLowerCase()}
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Designed Workouts */}
                      <div>
                        <button
                          onClick={() => toggleSubCategory(category.id, 'designed')}
                          className={cn(
                            "w-full p-3 rounded-lg flex items-center justify-between transition-all",
                            expandedSubCategory?.category === category.id && expandedSubCategory?.sub === 'designed'
                              ? "bg-muted"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Entrenamientos diseñados</span>
                            <span className="text-xs text-muted-foreground">({workouts.length})</span>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            expandedSubCategory?.category === category.id && expandedSubCategory?.sub === 'designed' && "rotate-180"
                          )} />
                        </button>

                        <AnimatePresence>
                          {expandedSubCategory?.category === category.id && expandedSubCategory?.sub === 'designed' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-4 py-2 space-y-2"
                            >
                              {workouts.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-2">
                                  No has diseñado ninguna rutina de {category.label.toLowerCase()} aún
                                </p>
                              ) : (
                                workouts.map((workout) => (
                                  <motion.div
                                    key={workout.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-card border border-border rounded-lg overflow-hidden"
                                  >
                                    <button
                                      onClick={() => setExpandedWorkout(
                                        expandedWorkout === workout.id ? null : workout.id
                                      )}
                                      className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={cn(
                                          "w-2 h-2 rounded-full",
                                          workout.is_active ? "bg-green-500" : "bg-muted-foreground"
                                        )} />
                                        <span className="text-sm font-medium text-foreground">
                                          {workout.name}
                                        </span>
                                        {workout.is_active && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-600 rounded">
                                            Activa
                                          </span>
                                        )}
                                      </div>
                                      <ChevronDown className={cn(
                                        "w-4 h-4 text-muted-foreground transition-transform",
                                        expandedWorkout === workout.id && "rotate-180"
                                      )} />
                                    </button>

                                    <AnimatePresence>
                                      {expandedWorkout === workout.id && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="border-t border-border"
                                        >
                                          <div className="p-3 space-y-2">
                                            {workout.sessions.map((session) => (
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
                                            ))}

                                            <div className="flex gap-2 pt-2">
                                              {!workout.is_active && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => activateWorkout(workout.id)}
                                                  className="flex-1 text-xs"
                                                >
                                                  <Play className="w-3 h-3 mr-1" />
                                                  Activar
                                                </Button>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => deleteWorkout(workout.id)}
                                                className="text-xs"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                ))
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
