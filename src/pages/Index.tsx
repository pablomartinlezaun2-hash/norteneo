import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingProgram } from '@/hooks/useTrainingProgram';
import { useCompletedSessions } from '@/hooks/useCompletedSessions';
import { ExerciseCardNew } from '@/components/ExerciseCardNew';
import { CycleProgressChart } from '@/components/CycleProgressChart';
import { NutritionSection } from '@/components/NutritionSection';
import { EducationalSection } from '@/components/EducationalSection';
import { ExerciseCatalog } from '@/components/ExerciseCatalog';
import { SwimmingSection } from '@/components/SwimmingSection';
import { RunningSection } from '@/components/RunningSection';
import { WorkoutSubNav } from '@/components/WorkoutSubNav';
import { WorkoutDesigner } from '@/components/WorkoutDesigner';
import { MyWorkoutsSection } from '@/components/MyWorkoutsSection';
import { Timer } from '@/components/Timer';
import { ProgramSelector } from '@/components/ProgramSelector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dumbbell, TrendingUp, Apple, LogOut, 
  CheckCircle2, Loader2, BookOpen, Library,
  Waves, Footprints, Pencil, FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Index = () => {
  const { signOut } = useAuth();
  const { program, loading: programLoading, refetch: refetchProgram } = useTrainingProgram();
  const { 
    completedSessions, 
    markSessionComplete, 
    getTotalCompleted, 
    getCyclesCompleted, 
    getProgressInCurrentCycle 
  } = useCompletedSessions();

  type MainTab = 'workouts' | 'swimming' | 'running' | 'progress' | 'nutrition' | 'theory' | 'exercises' | 'design' | 'my-workouts';
  
  const [mainTab, setMainTab] = useState<MainTab>('workouts');
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  // Loading state
  if (programLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  // No program - show selector
  if (!program) {
    return <ProgramSelector onProgramImported={refetchProgram} />;
  }

  const sessions = program.sessions || [];
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
      case 'my-workouts':
        return (
          <motion.div
            key="my-workouts"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <MyWorkoutsSection />
          </motion.div>
        );

      case 'design':
        return (
          <motion.div
            key="design"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <WorkoutDesigner />
          </motion.div>
        );

      case 'theory':
        return (
          <motion.div
            key="theory"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <EducationalSection />
          </motion.div>
        );

      case 'exercises':
        return (
          <motion.div
            key="exercises"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ExerciseCatalog />
          </motion.div>
        );

      case 'progress':
        return (
          <motion.div
            key="progress"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <CycleProgressChart 
              completedSessions={completedSessions}
              totalCompleted={getTotalCompleted()}
              cyclesCompleted={getCyclesCompleted()}
              progressInCycle={getProgressInCurrentCycle()}
            />
          </motion.div>
        );

      case 'nutrition':
        return (
          <motion.div
            key="nutrition"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <NutritionSection />
          </motion.div>
        );

      case 'swimming':
        return (
          <motion.div
            key="swimming"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <SwimmingSection />
          </motion.div>
        );

      case 'running':
        return (
          <motion.div
            key="running"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <RunningSection />
          </motion.div>
        );

      case 'workouts':
      default:
        if (!currentSession) {
          return (
            <motion.div 
              className="text-center py-12"
              variants={pageVariants}
              initial="initial"
              animate="animate"
            >
              <p className="text-muted-foreground">No hay sesiones en este programa</p>
            </motion.div>
          );
        }

        return (
          <motion.div 
            key={`session-${activeSessionIndex}`}
            className="space-y-4"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Sub-navigation for workout sessions */}
            <WorkoutSubNav 
              sessions={sessions}
              activeIndex={activeSessionIndex}
              onSelect={handleSessionSelect}
            />

            <motion.div 
              className="flex items-center justify-between mb-6"
              variants={itemVariants}
              transition={{ duration: 0.4 }}
            >
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentSession.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {currentSession.exercises?.length || 0} ejercicios
                </p>
              </div>
            </motion.div>

            <motion.div className="space-y-3">
              {currentSession.exercises?.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  variants={itemVariants}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <ExerciseCardNew 
                    exercise={exercise} 
                    index={index} 
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Complete Session */}
            <motion.div 
              className="mt-6 pt-4 border-t border-border"
              variants={itemVariants}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="gradient-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Checkbox 
                    id="session-complete"
                    checked={isSessionCompleted}
                    onCheckedChange={(checked) => setIsSessionCompleted(checked === true)}
                    className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label 
                    htmlFor="session-complete" 
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    He completado la sesión completa
                  </label>
                </div>
                
                <Button 
                  onClick={handleCompleteSession}
                  disabled={!isSessionCompleted || completing}
                  className="w-full gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {completing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Registrar entreno
                </Button>

                <AnimatePresence>
                  {showConfirmation && (
                    <motion.div 
                      className="mt-3 p-3 bg-success/20 border border-success/30 rounded-lg text-center"
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-sm text-success font-medium">
                        ¡Entreno registrado! 💪
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        );
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        className="px-4 py-4 border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="bg-foreground rounded-xl px-3 py-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg font-bold tracking-tight text-background">NEO</span>
            </motion.div>
            <div>
              <p className="text-[10px] text-muted-foreground">
                {getTotalCompleted()} entrenos • {getCyclesCompleted()} ciclos
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>

      {/* Navigation */}
      <motion.nav 
        className="sticky top-[65px] z-40 bg-background/95 backdrop-blur-sm border-b border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-2 py-2 gap-1">
            {/* My Workouts Tab */}
            <motion.button
              onClick={() => handleMainTabChange('my-workouts')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                mainTab === 'my-workouts'
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Entrenamientos
            </motion.button>

            {/* Workouts Tab (current program) */}
            <motion.button
              onClick={() => handleMainTabChange('workouts')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                mainTab === 'workouts'
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Programa activo
            </motion.button>

            {/* Swimming Tab */}
            <motion.button
              onClick={() => handleMainTabChange('swimming')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                mainTab === 'swimming'
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Waves className="w-3.5 h-3.5" />
              Natación
            </motion.button>

            {/* Running Tab */}
            <motion.button
              onClick={() => handleMainTabChange('running')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                mainTab === 'running'
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Footprints className="w-3.5 h-3.5" />
              Running
            </motion.button>
            
            {/* Progress Tab */}
            <motion.button
              onClick={() => handleMainTabChange('progress')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                mainTab === 'progress'
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Progreso
            </motion.button>
            
            {/* Nutrition Tab */}
            <motion.button
              onClick={() => handleMainTabChange('nutrition')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                mainTab === 'nutrition'
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Apple className="w-3.5 h-3.5" />
              Nutrición
            </motion.button>

            {/* Theory Tab */}
            <motion.button
              onClick={() => handleMainTabChange('theory')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                mainTab === 'theory'
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Teoría
            </motion.button>

            {/* Exercises Catalog Tab */}
            <motion.button
              onClick={() => handleMainTabChange('exercises')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                mainTab === 'exercises'
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Library className="w-3.5 h-3.5" />
              Ejercicios
            </motion.button>

            {/* Design Tab */}
            <motion.button
              onClick={() => handleMainTabChange('design')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                mainTab === 'design'
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              <Pencil className="w-3.5 h-3.5" />
              Diseñar
            </motion.button>
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

      {/* Timer FAB */}
      <Timer defaultRestTime={120} />
    </div>
  );
};

export default Index;
