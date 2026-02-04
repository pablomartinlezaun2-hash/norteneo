import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MuscleLoadChartProps {
  setLogs: any[];
  exercises: any[];
}

const MUSCLE_LIST = [
  { key: 'abs', label: 'Abdominales', keywords: ['abdominal', 'crunch', 'plank', 'core'] },
  { key: 'abductors', label: 'Abductores', keywords: ['abductor', 'hip abduction'] },
  { key: 'adductors', label: 'Aductores', keywords: ['aductor', 'hip adduction'] },
  { key: 'forearms', label: 'Antebrazos', keywords: ['antebrazo', 'wrist', 'forearm'] },
  { key: 'biceps', label: 'Bíceps', keywords: ['biceps', 'curl', 'martillo'] },
  { key: 'cardio', label: 'Cardio', keywords: ['cardio', 'running', 'bicicleta', 'elíptica'] },
  { key: 'quads', label: 'Cuádriceps', keywords: ['cuadriceps', 'quad', 'sentadilla', 'squat', 'prensa', 'extensión pierna'] },
  { key: 'neck', label: 'Cuello', keywords: ['cuello', 'neck'] },
  { key: 'fullbody', label: 'Cuerpo entero', keywords: ['full body', 'cuerpo completo', 'burpee'] },
  { key: 'lats', label: 'Dorsales', keywords: ['dorsal', 'lat', 'pulldown', 'dominada', 'jalón'] },
  { key: 'lowerback', label: 'Espalda baja', keywords: ['espalda baja', 'lower back', 'lumbar', 'hiperextensión'] },
  { key: 'upperback', label: 'Espalda superior', keywords: ['espalda superior', 'upper back', 'remo', 'row'] },
  { key: 'calves', label: 'Gemelos', keywords: ['gemelo', 'calf', 'pantorrilla', 'elevación talones'] },
  { key: 'glutes', label: 'Glúteos', keywords: ['glúteo', 'glute', 'hip thrust', 'patada'] },
  { key: 'shoulders', label: 'Hombros', keywords: ['hombro', 'deltoides', 'press militar', 'lateral', 'frontal'] },
  { key: 'hamstrings', label: 'Isquiotibiales', keywords: ['isquio', 'hamstring', 'curl femoral', 'peso muerto'] },
  { key: 'chest', label: 'Pecho', keywords: ['pecho', 'chest', 'press banca', 'bench', 'aperturas', 'fly'] },
  { key: 'traps', label: 'Trapecio', keywords: ['trapecio', 'trap', 'encogimiento', 'shrug'] },
  { key: 'triceps', label: 'Tríceps', keywords: ['triceps', 'extensión', 'fondos', 'dips', 'pushdown'] },
  { key: 'other', label: 'Otro', keywords: [] },
];

const MAX_SETS_VISUAL = 25;

export const MuscleLoadChart = ({ setLogs, exercises }: MuscleLoadChartProps) => {
  const muscleData = useMemo(() => {
    const exerciseMap = new Map(exercises.map(e => [e.id, e.name?.toLowerCase() || '']));
    const counts: Record<string, number> = {};
    
    MUSCLE_LIST.forEach(m => counts[m.key] = 0);

    setLogs.forEach(log => {
      const exerciseName = exerciseMap.get(log.exercise_id) || '';
      let matched = false;
      
      MUSCLE_LIST.forEach(muscle => {
        if (muscle.keywords.some(kw => exerciseName.includes(kw))) {
          counts[muscle.key] += 1;
          matched = true;
        }
      });

      if (!matched) {
        counts['other'] += 1;
      }
    });

    return MUSCLE_LIST.map(muscle => ({
      ...muscle,
      sets: counts[muscle.key],
      percentage: Math.min((counts[muscle.key] / MAX_SETS_VISUAL) * 100, 100),
    })).sort((a, b) => b.sets - a.sets);
  }, [setLogs, exercises]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">Carga por Músculo</h3>
      <p className="text-xs text-muted-foreground mb-4">Series totales por grupo muscular (últimos 30 días)</p>

      <div className="space-y-3">
        {muscleData.map((muscle, index) => (
          <motion.div
            key={muscle.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-3"
          >
            <div className="w-28 flex-shrink-0">
              <p className="text-sm font-medium text-foreground truncate">{muscle.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {muscle.sets} {muscle.sets === 1 ? 'serie' : 'series'}
              </p>
            </div>
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${muscle.percentage}%` }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.03,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className={cn(
                  "h-full rounded-full",
                  muscle.sets > 0 ? "gradient-primary" : "bg-transparent"
                )}
              />
            </div>
            <span className="w-8 text-right text-xs font-medium text-muted-foreground">
              {muscle.sets}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
