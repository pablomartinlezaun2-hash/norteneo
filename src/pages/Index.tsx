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
import { CinematicOnboarding } from '@/components/CinematicOnboarding';
import { ProfileSection } from '@/components/profile';
import { CoachPanel } from '@/components/coach/CoachPanel';
import { COACH_PREVIEW_EMAILS } from '@/components/coach/coachConstants';
import { Button } from '@/components/ui/button';
import { TrendingUp, Apple, Loader2, Pencil, FolderOpen, User, Timer as TimerIcon, Play, Pause, RotateCcw, Shield } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PeriodizationBadge } from '@/components/PeriodizationBadge';
import { NeoHelpChat } from '@/components/NeoHelpChat';

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const Index = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { program, loading: programLoading, refetch: refetchProgram } = useTrainingProgram();
  const {
    completedSessions, markSessionComplete,
    getTotalCompleted, getCyclesCompleted, getProgressInCurrentCycle
  } = useCompletedSessions();

  type MainTab = 'workouts' | 'progress' | 'nutrition' | 'exercises' | 'design' | 'profile' | 'coach';
  const [mainTab, setMainTab] = useState<MainTab>('workouts');

  const isCoach = !!user?.email && COACH_PREVIEW_EMAILS.includes(user.email);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [showCinematic, setShowCinematic] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const { formattedTime, isRunning, mode, startStopwatch, startCountdown, pause, resume, reset } = useTimer(120);
  const presetTimes = [60, 120, 150, 180];

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
    return base;
  }, [isCoach]);

  useEffect(() => {
    if (!programLoading && !program && !hasSeenWelcome) {
      const seen = localStorage.getItem('neo-welcome-seen');
      const seenCinematic = localStorage.getItem('neo-cinematic-seen');
      if (!seen) {
        if (!seenCinematic) {
          setShowCinematic(true);
        } else {
          setShowWelcome(true);
        }
      } else {
        setHasSeenWelcome(true);
      }
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

  if (programLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease }}
        >
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-caption text-muted-foreground"
        >{t('index.loading')}</motion.p>
      </div>
    );
  }

  const handleRestartTour = () => {
    localStorage.removeItem('neo-welcome-seen');
    localStorage.removeItem('neo-cinematic-seen');
    setShowCinematic(true);
    setHasSeenWelcome(false);
  };

  const handleCinematicComplete = () => {
    localStorage.setItem('neo-cinematic-seen', 'true');
    setShowCinematic(false);
    setShowWelcome(true);
  };

  if (showCinematic) {
    return <CinematicOnboarding onComplete={handleCinematicComplete} />;
  }

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
      {/* ── Header ── */}
      <motion.header
        className="px-5 py-4 sticky top-0 z-50 bg-background/90 backdrop-blur-2xl"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="h-9 px-3.5 rounded-lg bg-foreground flex items-center justify-center">
              <span className="font-bold tracking-[0.14em] text-background text-[13px] uppercase">NEO</span>
            </div>
          </motion.div>

          {/* Timer */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <motion.button
              onClick={() => setTimerOpen(prev => !prev)}
              className={cn(
                "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                isRunning ? "bg-neo-accent/10" : "hover:bg-surface-2"
              )}
              whileTap={{ scale: 0.9 }}
            >
              <TimerIcon className={cn("w-[18px] h-[18px]", isRunning ? "text-neo-accent" : "text-muted-foreground")} />
              {isRunning && (
                <motion.span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neo-accent"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.button>

            <AnimatePresence>
              {timerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{ duration: 0.2, ease }}
                  className="fixed top-[60px] inset-x-0 mx-auto w-[280px] z-[60] neo-surface-elevated p-5"
                >
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-[36px] font-bold tabular-nums tracking-tight text-foreground leading-none">
                        {formattedTime}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest">
                        {mode === 'stopwatch' ? t('index.stopwatch') : t('index.rest')}
                      </p>
                    </div>
                    <div className="flex justify-center gap-2">
                      {!isRunning ? (
                        <>
                          <Button size="sm" variant="outline" onClick={startStopwatch} className="h-9 text-sm flex-1 rounded-xl">
                            <Play className="w-3.5 h-3.5 mr-1.5" /> {t('index.start')}
                          </Button>
                          <Button size="sm" onClick={resume} disabled={formattedTime === '00:00'} className="h-9 w-9 rounded-xl bg-foreground text-background hover:bg-foreground/90 p-0">
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={pause} className="h-9 text-sm flex-1 rounded-xl">
                          <Pause className="w-3.5 h-3.5 mr-1.5" /> {t('index.pause')}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={reset} className="h-9 w-9 rounded-xl p-0">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-widest">{t('index.quickRest')}</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {presetTimes.map(s => (
                          <motion.button
                            key={s}
                            onClick={() => startCountdown(s)}
                            className="text-[13px] py-2 rounded-lg bg-surface-2 hover:bg-foreground hover:text-background font-medium transition-all duration-200"
                            whileTap={{ scale: 0.95 }}
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

          {/* Profile */}
          <motion.button
            onClick={() => handleMainTabChange('profile')}
            className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease, delay: 0.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <User className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>
      </motion.header>

      {/* ── Navigation ── */}
      <motion.nav
        className="sticky top-[57px] z-40 bg-background/90 backdrop-blur-2xl"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease }}
      >
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-5 py-3 gap-1.5">
            {tabs.map((tab, i) => {
              const isActive = mainTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => handleMainTabChange(tab.key)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.35, ease }}
                  className={isActive ? 'neo-tab-active' : 'neo-tab'}
                  whileTap={{ scale: 0.94 }}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.labelKey.startsWith('index.') ? t(tab.labelKey) : tab.labelKey}
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className="h-px" style={{ background: 'hsl(var(--border) / 0.25)' }} />
      </motion.nav>

      {/* ── Content ── */}
      <main className="px-5 py-6 pb-32 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={contentKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <NeoHelpChat />
    </div>
  );
};

export default Index;
