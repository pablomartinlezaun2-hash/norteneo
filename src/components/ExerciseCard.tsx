import { Exercise } from '@/data/workouts';
import { Dumbbell, Clock, Repeat, Target } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
}

export const ExerciseCard = ({ exercise, index }: ExerciseCardProps) => {
  return (
    <div 
      className="gradient-card rounded-lg p-4 border border-border card-hover animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="gradient-primary rounded-lg p-2 shrink-0">
          <Dumbbell className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight mb-3">
            {exercise.name}
          </h3>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span>{exercise.series} series</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Repeat className="w-3.5 h-3.5 text-primary" />
              <span>{exercise.reps} reps</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{exercise.rest}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-3.5 h-3.5 text-primary text-[10px] font-bold">RIR</span>
              <span>{exercise.approachSets}</span>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {exercise.technique}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
