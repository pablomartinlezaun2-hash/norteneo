import { Exercise } from '@/data/workouts';
import { Dumbbell, Clock, Repeat, Target } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
}

export const ExerciseCard = ({ exercise, index }: ExerciseCardProps) => {
  return (
    <div
      className="neo-module-card animate-slide-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
          <Dumbbell className="w-[18px] h-[18px] text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-[14px] leading-tight mb-3 tracking-[-0.01em]">
            {exercise.name}
          </h3>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="w-3 h-3 text-foreground/40" />
              <span>{exercise.series} series</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Repeat className="w-3 h-3 text-foreground/40" />
              <span>{exercise.reps} reps</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3 h-3 text-foreground/40" />
              <span>{exercise.rest}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-3 h-3 text-foreground/40 text-[9px] font-bold flex items-center justify-center">RIR</span>
              <span>{exercise.approachSets}</span>
            </div>
          </div>
          
          {exercise.technique && (
            <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid hsl(var(--border) / 0.25)' }}>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-medium">
                {exercise.technique}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
