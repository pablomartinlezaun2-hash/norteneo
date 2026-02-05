import { motion } from 'framer-motion';
import { Clock, Flame, Target, ChevronRight, Save, Calendar, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ExerciseCard } from './types';

interface RoutineSummaryProps {
  name: string;
  exercises: ExerciseCard[];
  estimatedMinutes: number;
  onSave: () => void;
  onAddToCalendar?: () => void;
  onExportPDF?: () => void;
  isSaving?: boolean;
}

export const RoutineSummary = ({
  name,
  exercises,
  estimatedMinutes,
  onSave,
  onAddToCalendar,
  onExportPDF,
  isSaving = false,
}: RoutineSummaryProps) => {
  // Get unique muscle groups
  const muscleGroups = [...new Set(exercises.flatMap(ex => ex.muscleGroups))];
  
  // Calculate total sets
  const totalSets = exercises.reduce((acc, ex) => acc + ex.series, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <h3 className="font-bold text-lg">{name}</h3>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {exercises.length} ejercicios
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-4 h-4" />
            {totalSets} series
          </span>
        </div>
      </div>

      {/* Muscle groups */}
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex flex-wrap gap-1.5">
          {muscleGroups.map(muscle => (
            <Badge key={muscle} variant="secondary" className="text-xs">
              {muscle}
            </Badge>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="divide-y divide-border">
        {exercises.map((exercise, index) => (
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{exercise.name}</div>
              <div className="text-xs text-muted-foreground">
                {exercise.series} x {exercise.reps} • {exercise.rest}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-border bg-muted/30 flex gap-2">
        <Button 
          className="flex-1 gradient-primary" 
          onClick={onSave}
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-1.5" />
          {isSaving ? 'Guardando...' : 'Guardar rutina'}
        </Button>
        {onAddToCalendar && (
          <Button variant="outline" size="icon" onClick={onAddToCalendar}>
            <Calendar className="w-4 h-4" />
          </Button>
        )}
        {onExportPDF && (
          <Button variant="outline" size="icon" onClick={onExportPDF}>
            <FileDown className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};
