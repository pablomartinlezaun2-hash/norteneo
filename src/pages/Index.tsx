import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingProgram, ProgramWithSessions } from '@/hooks/useTrainingProgram';
import { useCompletedSessions } from '@/hooks/useCompletedSessions';
import { ExerciseCardNew } from '@/components/ExerciseCardNew';
import { CycleProgressChart } from '@/components/CycleProgressChart';
import { NutritionSection } from '@/components/NutritionSection';
import { Timer } from '@/components/Timer';
import { ProgramSelector } from '@/components/ProgramSelector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Flame, Dumbbell, TrendingUp, Apple, LogOut, 
  CheckCircle2, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Loading state
  if (programLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  const handleTabChange = (index: number | 'progress' | 'nutrition') => {
    if (index === 'progress') {
      setShowProgress(true);
      setShowNutrition(false);
    } else if (index === 'nutrition') {
      setShowProgress(false);
      setShowNutrition(true);
    } else {
      setShowProgress(false);
      setShowNutrition(false);
      setActiveSessionIndex(index);
    }
  };

  const renderContent = () => {
    if (showProgress) {
      return (
        <CycleProgressChart 
          completedSessions={completedSessions}
          totalCompleted={getTotalCompleted()}
          cyclesCompleted={getCyclesCompleted()}
          progressInCycle={getProgressInCurrentCycle()}
        />
      );
    }

    if (showNutrition) {
      return <NutritionSection />;
    }

    if (!currentSession) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay sesiones en este programa</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">{currentSession.name}</h2>
            <p className="text-sm text-muted-foreground">
              {currentSession.exercises?.length || 0} ejercicios
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {currentSession.exercises?.map((exercise, index) => (
            <ExerciseCardNew 
              key={exercise.id} 
              exercise={exercise} 
              index={index} 
            />
          ))}
        </div>

        {/* Complete Session */}
        <div className="mt-6 pt-4 border-t border-border">
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

            {showConfirmation && (
              <div className="mt-3 p-3 bg-success/20 border border-success/30 rounded-lg text-center animate-slide-up">
                <p className="text-sm text-success font-medium">
                  ¡Entreno registrado! 💪
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Build tabs from sessions
  const sessionTabs = sessions.map((session, index) => ({
    index,
    label: session.short_name,
    icon: Dumbbell
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-4 border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="gradient-primary rounded-xl p-2.5 glow-primary">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Mi Entreno</h1>
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
      </header>

      {/* Navigation */}
      <nav className="sticky top-[65px] z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-2 py-2 gap-1">
            {sessionTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = !showProgress && !showNutrition && activeSessionIndex === tab.index;
              
              return (
                <button
                  key={tab.index}
                  onClick={() => handleTabChange(tab.index)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                    isActive 
                      ? "gradient-primary text-primary-foreground glow-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
            
            {/* Progress Tab */}
            <button
              onClick={() => handleTabChange('progress')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                showProgress 
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Progreso
            </button>
            
            {/* Nutrition Tab */}
            <button
              onClick={() => handleTabChange('nutrition')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                showNutrition 
                  ? "gradient-primary text-primary-foreground glow-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Apple className="w-3.5 h-3.5" />
              Nutrición
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="px-4 py-6 pb-32">
        {renderContent()}
      </main>

      {/* Timer FAB */}
      <Timer defaultRestTime={120} />
    </div>
  );
};

export default Index;
