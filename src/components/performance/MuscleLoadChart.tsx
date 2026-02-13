import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown, Calendar } from 'lucide-react';
import { subDays, isAfter } from 'date-fns';

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

type TimeFilter = '7d' | '30d' | 'meso' | 'custom';

const FILTER_OPTIONS: { id: TimeFilter; label: string }[] = [
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: 'meso', label: 'Mesociclo actual' },
  { id: 'custom', label: 'Personalizado' },
];

export const MuscleLoadChart = ({ setLogs, exercises }: MuscleLoadChartProps) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [customDays, setCustomDays] = useState(14);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const filterLabel = useMemo(() => {
    if (timeFilter === 'custom') return `${customDays} días`;
    return FILTER_OPTIONS.find(f => f.id === timeFilter)?.label || '30 días';
  }, [timeFilter, customDays]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeFilter) {
      case '7d':
        cutoffDate = subDays(now, 7);
        break;
      case 'meso':
        // Mesocycle = ~4 weeks from start of current training block
        cutoffDate = subDays(now, 28);
        break;
      case 'custom':
        cutoffDate = subDays(now, customDays);
        break;
      case '30d':
      default:
        cutoffDate = subDays(now, 30);
        break;
    }

    return setLogs.filter(log => {
      const logDate = new Date(log.logged_at || log.created_at);
      return isAfter(logDate, cutoffDate);
    });
  }, [setLogs, timeFilter, customDays]);

  const muscleData = useMemo(() => {
    const exerciseMap = new Map(exercises.map(e => [e.id, e.name?.toLowerCase() || '']));
    const counts: Record<string, number> = {};
    
    MUSCLE_LIST.forEach(m => counts[m.key] = 0);

    filteredLogs.forEach(log => {
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
  }, [filteredLogs, exercises]);

  const handleSelectFilter = (filter: TimeFilter) => {
    if (filter === 'custom') {
      setShowCustomInput(true);
      setTimeFilter('custom');
    } else {
      setTimeFilter(filter);
      setShowCustomInput(false);
    }
    setIsFilterOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-card rounded-2xl p-5 border border-border apple-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Carga por Músculo</h3>
        
        {/* Filter dropdown */}
        <div className="relative">
          <motion.button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-xs font-medium text-foreground transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {filterLabel}
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isFilterOpen && "rotate-180")} />
          </motion.button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
              >
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectFilter(option.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-xs font-medium transition-colors",
                      timeFilter === option.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/60"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Custom days input */}
      <AnimatePresence>
        {showCustomInput && timeFilter === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
              <span className="text-xs text-muted-foreground">Últimos</span>
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, Math.min(365, Number(e.target.value))))}
                className="w-16 px-2 py-1 rounded-md bg-background border border-border text-sm text-foreground text-center font-medium"
              />
              <span className="text-xs text-muted-foreground">días</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-muted-foreground mb-4">
        Series totales por grupo muscular ({filterLabel})
      </p>

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
