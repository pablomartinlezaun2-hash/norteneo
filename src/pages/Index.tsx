import { useState } from 'react';
import { workoutSessions } from '@/data/workouts';
import { Navigation } from '@/components/Navigation';
import { WorkoutSessionComponent } from '@/components/WorkoutSession';
import { ProgressChart } from '@/components/ProgressChart';
import { NutritionSection } from '@/components/NutritionSection';
import { useWorkoutProgress } from '@/hooks/useWorkoutProgress';
import { Flame } from 'lucide-react';

type Tab = 'push' | 'legs1' | 'pull' | 'legs2' | 'progress' | 'nutrition';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('push');
  const { progress, markSessionComplete, getCyclesCompleted, getProgressInCurrentCycle } = useWorkoutProgress();

  const renderContent = () => {
    if (activeTab === 'progress') {
      return (
        <ProgressChart 
          totalCompleted={progress.totalCompleted}
          cyclesCompleted={getCyclesCompleted()}
          progressInCycle={getProgressInCurrentCycle()}
        />
      );
    }

    if (activeTab === 'nutrition') {
      return <NutritionSection />;
    }

    const session = workoutSessions.find(s => s.id === activeTab);
    if (session) {
      return (
        <WorkoutSessionComponent 
          session={session} 
          onComplete={markSessionComplete}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="gradient-primary rounded-xl p-3 glow-primary">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mi Entreno</h1>
            <p className="text-xs text-muted-foreground">
              {progress.totalCompleted} entrenos • {getCyclesCompleted()} ciclos
            </p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <main className="px-4 py-6 pb-24">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
