import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, eachDayOfInterval, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  ChevronDown, ChevronLeft, Sparkles, Calendar, TrendingUp,
  UtensilsCrossed, Dumbbell, Moon, Pill, Droplets, Clock, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NutritionGoals } from '@/hooks/useNutritionData';
import {
  calcGeneralAccuracy,
  calcTimeAccuracy,
  calcRepsRangeAccuracy,
  calcSetsAccuracy,
  calcGlobalAccuracy,
  getAccuracyTextColor,
  getAccuracyBgColor,
  getAdherenceColor,
} from '../nutrition/adherenceCalculations';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   MOCK DATA — Microciclo 5 días basado en programa real
   Push-Legs-Pull-Legs 2 + Descanso
   Goals: 2700kcal · 180P · 250C · 115F
   Supps: Creatina 5g, Proteína 30g
   ═══════════════════════════════════════════════════════ */

const createMockMicrocycleData = (baseDate?: string): DayData[] => {
  const base = baseDate ? parseISO(baseDate) : addDays(new Date(), -4);
  const d = (offset: number) => format(addDays(base, offset), 'yyyy-MM-dd');
  const df = (offset: number) => format(addDays(base, offset), 'd MMM', { locale: es });
  const dt = (offset: number, time: string) => `${d(offset)}T${time}`;

  return [
    // ── DÍA 1: PUSH — Excelente (97%) ──
    {
      date: d(0), dateFormatted: `${df(0)} · PUSH`,
      nutritionAcc: 97, trainingAcc: 98, sleepAcc: 96, suppAcc: 100, globalAcc: 97,
      sleepData: { planned: '23:00', real: '23:10', hoursPlanned: 8, hoursReal: 7.8 },
      foodLogs: [
        { food_name: 'Avena con whey y plátano', meal_type: 'Desayuno', protein: 45, carbs: 65, fat: 10, calories: 530, logged_date: d(0) },
        { food_name: 'Arroz con pollo y aguacate', meal_type: 'Comida', protein: 55, carbs: 80, fat: 28, calories: 780, logged_date: d(0) },
        { food_name: 'Yogur griego con nueces', meal_type: 'Merienda', protein: 22, carbs: 20, fat: 18, calories: 330, logged_date: d(0) },
        { food_name: 'Salmón con boniato y brócoli', meal_type: 'Cena', protein: 48, carbs: 60, fat: 22, calories: 620, logged_date: d(0) },
        { food_name: 'Batido nocturno caseína', meal_type: 'Snack', protein: 12, carbs: 18, fat: 35, calories: 430, logged_date: d(0) },
      ],
      setLogs: [
        { exercise_id: 'push1a', reps: 15, weight: 10, rir: 2, is_warmup: false, logged_at: dt(0, '10:00:00'), exercises: { name: 'Elevaciones laterales en polea', series: 3, reps: '12-15' } },
        { exercise_id: 'push1a', reps: 14, weight: 10, rir: 1, is_warmup: false, logged_at: dt(0, '10:03:00'), exercises: { name: 'Elevaciones laterales en polea', series: 3, reps: '12-15' } },
        { exercise_id: 'push1a', reps: 13, weight: 10, rir: 1, is_warmup: false, logged_at: dt(0, '10:06:00'), exercises: { name: 'Elevaciones laterales en polea', series: 3, reps: '12-15' } },
        { exercise_id: 'push1b', reps: 10, weight: 60, rir: 2, is_warmup: false, logged_at: dt(0, '10:12:00'), exercises: { name: 'Press inclinado en máquina', series: 3, reps: '8-12' } },
        { exercise_id: 'push1b', reps: 9, weight: 60, rir: 1, is_warmup: false, logged_at: dt(0, '10:16:00'), exercises: { name: 'Press inclinado en máquina', series: 3, reps: '8-12' } },
        { exercise_id: 'push1b', reps: 8, weight: 60, rir: 1, is_warmup: false, logged_at: dt(0, '10:20:00'), exercises: { name: 'Press inclinado en máquina', series: 3, reps: '8-12' } },
        { exercise_id: 'push1c', reps: 8, weight: 32, rir: 2, is_warmup: false, logged_at: dt(0, '10:28:00'), exercises: { name: 'Press plano con mancuernas a 30°', series: 3, reps: '6-12' } },
        { exercise_id: 'push1c', reps: 11, weight: 28, rir: 1, is_warmup: false, logged_at: dt(0, '10:32:00'), exercises: { name: 'Press plano con mancuernas a 30°', series: 3, reps: '6-12' } },
        { exercise_id: 'push1c', reps: 10, weight: 28, rir: 1, is_warmup: false, logged_at: dt(0, '10:36:00'), exercises: { name: 'Press plano con mancuernas a 30°', series: 3, reps: '6-12' } },
        { exercise_id: 'push1d', reps: 14, weight: 15, rir: 2, is_warmup: false, logged_at: dt(0, '10:44:00'), exercises: { name: 'Cruces en polea', series: 2, reps: '10-15' } },
        { exercise_id: 'push1d', reps: 12, weight: 15, rir: 1, is_warmup: false, logged_at: dt(0, '10:48:00'), exercises: { name: 'Cruces en polea', series: 2, reps: '10-15' } },
        { exercise_id: 'push1e', reps: 15, weight: 25, rir: 2, is_warmup: false, logged_at: dt(0, '10:54:00'), exercises: { name: 'Extensión tríceps barra', series: 2, reps: '12-15' } },
        { exercise_id: 'push1e', reps: 13, weight: 25, rir: 1, is_warmup: false, logged_at: dt(0, '10:58:00'), exercises: { name: 'Extensión tríceps barra', series: 2, reps: '12-15' } },
        { exercise_id: 'push1f', reps: 12, weight: 12, rir: 2, is_warmup: false, logged_at: dt(0, '11:04:00'), exercises: { name: 'Ext. tríceps katana', series: 2, reps: '10-12' } },
        { exercise_id: 'push1f', reps: 11, weight: 12, rir: 1, is_warmup: false, logged_at: dt(0, '11:08:00'), exercises: { name: 'Ext. tríceps katana', series: 2, reps: '10-12' } },
      ],
      suppLogs: [
        { supplement_id: 's1', logged_date: d(0), name: 'Creatina 5g' },
        { supplement_id: 's2', logged_date: d(0), name: 'Proteína 30g' },
      ],
      hasData: true,
    },

    // ── DÍA 2: LEGS — Bueno con fallos (91%) ──
    {
      date: d(1), dateFormatted: `${df(1)} · LEGS`,
      nutritionAcc: 90, trainingAcc: 92, sleepAcc: 90, suppAcc: 100, globalAcc: 91,
      sleepData: { planned: '23:00', real: '00:05', hoursPlanned: 8, hoursReal: 7 },
      foodLogs: [
        { food_name: 'Tostadas con huevo y aguacate', meal_type: 'Desayuno', protein: 30, carbs: 45, fat: 22, calories: 490, logged_date: d(1) },
        { food_name: 'Pasta con ternera y verduras', meal_type: 'Comida', protein: 50, carbs: 85, fat: 18, calories: 690, logged_date: d(1) },
        { food_name: 'Batido proteínas con avena', meal_type: 'Merienda', protein: 35, carbs: 40, fat: 8, calories: 370, logged_date: d(1) },
        { food_name: 'Tortilla con ensalada', meal_type: 'Cena', protein: 35, carbs: 15, fat: 25, calories: 420, logged_date: d(1) },
        { food_name: 'Pan con mantequilla cacahuete', meal_type: 'Snack', protein: 12, carbs: 30, fat: 20, calories: 340, logged_date: d(1) },
      ],
      setLogs: [
        { exercise_id: 'legs1a', reps: 15, weight: 0, rir: 2, is_warmup: false, logged_at: dt(1, '17:00:00'), exercises: { name: 'AB crunch / Dragons', series: 3, reps: '12-15' } },
        { exercise_id: 'legs1a', reps: 13, weight: 0, rir: 1, is_warmup: false, logged_at: dt(1, '17:03:00'), exercises: { name: 'AB crunch / Dragons', series: 3, reps: '12-15' } },
        { exercise_id: 'legs1a', reps: 12, weight: 0, rir: 1, is_warmup: false, logged_at: dt(1, '17:06:00'), exercises: { name: 'AB crunch / Dragons', series: 3, reps: '12-15' } },
        { exercise_id: 'legs1b', reps: 12, weight: 60, rir: 2, is_warmup: false, logged_at: dt(1, '17:12:00'), exercises: { name: 'Abductor en máquina', series: 3, reps: '10-12' } },
        { exercise_id: 'legs1b', reps: 11, weight: 60, rir: 1, is_warmup: false, logged_at: dt(1, '17:16:00'), exercises: { name: 'Abductor en máquina', series: 3, reps: '10-12' } },
        { exercise_id: 'legs1b', reps: 9, weight: 60, rir: 0, is_warmup: false, logged_at: dt(1, '17:20:00'), exercises: { name: 'Abductor en máquina', series: 3, reps: '10-12' } },
        { exercise_id: 'legs1c', reps: 14, weight: 40, rir: 2, is_warmup: false, logged_at: dt(1, '17:26:00'), exercises: { name: 'Isquios en máquina', series: 3, reps: '10-15' } },
        { exercise_id: 'legs1c', reps: 12, weight: 40, rir: 1, is_warmup: false, logged_at: dt(1, '17:30:00'), exercises: { name: 'Isquios en máquina', series: 3, reps: '10-15' } },
        { exercise_id: 'legs1c', reps: 10, weight: 40, rir: 0, is_warmup: false, logged_at: dt(1, '17:34:00'), exercises: { name: 'Isquios en máquina', series: 3, reps: '10-15' } },
        { exercise_id: 'legs1d', reps: 14, weight: 50, rir: 2, is_warmup: false, logged_at: dt(1, '17:40:00'), exercises: { name: 'Extensión cuádriceps', series: 3, reps: '10-15' } },
        { exercise_id: 'legs1d', reps: 12, weight: 50, rir: 1, is_warmup: false, logged_at: dt(1, '17:44:00'), exercises: { name: 'Extensión cuádriceps', series: 3, reps: '10-15' } },
        { exercise_id: 'legs1d', reps: 10, weight: 50, rir: 0, is_warmup: false, logged_at: dt(1, '17:48:00'), exercises: { name: 'Extensión cuádriceps', series: 3, reps: '10-15' } },
        { exercise_id: 'legs1e', reps: 10, weight: 180, rir: 2, is_warmup: false, logged_at: dt(1, '17:56:00'), exercises: { name: 'Prensa', series: 2, reps: '8-12' } },
        { exercise_id: 'legs1e', reps: 9, weight: 180, rir: 1, is_warmup: false, logged_at: dt(1, '18:00:00'), exercises: { name: 'Prensa', series: 2, reps: '8-12' } },
        { exercise_id: 'legs1f', reps: 8, weight: 20, rir: 2, is_warmup: false, logged_at: dt(1, '18:08:00'), exercises: { name: 'Sentadilla búlgara', series: 3, reps: '6-10' } },
        { exercise_id: 'legs1f', reps: 7, weight: 20, rir: 1, is_warmup: false, logged_at: dt(1, '18:12:00'), exercises: { name: 'Sentadilla búlgara', series: 3, reps: '6-10' } },
        { exercise_id: 'legs1f', reps: 6, weight: 20, rir: 0, is_warmup: false, logged_at: dt(1, '18:16:00'), exercises: { name: 'Sentadilla búlgara', series: 3, reps: '6-10' } },
      ],
      suppLogs: [
        { supplement_id: 's1', logged_date: d(1), name: 'Creatina 5g' },
        { supplement_id: 's2', logged_date: d(1), name: 'Proteína 30g' },
      ],
      hasData: true,
    },

    // ── DÍA 3: PULL — Desastroso (54%) ──
    {
      date: d(2), dateFormatted: `${df(2)} · PULL`,
      nutritionAcc: 52, trainingAcc: 60, sleepAcc: 50, suppAcc: 50, globalAcc: 54,
      sleepData: { planned: '23:00', real: '03:00', hoursPlanned: 8, hoursReal: 4.5 },
      foodLogs: [
        { food_name: 'Café con galletas', meal_type: 'Desayuno', protein: 4, carbs: 45, fat: 12, calories: 300, logged_date: d(2) },
        { food_name: 'Bocadillo de jamón', meal_type: 'Comida', protein: 22, carbs: 55, fat: 14, calories: 430, logged_date: d(2) },
      ],
      setLogs: [
        { exercise_id: 'pull1a', reps: 11, weight: 10, rir: 0, is_warmup: false, logged_at: dt(2, '20:00:00'), exercises: { name: 'Elevaciones laterales DB', series: 3, reps: '12-15' } },
        { exercise_id: 'pull1a', reps: 9, weight: 10, rir: 0, is_warmup: false, logged_at: dt(2, '20:04:00'), exercises: { name: 'Elevaciones laterales DB', series: 3, reps: '12-15' } },
        { exercise_id: 'pull1b', reps: 6, weight: 55, rir: 0, is_warmup: false, logged_at: dt(2, '20:12:00'), exercises: { name: 'Tracción vertical unilateral', series: 3, reps: '6-10' } },
        { exercise_id: 'pull1b', reps: 5, weight: 55, rir: 0, is_warmup: false, logged_at: dt(2, '20:16:00'), exercises: { name: 'Tracción vertical unilateral', series: 3, reps: '6-10' } },
        { exercise_id: 'pull1c', reps: 7, weight: 65, rir: 0, is_warmup: false, logged_at: dt(2, '20:24:00'), exercises: { name: 'Remo agarre mag', series: 3, reps: '6-10' } },
      ],
      suppLogs: [
        { supplement_id: 's1', logged_date: d(2), name: 'Creatina 5g' },
      ],
      hasData: true,
    },

    // ── DÍA 4: LEGS 2 — Regular (87%) ──
    {
      date: d(3), dateFormatted: `${df(3)} · LEGS 2`,
      nutritionAcc: 88, trainingAcc: 86, sleepAcc: 85, suppAcc: 100, globalAcc: 87,
      sleepData: { planned: '23:00', real: '23:50', hoursPlanned: 8, hoursReal: 7 },
      foodLogs: [
        { food_name: 'Tortitas de avena con miel', meal_type: 'Desayuno', protein: 25, carbs: 60, fat: 10, calories: 430, logged_date: d(3) },
        { food_name: 'Arroz con ternera y verduras', meal_type: 'Comida', protein: 50, carbs: 75, fat: 16, calories: 640, logged_date: d(3) },
        { food_name: 'Queso fresco con nueces', meal_type: 'Merienda', protein: 20, carbs: 10, fat: 22, calories: 310, logged_date: d(3) },
        { food_name: 'Pechuga con ensalada', meal_type: 'Cena', protein: 45, carbs: 12, fat: 8, calories: 300, logged_date: d(3) },
      ],
      setLogs: [
        { exercise_id: 'legs2a', reps: 12, weight: 0, rir: 2, is_warmup: false, logged_at: dt(3, '10:00:00'), exercises: { name: 'ABS / Dragons', series: 3, reps: '8-12' } },
        { exercise_id: 'legs2a', reps: 10, weight: 0, rir: 1, is_warmup: false, logged_at: dt(3, '10:03:00'), exercises: { name: 'ABS / Dragons', series: 3, reps: '8-12' } },
        { exercise_id: 'legs2a', reps: 8, weight: 0, rir: 0, is_warmup: false, logged_at: dt(3, '10:06:00'), exercises: { name: 'ABS / Dragons', series: 3, reps: '8-12' } },
        { exercise_id: 'legs2b', reps: 12, weight: 65, rir: 2, is_warmup: false, logged_at: dt(3, '10:12:00'), exercises: { name: 'Abductor en máquina', series: 3, reps: '10-12' } },
        { exercise_id: 'legs2b', reps: 10, weight: 65, rir: 1, is_warmup: false, logged_at: dt(3, '10:16:00'), exercises: { name: 'Abductor en máquina', series: 3, reps: '10-12' } },
        { exercise_id: 'legs2b', reps: 9, weight: 65, rir: 0, is_warmup: false, logged_at: dt(3, '10:20:00'), exercises: { name: 'Abductor en máquina', series: 3, reps: '10-12' } },
        { exercise_id: 'legs2c', reps: 10, weight: 15, rir: 2, is_warmup: false, logged_at: dt(3, '10:26:00'), exercises: { name: 'Glúteo medio en polea', series: 2, reps: '8-10' } },
        { exercise_id: 'legs2c', reps: 8, weight: 15, rir: 1, is_warmup: false, logged_at: dt(3, '10:30:00'), exercises: { name: 'Glúteo medio en polea', series: 2, reps: '8-10' } },
        { exercise_id: 'legs2d', reps: 8, weight: 80, rir: 2, is_warmup: false, logged_at: dt(3, '10:38:00'), exercises: { name: 'Peso muerto rumano', series: 2, reps: '6-10' } },
        { exercise_id: 'legs2d', reps: 7, weight: 80, rir: 1, is_warmup: false, logged_at: dt(3, '10:42:00'), exercises: { name: 'Peso muerto rumano', series: 2, reps: '6-10' } },
        { exercise_id: 'legs2e', reps: 13, weight: 45, rir: 1, is_warmup: false, logged_at: dt(3, '10:48:00'), exercises: { name: 'Extensión cuádriceps', series: 2, reps: '10-15' } },
        { exercise_id: 'legs2e', reps: 10, weight: 45, rir: 0, is_warmup: false, logged_at: dt(3, '10:52:00'), exercises: { name: 'Extensión cuádriceps', series: 2, reps: '10-15' } },
        { exercise_id: 'legs2f', reps: 9, weight: 200, rir: 1, is_warmup: false, logged_at: dt(3, '10:58:00'), exercises: { name: 'Prensa', series: 2, reps: '6-10' } },
        { exercise_id: 'legs2f', reps: 7, weight: 200, rir: 0, is_warmup: false, logged_at: dt(3, '11:02:00'), exercises: { name: 'Prensa', series: 2, reps: '6-10' } },
        { exercise_id: 'legs2g', reps: 8, weight: 100, rir: 1, is_warmup: false, logged_at: dt(3, '11:10:00'), exercises: { name: 'Hip Thrust', series: 3, reps: '6-10' } },
        { exercise_id: 'legs2g', reps: 7, weight: 100, rir: 0, is_warmup: false, logged_at: dt(3, '11:14:00'), exercises: { name: 'Hip Thrust', series: 3, reps: '6-10' } },
      ],
      suppLogs: [
        { supplement_id: 's1', logged_date: d(3), name: 'Creatina 5g' },
        { supplement_id: 's2', logged_date: d(3), name: 'Proteína 30g' },
      ],
      hasData: true,
    },

    // ── DÍA 5: DESCANSO — Perfecto (100%) ──
    {
      date: d(4), dateFormatted: `${df(4)} · Descanso`,
      nutritionAcc: 100, trainingAcc: 100, sleepAcc: 100, suppAcc: 100, globalAcc: 100,
      sleepData: { planned: '23:00', real: '22:45', hoursPlanned: 8, hoursReal: 8.5 },
      foodLogs: [
        { food_name: 'Bowl açaí con granola', meal_type: 'Desayuno', protein: 20, carbs: 65, fat: 15, calories: 470, logged_date: d(4) },
        { food_name: 'Paella de marisco', meal_type: 'Comida', protein: 45, carbs: 80, fat: 18, calories: 660, logged_date: d(4) },
        { food_name: 'Hummus con palitos vegetales', meal_type: 'Merienda', protein: 12, carbs: 25, fat: 14, calories: 270, logged_date: d(4) },
        { food_name: 'Lubina al horno con patata', meal_type: 'Cena', protein: 50, carbs: 55, fat: 16, calories: 560, logged_date: d(4) },
        { food_name: 'Yogur con miel y almendras', meal_type: 'Snack', protein: 15, carbs: 30, fat: 12, calories: 290, logged_date: d(4) },
      ],
      setLogs: [],
      suppLogs: [
        { supplement_id: 's1', logged_date: d(4), name: 'Creatina 5g' },
        { supplement_id: 's2', logged_date: d(4), name: 'Proteína 30g' },
      ],
      hasData: true,
    },
  ];
};

/* ═══════════════════════════════════════════════════════
   MICROCYCLE ANALYSIS COMPONENT
   ═══════════════════════════════════════════════════════ */

interface MicrocycleAnalysisProps {
  goals: NutritionGoals | null;
  microcycleId?: string;
  microcycleStart?: string;
  microcycleEnd?: string | null;
  durationWeeks?: number;
}

interface DayData {
  date: string;
  dateFormatted: string;
  nutritionAcc: number;
  trainingAcc: number;
  sleepAcc: number;
  suppAcc: number;
  globalAcc: number;
  foodLogs: any[];
  setLogs: any[];
  suppLogs: any[];
  sleepData?: { planned: string; real: string; hoursPlanned: number; hoursReal: number };
  hasData: boolean;
}

/* ───────────── Progress Bar ───────────── */
const ProgressBar = ({ value, colorType }: { value: number; colorType?: 'green' | 'blue' | 'orange' | 'red' }) => (
  <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
    <motion.div
      className={cn('h-full rounded-full', getAccuracyBgColor(value, colorType))}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(value, 100)}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  </div>
);

/* ───────────── Metric Row ───────────── */
const MetricRow = ({
  label, planned, real, unit, accuracy, colorType,
}: {
  label: string; planned: string | number; real: string | number; unit?: string;
  accuracy: number; colorType?: 'green' | 'blue' | 'orange' | 'red';
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className={cn('text-base font-black tabular-nums', getAccuracyTextColor(accuracy, colorType))}>
        {accuracy}%
      </span>
    </div>
    <div className="flex gap-4 text-xs">
      <div className="flex-1">
        <span className="text-muted-foreground">Pautado: </span>
        <span className="text-muted-foreground font-medium">{planned}{unit || ''}</span>
      </div>
      <div className="flex-1">
        <span className="text-foreground">Real: </span>
        <span className="text-foreground font-bold">{real}{unit || ''}</span>
      </div>
    </div>
    <ProgressBar value={accuracy} colorType={colorType} />
  </div>
);

/* ───────────── Critical Alert Item ───────────── */
const CriticalAlertItem = ({ alert, onGoToDay }: { alert: { id: string; icon: string; title: string; severity: 'critical' | 'warning'; detail: string; dayDate?: string }; onGoToDay: (date: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-colors',
      alert.severity === 'critical' ? 'border-destructive/40 bg-destructive/5' : 'border-orange-500/30 bg-orange-500/5'
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <span className="text-base">{alert.icon}</span>
        <span className={cn(
          'text-xs font-bold flex-1',
          alert.severity === 'critical' ? 'text-destructive' : 'text-orange-600 dark:text-orange-400'
        )}>
          {alert.title}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border/30">
              <p className="text-xs text-foreground leading-relaxed pt-2">{alert.detail}</p>
              {alert.dayDate && (
                <button
                  onClick={() => onGoToDay(alert.dayDate!)}
                  className="text-[11px] font-bold text-primary underline underline-offset-2"
                >
                  Ver detalle del día →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───────────── Day Detail View ───────────── */
const DayDetailView = ({ day, goals, onBack }: { day: DayData; goals: any; onBack: () => void }) => {
  const g = goals || { daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 70 };

  // Nutrition breakdown
  const totalProtein = day.foodLogs.reduce((s, l) => s + (Number(l.protein) || 0), 0);
  const totalCarbs = day.foodLogs.reduce((s, l) => s + (Number(l.carbs) || 0), 0);
  const totalFat = day.foodLogs.reduce((s, l) => s + (Number(l.fat) || 0), 0);
  const accP = calcGeneralAccuracy(g.daily_protein, totalProtein);
  const accC = calcGeneralAccuracy(g.daily_carbs, totalCarbs);
  const accF = calcGeneralAccuracy(g.daily_fat, totalFat);

  // Training breakdown
  const byEx: Record<string, any[]> = {};
  day.setLogs.forEach(log => { const id = log.exercise_id; if (!byEx[id]) byEx[id] = []; byEx[id].push(log); });
  const exercises = Object.entries(byEx).map(([, logs]) => {
    const ex = logs[0]?.exercises;
    const name = ex?.name || 'Ejercicio';
    const tSets = ex?.series || 3;
    const repsStr = ex?.reps || '8-12';
    const [minR, maxR] = repsStr.includes('-') ? repsStr.split('-').map(Number) : [Number(repsStr), Number(repsStr)];
    const work = logs.filter((l: any) => !l.is_warmup);
    const setsResult = calcSetsAccuracy(tSets, work.length);
    const repsResults = work.map((l: any) => calcRepsRangeAccuracy(minR || 8, maxR || 12, l.reps));
    const avgRepsAcc = repsResults.length > 0 ? Math.round(repsResults.reduce((a, r) => a + r.accuracy, 0) / repsResults.length) : 100;
    const accuracy = Math.round((setsResult.accuracy + avgRepsAcc) / 2);
    return { name, accuracy, sets: work.length, targetSets: tSets, reps: work.map((l: any) => l.reps), minR, maxR, setsResult, repsResults };
  });

  // Day-level AI summary — exhaustive
  const summaryLines: string[] = [];

  // Opening
  if (day.globalAcc >= 95) {
    summaryLines.push(`📊 **Día sobresaliente (${day.globalAcc}%).** Disciplina ejemplar en todas las áreas.`);
  } else if (day.globalAcc >= 85) {
    summaryLines.push(`📊 **Día aceptable (${day.globalAcc}%).** Buen esfuerzo con áreas puntuales a mejorar.`);
  } else {
    summaryLines.push(`🔴 **Día crítico (${day.globalAcc}%).** Varias métricas presentan desviaciones importantes.`);
  }

  // Nutrition detail
  if (day.foodLogs.length > 0) {
    const diffP = totalProtein - g.daily_protein;
    const diffC = totalCarbs - g.daily_carbs;
    const diffF = totalFat - g.daily_fat;
    if (day.nutritionAcc >= 95) {
      summaryLines.push(`🍽️ Nutrición excelente (${day.nutritionAcc}%). Macros clavados: P${Math.round(totalProtein)}g C${Math.round(totalCarbs)}g G${Math.round(totalFat)}g.`);
    } else {
      const issues: string[] = [];
      if (accP < 90) issues.push(`proteína ${diffP > 0 ? '+' : ''}${Math.round(diffP)}g`);
      if (accC < 90) issues.push(`carbos ${diffC > 0 ? '+' : ''}${Math.round(diffC)}g`);
      if (accF < 90) issues.push(`grasas ${diffF > 0 ? '+' : ''}${Math.round(diffF)}g`);
      summaryLines.push(`🍽️ Nutrición al ${day.nutritionAcc}%. Desviaciones: ${issues.length > 0 ? issues.join(', ') : 'menores'}. ${day.foodLogs.length < 3 ? 'Pocas comidas registradas — distribuir mejor las ingestas.' : ''}`);
    }
  }

  // Training detail
  if (exercises.length > 0) {
    const failedEx = exercises.filter(e => e.accuracy < 85);
    if (day.trainingAcc >= 95) {
      summaryLines.push(`💪 Entrenamiento impecable (${day.trainingAcc}%). ${exercises.length} ejercicios completados con alta precisión.`);
    } else {
      summaryLines.push(`💪 Entrenamiento al ${day.trainingAcc}%.${failedEx.length > 0 ? ` Ejercicios con baja adherencia: ${failedEx.map(e => `${e.name} (${e.accuracy}%)`).join(', ')}.` : ''}`);
      failedEx.forEach(ex => {
        if (ex.sets < ex.targetSets) summaryLines.push(`   ⚠ ${ex.name}: faltan ${ex.targetSets - ex.sets} series. Posible fatiga acumulada.`);
      });
    }
  }

  // Sleep
  if (day.sleepData) {
    if (day.sleepAcc >= 95) {
      summaryLines.push(`😴 Sueño óptimo (${day.sleepAcc}%). Descanso adecuado para la recuperación.`);
    } else {
      summaryLines.push(`😴 Sueño al ${day.sleepAcc}%. ${day.sleepData.hoursReal < 6 ? 'Menos de 6h: la recuperación se ve severamente comprometida.' : `${day.sleepData.hoursReal}h de ${day.sleepData.hoursPlanned}h objetivo.`} ${day.sleepData.real > '01:00' ? 'Hora de dormir muy tardía — afecta ritmo circadiano.' : ''}`);
    }
  }

  // Supplements
  if (day.suppLogs.length > 0 || day.suppAcc < 100) {
    if (day.suppAcc >= 100) {
      summaryLines.push(`💊 Suplementación completa.`);
    } else {
      summaryLines.push(`💊 Suplementación al ${day.suppAcc}%. Faltan suplementos por tomar.`);
    }
  }

  const summaryText = summaryLines.join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-4"
    >
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary active:opacity-70">
        <ChevronLeft className="w-4 h-4" />
        Volver al microciclo
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">{day.dateFormatted}</h3>
          <p className="text-xs text-muted-foreground">Detalle del día</p>
        </div>
        <span className={cn('text-2xl font-black tabular-nums', getAccuracyTextColor(day.globalAcc))}>
          {day.globalAcc}%
        </span>
      </div>

      {/* AI Summary */}
      <div className="rounded-xl bg-muted/50 p-4 flex gap-3 items-start">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{summaryText}</div>
      </div>

      {/* Nutrition */}
      {day.foodLogs.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-foreground" />
            <span className="text-sm font-bold text-foreground">Nutrición</span>
            <span className={cn('text-sm font-black tabular-nums ml-auto', getAccuracyTextColor(day.nutritionAcc))}>
              {day.nutritionAcc}%
            </span>
          </div>
          <MetricRow label="Proteína" planned={g.daily_protein} real={Math.round(totalProtein)} unit="g" accuracy={accP} />
          <MetricRow label="Carbohidratos" planned={g.daily_carbs} real={Math.round(totalCarbs)} unit="g" accuracy={accC} />
          <MetricRow label="Grasas" planned={g.daily_fat} real={Math.round(totalFat)} unit="g" accuracy={accF} />
        </div>
      )}

      {/* Training */}
      {exercises.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-foreground" />
            <span className="text-sm font-bold text-foreground">Entrenamiento</span>
            <span className={cn('text-sm font-black tabular-nums ml-auto', getAccuracyTextColor(day.trainingAcc))}>
              {day.trainingAcc}%
            </span>
          </div>
          {exercises.map((ex, i) => (
            <div key={i} className="rounded-lg bg-muted/30 p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-foreground">{ex.name}</span>
                <span className={cn('text-xs font-black', getAccuracyTextColor(ex.accuracy))}>{ex.accuracy}%</span>
              </div>
              <MetricRow label="Series" planned={ex.targetSets} real={ex.sets} accuracy={ex.setsResult.accuracy} colorType={ex.setsResult.colorType} />
              {ex.reps.map((r: number, j: number) => (
                <MetricRow key={j} label={`Reps S${j + 1}`} planned={`${ex.minR}-${ex.maxR}`} real={r} accuracy={ex.repsResults[j]?.accuracy ?? 100} colorType={ex.repsResults[j]?.colorType} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Sleep */}
      {day.sleepData && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-foreground" />
            <span className="text-sm font-bold text-foreground">Sueño</span>
            <span className={cn('text-sm font-black tabular-nums ml-auto', getAccuracyTextColor(day.sleepAcc))}>
              {day.sleepAcc}%
            </span>
          </div>
          <MetricRow label="Hora de dormir" planned={day.sleepData.planned} real={day.sleepData.real} accuracy={calcTimeAccuracy(day.sleepData.planned, day.sleepData.real)} />
          <MetricRow label="Horas de sueño" planned={day.sleepData.hoursPlanned} real={day.sleepData.hoursReal} unit="h" accuracy={calcGeneralAccuracy(day.sleepData.hoursPlanned, day.sleepData.hoursReal)} />
        </div>
      )}

      {/* Supplements */}
      {day.suppLogs.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-foreground" />
            <span className="text-sm font-bold text-foreground">Suplementación</span>
            <span className={cn('text-sm font-black tabular-nums ml-auto', getAccuracyTextColor(day.suppAcc))}>
              {day.suppAcc}%
            </span>
          </div>
          <div className="space-y-1">
            {day.suppLogs.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-foreground">{s.name || 'Suplemento'}</span>
              </div>
            ))}
            {day.suppAcc < 100 && (
              <p className="text-xs text-destructive mt-1">⚠ Faltan suplementos por tomar</p>
            )}
          </div>
        </div>
      )}

      {!day.hasData && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No hay datos registrados este día
        </div>
      )}
    </motion.div>
  );
};

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */

export const MicrocycleAnalysis = ({ goals, microcycleId, microcycleStart, microcycleEnd, durationWeeks = 1 }: MicrocycleAnalysisProps) => {
  const { user } = useAuth();
  const [daysData, setDaysData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [supplements, setSupplements] = useState<any[]>([]);

  const g = goals || { daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 70 } as any;

  // Calculate date range for this microcycle
  const dateRange = useMemo(() => {
    if (!microcycleStart) return [];
    const start = parseISO(microcycleStart);
    const end = microcycleEnd ? parseISO(microcycleEnd) : addDays(start, (durationWeeks * 7) - 1);
    const today = new Date();
    const effectiveEnd = end > today ? today : end;
    if (start > effectiveEnd) return [];
    return eachDayOfInterval({ start, end: effectiveEnd });
  }, [microcycleStart, microcycleEnd, durationWeeks]);

  useEffect(() => {
    if (!user || dateRange.length === 0) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);

      const startStr = format(dateRange[0], 'yyyy-MM-dd');
      const endStr = format(dateRange[dateRange.length - 1], 'yyyy-MM-dd');

      const [foodRes, setLogRes, suppRes, suppLogRes] = await Promise.all([
        supabase.from('food_logs').select('*').eq('user_id', user.id).gte('logged_date', startStr).lte('logged_date', endStr),
        supabase.from('set_logs').select('*, exercises(name, series, reps, session_id)').eq('user_id', user.id).gte('logged_at', startStr + 'T00:00:00').lte('logged_at', endStr + 'T23:59:59'),
        supabase.from('user_supplements').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('supplement_logs').select('*').eq('user_id', user.id).gte('logged_date', startStr).lte('logged_date', endStr),
      ]);

      const allFood = foodRes.data || [];
      const allSets = setLogRes.data || [];
      const allSuppLogs = suppLogRes.data || [];
      const supps = suppRes.data || [];
      setSupplements(supps);

      const days: DayData[] = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Food logs for this day
        const dayFood = allFood.filter((f: any) => f.logged_date === dateStr);
        const totalP = dayFood.reduce((s, l) => s + (Number(l.protein) || 0), 0);
        const totalC = dayFood.reduce((s, l) => s + (Number(l.carbs) || 0), 0);
        const totalF = dayFood.reduce((s, l) => s + (Number(l.fat) || 0), 0);
        const nutritionAcc = dayFood.length > 0
          ? Math.round((calcGeneralAccuracy(g.daily_protein, totalP) + calcGeneralAccuracy(g.daily_carbs, totalC) + calcGeneralAccuracy(g.daily_fat, totalF)) / 3)
          : 100;

        // Set logs for this day
        const daySets = allSets.filter((s: any) => s.logged_at && s.logged_at.startsWith(dateStr));
        let trainingAcc = 100;
        if (daySets.length > 0) {
          const byEx: Record<string, any[]> = {};
          daySets.forEach((log: any) => { const id = log.exercise_id; if (!byEx[id]) byEx[id] = []; byEx[id].push(log); });
          const exScores = Object.values(byEx).map(logs => {
            const ex = logs[0]?.exercises;
            const tSets = ex?.series || 3;
            const repsStr = ex?.reps || '8-12';
            const [minR, maxR] = repsStr.includes('-') ? repsStr.split('-').map(Number) : [Number(repsStr), Number(repsStr)];
            const work = logs.filter((l: any) => !l.is_warmup);
            const setsAcc = calcSetsAccuracy(tSets, work.length).accuracy;
            const repsAcc = work.length > 0
              ? Math.round(work.map((l: any) => calcRepsRangeAccuracy(minR || 8, maxR || 12, l.reps).accuracy).reduce((a, b) => a + b, 0) / work.length)
              : 100;
            return Math.round((setsAcc + repsAcc) / 2);
          });
          trainingAcc = Math.round(exScores.reduce((a, b) => a + b, 0) / exScores.length);
        }

        // Supplements — enrich with names
        const daySuppLogs = allSuppLogs.filter((s: any) => s.logged_date === dateStr).map((sl: any) => {
          const supp = supps.find((s: any) => s.id === sl.supplement_id);
          return { ...sl, name: supp?.name || 'Suplemento' };
        });
        const suppAcc = supps.length > 0
          ? calcGeneralAccuracy(supps.length, daySuppLogs.length)
          : 100;

        // Sleep (no table yet — default 100)
        const sleepAcc = 100;

        const globalAcc = calcGlobalAccuracy(nutritionAcc, trainingAcc, sleepAcc, suppAcc);
        const hasData = dayFood.length > 0 || daySets.length > 0 || daySuppLogs.length > 0;

        return {
          date: dateStr,
          dateFormatted: format(date, "d 'de' MMMM", { locale: es }),
          nutritionAcc,
          trainingAcc,
          sleepAcc,
          suppAcc,
          globalAcc,
          foodLogs: dayFood,
          setLogs: daySets,
          suppLogs: daySuppLogs,
          hasData,
        };
      });

      setDaysData(days);
      setLoading(false);
    };

    loadData();
  }, [user, dateRange, goals]);

  // Use mock data when there's insufficient real data (fewer than 3 days with data)
  const mockData = useMemo(() => createMockMicrocycleData(microcycleStart), [microcycleStart]);
  const effectiveData = useMemo(() => {
    const realWithData = daysData.filter(d => d.hasData);
    return realWithData.length >= 3 ? daysData : mockData;
  }, [daysData, mockData]);

  // Chart data
  const chartData = useMemo(() => effectiveData.map(d => ({
    name: format(parseISO(d.date), 'dd MMM', { locale: es }),
    date: d.date,
    accuracy: d.globalAcc,
    hasData: d.hasData,
  })), [effectiveData]);

  // Microcycle average
  const daysWithData = effectiveData.filter(d => d.hasData);
  const microcycleAvg = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((a, d) => a + d.globalAcc, 0) / daysWithData.length)
    : 0;

  // AI Microcycle summary — exhaustive
  interface CriticalAlert {
    id: string;
    icon: string;
    title: string;
    severity: 'critical' | 'warning';
    detail: string;
    dayDate?: string;
  }

  const { microcycleSummary, criticalAlerts } = useMemo(() => {
    const alerts: CriticalAlert[] = [];

    if (daysWithData.length === 0) return {
      microcycleSummary: 'Aún no hay datos suficientes para generar un análisis del microciclo.',
      criticalAlerts: [],
    };

    const avgNut = Math.round(daysWithData.reduce((a, d) => a + d.nutritionAcc, 0) / daysWithData.length);
    const avgTrain = Math.round(daysWithData.reduce((a, d) => a + d.trainingAcc, 0) / daysWithData.length);
    const avgSleep = Math.round(daysWithData.reduce((a, d) => a + d.sleepAcc, 0) / daysWithData.length);
    const avgSupp = Math.round(daysWithData.reduce((a, d) => a + d.suppAcc, 0) / daysWithData.length);

    const bestDay = [...daysWithData].sort((a, b) => b.globalAcc - a.globalAcc)[0];
    const worstDay = [...daysWithData].sort((a, b) => a.globalAcc - b.globalAcc)[0];

    // Detect trends
    const accuracies = daysWithData.map(d => d.globalAcc);
    const isDecline = accuracies.length >= 3 && accuracies[accuracies.length - 1] < accuracies[0] - 10;
    const isImproving = accuracies.length >= 3 && accuracies[accuracies.length - 1] > accuracies[0] + 5;
    const variance = accuracies.length >= 2
      ? Math.round(Math.sqrt(accuracies.reduce((s, v) => s + Math.pow(v - microcycleAvg, 2), 0) / accuracies.length))
      : 0;

    const lines: string[] = [];

    // ── Header ──
    lines.push(`📊 **Análisis exhaustivo del microciclo** (${daysWithData.length} días registrados)`);
    lines.push(`Precisión media: **${microcycleAvg}%** · Variabilidad: ±${variance}% · Mejor: ${bestDay.dateFormatted} (${bestDay.globalAcc}%) · Peor: ${worstDay.dateFormatted} (${worstDay.globalAcc}%)`);

    // ── Trend analysis ──
    if (isDecline) {
      lines.push(`📉 **Tendencia descendente detectada.** La adherencia ha caído ${accuracies[0] - accuracies[accuracies.length - 1]} puntos desde el inicio del microciclo. Esto puede indicar fatiga acumulada, estrés externo o pérdida de motivación.`);
      alerts.push({
        id: 'trend-decline',
        icon: '📉',
        title: 'Tendencia descendente en adherencia',
        severity: 'warning',
        detail: `La adherencia global ha pasado de ${accuracies[0]}% a ${accuracies[accuracies.length - 1]}% a lo largo del microciclo. Esto sugiere fatiga acumulada o factores externos. Recomendación: evaluar si es necesario adelantar un deload o simplificar la dieta.`,
      });
    } else if (isImproving) {
      lines.push(`📈 **Tendencia ascendente.** La adherencia ha mejorado progresivamente, lo que indica buena adaptación y consistencia creciente.`);
    } else if (variance > 15) {
      lines.push(`🔀 **Alta variabilidad (±${variance}%).** Hay días muy buenos y otros muy malos. La inconsistencia reduce la efectividad global del programa.`);
      alerts.push({
        id: 'high-variance',
        icon: '🔀',
        title: 'Inconsistencia extrema entre días',
        severity: 'warning',
        detail: `La variabilidad de ±${variance}% indica que la adherencia fluctúa demasiado. Los días bajos (${worstDay.dateFormatted}: ${worstDay.globalAcc}%) contrarrestan los días buenos. Busca patrones: ¿son siempre los mismos días de la semana? ¿Coinciden con estrés laboral?`,
      });
    }

    // ── Nutrition analysis ──
    if (avgNut >= 95) {
      lines.push(`🍽️ **Nutrición excelente (${avgNut}%).** Los macros se han mantenido consistentemente cerca del objetivo durante todo el microciclo.`);
    } else if (avgNut >= 85) {
      const lowNutDays = daysWithData.filter(d => d.nutritionAcc < 85);
      lines.push(`🍽️ **Nutrición aceptable (${avgNut}%).** ${lowNutDays.length} día(s) con adherencia baja. La media está cerca del objetivo pero los días inconsistentes frenan el progreso.`);
    } else {
      const lowNutDays = daysWithData.filter(d => d.nutritionAcc < 80);
      lines.push(`🍽️ **Nutrición deficiente (${avgNut}%).** ${lowNutDays.length} día(s) con adherencia por debajo del 80%. Esto puede generar déficits proteicos que comprometan la recuperación y la ganancia muscular.`);
      alerts.push({
        id: 'nutrition-low',
        icon: '🍽️',
        title: `Nutrición crítica: ${avgNut}% media`,
        severity: 'critical',
        dayDate: lowNutDays[0]?.date,
        detail: `La adherencia nutricional media es del ${avgNut}%. Los días críticos son: ${lowNutDays.map(d => `${d.dateFormatted} (${d.nutritionAcc}%)`).join(', ')}. Esto implica que no se están alcanzando los macros necesarios para sostener el programa de entrenamiento. Un déficit proteico recurrente reduce la síntesis proteica muscular hasta un 30%.`,
      });
    }

    // ── Training analysis ──
    if (avgTrain >= 95) {
      lines.push(`💪 **Entrenamiento impecable (${avgTrain}%).** Todas las sesiones se han completado con alta precisión en series y repeticiones.`);
    } else if (avgTrain >= 85) {
      const failDays = daysWithData.filter(d => d.trainingAcc < 85);
      lines.push(`💪 **Entrenamiento bueno (${avgTrain}%).** Hay ${failDays.length} sesión(es) con desviaciones. Revisa si el volumen programado es sostenible o si necesitas ajustar cargas.`);
    } else {
      const failDays = daysWithData.filter(d => d.trainingAcc < 80 && d.setLogs.length > 0);
      lines.push(`💪 **Entrenamiento con problemas (${avgTrain}%).** ${failDays.length} sesión(es) con adherencia baja. Esto puede indicar que el volumen/intensidad programados superan tu capacidad de recuperación actual.`);
      if (failDays.length > 0) {
        alerts.push({
          id: 'training-low',
          icon: '💪',
          title: `Entrenamiento: ${failDays.length} sesiones fallidas`,
          severity: failDays.length >= 3 ? 'critical' : 'warning',
          dayDate: failDays[0]?.date,
          detail: `Las sesiones con baja adherencia son: ${failDays.map(d => `${d.dateFormatted} (${d.trainingAcc}%)`).join(', ')}. Esto puede deberse a: (1) fatiga acumulada — considera un deload, (2) cargas demasiado altas — reduce el peso 5-10%, o (3) mal descanso/nutrición previos que reducen el rendimiento.`,
        });
      }
    }

    // ── Sleep analysis ──
    if (avgSleep >= 95) {
      lines.push(`😴 **Sueño óptimo (${avgSleep}%).** El descanso ha sido consistente, maximizando la recuperación y la supercompensación.`);
    } else if (avgSleep >= 80) {
      lines.push(`😴 **Sueño aceptable (${avgSleep}%).** Pequeñas desviaciones en horario o duración. Mantener un horario fijo de sueño mejora la calidad del descanso a largo plazo.`);
    } else {
      const badSleepDays = daysWithData.filter(d => d.sleepAcc < 75);
      lines.push(`😴 **Sueño deficiente (${avgSleep}%).** ${badSleepDays.length} día(s) con sueño inadecuado. El déficit de sueño reduce la producción de hormona del crecimiento y testosterona, afectando directamente la recuperación.`);
      alerts.push({
        id: 'sleep-low',
        icon: '😴',
        title: `Sueño insuficiente: ${badSleepDays.length} noches malas`,
        severity: badSleepDays.length >= 3 ? 'critical' : 'warning',
        dayDate: badSleepDays[0]?.date,
        detail: `Las noches con peor descanso: ${badSleepDays.map(d => `${d.dateFormatted} (${d.sleepAcc}%${d.sleepData ? `, ${d.sleepData.hoursReal}h de ${d.sleepData.hoursPlanned}h` : ''})`).join(', ')}. El sueño insuficiente (<7h) aumenta el cortisol un 37%, reduce la síntesis proteica y empeora la toma de decisiones nutricionales al día siguiente.`,
      });
    }

    // ── Supplements ──
    if (avgSupp >= 95) {
      lines.push(`💊 **Suplementación perfecta (${avgSupp}%).** Todos los suplementos se han tomado consistentemente.`);
    } else {
      const missedDays = daysWithData.filter(d => d.suppAcc < 100);
      lines.push(`💊 **Suplementación al ${avgSupp}%.** ${missedDays.length} día(s) con suplementos faltantes. La creatina requiere toma diaria para mantener la saturación muscular.`);
    }

    // ── Cross-metric correlations ──
    const daysBadSleepBadTrain = daysWithData.filter(d => d.sleepAcc < 80 && d.trainingAcc < 85);
    if (daysBadSleepBadTrain.length > 0) {
      lines.push(`🔗 **Correlación detectada:** ${daysBadSleepBadTrain.length} día(s) donde el mal sueño coincidió con bajo rendimiento en el entreno. Esto confirma que la calidad del descanso impacta directamente tu capacidad de trabajo.`);
      alerts.push({
        id: 'sleep-train-correlation',
        icon: '🔗',
        title: 'Mal sueño → bajo rendimiento',
        severity: 'warning',
        dayDate: daysBadSleepBadTrain[0]?.date,
        detail: `En ${daysBadSleepBadTrain.map(d => d.dateFormatted).join(', ')}, el sueño deficiente (<80%) coincidió con entrenamiento por debajo del objetivo (<85%). Patrón claro: priorizar el descanso mejorará automáticamente tu rendimiento en el gym.`,
      });
    }

    const daysBadNutBadTrain = daysWithData.filter(d => d.nutritionAcc < 80 && d.trainingAcc < 85);
    if (daysBadNutBadTrain.length > 0 && daysBadNutBadTrain !== daysBadSleepBadTrain) {
      lines.push(`🔗 **Correlación nutrición-entreno:** ${daysBadNutBadTrain.length} día(s) con mala nutrición y bajo rendimiento. Asegurar una ingesta adecuada pre-entreno es fundamental.`);
    }

    // ── Final verdict ──
    if (microcycleAvg >= 95) {
      lines.push(`\n✅ **Veredicto final:** Microciclo sobresaliente. Esta consistencia maximiza las adaptaciones del programa. Mantén esta línea y el próximo microciclo puedes considerar un incremento progresivo de volumen.`);
    } else if (microcycleAvg >= 85) {
      lines.push(`\n📌 **Veredicto final:** Microciclo aceptable con margen de mejora. Céntrate en las alertas señaladas para escalar al 95%+ en el próximo bloque.`);
    } else {
      lines.push(`\n🚨 **Veredicto final:** Microciclo por debajo del estándar. Las desviaciones acumuladas pueden retrasar tu progreso 1-2 semanas. Revisa las alertas críticas y corrige antes del siguiente microciclo.`);
    }

    return {
      microcycleSummary: lines.join('\n\n'),
      criticalAlerts: alerts,
    };
  }, [daysWithData, microcycleAvg]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-border/20">
        <p className="text-primary-foreground font-bold text-sm">{d.name}</p>
        <p className={cn('text-lg font-black tabular-nums', d.accuracy >= 95 ? 'text-green-400' : d.accuracy >= 90 ? 'text-orange-400' : 'text-red-400')}>
          {d.accuracy}%
        </p>
        {d.hasData && (
          <p className="text-primary-foreground/50 text-[10px] mt-1">Toca para ver detalle</p>
        )}
      </div>
    );
  };

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]) {
      const dateStr = data.activePayload[0].payload.date;
      const day = effectiveData.find(d => d.date === dateStr);
      if (day?.hasData) setSelectedDay(day);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // When no microcycle range, still show mock data as demo
  const showingMock = daysData.filter(d => d.hasData).length < 3;

  return (
    <div className="space-y-5 p-4">
      <AnimatePresence mode="wait">
        {selectedDay ? (
          <DayDetailView
            key="detail"
            day={selectedDay}
            goals={goals}
            onBack={() => setSelectedDay(null)}
          />
        ) : (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Header with average */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Análisis del Microciclo</h3>
                <p className="text-xs text-muted-foreground">
                  {showingMock ? '5 días · Datos de ejemplo' : `${dateRange.length} días · ${daysWithData.length} con datos`}
                </p>
              </div>
              <div className="text-right">
                <span className={cn('text-3xl font-black tabular-nums', getAccuracyTextColor(microcycleAvg))}>
                  {microcycleAvg}%
                </span>
                <p className="text-[10px] text-muted-foreground font-medium">Media</p>
              </div>
            </div>

            {/* Line Chart */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-foreground" />
                <span className="text-sm font-bold text-foreground">Precisión Diaria</span>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} onClick={handleChartClick}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={100}
                      stroke="hsl(142 71% 45%)"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{ value: '100%', position: 'right', fontSize: 9, fill: 'hsl(142 71% 45%)' }}
                    />
                    <ReferenceLine
                      y={90}
                      stroke="hsl(38 92% 50%)"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (!payload.hasData) return <circle key={payload.date} cx={cx} cy={cy} r={3} fill="hsl(var(--muted-foreground))" opacity={0.3} />;
                        const color = payload.accuracy >= 95 ? 'hsl(142 71% 45%)' : payload.accuracy >= 90 ? 'hsl(38 92% 50%)' : 'hsl(0 62% 50%)';
                        return <circle key={payload.date} cx={cx} cy={cy} r={5} fill={color} stroke="hsl(var(--card))" strokeWidth={2} className="cursor-pointer" />;
                      }}
                      activeDot={{ r: 7, strokeWidth: 2, className: 'cursor-pointer' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Toca un punto para ver el desglose del día
              </p>
            </div>

            {/* AI Microcycle Summary */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-foreground">Resumen IA del Microciclo</span>
              </div>
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{microcycleSummary}</div>

              {/* Critical alerts — clickable */}
              {criticalAlerts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {criticalAlerts.length} alerta(s) detectada(s)
                  </p>
                  {criticalAlerts.map(alert => (
                    <CriticalAlertItem
                      key={alert.id}
                      alert={alert}
                      onGoToDay={(date) => {
                        const day = effectiveData.find(d => d.date === date);
                        if (day) setSelectedDay(day);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Day list */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground px-1">Días del Microciclo</p>
              {effectiveData.map((day, idx) => (
                <button
                  key={day.date}
                  onClick={() => day.hasData ? setSelectedDay(day) : null}
                  disabled={!day.hasData}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left',
                    day.hasData
                      ? 'border-border bg-card active:bg-muted/50 cursor-pointer'
                      : 'border-border/40 bg-muted/20 opacity-50 cursor-default'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{day.dateFormatted}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {day.hasData
                        ? `${day.foodLogs.length} comidas · ${day.setLogs.length} series · ${day.suppLogs.length} supps`
                        : 'Sin datos'
                      }
                    </p>
                  </div>
                  {day.hasData && (
                    <>
                      <span className={cn('text-lg font-black tabular-nums', getAccuracyTextColor(day.globalAcc))}>
                        {day.globalAcc}%
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
                    </>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
