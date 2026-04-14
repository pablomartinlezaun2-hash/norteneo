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
const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

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
      const acceptedRecs = autoreg.acceptedRecommendations;
      
      if (acceptedRecs.length > 0) {
        sessionPlan.setRecommendations(
          acceptedRecs,
          autoreg.engineOutput.readinessScore,
          'pre_session'
        );
        sessionPlan.acceptAll();
      } else {
        sessionPlan.setRecommendations(
          autoreg.engineOutput.recommendations,
          autoreg.engineOutput.readinessScore,
          'pre_session'
        );
        sessionPlan.rejectAll();
      }
    }
    autoreg.proceedToSession();
  }, [autoreg.engineOutput, autoreg.acceptedRecommendations]);

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
        if (hasAutoregResults && sessionPlan.summary.total_recommendations > 0) {
          saveAutoregHistory(sessionId);
        }
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
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="mb-2">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="flex items-center gap-3 mb-3"
        >
          <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
            <Dumbbell className="w-[18px] h-[18px] text-background" />
          </div>
          <div>
            <h2 className="text-[19px] font-bold text-foreground tracking-[-0.02em]">{t('gym.title')}</h2>
            <p className="text-[13px] text-muted-foreground">{t('gym.routinesSubtitle')}</p>
          </div>
        </motion.div>
      </div>

      {/* Stats Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3, ease }}
      >
        <motion.button
          onClick={() => setShowStats(!showStats)}
          className={cn(
            "neo-pill flex items-center gap-2",
            showStats && "bg-foreground text-background"
          )}
          whileTap={{ scale: 0.96 }}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          {showStats ? t('gym.hideStats') : t('gym.viewStats')}
        </motion.button>
      </motion.div>

      {/* Stats Section */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease }}
          className="text-center py-16 neo-surface"
        >
          <Dumbbell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[15px] font-medium text-muted-foreground">{t('gym.noActiveRoutines')}</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1">{t('gym.goToWorkouts')}</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {activePrograms.map((program, programIndex) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + programIndex * 0.08, duration: 0.4, ease }}
              className="space-y-3"
            >
              <PeriodizationBadge programId={program.id} variant="full" />

              <div className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
                  <Play className="w-[18px] h-[18px] text-background" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-foreground tracking-[-0.01em]">{program.name}</h3>
                  <p className="text-[12px] text-muted-foreground">
                    {t('gym.sessionsCount', { count: program.sessions.length })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
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
                      initial={{ opacity: 0, x: -10, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      transition={{ delay: 0.2 + (programIndex * 0.08) + (sessionIndex * 0.06), duration: 0.4, ease }}
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        isActive ? "neo-surface-elevated" : "neo-module-card"
                      )}
                    >
                      {/* Session Header */}
                      <button
                        onClick={() => setActiveSession(isActive ? null : session.id)}
                        className="w-full px-4 py-3.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[14px] transition-all duration-300",
                            isCompletedInMicrocycle 
                              ? "bg-primary/15 text-primary" 
                              : isActive
                                ? "bg-foreground text-background"
                                : "bg-surface-2 text-muted-foreground"
                          )}>
                            {isCompletedInMicrocycle ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              session.short_name.slice(0, 2)
                            )}
                          </div>
                          <div className="text-left">
                            <h4 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">{session.name}</h4>
                            <div className="flex items-center gap-2 text-[12px] text-muted-foreground mt-0.5">
                              <span>{t('gym.exercisesCount', { count: session.exercises.length })}</span>
                              {lastCompleted && (
                                <>
                                  <span>·</span>
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
                          transition={{ duration: 0.25, ease }}
                        >
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                        </motion.div>
                      </button>

                      {/* Session Content */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease }}
                            className="overflow-hidden"
                          >
                            <div className="h-px mx-4" style={{ background: 'hsl(var(--border) / 0.3)' }} />
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: 0.08, ease }}
                              className="px-4 pb-4 pt-3 space-y-4"
                            >
                              {/* ── Autoregulation Flow ── */}
                              {showAutoregFlow && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, ease }}
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

                              {/* ── Normal session content ── */}
                              {!showAutoregFlow && (
                                <>
                                  {/* Autoreg summary badge */}
                                  {showAutoregResults && autoreg.engineOutput && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="flex items-center justify-between p-3 rounded-xl neo-surface"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-[12px] text-muted-foreground">Readiness</span>
                                        <span className="text-[14px] font-bold text-foreground tabular-nums">
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

                                  {/* Neo Autoreg Button */}
                                  {!isThisSessionInAutoreg && !isCompletedInMicrocycle && (
                                    <motion.div whileTap={{ scale: 0.98 }}>
                                      <Button
                                        variant="outline"
                                        className="w-full gap-2 rounded-xl border-border/50 text-[13px]"
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
                                      let neoRir: number | null = null;
                                      if (showAutoregResults && sessionPlan.summary.plan_was_modified) {
                                        const modifiedEx = sessionPlan.activePlan.exercises.find(
                                          e => e.exercise_id === exercise.id
                                        );
                                        if (modifiedEx?.is_modified && modifiedEx.rir !== undefined) {
                                          const originalRir = sessionPlan.basePlan.exercises.find(
                                            e => e.exercise_id === exercise.id
                                          )?.rir;
                                          if (originalRir !== undefined && modifiedEx.rir !== originalRir) {
                                            neoRir = modifiedEx.rir;
                                          }
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
                                          neoRecommendedRir={neoRir}
                                        />
                                      );
                                    })}
                                  </div>

                                  {/* Session completion */}
                                  {!isCompletedInMicrocycle && (
                                    <div className="neo-surface rounded-xl p-4 mt-3">
                                      <div className="flex items-center gap-3 mb-3">
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
                                          className="text-[13px] font-medium text-foreground cursor-pointer"
                                        >
                                          {t('gym.completedSessionConfirm')}
                                        </label>
                                      </div>
                                      
                                      <motion.div whileTap={{ scale: 0.98 }}>
                                        <Button 
                                          onClick={() => handleCompleteSession(session.id)}
                                          disabled={!isChecked || isCompletingThis}
                                          className="w-full bg-foreground text-background font-semibold hover:bg-foreground/90 transition-all disabled:opacity-40 rounded-xl h-11 text-[14px]"
                                        >
                                          {isCompletingThis ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          ) : (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                          )}
                                          {t('gym.registerWorkout')}
                                        </Button>
                                      </motion.div>
                                    </div>
                                  )}

                                  {isCompletedInMicrocycle && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3, ease }}
                                      className="p-4 bg-primary/10 rounded-xl text-center"
                                      style={{ border: '1px solid hsl(var(--primary) / 0.2)' }}
                                    >
                                      <CheckCircle2 className="w-7 h-7 text-primary mx-auto mb-2" />
                                      <p className="text-[13px] font-medium text-primary">
                                        Sesión completada en este microciclo ✓
                                      </p>
                                    </motion.div>
                                  )}
                                </>
                              )}
                            </motion.div>
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
