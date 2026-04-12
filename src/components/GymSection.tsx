import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, ChevronRight, Loader2, CheckCircle2, 
  BarChart3, Play, Calendar, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompletedSessions } from '@/hooks/useCompletedSessions';
import { usePeriodization } from '@/hooks/usePeriodization';
import { toast } from 'sonner';
import { ExerciseCardNew } from './ExerciseCardNew';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GymStatsSection } from './GymStatsSection';
import { PeriodizationBadge } from './PeriodizationBadge';
import { DailyCheckIn } from './autoregulation/DailyCheckIn';
import { PreWorkoutCheckIn } from './autoregulation/PreWorkoutCheckIn';
import { RecommendationOverlay } from './autoregulation/RecommendationOverlay';
import { ActivePlanView } from './autoregulation/ActivePlanView';
import { RecommendationHistory } from './autoregulation/RecommendationHistory';
import { useAutoregulation } from '@/hooks/useAutoregulation';
import { useSessionPlan } from '@/hooks/useSessionPlan';
import { Badge } from '@/components/ui/badge';
import type { SessionContext, ExerciseContext } from '@/lib/autoregulation/recommendationEngine';
import { format } from 'date-fns';
import { es, enUS, fr, de, type Locale } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const dateLocales: Record<string, Locale> = { es, en: enUS, fr, de };

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

interface GymSectionProps {
  initialExpandedSession?: string | null;
  onSessionExpanded?: () => void;
}

/** Convert a gym session to the autoregulation SessionContext */
function toSessionContext(session: ActiveProgram['sessions'][0]): SessionContext {
  return {
    session_id: session.id,
    planned_duration_minutes: Math.max(30, session.exercises.length * 12),
    exercises: session.exercises.map(ex => ({
      exercise_id: ex.id,
      exercise_name: ex.name,
      planned_sets: ex.series,
      planned_rir: 0,
      planned_rep_range: ex.reps,
      target_muscle_group: 'general',
      fatigue_cost: 60,
      has_substitute_available: false,
    })),
  };
}

export const GymSection = ({ initialExpandedSession, onSessionExpanded }: GymSectionProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { 
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

  // ── Autoregulation state ──
  const [autoregSessionId, setAutoregSessionId] = useState<string | null>(null);
  const [autoregContext, setAutoregContext] = useState<SessionContext | null>(null);
  const autoreg = useAutoregulation(autoregContext);
  const sessionPlan = useSessionPlan();

  const firstProgramId = activePrograms[0]?.id;
  const periodization = usePeriodization(firstProgramId);
  const dateLoc = dateLocales[i18n.language] || es;

  useEffect(() => {
    if (user) fetchActivePrograms();
  }, [user]);

  useEffect(() => {
    if (initialExpandedSession && !loading) {
      setActiveSession(initialExpandedSession);
      onSessionExpanded?.();
    }
  }, [initialExpandedSession, loading, onSessionExpanded]);

  const fetchActivePrograms = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: programs, error } = await supabase
        .from('training_programs')
        .select('id, name, description')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
          sessionsWithExercises.push({ ...session, exercises: exercises || [] });
        }
        programsWithDetails.push({ ...program, sessions: sessionsWithExercises });
      }
      setActivePrograms(programsWithDetails);
    } catch (error) {
      console.error('Error fetching active programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLastCompletedDate = (sessionId: string) => {
    const session = completedSessions
      .filter(s => s.session_id === sessionId)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
    return session ? new Date(session.completed_at) : null;
  };

  // ── Autoregulation handlers ──
  const handleStartAutoregulation = useCallback((session: ActiveProgram['sessions'][0]) => {
    const ctx = toSessionContext(session);
    setAutoregContext(ctx);
    setAutoregSessionId(session.id);
    sessionPlan.initPlan(ctx);
    autoreg.startFlow();
  }, []);

  const handleAutoregComplete = useCallback(() => {
    if (autoreg.engineOutput) {
      sessionPlan.setRecommendations(
        autoreg.engineOutput.recommendations,
        autoreg.engineOutput.readinessScore,
        'pre_session'
      );
    }
    autoreg.proceedToSession();
  }, [autoreg.engineOutput]);

  const handleSkipAutoreg = useCallback(() => {
    setAutoregSessionId(null);
    setAutoregContext(null);
    autoreg.reset();
  }, []);

  const isInAutoregFlow = autoregSessionId !== null && autoreg.phase !== 'idle' && autoreg.phase !== 'session_active';
  const hasAutoregResults = autoregSessionId !== null && autoreg.phase === 'session_active';

  const handleCompleteSession = async (sessionId: string) => {
    if (!sessionCompleteCheck[sessionId]) return;
    setCompleting(sessionId);

    if (periodization.activeMicrocycle) {
      const result = await periodization.completeSessionWithPeriodization(sessionId);
      if (!result.error) {
        if (result.microcycleCompleted) {
          toast.success('¡Microciclo completado!', { description: 'Se ha avanzado automáticamente al siguiente microciclo.' });
        } else {
          toast.success(t('gym.workoutRegistered'), { description: t('gym.progressUpdated') });
        }
        setSessionCompleteCheck(prev => ({ ...prev, [sessionId]: false }));
        // Save autoreg summary
        if (hasAutoregResults && sessionPlan.summary.total_recommendations > 0) {
          saveAutoregHistory(sessionId);
        }
        // Reset autoreg
        if (autoregSessionId === sessionId) {
          setAutoregSessionId(null);
          setAutoregContext(null);
          autoreg.reset();
        }
      } else {
        toast.error(result.error);
      }
    } else {
      const { error } = await supabase
        .from('completed_sessions')
        .insert({ user_id: user!.id, session_id: sessionId });
      if (!error) {
        toast.success(t('gym.workoutRegistered'));
        setSessionCompleteCheck(prev => ({ ...prev, [sessionId]: false }));
        const { syncTrainingToCoach } = await import('@/lib/syncTrainingToCoach');
        const session = activePrograms.flatMap(p => p.sessions).find(s => s.id === sessionId);
        syncTrainingToCoach({ sessionName: session?.name, sessionType: 'Gimnasio', completed: true });
        if (autoregSessionId === sessionId) {
          setAutoregSessionId(null);
          setAutoregContext(null);
          autoreg.reset();
        }
      } else {
        toast.error(t('gym.errorRegistering'));
      }
    }
    setCompleting(null);
  };

  const saveAutoregHistory = async (sessionId: string) => {
    if (!user) return;
    try {
      // Save session autoregulation state
      const { data: stateRow } = await supabase
        .from('session_autoregulation_state')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          readiness_score: autoreg.engineOutput?.readinessScore ?? null,
          readiness_state: autoreg.engineOutput?.readinessState ?? null,
          daily_score: autoreg.engineOutput?.dailyScore ?? null,
          pre_workout_score: autoreg.engineOutput?.preWorkoutScore ?? null,
          performance_score: autoreg.engineOutput?.performanceScore ?? null,
          fatigue_score: autoreg.engineOutput?.fatigueScore ?? null,
        })
        .select('id')
        .single();

      if (stateRow) {
        // Save each recommendation
        const inserts = sessionPlan.history.map(h => ({
          session_autoregulation_id: stateRow.id,
          user_id: user.id,
          recommendation_type: h.recommendation.recommendation_type as string,
          recommendation_reason: h.recommendation.recommendation_reason,
          exercise_id: h.recommendation.exercise_id ?? null,
          recommendation_payload: h.recommendation.recommendation_payload as Record<string, unknown> as import('@/integrations/supabase/types').Json,
          status: h.status as string,
          responded_at: h.responded_at,
        }));
        if (inserts.length > 0) {
          await supabase.from('autoregulation_recommendations').insert(inserts);
        }
      }
    } catch (e) {
      console.error('Error saving autoreg history:', e);
    }
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, filter: 'blur(5px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
        >
          <Dumbbell className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">{t('gym.title')}</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
          animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
          transition={{ delay: 0.2, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-2xl font-bold text-foreground"
        >{t('gym.myRoutines')}</motion.h2>
        <motion.p
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.4, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-sm text-muted-foreground mt-1"
        >
          {t('gym.routinesSubtitle')}
        </motion.p>
      </div>

      {/* Stats Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            variant={showStats ? "default" : "outline"}
            onClick={() => setShowStats(!showStats)}
            className={cn(
              "gap-2 rounded-full transition-all duration-200",
              showStats && "gradient-primary text-primary-foreground"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            {showStats ? t('gym.hideStats') : t('gym.viewStats')}
          </Button>
        </motion.div>
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
          <p className="text-muted-foreground font-medium">{t('gym.noActiveRoutines')}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {t('gym.goToWorkouts')}
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
              <PeriodizationBadge programId={program.id} variant="full" />

              <div className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{program.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('gym.sessionsCount', { count: program.sessions.length })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {program.sessions.map((session, sessionIndex) => {
                  const isActive = activeSession === session.id;
                  const isCompletedInMicrocycle = periodization.isSessionCompletedInMicrocycle(session.id);
                  const isChecked = sessionCompleteCheck[session.id] || false;
                  const isCompletingThis = completing === session.id;
                  const lastCompleted = getLastCompletedDate(session.id);
                  const isThisSessionInAutoreg = autoregSessionId === session.id;
                  const showAutoregFlow = isThisSessionInAutoreg && isInAutoregFlow;
                  const showAutoregResults = isThisSessionInAutoreg && hasAutoregResults;

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -15, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      transition={{ delay: 0.3 + (programIndex * 0.12) + (sessionIndex * 0.1), duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                            isCompletedInMicrocycle 
                              ? "bg-primary/20 text-primary" 
                              : "gradient-primary text-primary-foreground"
                          )}>
                            {isCompletedInMicrocycle ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              session.short_name.slice(0, 2)
                            )}
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-foreground">{session.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{t('gym.exercisesCount', { count: session.exercises.length })}</span>
                              {lastCompleted && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(lastCompleted, "dd MMM", { locale: dateLoc })}
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

                              {/* ── Autoregulation Flow ── */}
                              {showAutoregFlow && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                >
                                  {autoreg.phase === 'daily_checkin' && (
                                    <DailyCheckIn
                                      onSubmit={autoreg.submitDailyCheckIn}
                                      onSkip={autoreg.skipDailyCheckIn}
                                    />
                                  )}
                                  {autoreg.phase === 'pre_workout_checkin' && (
                                    <PreWorkoutCheckIn
                                      plannedMinutes={autoregContext?.planned_duration_minutes ?? 60}
                                      onSubmit={autoreg.submitPreWorkoutCheckIn}
                                      onSkip={autoreg.skipPreWorkoutCheckIn}
                                    />
                                  )}
                                  {autoreg.phase === 'recommendations' && autoreg.engineOutput && (
                                    <RecommendationOverlay
                                      engineOutput={autoreg.engineOutput}
                                      responses={autoreg.responses}
                                      onAccept={(i) => autoreg.respondToRecommendation(i, 'accepted')}
                                      onReject={(i) => autoreg.respondToRecommendation(i, 'rejected')}
                                      onProceed={handleAutoregComplete}
                                      allResponded={autoreg.allResponded}
                                    />
                                  )}
                                </motion.div>
                              )}

                              {/* ── Normal session content (exercises) ── */}
                              {!showAutoregFlow && (
                                <>
                                  {/* Autoreg summary badge if completed */}
                                  {showAutoregResults && autoreg.engineOutput && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Readiness</span>
                                        <span className="text-sm font-bold text-foreground tabular-nums">
                                          {Math.round(autoreg.engineOutput.readinessScore)}
                                        </span>
                                      </div>
                                      {sessionPlan.summary.accepted > 0 && (
                                        <Badge variant="outline" className="text-[10px] bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]">
                                          {sessionPlan.summary.accepted} ajuste{sessionPlan.summary.accepted > 1 ? 's' : ''} aplicado{sessionPlan.summary.accepted > 1 ? 's' : ''}
                                        </Badge>
                                      )}
                                    </motion.div>
                                  )}

                                  {/* Neo Autoreg Button (if not started yet) */}
                                  {!isThisSessionInAutoreg && !isCompletedInMicrocycle && (
                                    <motion.div whileTap={{ scale: 0.98 }}>
                                      <Button
                                        variant="outline"
                                        className="w-full gap-2 rounded-xl border-border"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartAutoregulation(session);
                                        }}
                                      >
                                        <Brain className="w-4 h-4" />
                                        Analizar con Neo
                                      </Button>
                                    </motion.div>
                                  )}

                                  {/* Modified plan view */}
                                  {showAutoregResults && sessionPlan.summary.plan_was_modified && (
                                    <ActivePlanView
                                      basePlan={sessionPlan.basePlan}
                                      activePlan={sessionPlan.activePlan}
                                    />
                                  )}

                                  {/* Recommendation history */}
                                  {showAutoregResults && sessionPlan.history.length > 0 && (
                                    <RecommendationHistory history={sessionPlan.history} />
                                  )}

                                  {/* Exercises */}
                                  <div className="space-y-3">
                                    {session.exercises.map((exercise, index) => {
                                      // Apply autoreg modifications if active
                                      let displayExercise = exercise;
                                      if (showAutoregResults && sessionPlan.summary.plan_was_modified) {
                                        const modifiedEx = sessionPlan.activePlan.exercises.find(
                                          e => e.exercise_id === exercise.id
                                        );
                                        if (modifiedEx) {
                                          displayExercise = {
                                            ...exercise,
                                            series: modifiedEx.sets,
                                            reps: modifiedEx.rep_range,
                                          };
                                        }
                                      }
                                      return (
                                        <ExerciseCardNew 
                                          key={exercise.id} 
                                          exercise={{
                                            ...displayExercise,
                                            session_id: session.id,
                                            approach_sets: null,
                                            created_at: new Date().toISOString()
                                          }} 
                                          index={index} 
                                        />
                                      );
                                    })}
                                  </div>

                                  {/* Session completion */}
                                  {!isCompletedInMicrocycle && (
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
                                          {t('gym.completedSessionConfirm')}
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
                                        {t('gym.registerWorkout')}
                                      </Button>
                                    </div>
                                  )}

                                  {isCompletedInMicrocycle && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center"
                                    >
                                      <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                                      <p className="text-sm font-medium text-primary">
                                        Sesión completada en este microciclo ✓
                                      </p>
                                    </motion.div>
                                  )}
                                </>
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
