import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Activity, Eye, Info, X, Clock, Zap, FlaskConical, Dumbbell } from 'lucide-react';
import { SetLog } from '@/types/database';

// ──────────────────────────────────────────────
// Recovery config per group
// ──────────────────────────────────────────────
type RecoveryGroup = 'large' | 'medium' | 'spinal' | 'fast';

const TOTAL_RECOVERY_HOURS: Record<RecoveryGroup, number> = {
  large: 72,
  medium: 48,
  spinal: 48,
  fast: 24,
};

const RECOVERY_COLORS: Record<RecoveryGroup, { thresholds: number[]; colors: string[] }> = {
  large: { thresholds: [24, 48, 72], colors: ['#EF4444', '#F97316', '#EAB308', '#10B981'] },
  medium: { thresholds: [24, 48], colors: ['#EF4444', '#EAB308', '#10B981'] },
  spinal: { thresholds: [24, 48], colors: ['#EF4444', '#EAB308', '#10B981'] },
  fast: { thresholds: [24], colors: ['#EF4444', '#10B981'] },
};

// ──────────────────────────────────────────────
// Core calculation engine
// ──────────────────────────────────────────────
interface RecoveryResult {
  percent: number;
  color: string;
  elapsedHours: number;
  remainingHours: number;
  statusKey: string;
}

function calculateRecovery(group: RecoveryGroup, lastTrained: Date, now: number): RecoveryResult {
  const elapsedHours = (now - lastTrained.getTime()) / 3_600_000;
  const total = TOTAL_RECOVERY_HOURS[group];
  const percent = Math.min(100, Math.round((elapsedHours / total) * 100));
  const remainingHours = Math.max(0, Math.ceil(total - elapsedHours));

  const { thresholds, colors } = RECOVERY_COLORS[group];
  let color = colors[colors.length - 1];
  for (let i = 0; i < thresholds.length; i++) {
    if (elapsedHours < thresholds[i]) { color = colors[i]; break; }
  }

  let statusKey = 'fatigueMap.recovered';
  if (percent < 33) statusKey = 'fatigueMap.fatigued';
  else if (percent < 67) statusKey = 'fatigueMap.moderate';
  else if (percent < 100) statusKey = 'fatigueMap.almostReady';

  return { percent, color, elapsedHours, remainingHours, statusKey };
}

// ──────────────────────────────────────────────
// Muscle definitions
// ──────────────────────────────────────────────
interface MuscleDef {
  id: string;
  nameKey: string;
  group: RecoveryGroup;
  frontPath?: string;
  backPath?: string;
}

const FATIGUE_MUSCLES: MuscleDef[] = [
  { id: 'delt-l', nameKey: 'fatigueMap.muscles.deltL', group: 'fast',
    frontPath: 'M 108,120 Q 100,118 92,126 Q 88,134 90,142 Q 96,138 102,130 Q 108,124 108,120 Z',
    backPath: 'M 108,120 Q 100,118 92,126 Q 88,134 90,142 Q 96,138 102,130 Q 108,124 108,120 Z' },
  { id: 'delt-r', nameKey: 'fatigueMap.muscles.deltR', group: 'fast',
    frontPath: 'M 192,120 Q 200,118 208,126 Q 212,134 210,142 Q 204,138 198,130 Q 192,124 192,120 Z',
    backPath: 'M 192,120 Q 200,118 208,126 Q 212,134 210,142 Q 204,138 198,130 Q 192,124 192,120 Z' },
  { id: 'pec-l', nameKey: 'fatigueMap.muscles.pecL', group: 'large',
    frontPath: 'M 108,126 Q 110,122 125,126 Q 140,130 148,134 Q 148,152 138,157 Q 122,160 110,150 Q 104,142 108,126 Z' },
  { id: 'pec-r', nameKey: 'fatigueMap.muscles.pecR', group: 'large',
    frontPath: 'M 192,126 Q 190,122 175,126 Q 160,130 152,134 Q 152,152 162,157 Q 178,160 190,150 Q 196,142 192,126 Z' },
  { id: 'lat-l', nameKey: 'fatigueMap.muscles.latL', group: 'large',
    frontPath: 'M 100,144 Q 96,150 94,162 Q 92,178 96,188 Q 102,182 106,172 Q 108,160 106,150 Q 104,146 100,144 Z',
    backPath: 'M 108,130 Q 100,140 96,160 Q 94,180 98,196 Q 108,200 118,196 Q 126,186 130,170 Q 132,154 128,140 Q 122,130 108,130 Z' },
  { id: 'lat-r', nameKey: 'fatigueMap.muscles.latR', group: 'large',
    frontPath: 'M 200,144 Q 204,150 206,162 Q 208,178 204,188 Q 198,182 194,172 Q 192,160 194,150 Q 196,146 200,144 Z',
    backPath: 'M 192,130 Q 200,140 204,160 Q 206,180 202,196 Q 192,200 182,196 Q 174,186 170,170 Q 168,154 172,140 Q 178,130 192,130 Z' },
  { id: 'trap', nameKey: 'fatigueMap.muscles.trap', group: 'large',
    frontPath: 'M 128,106 Q 140,102 150,102 Q 160,102 172,106 Q 170,116 162,120 Q 150,122 138,120 Q 130,116 128,106 Z',
    backPath: 'M 126,100 Q 138,94 150,94 Q 162,94 174,100 Q 176,118 168,130 Q 158,138 150,138 Q 142,138 132,130 Q 124,118 126,100 Z' },
  { id: 'biceps-l', nameKey: 'fatigueMap.muscles.bicepsL', group: 'medium',
    frontPath: 'M 84,146 Q 78,152 76,164 Q 74,178 76,188 Q 82,190 86,186 Q 88,176 88,164 Q 88,154 84,146 Z' },
  { id: 'biceps-r', nameKey: 'fatigueMap.muscles.bicepsR', group: 'medium',
    frontPath: 'M 216,146 Q 222,152 224,164 Q 226,178 224,188 Q 218,190 214,186 Q 212,176 212,164 Q 212,154 216,146 Z' },
  { id: 'triceps-l', nameKey: 'fatigueMap.muscles.tricepsL', group: 'medium',
    backPath: 'M 82,146 Q 76,154 74,168 Q 72,182 74,192 Q 80,194 84,190 Q 86,180 86,168 Q 86,156 82,146 Z' },
  { id: 'triceps-r', nameKey: 'fatigueMap.muscles.tricepsR', group: 'medium',
    backPath: 'M 218,146 Q 224,154 226,168 Q 228,182 226,192 Q 220,194 216,190 Q 214,180 214,168 Q 214,156 218,146 Z' },
  { id: 'abs', nameKey: 'fatigueMap.muscles.abs', group: 'fast',
    frontPath: 'M 132,156 L 168,156 L 168,214 Q 162,218 150,218 Q 138,218 132,214 Z' },
  { id: 'oblique-l', nameKey: 'fatigueMap.muscles.obliqueL', group: 'fast',
    frontPath: 'M 110,160 Q 108,170 108,184 Q 110,200 116,214 Q 124,216 130,214 Q 132,200 132,184 Q 132,170 130,160 Q 122,158 114,158 Z' },
  { id: 'oblique-r', nameKey: 'fatigueMap.muscles.obliqueR', group: 'fast',
    frontPath: 'M 190,160 Q 192,170 192,184 Q 190,200 184,214 Q 176,216 170,214 Q 168,200 168,184 Q 168,170 170,160 Q 178,158 186,158 Z' },
  { id: 'glute-l', nameKey: 'fatigueMap.muscles.gluteL', group: 'large',
    backPath: 'M 118,214 Q 112,220 108,234 Q 108,248 116,254 Q 126,258 136,254 Q 142,248 142,234 Q 140,222 132,214 Z' },
  { id: 'glute-r', nameKey: 'fatigueMap.muscles.gluteR', group: 'large',
    backPath: 'M 182,214 Q 188,220 192,234 Q 192,248 184,254 Q 174,258 164,254 Q 158,248 158,234 Q 160,222 168,214 Z' },
  { id: 'glute-med-l', nameKey: 'fatigueMap.muscles.gluteMedL', group: 'medium',
    backPath: 'M 108,200 Q 102,208 100,218 Q 102,228 110,232 Q 118,228 120,218 Q 118,208 112,200 Z' },
  { id: 'glute-med-r', nameKey: 'fatigueMap.muscles.gluteMedR', group: 'medium',
    backPath: 'M 192,200 Q 198,208 200,218 Q 198,228 190,232 Q 182,228 180,218 Q 182,208 188,200 Z' },
  { id: 'quad-l', nameKey: 'fatigueMap.muscles.quadL', group: 'large',
    frontPath: 'M 114,248 Q 108,262 106,284 Q 104,308 108,326 Q 114,332 122,328 Q 130,322 132,300 Q 132,278 128,260 Q 124,248 114,248 Z' },
  { id: 'quad-r', nameKey: 'fatigueMap.muscles.quadR', group: 'large',
    frontPath: 'M 186,248 Q 192,262 194,284 Q 196,308 192,326 Q 186,332 178,328 Q 170,322 168,300 Q 168,278 172,260 Q 176,248 186,248 Z' },
  { id: 'hamstring-l', nameKey: 'fatigueMap.muscles.hamstringL', group: 'large',
    backPath: 'M 112,258 Q 106,270 104,290 Q 102,312 106,330 Q 112,336 120,332 Q 126,324 128,304 Q 128,282 124,266 Q 120,258 112,258 Z' },
  { id: 'hamstring-r', nameKey: 'fatigueMap.muscles.hamstringR', group: 'large',
    backPath: 'M 188,258 Q 194,270 196,290 Q 198,312 194,330 Q 188,336 180,332 Q 174,324 172,304 Q 172,282 176,266 Q 180,258 188,258 Z' },
  { id: 'adductor-l', nameKey: 'fatigueMap.muscles.adductorL', group: 'large',
    frontPath: 'M 130,248 Q 136,260 140,278 Q 142,298 140,316 Q 136,322 132,316 Q 130,298 130,278 Q 130,262 130,248 Z' },
  { id: 'adductor-r', nameKey: 'fatigueMap.muscles.adductorR', group: 'large',
    frontPath: 'M 170,248 Q 164,260 160,278 Q 158,298 160,316 Q 164,322 168,316 Q 170,298 170,278 Q 170,262 170,248 Z' },
  { id: 'calf-l', nameKey: 'fatigueMap.muscles.calfL', group: 'medium',
    frontPath: 'M 108,332 Q 104,344 102,362 Q 102,380 106,392 Q 112,396 118,392 Q 122,380 122,362 Q 120,344 116,332 Z',
    backPath: 'M 106,336 Q 100,350 98,370 Q 98,388 104,400 Q 112,404 120,400 Q 126,388 126,370 Q 124,350 118,336 Z' },
  { id: 'calf-r', nameKey: 'fatigueMap.muscles.calfR', group: 'medium',
    frontPath: 'M 192,332 Q 196,344 198,362 Q 198,380 194,392 Q 188,396 182,392 Q 178,380 178,362 Q 180,344 184,332 Z',
    backPath: 'M 194,336 Q 200,350 202,370 Q 202,388 196,400 Q 188,404 180,400 Q 174,388 174,370 Q 176,350 182,336 Z' },
  { id: 'tibialis-l', nameKey: 'fatigueMap.muscles.tibialisL', group: 'medium',
    frontPath: 'M 118,334 Q 122,348 124,366 Q 124,384 122,396 Q 118,398 114,396 Q 114,384 114,366 Q 114,348 118,334 Z' },
  { id: 'tibialis-r', nameKey: 'fatigueMap.muscles.tibialisR', group: 'medium',
    frontPath: 'M 182,334 Q 178,348 176,366 Q 176,384 178,396 Q 182,398 186,396 Q 186,384 186,366 Q 186,348 182,334 Z' },
  { id: 'lower-back', nameKey: 'fatigueMap.muscles.lowerBack', group: 'spinal',
    backPath: 'M 134,140 Q 130,160 130,186 Q 132,208 140,218 Q 148,222 150,222 Q 152,222 160,218 Q 168,208 170,186 Q 170,160 166,140 Q 158,136 150,136 Q 142,136 134,140 Z' },
];

// ──────────────────────────────────────────────
// Exercise name → fatigue muscle ID mapping
// Maps keywords in exercise names to fatigue muscle IDs
// Both left/right sides are updated together
// ──────────────────────────────────────────────
const EXERCISE_TO_FATIGUE_MUSCLES: Record<string, string[]> = {
  // Chest
  'press banca': ['pec-l', 'pec-r'],
  'press inclinado': ['pec-l', 'pec-r'],
  'press declinado': ['pec-l', 'pec-r'],
  'aperturas': ['pec-l', 'pec-r'],
  'cruces': ['pec-l', 'pec-r'],
  'fondos': ['pec-l', 'pec-r', 'triceps-l', 'triceps-r'],
  'push up': ['pec-l', 'pec-r', 'triceps-l', 'triceps-r'],
  'flexiones': ['pec-l', 'pec-r', 'triceps-l', 'triceps-r'],
  'chest': ['pec-l', 'pec-r'],
  'pectoral': ['pec-l', 'pec-r'],
  'pecho': ['pec-l', 'pec-r'],
  'bench': ['pec-l', 'pec-r'],
  'fly': ['pec-l', 'pec-r'],

  // Back
  'dominadas': ['lat-l', 'lat-r', 'biceps-l', 'biceps-r'],
  'jalón': ['lat-l', 'lat-r'],
  'remo': ['lat-l', 'lat-r', 'trap'],
  'pull over': ['lat-l', 'lat-r'],
  'face pull': ['trap', 'delt-l', 'delt-r'],
  'pulldown': ['lat-l', 'lat-r'],
  'lat pulldown': ['lat-l', 'lat-r'],
  'pull-up': ['lat-l', 'lat-r', 'biceps-l', 'biceps-r'],
  'chin up': ['lat-l', 'lat-r', 'biceps-l', 'biceps-r'],
  'row': ['lat-l', 'lat-r', 'trap'],
  'dorsal': ['lat-l', 'lat-r'],
  'espalda': ['lat-l', 'lat-r', 'trap'],

  // Deadlift variations
  'peso muerto': ['lower-back', 'hamstring-l', 'hamstring-r', 'glute-l', 'glute-r', 'trap'],
  'peso muerto rumano': ['hamstring-l', 'hamstring-r', 'glute-l', 'glute-r', 'lower-back'],
  'deadlift': ['lower-back', 'hamstring-l', 'hamstring-r', 'glute-l', 'glute-r', 'trap'],
  'rdl': ['hamstring-l', 'hamstring-r', 'glute-l', 'glute-r', 'lower-back'],

  // Shoulders
  'press militar': ['delt-l', 'delt-r'],
  'press hombro': ['delt-l', 'delt-r'],
  'elevaciones laterales': ['delt-l', 'delt-r'],
  'elevaciones frontales': ['delt-l', 'delt-r'],
  'pájaros': ['delt-l', 'delt-r'],
  'encogimientos': ['trap'],
  'lateral raise': ['delt-l', 'delt-r'],
  'shoulder press': ['delt-l', 'delt-r'],
  'overhead press': ['delt-l', 'delt-r'],
  'ohp': ['delt-l', 'delt-r'],
  'hombro': ['delt-l', 'delt-r'],
  'deltoid': ['delt-l', 'delt-r'],
  'shrug': ['trap'],

  // Arms
  'curl': ['biceps-l', 'biceps-r'],
  'curl bíceps': ['biceps-l', 'biceps-r'],
  'curl martillo': ['biceps-l', 'biceps-r'],
  'curl predicador': ['biceps-l', 'biceps-r'],
  'bíceps': ['biceps-l', 'biceps-r'],
  'biceps': ['biceps-l', 'biceps-r'],
  'extensiones tríceps': ['triceps-l', 'triceps-r'],
  'press francés': ['triceps-l', 'triceps-r'],
  'fondos en banco': ['triceps-l', 'triceps-r'],
  'tríceps': ['triceps-l', 'triceps-r'],
  'triceps': ['triceps-l', 'triceps-r'],
  'tricep': ['triceps-l', 'triceps-r'],
  'skull crusher': ['triceps-l', 'triceps-r'],
  'pushdown': ['triceps-l', 'triceps-r'],
  'kickback': ['triceps-l', 'triceps-r'],

  // Legs
  'sentadillas': ['quad-l', 'quad-r', 'glute-l', 'glute-r'],
  'sentadilla': ['quad-l', 'quad-r', 'glute-l', 'glute-r'],
  'prensa': ['quad-l', 'quad-r', 'glute-l', 'glute-r'],
  'extensiones': ['quad-l', 'quad-r'],
  'extensión de pierna': ['quad-l', 'quad-r'],
  'leg extension': ['quad-l', 'quad-r'],
  'leg press': ['quad-l', 'quad-r', 'glute-l', 'glute-r'],
  'squat': ['quad-l', 'quad-r', 'glute-l', 'glute-r'],
  'cuádriceps': ['quad-l', 'quad-r'],
  'quads': ['quad-l', 'quad-r'],

  'curl femoral': ['hamstring-l', 'hamstring-r'],
  'leg curl': ['hamstring-l', 'hamstring-r'],
  'isquios': ['hamstring-l', 'hamstring-r'],
  'hamstring': ['hamstring-l', 'hamstring-r'],
  'femoral': ['hamstring-l', 'hamstring-r'],

  'zancadas': ['quad-l', 'quad-r', 'glute-l', 'glute-r'],
  'lunge': ['quad-l', 'quad-r', 'glute-l', 'glute-r'],
  'hip thrust': ['glute-l', 'glute-r', 'hamstring-l', 'hamstring-r'],
  'glúteo': ['glute-l', 'glute-r'],
  'glute': ['glute-l', 'glute-r'],

  'abductor': ['adductor-l', 'adductor-r'],
  'aductor': ['adductor-l', 'adductor-r'],
  'adductor': ['adductor-l', 'adductor-r'],

  'elevación talones': ['calf-l', 'calf-r'],
  'gemelos': ['calf-l', 'calf-r'],
  'calf raise': ['calf-l', 'calf-r'],
  'calves': ['calf-l', 'calf-r'],
  'tibial': ['tibialis-l', 'tibialis-r'],

  // Core
  'crunch': ['abs', 'oblique-l', 'oblique-r'],
  'plancha': ['abs', 'oblique-l', 'oblique-r'],
  'russian twist': ['oblique-l', 'oblique-r'],
  'elevación piernas': ['abs'],
  'ab wheel': ['abs'],
  'abdomen': ['abs', 'oblique-l', 'oblique-r'],
  'abdominal': ['abs', 'oblique-l', 'oblique-r'],
  'oblicuo': ['oblique-l', 'oblique-r'],
  'oblique': ['oblique-l', 'oblique-r'],

  // Erectors / Lower back
  'hiperextensiones': ['lower-back'],
  'hiperextensión': ['lower-back'],
  'lumbar': ['lower-back'],
  'good morning': ['lower-back', 'hamstring-l', 'hamstring-r'],
  'back extension': ['lower-back'],
  'erector': ['lower-back'],
};

function mapExerciseToFatigueMuscles(exerciseName: string): string[] {
  const name = exerciseName.toLowerCase();
  // Try longer keys first for more specific matches
  const sortedKeys = Object.keys(EXERCISE_TO_FATIGUE_MUSCLES).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (name.includes(key)) {
      return EXERCISE_TO_FATIGUE_MUSCLES[key];
    }
  }
  return [];
}

// ──────────────────────────────────────────────
// Body outline
// ──────────────────────────────────────────────
const BODY_OUTLINE = `
  M 150,20
  Q 140,20 134,28 Q 128,36 128,48 Q 128,60 134,68 Q 138,74 142,78
  L 130,82 Q 120,86 110,92 Q 96,100 88,110 Q 82,118 78,128
  Q 74,138 70,150 Q 66,162 64,178 Q 62,194 62,210
  Q 62,220 64,228
  L 56,240 Q 52,248 52,258 L 56,268
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

// ──────────────────────────────────────────────
// Component Props
// ──────────────────────────────────────────────
interface ExerciseInfo {
  id: string;
  name: string;
}

interface NeoFatigueMapProps {
  setLogs?: SetLog[];
  exercises?: ExerciseInfo[];
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export const NeoFatigueMap = ({ setLogs = [], exercises = [] }: NeoFatigueMapProps) => {
  const { t } = useTranslation();
  const [fatigueMode, setFatigueMode] = useState(false);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(
    () => localStorage.getItem('neo-fatigue-disclaimer') === 'dismissed'
  );
  const [timeOffset, setTimeOffset] = useState(0); // debug: ms offset

  // Real-time tick every 60s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now() + timeOffset;

  // ──────────────────────────────────────────
  // Compute lastTrained from real set_logs data
  // ──────────────────────────────────────────
  const lastTrained = useMemo(() => {
    const result: Record<string, Date> = {};

    if (setLogs.length === 0 || exercises.length === 0) return result;

    // Build exercise id → name map
    const exerciseNameMap = new Map<string, string>();
    for (const ex of exercises) {
      exerciseNameMap.set(ex.id, ex.name);
    }

    // For each set log, find the muscles it targets and track the most recent date
    for (const log of setLogs) {
      const exerciseName = exerciseNameMap.get(log.exercise_id);
      if (!exerciseName) continue;

      const muscles = mapExerciseToFatigueMuscles(exerciseName);
      if (muscles.length === 0) continue;

      const logDate = new Date(log.logged_at);

      for (const muscleId of muscles) {
        const existing = result[muscleId];
        if (!existing || logDate > existing) {
          result[muscleId] = logDate;
        }
      }
    }

    return result;
  }, [setLogs, exercises]);

  const hasRealData = Object.keys(lastTrained).length > 0;

  const recoveryMap = useMemo(() => {
    const map: Record<string, RecoveryResult> = {};
    for (const m of FATIGUE_MUSCLES) {
      const date = lastTrained[m.id];
      if (date) map[m.id] = calculateRecovery(m.group, date, now);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTrained, now, tick]);

  const visibleMuscles = useMemo(
    () => FATIGUE_MUSCLES.filter(m => (view === 'front' ? m.frontPath : m.backPath)),
    [view]
  );

  const dismissDisclaimer = useCallback(() => {
    setDisclaimerDismissed(true);
    localStorage.setItem('neo-fatigue-disclaimer', 'dismissed');
  }, []);

  const addTimeOffset = useCallback((hours: number) => {
    setTimeOffset(prev => prev + hours * 3_600_000);
  }, []);

  const BASE_FILL = 'hsl(var(--muted-foreground) / 0.18)';
  const isDev = import.meta.env.DEV;

  return (
    <TooltipProvider delayDuration={100}>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{t('fatigueMap.title')}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t('fatigueMap.subtitle')}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['front', 'back'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === v ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(v === 'front' ? 'fatigueMap.front' : 'fatigueMap.back')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Neo</span>
            <Switch checked={fatigueMode} onCheckedChange={setFatigueMode} />
            <span className={`text-xs font-medium ${fatigueMode ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('fatigueMap.fatigue')}
            </span>
          </div>
        </div>

        {/* No data notice */}
        {fatigueMode && !hasRealData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert className="bg-muted/50 border-border">
              <Info className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-xs text-muted-foreground">
                {t('fatigueMap.noData')}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Health Disclaimer */}
        <AnimatePresence>
          {fatigueMode && !disclaimerDismissed && hasRealData && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Alert className="bg-accent/30 border-accent/50 relative">
                <Info className="h-4 w-4 text-accent-foreground" />
                <AlertDescription className="text-xs text-muted-foreground pr-6">
                  {t('fatigueMap.disclaimer')}
                </AlertDescription>
                <button onClick={dismissDisclaimer} className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted/50 transition-colors">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        {fatigueMode && hasRealData && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-center gap-3 flex-wrap">
            {[
              { color: '#EF4444', label: t('fatigueMap.fatigued') },
              { color: '#F97316', label: t('fatigueMap.moderate') },
              { color: '#EAB308', label: t('fatigueMap.almostReady') },
              { color: '#10B981', label: t('fatigueMap.recovered') },
            ].map(item => (
              <div key={item.color} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* SVG Body */}
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-[320px] aspect-[3/4.5] rounded-2xl overflow-hidden bg-gradient-to-b from-muted/80 to-muted/40 border border-border">
            <svg viewBox="40 10 220 430" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 8px hsl(var(--foreground) / 0.08))' }}>
              <path d={BODY_OUTLINE} fill="hsl(var(--muted-foreground) / 0.1)" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth="1" />
              <ellipse cx="150" cy="48" rx="22" ry="28" fill="hsl(25 60% 72%)" stroke="hsl(25 40% 55%)" strokeWidth="0.8" />
              <circle cx="142" cy="44" r="2" fill="hsl(var(--foreground) / 0.7)" />
              <circle cx="158" cy="44" r="2" fill="hsl(var(--foreground) / 0.7)" />
              <path d="M 144,56 Q 150,60 156,56" stroke="hsl(var(--foreground) / 0.4)" strokeWidth="1" fill="none" />
              <rect x="142" y="72" width="16" height="14" rx="4" fill="hsl(25 55% 68%)" />

              {visibleMuscles.map(muscle => {
                const path = view === 'front' ? muscle.frontPath! : muscle.backPath!;
                const recovery = recoveryMap[muscle.id];
                const fill = fatigueMode && recovery ? recovery.color : BASE_FILL;
                const isHovered = hoveredMuscle === muscle.id;

                return (
                  <Tooltip key={muscle.id}>
                    <TooltipTrigger asChild>
                      <motion.path
                        d={path}
                        fill={fill}
                        fillOpacity={fatigueMode ? (isHovered ? 1 : 0.75) : (isHovered ? 0.5 : 0.3)}
                        stroke={isHovered ? 'hsl(var(--foreground) / 0.6)' : 'hsl(var(--foreground) / 0.12)'}
                        strokeWidth={isHovered ? 1.5 : 0.6}
                        style={{ cursor: 'pointer', transition: 'fill 0.3s, fill-opacity 0.2s, stroke 0.2s' }}
                        onMouseEnter={() => setHoveredMuscle(muscle.id)}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => setHoveredMuscle(muscle.id === hoveredMuscle ? null : muscle.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px]">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-xs">{t(muscle.nameKey)}</p>
                        {fatigueMode && recovery ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: recovery.color }} />
                              <span className="text-[11px] font-medium">{t(recovery.statusKey)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Zap className="w-3 h-3" />
                              <span>{t('fatigueMap.recoveryPercent', { percent: recovery.percent })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                {recovery.remainingHours > 0
                                  ? t('fatigueMap.timeRemaining', { hours: recovery.remainingHours })
                                  : t('fatigueMap.readyToTrain')}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {Math.round(recovery.elapsedHours)}h {t('fatigueMap.sinceLastTrain')}
                            </p>
                          </>
                        ) : fatigueMode && !recovery ? (
                          <p className="text-[10px] text-muted-foreground">{t('fatigueMap.noDataMuscle')}</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">{t('fatigueMap.enableFatigue')}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </svg>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-background/80 border border-border text-muted-foreground backdrop-blur-sm flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {t(view === 'front' ? 'fatigueMap.frontView' : 'fatigueMap.backView')}
              </span>
            </div>
          </div>
        </div>

        {/* Debug Panel — DEV only */}
        {isDev && fatigueMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl border border-dashed border-accent bg-accent/10 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-accent-foreground">
              <FlaskConical className="w-3.5 h-3.5" />
              {t('fatigueMap.debugTitle')}
            </div>

            {/* Time warp buttons */}
            <div className="flex flex-wrap gap-2">
              {[1, 12, 24, 48].map(h => (
                <button
                  key={h}
                  onClick={() => addTimeOffset(h)}
                  className="px-2.5 py-1 text-[11px] rounded-md bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors"
                >
                  +{h}h
                </button>
              ))}
              <button
                onClick={() => setTimeOffset(0)}
                className="px-2.5 py-1 text-[11px] rounded-md bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive transition-colors"
              >
                Reset
              </button>
            </div>

            {timeOffset > 0 && (
              <p className="text-[10px] text-muted-foreground">
                ⏱ {t('fatigueMap.debugOffset', { hours: Math.round(timeOffset / 3_600_000) })}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
};
