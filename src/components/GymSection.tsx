import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, ChevronRight, Loader2, CheckCircle2, 
  BarChart3, Play, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompletedSessions } from '@/hooks/useCompletedSessions';
import { toast } from 'sonner';
import { ExerciseCardNew } from './ExerciseCardNew';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GymStatsSection } from './GymStatsSection';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActiveProgram {
  id: string;
  name: string;
  description: string | null;
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

export const GymSection = () => {
  const { user } = useAuth();
  const { 
    markSessionComplete, 
    completedSessions, 
    getTotalCompleted, 
    getCyclesCompleted, 
    getProgressInCurrentCycle 
  } = useCompletedSessions();
  
  const [activePrograms, setActivePrograms] = useState<ActiveProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [sessionCompleteCheck, setSessionCompleteCheck] = useState<{[key: string]: boolean}>({});
  const [completing, setCompleting] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (user) {
      fetchActivePrograms();
    }
  }, [user]);

  const fetchActivePrograms = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Solo rutinas de gimnasio activas (sin natación/running en descripción)
      const { data: programs, error } = await supabase
        .from('training_programs')
        .select('id, name, description')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrar solo gimnasio
      const gymPrograms = (programs || []).filter(p => {
        const desc = (p.description || '').toLowerCase();
        return !desc.includes('natación') && !desc.includes('swimming') && 
               !desc.includes('piscina') && !desc.includes('running') && 
               !desc.includes('carrera') && !desc.includes('correr');
      });

      const programsWithDetails: ActiveProgram[] = [];
      
      for (const program of gymPrograms) {
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

      setActivePrograms(programsWithDetails);
    } catch (error) {
      console.error('Error fetching active programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSessionCompletedToday = (sessionId: string) => {
    const today = new Date().toDateString();
    return completedSessions.some(s => 
      s.session_id === sessionId && 
      new Date(s.completed_at).toDateString() === today
    );
  };

  const getLastCompletedDate = (sessionId: string) => {
    const session = completedSessions
      .filter(s => s.session_id === sessionId)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
    return session ? new Date(session.completed_at) : null;
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
          <span className="text-sm font-medium text-primary">Gimnasio</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Mis Rutinas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Entrena, registra series y sigue tu progreso
        </p>
      </div>

      {/* Stats Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <Button
          variant={showStats ? "default" : "outline"}
          onClick={() => setShowStats(!showStats)}
          className={cn(
            "gap-2 rounded-full",
            showStats && "gradient-primary text-primary-foreground"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          {showStats ? 'Ocultar estadísticas' : 'Ver estadísticas'}
        </Button>
      </motion.div>

      {/* Stats Section */}
      <AnimatePresence>
        {showStats && (
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

      {/* Active Programs */}
      {activePrograms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border"
        >
          <Dumbbell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No tienes rutinas activas</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Ve a "Entrenamientos" para activar una rutina
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {activePrograms.map((program, programIndex) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: programIndex * 0.1 }}
              className="space-y-3"
            >
              {/* Program Header */}
              <div className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{program.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {program.sessions.length} sesiones
                  </p>
                </div>
              </div>

              {/* Sessions */}
              <div className="space-y-3">
                {program.sessions.map((session, sessionIndex) => {
                  const isActive = activeSession === session.id;
                  const isCompletedToday = isSessionCompletedToday(session.id);
                  const isChecked = sessionCompleteCheck[session.id] || false;
                  const isCompletingThis = completing === session.id;
                  const lastCompleted = getLastCompletedDate(session.id);

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (programIndex * 0.1) + (sessionIndex * 0.05) }}
                      className={cn(
                        "rounded-2xl overflow-hidden transition-all duration-300 apple-shadow",
                        isActive 
                          ? "bg-card border-2 border-primary/30" 
                          : "bg-card border border-border"
                      )}
                    >
                      {/* Session Header */}
                      <button
                        onClick={() => setActiveSession(isActive ? null : session.id)}
                        className="w-full p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base",
                            isCompletedToday 
                              ? "bg-green-500/20 text-green-500" 
                              : "gradient-primary text-primary-foreground"
                          )}>
                            {isCompletedToday ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              session.short_name.slice(0, 2)
                            )}
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-foreground">{session.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{session.exercises.length} ejercicios</span>
                              {lastCompleted && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(lastCompleted, "dd MMM", { locale: es })}
                                  </span>
                                </>
                              )}
                            </div>
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
                              {!isCompletedToday && (
                                <div className="gradient-card rounded-xl p-4 border border-border mt-4">
                                  <div className="flex items-center gap-3 mb-4">
                                    <Checkbox 
                                      id={`gym-session-complete-${session.id}`}
                                      checked={isChecked}
                                      onCheckedChange={(checked) => 
                                        setSessionCompleteCheck(prev => ({ 
                                          ...prev, 
                                          [session.id]: checked === true 
                                        }))
                                      }
                                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <label 
                                      htmlFor={`gym-session-complete-${session.id}`}
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

                              {isCompletedToday && (
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
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
