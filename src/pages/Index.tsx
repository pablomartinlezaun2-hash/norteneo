import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { TrendingUp, Apple, Loader2, Pencil, FolderOpen, User, Timer as TimerIcon, Play, Pause, RotateCcw } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
const Index = () => {
  const {
    signOut
  } = useAuth();
  const {
    program,
    loading: programLoading,
    refetch: refetchProgram
  } = useTrainingProgram();
  const {
    completedSessions,
    markSessionComplete,
    getTotalCompleted,
    getCyclesCompleted,
    getProgressInCurrentCycle
  } = useCompletedSessions();
  type MainTab = 'workouts' | 'progress' | 'nutrition' | 'exercises' | 'design' | 'profile';
  const [mainTab, setMainTab] = useState<MainTab>('workouts');
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

  // Check if user is new (no program) and hasn't seen welcome
  useEffect(() => {
    if (!programLoading && !program && !hasSeenWelcome) {
      const seen = localStorage.getItem('neo-welcome-seen');
      if (!seen) {
        setShowWelcome(true);
      } else {
        setHasSeenWelcome(true);
      }
    }
  }, [programLoading, program, hasSeenWelcome]);
  const handleStartWithAssistant = () => {
    localStorage.setItem('neo-welcome-seen', 'true');
    setShowWelcome(false);
    setHasSeenWelcome(true);
    // Navigate to design tab to use AI assistant
    setMainTab('design');
  };
  const handleStartAlone = () => {
    localStorage.setItem('neo-welcome-seen', 'true');
    setShowWelcome(false);
    setHasSeenWelcome(true);
  };

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    },
    exit: {
      opacity: 0,
      y: -20
    }
  };
  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    }
  };

  // Loading state
  if (programLoading) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <motion.div initial={{
        opacity: 0,
        scale: 0.8
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        duration: 0.5
      }}>
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </motion.div>
        <p className="text-sm text-muted-foreground">Cargando tu programa...</p>
      </div>;
  }

  const handleRestartTour = () => {
    localStorage.removeItem('neo-welcome-seen');
    setShowWelcome(true);
    setHasSeenWelcome(false);
  };

  // No program - show welcome screen for new users
  if ((!program && showWelcome) || (showWelcome)) {
    return <WelcomeScreen onStartWithAssistant={handleStartWithAssistant} onStartAlone={handleStartAlone} />;
  }

  // Handle case where user dismissed welcome but has no program yet
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
  const handleSessionSelect = (index: number) => {
    setActiveSessionIndex(index);
    setContentKey(prev => prev + 1);
  };
  const renderContent = () => {
    switch (mainTab) {
      case 'workouts':
        return <motion.div key="workouts" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}>
            <WorkoutsHub />
          </motion.div>;
      case 'design':
        return <motion.div key="design" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}>
            <WorkoutDesigner />
          </motion.div>;
      case 'exercises':
        return <motion.div key="exercises" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}>
            <ExerciseCatalog />
          </motion.div>;
      case 'progress':
        return <motion.div key="progress" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}>
            <UnifiedProgressChart completedSessions={completedSessions} totalCompleted={getTotalCompleted()} cyclesCompleted={getCyclesCompleted()} progressInCycle={getProgressInCurrentCycle()} />
          </motion.div>;
      case 'nutrition':
        return <motion.div key="nutrition" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}>
            <NutritionSection />
          </motion.div>;
      case 'profile':
        return <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}>
            <ProfileSection onRestartTour={handleRestartTour} />
          </motion.div>;
      default:
        return <motion.div key="workouts" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}>
            <WorkoutsHub />
          </motion.div>;
    }
  };
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <motion.header className="px-4 py-4 border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm overflow-visible" initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div className="bg-foreground rounded-xl px-3 py-2 shadow-lg" whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
              <span className="font-bold tracking-tight text-background text-xl text-center">NEO</span>
            </motion.div>
            <div>
              <p className="text-[10px] text-muted-foreground">
                {getTotalCompleted()} entrenos • {getCyclesCompleted()} ciclos
              </p>
            </div>
          </div>

          {/* Timer in center */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="relative flex items-center justify-center">
              <motion.button
                onClick={() => setTimerOpen(prev => !prev)}
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isRunning
                    ? "bg-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                    : "bg-muted/60 hover:bg-muted"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <TimerIcon className={cn("w-5 h-5", isRunning ? "text-primary" : "text-muted-foreground")} />
                {isRunning && (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>

              <AnimatePresence>
                {timerOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed top-[60px] inset-x-0 mx-auto w-64 z-[60] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden"
                  >
                    {/* Glow bar */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
                    
                    <div className="p-4 space-y-4">
                      {/* Time display */}
                      <div className="text-center">
                        <motion.span
                          key={formattedTime}
                          initial={{ opacity: 0.6, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "text-4xl font-bold tabular-nums tracking-tight",
                            isRunning ? "text-primary" : "text-foreground"
                          )}
                        >
                          {formattedTime}
                        </motion.span>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {mode === 'stopwatch' ? 'Cronómetro' : 'Descanso'}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex justify-center gap-2">
                        {!isRunning ? (
                          <>
                            <Button size="sm" variant="outline" onClick={startStopwatch} className="h-10 text-sm flex-1 rounded-xl">
                              <Play className="w-4 h-4 mr-2" /> Iniciar
                            </Button>
                            <Button size="sm" onClick={resume} disabled={formattedTime === '00:00'} className="h-10 w-10 rounded-xl gradient-primary text-primary-foreground p-0">
                              <Play className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={pause} className="h-10 text-sm flex-1 rounded-xl">
                            <Pause className="w-4 h-4 mr-2" /> Pausar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={reset} className="h-10 w-10 rounded-xl p-0">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Presets */}
                      <div className="space-y-2">
                        <span className="text-[11px] text-muted-foreground">Descanso rápido</span>
                        <div className="grid grid-cols-4 gap-2">
                          {presetTimes.map(s => (
                            <motion.button
                              key={s}
                              onClick={() => startCountdown(s)}
                              className="text-xs py-2 rounded-lg bg-muted/60 hover:bg-primary hover:text-primary-foreground font-medium transition-colors"
                              whileHover={{ scale: 1.05 }}
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
          </div>

          {/* Profile button */}
          <motion.button 
            onClick={() => handleMainTabChange('profile')}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <User className="w-5 h-5 text-primary" />
          </motion.button>
        </div>
      </motion.header>

      {/* Navigation */}
      <motion.nav className="sticky top-[65px] z-40 bg-background/95 backdrop-blur-sm border-b border-border" initial={{
      opacity: 0,
      y: -10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.1
    }}>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-3 py-2.5 gap-1.5">
            {([
              { key: 'workouts' as const, icon: FolderOpen, label: 'Entrenos', delay: 0.05 },
              { key: 'progress' as const, icon: TrendingUp, label: 'Progreso', delay: 0.1 },
              { key: 'nutrition' as const, icon: Apple, label: 'Nutrición', delay: 0.15 },
              { key: 'design' as const, icon: Pencil, label: 'Diseñar', delay: 0.2 },
              { key: 'profile' as const, icon: User, label: 'Perfil', delay: 0.25 },
            ] as const).map(tab => (
              <motion.button
                key={tab.key}
                onClick={() => handleMainTabChange(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[44px]",
                  mainTab === tab.key
                    ? "gradient-primary text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: tab.delay }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.nav>

      {/* Content */}
      <main className="px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={contentKey}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Timer is now in header */}
    </div>;
};
export default Index;