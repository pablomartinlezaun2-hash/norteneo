import { workoutSessions } from '@/data/workouts';
import { cn } from '@/lib/utils';
import { Dumbbell, TrendingUp, Apple } from 'lucide-react';

type Tab = 'push' | 'legs1' | 'pull' | 'legs2' | 'progress' | 'nutrition';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const workoutTabs = workoutSessions.map(session => ({
    id: session.id as Tab,
    label: session.shortName,
    icon: Dumbbell
  }));

  const extraTabs = [
    { id: 'progress' as Tab, label: 'Progreso', icon: TrendingUp },
    { id: 'nutrition' as Tab, label: 'Nutrición', icon: Apple }
  ];

  const allTabs = [...workoutTabs, ...extraTabs];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max px-2 py-2 gap-1">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
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
        </div>
      </div>
    </nav>
  );
};
