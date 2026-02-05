import { motion } from 'framer-motion';
import { Flame, Trophy, Target, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface WeekDay {
  day: string;
  short: string;
  completed: boolean;
  type?: string;
}

interface ProgressVisualProps {
  weekProgress: WeekDay[];
  streak: number;
  totalWorkouts: number;
  muscleHeatMap?: { muscle: string; intensity: number }[];
}

export const ProgressVisual = ({ weekProgress, streak, totalWorkouts, muscleHeatMap = [] }: ProgressVisualProps) => {
  const completedDays = weekProgress.filter(d => d.completed).length;
  const progressPercent = (completedDays / weekProgress.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-3 space-y-3"
    >
      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-orange-500/10">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <div className="text-lg font-bold leading-none">{streak}</div>
              <div className="text-[10px] text-muted-foreground">Racha</div>
            </div>
          </div>
          
          <div className="w-px h-8 bg-border" />
          
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold leading-none">{totalWorkouts}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-semibold">{completedDays}/{weekProgress.length}</div>
          <div className="text-[10px] text-muted-foreground">esta semana</div>
        </div>
      </div>

      {/* Week progress bar */}
      <div className="space-y-1.5">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between">
          {weekProgress.map((day, index) => (
            <div key={day.day} className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                  day.completed
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {day.completed ? '✓' : day.short}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Muscle heat map (mini) */}
      {muscleHeatMap.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="text-xs font-medium mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary" />
            Músculos trabajados
          </div>
          <div className="flex flex-wrap gap-1">
            {muscleHeatMap.slice(0, 6).map(({ muscle, intensity }) => (
              <div
                key={muscle}
                className="px-2 py-1 rounded-md text-[10px] font-medium"
                style={{
                  backgroundColor: `hsl(211 100% 50% / ${intensity / 100})`,
                  color: intensity > 50 ? 'white' : 'hsl(211 100% 30%)',
                }}
              >
                {muscle}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Achievement badge component
export const AchievementBadge = ({ 
  icon, 
  name, 
  unlocked 
}: { 
  icon: string; 
  name: string; 
  unlocked: boolean;
}) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    className={`relative p-2 rounded-xl border-2 ${
      unlocked 
        ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-500/50' 
        : 'bg-muted border-border opacity-50'
    }`}
  >
    <span className="text-2xl">{icon}</span>
    {unlocked && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center"
      >
        <Trophy className="w-2.5 h-2.5 text-white" />
      </motion.div>
    )}
    <div className="text-[9px] text-center mt-1 font-medium truncate max-w-[60px]">{name}</div>
  </motion.div>
);
