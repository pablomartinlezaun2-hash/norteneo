import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, Play, ChevronRight, Timer, Repeat, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ExerciseCard } from './types';

// Exercise GIF mappings (using placeholder animations)
const exerciseGifs: Record<string, string> = {
  'press-banca': 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDVhY2h1dWQxYnR4cW9nNnV6ZnN6bWd4OWg2dDlhbTBqeGQ0ZWJ5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oriNZoNvn73MZaFYk/giphy.gif',
  'sentadilla': 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3BkbWh1Z2htMWZ5dHVxNmhmNzJqY2tjdm12YnRuMXNhdGVub2NsYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT8qBff8cRRFf7k2vS/giphy.gif',
  'peso-muerto': 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWl4d2J3a2x0M2o3djl1NzlhZDZhYzhoMnFxbWRndjl4d2d4Ynk2ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlPwMAzh13pcZ20/giphy.gif',
  'default': 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGc4ZjBnNnhxOHJ4ZzF0aGF4bWRyMHFsaDd6M3Vha2l5OGx0b3I0ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MaIUaZdSLyWZPdfSSt/giphy.gif',
};

interface ExerciseCardVisualProps {
  exercise: ExerciseCard;
  onAdd: () => void;
  onAlternative: () => void;
  onViewMuscle?: (muscle: string) => void;
  isAdded?: boolean;
}

export const ExerciseCardVisual = ({ 
  exercise, 
  onAdd, 
  onAlternative, 
  onViewMuscle,
  isAdded = false 
}: ExerciseCardVisualProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const gifUrl = exerciseGifs[exercise.id] || exerciseGifs.default;

  const difficultyColors = {
    principiante: 'bg-green-500/10 text-green-600 border-green-500/20',
    intermedio: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    avanzado: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2 }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
    >
      {/* GIF/Animation preview */}
      <div className="relative aspect-video bg-muted">
        {isPlaying ? (
          <img 
            src={gifUrl} 
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20">
            <Play className="w-12 h-12 text-primary/50" />
          </div>
        )}
        
        {/* Difficulty badge */}
        <Badge 
          className={`absolute top-2 right-2 text-[10px] border ${difficultyColors[exercise.difficulty]}`}
        >
          {exercise.difficulty}
        </Badge>
        
        {/* Play/Pause button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          {isPlaying ? (
            <div className="w-3 h-3 flex gap-0.5">
              <div className="w-1 h-full bg-white rounded-full" />
              <div className="w-1 h-full bg-white rounded-full" />
            </div>
          ) : (
            <Play className="w-3 h-3 fill-white" />
          )}
        </button>
      </div>

      {/* Exercise info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-sm">{exercise.name}</h4>
        </div>

        {/* Muscle groups */}
        <div className="flex flex-wrap gap-1">
          {exercise.muscleGroups.map(muscle => (
            <button
              key={muscle}
              onClick={() => onViewMuscle?.(muscle)}
              className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors flex items-center gap-0.5"
            >
              {muscle}
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            {exercise.series} x {exercise.reps}
          </span>
          <span className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {exercise.rest} desc.
          </span>
          {exercise.equipment.length > 0 && (
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              {exercise.equipment[0]}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant={isAdded ? 'secondary' : 'default'}
            className={`flex-1 text-xs ${!isAdded && 'gradient-primary'}`}
            onClick={onAdd}
            disabled={isAdded}
          >
            {isAdded ? (
              '✓ Añadido'
            ) : (
              <>
                <Plus className="w-3 h-3 mr-1" />
                Añadir
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onAlternative}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
