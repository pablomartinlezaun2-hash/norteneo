import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingProgram } from '@/hooks/useTrainingProgram';
import { useCompletedSessions } from '@/hooks/useCompletedSessions';
import { UnifiedProgressChart } from '@/components/UnifiedProgressChart';
import { NutritionSection } from '@/components/NutritionSection';
import { ExerciseCatalog } from '@/components/ExerciseCatalog';
import { WorkoutDesigner } from '@/components/WorkoutDesigner';
import { WorkoutsHub } from '@/components/WorkoutsHub';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ProfileSection } from '@/components/profile';
import { CoachPanel } from '@/components/coach/CoachPanel';
import { AthleteChatSection } from '@/components/coach/AthleteChatSection';
import { COACH_PREVIEW_EMAILS } from '@/components/coach/coachConstants';
import { Button } from '@/components/ui/button';
import { TrendingUp, Apple, Loader2, Pencil, FolderOpen, User, Timer as TimerIcon, Play, Pause, RotateCcw, Shield, MessageCircle } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PeriodizationBadge } from '@/components/PeriodizationBadge';
import { supabase } from '@/integrations/supabase/client';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

const Index = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { program, loading: programLoading, refetch: refetchProgram } = useTrainingProgram();
  const {
    completedSessions, markSessionComplete,
    getTotalCompleted, getCyclesCompleted, getProgressInCurrentCycle
  } = useCompletedSessions();

  type MainTab = 'workouts' | 'progress' | 'nutrition' | 'exercises' | 'design' | 'profile' | 'coach' | 'messages';
  const [mainTab, setMainTab] = useState<MainTab>('workouts');

  const isCoach = !!user?.email && COACH_PREVIEW_EMAILS.includes(user.email);
  const [hasCoach, setHasCoach] = useState(false);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const { formattedTime, isRunning, mode, startStopwatch, startCountdown, pause, resume, reset } = useTimer(120);
  const presetTimes = [60, 120, 150, 180];

  // Check if athlete has a coach assigned (for messages tab)
  useEffect(() => {
    if (!user || isCoach) return;
    (supabase as any)
      .from('profiles')
      .select('coach_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        setHasCoach(!!data?.coach_id);
      });
  }, [user, isCoach]);

  // Listen for nav events from chat back button
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setMainTab(detail as MainTab);
    };
    window.addEventListener('neo-nav', handler);
    return () => window.removeEventListener('neo-nav', handler);
  }, []);

  const tabs = useMemo(() => {
    const base = [
      { key: 'workouts' as const, icon: FolderOpen, labelKey: 'index.workouts' },
      { key: 'progress' as const, icon: TrendingUp, labelKey: 'index.progress' },
      { key: 'nutrition' as const, icon: Apple, labelKey: 'index.nutrition' },
      { key: 'design' as const, icon: Pencil, labelKey: 'index.design' },
      { key: 'profile' as const, icon: User, labelKey: 'index.profile' },
    ] as const;
    if (isCoach) {
      return [...base, { key: 'coach' as const, icon: Shield, labelKey: 'Coach' }] as const;
    }
    if (hasCoach) {
      return [...base, { key: 'messages' as const, icon: MessageCircle, labelKey: 'Chat' }] as const;
    }
    return base;
  }, [isCoach, hasCoach]);

  useEffect(() => {
    if (!programLoading && !program && !hasSeenWelcome) {
      const seen = localStorage.getItem('neo-welcome-seen');
      if (!seen) setShowWelcome(true);
      else setHasSeenWelcome(true);
    }
  }, [programLoading, program, hasSeenWelcome]);

  const handleStartWithAssistant = () => {
    localStorage.setItem('neo-welcome-seen', 'true');
    setShowWelcome(false);
    setHasSeenWelcome(true);
    setMainTab('design');
  };
  const handleStartAlone = () => {
    localStorage.setItem('neo-welcome-seen', 'true');
    setShowWelcome(false);
    setHasSeenWelcome(true);
  };

  const contentVariants = {
    initial: { opacity: 0, scale: 0.97, filter: 'blur(4px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.98, filter: 'blur(3px)' }
  };

  if (programLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.32, ease: premiumEase }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.24 }}
          className="text-sm text-muted-foreground"
        >{t('index.loading')}</motion.p>
      </div>
    );
  }

  const handleRestartTour = () => {
    localStorage.removeItem('neo-welcome-seen');
    setShowWelcome(true);
    setHasSeenWelcome(false);
  };

  if ((!program && showWelcome) || showWelcome) {
    return <WelcomeScreen onStartWithAssistant={handleStartWithAssistant} onStartAlone={handleStartAlone} />;
  }

  const sessions = program?.sessions || [];
  const currentSession = sessions[activeSessionIndex];

  const handleCompleteSession = async () => {
    if (!isSessionCompleted || !currentSession) return;
    setCompleting(true);
    const result = await markSessionComplete(currentSession.id);
    setCompleting(false);
    if (!result.error) {
      setIsSessionCompleted(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    }
  };

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    setContentKey(prev => prev + 1);
  };

  const renderContent = () => {
    switch (mainTab) {
      case 'workouts': return <WorkoutsHub />;
      case 'design': return <WorkoutDesigner />;
      case 'exercises': return <ExerciseCatalog />;
      case 'progress':
        return (
          <UnifiedProgressChart
            completedSessions={completedSessions}
            totalCompleted={getTotalCompleted()}
            cyclesCompleted={getCyclesCompleted()}
            progressInCycle={getProgressInCurrentCycle()}
          />
        );
      case 'nutrition': return <NutritionSection />;
      case 'profile': return <ProfileSection onRestartTour={handleRestartTour} />;
      case 'coach': return isCoach ? <CoachPanel /> : <WorkoutsHub />;
      default: return <WorkoutsHub />;
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <motion.header
        className="px-4 py-4 border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm overflow-visible"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: premiumEase }}
      >
        <div className="flex items-center justify-between">
          {/* Logo with subtle glow */}
          <div className="flex items-center gap-3">
            <motion.div
              className="bg-foreground rounded-xl px-3 py-2"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.32, ease: premiumEase, delay: 0.04 }}
              whileTap={{ scale: 0.96 }}
              style={{ boxShadow: '0 0 16px hsla(0, 0%, 100%, 0.06)' }}
            >
              <span className="font-bold tracking-tight text-background text-xl text-center">NEO</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: premiumEase, delay: 0.12 }}
              className="flex items-center gap-2"
            >
              <p className="text-[10px] text-muted-foreground">
                {getTotalCompleted()} {t('index.sessions')} • {getCyclesCompleted()} {t('index.cycles')}
              </p>
              <PeriodizationBadge programId={program?.id} variant="compact" />
            </motion.div>
          </div>

          {/* Timer */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="relative flex items-center justify-center">
              <motion.button
                onClick={() => setTimerOpen(prev => !prev)}
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                  isRunning
                    ? "bg-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    : "bg-muted/60 hover:bg-muted"
                )}
                whileTap={{ scale: 0.92 }}
              >
                <TimerIcon className={cn("w-5 h-5", isRunning ? "text-primary" : "text-muted-foreground")} />
                {isRunning && (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.button>

              <AnimatePresence>
                {timerOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.24, ease: premiumEase }}
                    className="fixed top-[60px] inset-x-0 mx-auto w-64 z-[60] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                  >
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                    <div className="p-4 space-y-4">
                      <div className="text-center">
                        <span className={cn(
                          "text-4xl font-bold tabular-nums tracking-tight",
                          isRunning ? "text-primary" : "text-foreground"
                        )}>
                          {formattedTime}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {mode === 'stopwatch' ? t('index.stopwatch') : t('index.rest')}
                        </p>
                      </div>
                      <div className="flex justify-center gap-2">
                        {!isRunning ? (
                          <>
                            <Button size="sm" variant="outline" onClick={startStopwatch} className="h-10 text-sm flex-1 rounded-xl">
                              <Play className="w-4 h-4 mr-2" /> {t('index.start')}
                            </Button>
                            <Button size="sm" onClick={resume} disabled={formattedTime === '00:00'} className="h-10 w-10 rounded-xl gradient-primary text-primary-foreground p-0">
                              <Play className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={pause} className="h-10 text-sm flex-1 rounded-xl">
                            <Pause className="w-4 h-4 mr-2" /> {t('index.pause')}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={reset} className="h-10 w-10 rounded-xl p-0">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[11px] text-muted-foreground">{t('index.quickRest')}</span>
                        <div className="grid grid-cols-4 gap-2">
                          {presetTimes.map(s => (
                            <motion.button
                              key={s}
                              onClick={() => startCountdown(s)}
                              className="text-xs py-2 rounded-lg bg-muted/60 hover:bg-primary hover:text-primary-foreground font-medium transition-colors duration-200"
                              whileTap={{ scale: 0.94 }}
                            >
                              {Math.floor(s / 60)}:{(s % 60).toString().padStart(2, '0')}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Profile button */}
          <motion.button
            onClick={() => handleMainTabChange('profile')}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: premiumEase, delay: 0.16 }}
            whileTap={{ scale: 0.92 }}
          >
            <User className="w-5 h-5 text-primary" />
          </motion.button>
        </div>
      </motion.header>

      {/* Navigation — layoutId sliding indicator */}
      <motion.nav
        className="sticky top-[65px] z-40 bg-background/95 backdrop-blur-sm border-b border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, delay: 0.08 }}
      >
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-3 py-2.5 gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleMainTabChange(tab.key)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 whitespace-nowrap min-h-[44px]",
                  mainTab === tab.key
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Sliding background via layoutId */}
                {mainTab === tab.key && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 rounded-xl gradient-primary glow-primary"
                    transition={{ duration: 0.28, ease: premiumEase }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.labelKey.startsWith('index.') ? t(tab.labelKey) : tab.labelKey}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.nav>

      {/* Content */}
      <main className="px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={contentKey}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28, ease: premiumEase }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
