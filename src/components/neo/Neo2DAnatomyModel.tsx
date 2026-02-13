import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Target, X, TrendingUp, Calendar, Flame } from 'lucide-react';
import { SetLog } from '@/types/database';
import { subDays, isAfter, startOfWeek, startOfMonth } from 'date-fns';

interface Neo2DAnatomyProps {
  setLogs: SetLog[];
  exercises: Array<{ id: string; name: string; sessionName: string }>;
}

interface MuscleConfig {
  id: string;
  name: string;
  path: string;
  keywords: string[];
}

// Comprehensive muscle definitions with SVG paths for a front-facing anatomical figure
const MUSCLES: MuscleConfig[] = [
  // --- SHOULDERS ---
  {
    id: 'delt-anterior-l',
    name: 'Deltoides Anterior',
    path: 'M 108,120 Q 100,118 94,125 Q 92,132 94,140 Q 98,135 104,128 Q 108,124 108,120 Z',
    keywords: ['press militar', 'elevaciones frontales', 'press banca', 'press inclinado', 'hombro', 'shoulder'],
  },
  {
    id: 'delt-anterior-r',
    name: 'Deltoides Anterior',
    path: 'M 192,120 Q 200,118 206,125 Q 208,132 206,140 Q 202,135 196,128 Q 192,124 192,120 Z',
    keywords: ['press militar', 'elevaciones frontales', 'press banca', 'press inclinado', 'hombro', 'shoulder'],
  },
  {
    id: 'delt-lateral-l',
    name: 'Deltoides Lateral',
    path: 'M 94,125 Q 86,122 82,130 Q 80,138 84,144 Q 88,140 92,134 Q 94,130 94,125 Z',
    keywords: ['elevaciones laterales', 'press militar', 'hombro', 'shoulder'],
  },
  {
    id: 'delt-lateral-r',
    name: 'Deltoides Lateral',
    path: 'M 206,125 Q 214,122 218,130 Q 220,138 216,144 Q 212,140 208,134 Q 206,130 206,125 Z',
    keywords: ['elevaciones laterales', 'press militar', 'hombro', 'shoulder'],
  },
  {
    id: 'delt-posterior-l',
    name: 'Deltoides Posterior',
    path: 'M 82,130 Q 78,128 76,134 Q 76,140 80,144 Q 83,141 84,136 Q 84,133 82,130 Z',
    keywords: ['pájaros', 'face pull', 'remo', 'hombro', 'shoulder'],
  },
  {
    id: 'delt-posterior-r',
    name: 'Deltoides Posterior',
    path: 'M 218,130 Q 222,128 224,134 Q 224,140 220,144 Q 217,141 216,136 Q 216,133 218,130 Z',
    keywords: ['pájaros', 'face pull', 'remo', 'hombro', 'shoulder'],
  },
  // --- CHEST ---
  {
    id: 'pec-upper-l',
    name: 'Pectoral Superior',
    path: 'M 108,126 Q 110,124 120,126 Q 135,128 148,130 Q 145,138 135,140 Q 120,138 110,135 Q 106,132 108,126 Z',
    keywords: ['press inclinado', 'aperturas inclinadas', 'cruces', 'pecho', 'chest'],
  },
  {
    id: 'pec-upper-r',
    name: 'Pectoral Superior',
    path: 'M 192,126 Q 190,124 180,126 Q 165,128 152,130 Q 155,138 165,140 Q 180,138 190,135 Q 194,132 192,126 Z',
    keywords: ['press inclinado', 'aperturas inclinadas', 'cruces', 'pecho', 'chest'],
  },
  {
    id: 'pec-lower-l',
    name: 'Pectoral Inferior',
    path: 'M 106,135 Q 110,138 120,140 Q 135,142 148,140 Q 148,150 140,155 Q 125,158 112,152 Q 104,146 106,135 Z',
    keywords: ['press banca', 'press declinado', 'fondos', 'aperturas', 'pecho', 'chest'],
  },
  {
    id: 'pec-lower-r',
    name: 'Pectoral Inferior',
    path: 'M 194,135 Q 190,138 180,140 Q 165,142 152,140 Q 152,150 160,155 Q 175,158 188,152 Q 196,146 194,135 Z',
    keywords: ['press banca', 'press declinado', 'fondos', 'aperturas', 'pecho', 'chest'],
  },
  // --- BACK (simplified front view hints) ---
  {
    id: 'lat-l',
    name: 'Dorsal Ancho',
    path: 'M 100,144 Q 96,150 94,162 Q 92,175 96,185 Q 102,180 106,170 Q 108,160 106,150 Q 104,146 100,144 Z',
    keywords: ['dominadas', 'jalón', 'remo', 'espalda', 'back', 'dorsal'],
  },
  {
    id: 'lat-r',
    name: 'Dorsal Ancho',
    path: 'M 200,144 Q 204,150 206,162 Q 208,175 204,185 Q 198,180 194,170 Q 192,160 194,150 Q 196,146 200,144 Z',
    keywords: ['dominadas', 'jalón', 'remo', 'espalda', 'back', 'dorsal'],
  },
  {
    id: 'trap',
    name: 'Trapecio',
    path: 'M 130,108 Q 140,104 150,104 Q 160,104 170,108 Q 168,116 160,118 Q 150,120 140,118 Q 132,116 130,108 Z',
    keywords: ['remo', 'encogimientos', 'peso muerto', 'trapecio', 'espalda'],
  },
  // --- ARMS ---
  {
    id: 'biceps-l',
    name: 'Bíceps',
    path: 'M 82,148 Q 78,152 76,162 Q 74,174 76,184 Q 80,186 84,184 Q 86,174 86,164 Q 86,154 82,148 Z',
    keywords: ['curl bíceps', 'curl martillo', 'dominadas', 'bíceps'],
  },
  {
    id: 'biceps-r',
    name: 'Bíceps',
    path: 'M 218,148 Q 222,152 224,162 Q 226,174 224,184 Q 220,186 216,184 Q 214,174 214,164 Q 214,154 218,148 Z',
    keywords: ['curl bíceps', 'curl martillo', 'dominadas', 'bíceps'],
  },
  {
    id: 'triceps-l',
    name: 'Tríceps',
    path: 'M 76,148 Q 72,154 70,164 Q 68,174 70,182 Q 74,184 76,182 Q 76,172 76,162 Q 76,154 76,148 Z',
    keywords: ['extensiones tríceps', 'press francés', 'fondos', 'tríceps'],
  },
  {
    id: 'triceps-r',
    name: 'Tríceps',
    path: 'M 224,148 Q 228,154 230,164 Q 232,174 230,182 Q 226,184 224,182 Q 224,172 224,162 Q 224,154 224,148 Z',
    keywords: ['extensiones tríceps', 'press francés', 'fondos', 'tríceps'],
  },
  {
    id: 'forearm-l',
    name: 'Antebrazo',
    path: 'M 72,186 Q 68,194 66,206 Q 66,216 68,224 Q 72,226 76,224 Q 78,214 78,204 Q 78,194 74,186 Z',
    keywords: ['curl', 'agarre', 'antebrazo'],
  },
  {
    id: 'forearm-r',
    name: 'Antebrazo',
    path: 'M 228,186 Q 232,194 234,206 Q 234,216 232,224 Q 228,226 224,224 Q 222,214 222,204 Q 222,194 226,186 Z',
    keywords: ['curl', 'agarre', 'antebrazo'],
  },
  // --- CORE ---
  {
    id: 'abs-upper',
    name: 'Recto Abdominal Superior',
    path: 'M 134,158 L 166,158 L 166,175 L 134,175 Z',
    keywords: ['crunch', 'plancha', 'abdominal', 'core', 'abs'],
  },
  {
    id: 'abs-mid',
    name: 'Recto Abdominal Medio',
    path: 'M 134,177 L 166,177 L 166,194 L 134,194 Z',
    keywords: ['crunch', 'plancha', 'abdominal', 'core', 'abs'],
  },
  {
    id: 'abs-lower',
    name: 'Recto Abdominal Inferior',
    path: 'M 136,196 L 164,196 L 164,212 L 136,212 Z',
    keywords: ['crunch', 'elevación piernas', 'abdominal', 'core', 'abs'],
  },
  {
    id: 'oblique-l',
    name: 'Oblicuo Externo',
    path: 'M 110,158 Q 108,168 108,180 Q 110,195 114,208 Q 120,210 126,208 Q 130,195 132,180 Q 132,168 132,158 Q 124,156 116,156 Q 112,157 110,158 Z',
    keywords: ['russian twist', 'oblicuo', 'plancha lateral', 'core'],
  },
  {
    id: 'oblique-r',
    name: 'Oblicuo Externo',
    path: 'M 190,158 Q 192,168 192,180 Q 190,195 186,208 Q 180,210 174,208 Q 170,195 168,180 Q 168,168 168,158 Q 176,156 184,156 Q 188,157 190,158 Z',
    keywords: ['russian twist', 'oblicuo', 'plancha lateral', 'core'],
  },
  // --- GLUTES ---
  {
    id: 'glute-l',
    name: 'Glúteo Mayor',
    path: 'M 116,212 Q 112,218 110,228 Q 110,238 116,244 Q 124,248 132,246 Q 138,242 140,234 Q 140,224 136,216 Q 130,212 120,212 Z',
    keywords: ['hip thrust', 'sentadillas', 'peso muerto', 'glúteo'],
  },
  {
    id: 'glute-r',
    name: 'Glúteo Mayor',
    path: 'M 184,212 Q 188,218 190,228 Q 190,238 184,244 Q 176,248 168,246 Q 162,242 160,234 Q 160,224 164,216 Q 170,212 180,212 Z',
    keywords: ['hip thrust', 'sentadillas', 'peso muerto', 'glúteo'],
  },
  // --- QUADS ---
  {
    id: 'quad-l',
    name: 'Cuádriceps',
    path: 'M 114,248 Q 110,260 108,278 Q 106,298 108,318 Q 112,326 120,328 Q 128,326 132,318 Q 134,298 132,278 Q 130,260 126,248 Z',
    keywords: ['sentadillas', 'prensa', 'extensiones', 'cuádriceps', 'pierna', 'leg'],
  },
  {
    id: 'quad-r',
    name: 'Cuádriceps',
    path: 'M 186,248 Q 190,260 192,278 Q 194,298 192,318 Q 188,326 180,328 Q 172,326 168,318 Q 166,298 168,278 Q 170,260 174,248 Z',
    keywords: ['sentadillas', 'prensa', 'extensiones', 'cuádriceps', 'pierna', 'leg'],
  },
  // --- HAMSTRINGS ---
  {
    id: 'hamstring-l',
    name: 'Isquiotibiales',
    path: 'M 108,248 Q 104,260 102,278 Q 100,296 102,314 Q 106,318 110,314 Q 112,296 112,278 Q 112,260 110,248 Z',
    keywords: ['curl femoral', 'peso muerto rumano', 'isquiotibiales'],
  },
  {
    id: 'hamstring-r',
    name: 'Isquiotibiales',
    path: 'M 192,248 Q 196,260 198,278 Q 200,296 198,314 Q 194,318 190,314 Q 188,296 188,278 Q 188,260 190,248 Z',
    keywords: ['curl femoral', 'peso muerto rumano', 'isquiotibiales'],
  },
  // --- CALVES ---
  {
    id: 'calf-l',
    name: 'Gemelos',
    path: 'M 108,326 Q 104,338 102,356 Q 102,374 106,388 Q 112,392 118,388 Q 122,374 122,356 Q 120,338 116,326 Z',
    keywords: ['gemelos', 'elevación talones', 'pantorrilla'],
  },
  {
    id: 'calf-r',
    name: 'Gemelos',
    path: 'M 192,326 Q 196,338 198,356 Q 198,374 194,388 Q 188,392 182,388 Q 178,374 178,356 Q 180,338 184,326 Z',
    keywords: ['gemelos', 'elevación talones', 'pantorrilla'],
  },
];

// Body outline path
const BODY_OUTLINE = `
  M 150,20
  Q 140,20 134,28 Q 128,36 128,48 Q 128,60 134,68 Q 138,74 142,78
  L 130,82 Q 120,86 110,92 Q 96,100 88,110 Q 82,118 78,128
  Q 74,138 70,150 Q 66,162 64,178 Q 62,194 62,210
  Q 62,220 64,228
  L 56,240 Q 52,248 52,258
  L 56,268
  Q 108,268 108,268
  Q 106,258 104,248 Q 100,238 98,228
  Q 96,218 96,208 Q 96,198 98,188
  L 108,212
  Q 106,230 104,248
  Q 100,268 98,288 Q 96,308 98,328
  Q 100,348 104,368 Q 106,382 108,392
  Q 110,400 112,408
  L 104,412 Q 98,416 94,420
  L 92,430 L 130,430
  L 132,420 Q 132,410 128,400
  Q 124,388 120,370 Q 116,350 114,330
  Q 112,310 114,290 Q 116,270 120,252
  L 150,248
  L 180,252
  Q 184,270 186,290 Q 188,310 186,330
  Q 184,350 180,370 Q 176,388 172,400
  Q 168,410 168,420
  L 170,430 L 208,430
  L 206,420 Q 202,416 196,412
  L 188,408
  Q 190,400 192,392 Q 194,382 196,368
  Q 200,348 202,328 Q 204,308 202,288
  Q 200,268 196,248
  L 192,212
  Q 202,198 204,188 Q 204,198 204,208
  Q 204,218 202,228 Q 200,238 196,248
  Q 194,258 192,268
  L 244,268
  L 248,258 Q 248,248 244,240
  L 236,228
  Q 238,220 238,210 Q 238,194 236,178
  Q 234,162 230,150 Q 226,138 222,128
  Q 218,118 212,110 Q 204,100 190,92
  Q 180,86 170,82
  L 158,78 Q 162,74 166,68
  Q 172,60 172,48 Q 172,36 166,28
  Q 160,20 150,20 Z
`;

const getProgressColor = (series: number, maxSeries: number) => {
  if (maxSeries === 0 || series === 0) return { fill: 'hsl(220 15% 40%)', opacity: 0.3 };
  const pct = Math.min(series / maxSeries, 1);
  if (pct <= 0.2) return { fill: 'hsl(220 20% 50%)', opacity: 0.4 };
  if (pct <= 0.4) return { fill: 'hsl(200 40% 50%)', opacity: 0.55 };
  if (pct <= 0.6) return { fill: 'hsl(180 50% 45%)', opacity: 0.7 };
  if (pct <= 0.8) return { fill: 'hsl(150 60% 45%)', opacity: 0.82 };
  return { fill: 'hsl(140 70% 42%)', opacity: 0.95 };
};

const getProgressLevel = (series: number, maxSeries: number): number => {
  if (maxSeries === 0 || series === 0) return 0;
  const pct = Math.min(series / maxSeries, 1);
  if (pct <= 0.2) return 1;
  if (pct <= 0.4) return 2;
  if (pct <= 0.6) return 3;
  if (pct <= 0.8) return 4;
  return 5;
};

const getScaleForProgress = (level: number) => {
  return 1 + level * 0.03; // up to ~15% at level 5
};

export const Neo2DAnatomyModel = ({ setLogs, exercises }: Neo2DAnatomyProps) => {
  const { t } = useTranslation();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const muscleSeriesData = useMemo(() => {
    const data: Record<string, number> = {};
    setLogs.forEach(log => {
      const exercise = exercises.find(ex => ex.id === log.exercise_id);
      if (!exercise) return;
      const name = exercise.name.toLowerCase();
      MUSCLES.forEach(m => {
        if (m.keywords.some(k => name.includes(k))) {
          const baseId = m.id.replace(/-[lr]$/, '');
          data[baseId] = (data[baseId] || 0) + 1;
        }
      });
    });
    return data;
  }, [setLogs, exercises]);

  const maxSeries = useMemo(() => Math.max(...Object.values(muscleSeriesData), 1), [muscleSeriesData]);

  const getSeriesForMuscle = useCallback((muscleId: string) => {
    const baseId = muscleId.replace(/-[lr]$/, '');
    return muscleSeriesData[baseId] || 0;
  }, [muscleSeriesData]);

  const selectedMuscleData = useMemo(() => {
    if (!selectedMuscle) return null;
    const muscle = MUSCLES.find(m => m.id === selectedMuscle);
    if (!muscle) return null;
    const baseId = selectedMuscle.replace(/-[lr]$/, '');
    const series = muscleSeriesData[baseId] || 0;

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    let weekly = 0, monthly = 0;

    setLogs.forEach(log => {
      const exercise = exercises.find(ex => ex.id === log.exercise_id);
      if (!exercise) return;
      const n = exercise.name.toLowerCase();
      if (!muscle.keywords.some(k => n.includes(k))) return;
      const logDate = new Date(log.logged_at);
      if (isAfter(logDate, weekStart)) weekly++;
      if (isAfter(logDate, monthStart)) monthly++;
    });

    return { muscle, series, weekly, monthly, level: getProgressLevel(series, maxSeries) };
  }, [selectedMuscle, muscleSeriesData, maxSeries, setLogs, exercises]);

  const totalSeries = useMemo(() => Object.values(muscleSeriesData).reduce((a, b) => a + b, 0), [muscleSeriesData]);
  const overallProgress = Math.min(totalSeries / Math.max(maxSeries * MUSCLES.length * 0.3, 1), 1);
  const overallScale = 1 + overallProgress * 0.2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-2"
        >
          <Target className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Anatomía Interactiva</span>
        </motion.div>
        <h2 className="text-lg font-bold text-foreground">Modelo Neo</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Toca un músculo para ver su progreso</p>
      </div>

      {/* Model container */}
      <div className="relative flex justify-center">
        <div className="relative w-full max-w-[320px] aspect-[3/4.5] rounded-2xl overflow-hidden bg-gradient-to-b from-muted/80 to-muted/40 border border-border">
          <svg
            viewBox="40 10 220 430"
            className="w-full h-full"
            style={{ filter: 'drop-shadow(0 2px 8px hsl(var(--foreground) / 0.08))' }}
          >
            {/* Body silhouette */}
            <motion.g
              animate={{ scale: overallScale }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ transformOrigin: '150px 225px' }}
            >
              {/* Base body outline */}
              <path
                d={BODY_OUTLINE}
                fill="hsl(var(--muted-foreground) / 0.12)"
                stroke="hsl(var(--muted-foreground) / 0.25)"
                strokeWidth="1"
              />

              {/* Head */}
              <ellipse cx="150" cy="48" rx="22" ry="28" fill="hsl(25 60% 72%)" stroke="hsl(25 40% 55%)" strokeWidth="0.8" />
              {/* Eyes */}
              <circle cx="142" cy="44" r="2" fill="hsl(var(--foreground) / 0.7)" />
              <circle cx="158" cy="44" r="2" fill="hsl(var(--foreground) / 0.7)" />
              {/* Mouth */}
              <path d="M 144,56 Q 150,60 156,56" stroke="hsl(var(--foreground) / 0.4)" strokeWidth="1" fill="none" />

              {/* Neck */}
              <rect x="142" y="72" width="16" height="14" rx="4" fill="hsl(25 55% 68%)" />

              {/* Muscle layers */}
              {MUSCLES.map(muscle => {
                const series = getSeriesForMuscle(muscle.id);
                const { fill, opacity } = getProgressColor(series, maxSeries);
                const level = getProgressLevel(series, maxSeries);
                const scale = getScaleForProgress(level);
                const isSelected = selectedMuscle === muscle.id;
                const baseId = muscle.id.replace(/-[lr]$/, '');

                return (
                  <motion.path
                    key={muscle.id}
                    d={muscle.path}
                    fill={isSelected ? 'hsl(0 70% 55%)' : fill}
                    fillOpacity={isSelected ? 0.85 : opacity}
                    stroke={isSelected ? 'hsl(0 80% 60%)' : 'hsl(var(--foreground) / 0.15)'}
                    strokeWidth={isSelected ? 2 : 0.6}
                    animate={{
                      scale,
                      fillOpacity: isSelected ? [0.7, 0.9, 0.7] : opacity,
                    }}
                    transition={
                      isSelected
                        ? { fillOpacity: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } }
                        : { duration: 0.5 }
                    }
                    style={{
                      transformOrigin: '150px 225px',
                      cursor: 'pointer',
                      filter: isSelected ? 'drop-shadow(0 0 6px hsl(0 80% 60% / 0.6))' : level >= 4 ? 'drop-shadow(0 1px 3px hsl(var(--foreground) / 0.15))' : 'none',
                    }}
                    onClick={() => setSelectedMuscle(isSelected ? null : muscle.id)}
                    whileHover={{ fillOpacity: Math.min(opacity + 0.2, 1), strokeWidth: 1.5 }}
                    whileTap={{ scale: scale * 1.05 }}
                  />
                );
              })}
            </motion.g>

            {/* Abs center line */}
            <line x1="150" y1="158" x2="150" y2="212" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.5" />
            {/* Abs horizontal lines */}
            <line x1="136" y1="175" x2="164" y2="175" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="0.5" />
            <line x1="136" y1="194" x2="164" y2="194" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="0.5" />
          </svg>

          {/* Progress legend */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-[9px] text-muted-foreground">Volumen:</span>
            {[0.3, 0.45, 0.6, 0.75, 0.9].map((op, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-sm"
                style={{
                  backgroundColor: ['hsl(220 15% 40%)', 'hsl(200 40% 50%)', 'hsl(180 50% 45%)', 'hsl(150 60% 45%)', 'hsl(140 70% 42%)'][i],
                  opacity: op,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selected muscle detail panel */}
      <AnimatePresence>
        {selectedMuscleData && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <h3 className="text-sm font-bold text-foreground">{selectedMuscleData.muscle.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedMuscle(null)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <TrendingUp className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground leading-none">{selectedMuscleData.series}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Series total</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <Calendar className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground leading-none">{selectedMuscleData.weekly}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Esta semana</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <Flame className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground leading-none">{selectedMuscleData.monthly}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Este mes</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Nivel de desarrollo</span>
                  <span className="text-foreground font-semibold">{selectedMuscleData.level * 20}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedMuscleData.level * 20}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Muscle group grid */}
      <div className="bg-card border border-border rounded-xl p-3">
        <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-primary" />
          Grupos musculares
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(() => {
            const uniqueGroups: { name: string; baseId: string; series: number }[] = [];
            const seen = new Set<string>();
            MUSCLES.forEach(m => {
              const baseId = m.id.replace(/-[lr]$/, '');
              if (!seen.has(baseId)) {
                seen.add(baseId);
                uniqueGroups.push({ name: m.name, baseId, series: muscleSeriesData[baseId] || 0 });
              }
            });
            return uniqueGroups.map(({ name, baseId, series }) => {
              const { fill } = getProgressColor(series, maxSeries);
              const isActive = selectedMuscle?.replace(/-[lr]$/, '') === baseId;
              return (
                <button
                  key={baseId}
                  onClick={() => {
                    const muscle = MUSCLES.find(m => m.id.replace(/-[lr]$/, '') === baseId);
                    if (muscle) setSelectedMuscle(isActive ? null : muscle.id);
                  }}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg text-left transition-all ${
                    isActive ? 'bg-primary/15 border border-primary/30' : 'bg-muted/40 hover:bg-muted/70 border border-transparent'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
                  <span className="text-[10px] font-medium text-foreground truncate flex-1">{name}</span>
                  {series > 0 && <span className="text-[10px] text-primary font-bold">{series}</span>}
                </button>
              );
            });
          })()}
        </div>
      </div>
    </motion.div>
  );
};
