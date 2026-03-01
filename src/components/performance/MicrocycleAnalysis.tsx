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
   MOCK DATA — 5 días con variabilidad para testear gráfica
   ═══════════════════════════════════════════════════════ */

const mockMicrocycleData: DayData[] = [
  {
    date: '2026-02-24',
    dateFormatted: '24 de febrero',
    nutritionAcc: 97,
    trainingAcc: 98,
    sleepAcc: 95,
    suppAcc: 100,
    globalAcc: 97, // Excelente — todo verde
    foodLogs: [
      { protein: 148, carbs: 245, fat: 68, food_name: 'Pollo a la plancha', meal_type: 'Comida', logged_date: '2026-02-24', calories: 530 },
      { protein: 35, carbs: 60, fat: 12, food_name: 'Avena con plátano', meal_type: 'Desayuno', logged_date: '2026-02-24', calories: 320 },
    ],
    setLogs: [
      { exercise_id: 'ex1', reps: 12, weight: 80, is_warmup: false, logged_at: '2026-02-24T10:00:00', exercises: { name: 'Press Banca', series: 4, reps: '10-12' } },
      { exercise_id: 'ex1', reps: 11, weight: 80, is_warmup: false, logged_at: '2026-02-24T10:05:00', exercises: { name: 'Press Banca', series: 4, reps: '10-12' } },
      { exercise_id: 'ex1', reps: 10, weight: 80, is_warmup: false, logged_at: '2026-02-24T10:10:00', exercises: { name: 'Press Banca', series: 4, reps: '10-12' } },
      { exercise_id: 'ex1', reps: 10, weight: 80, is_warmup: false, logged_at: '2026-02-24T10:15:00', exercises: { name: 'Press Banca', series: 4, reps: '10-12' } },
    ],
    suppLogs: [{ supplement_id: 's1', logged_date: '2026-02-24' }, { supplement_id: 's2', logged_date: '2026-02-24' }],
    hasData: true,
  },
  {
    date: '2026-02-25',
    dateFormatted: '25 de febrero',
    nutritionAcc: 93,
    trainingAcc: 90,
    sleepAcc: 95,
    suppAcc: 90,
    globalAcc: 92, // Bueno con fallos leves — azul/naranja
    foodLogs: [
      { protein: 140, carbs: 270, fat: 75, food_name: 'Pasta boloñesa', meal_type: 'Comida', logged_date: '2026-02-25', calories: 620 },
      { protein: 30, carbs: 50, fat: 10, food_name: 'Tostadas con huevo', meal_type: 'Desayuno', logged_date: '2026-02-25', calories: 280 },
    ],
    setLogs: [
      { exercise_id: 'ex2', reps: 8, weight: 60, is_warmup: false, logged_at: '2026-02-25T17:00:00', exercises: { name: 'Sentadilla', series: 4, reps: '8-10' } },
      { exercise_id: 'ex2', reps: 7, weight: 60, is_warmup: false, logged_at: '2026-02-25T17:05:00', exercises: { name: 'Sentadilla', series: 4, reps: '8-10' } },
      { exercise_id: 'ex2', reps: 7, weight: 60, is_warmup: false, logged_at: '2026-02-25T17:10:00', exercises: { name: 'Sentadilla', series: 4, reps: '8-10' } },
    ],
    suppLogs: [{ supplement_id: 's1', logged_date: '2026-02-25' }],
    hasData: true,
  },
  {
    date: '2026-02-26',
    dateFormatted: '26 de febrero',
    nutritionAcc: 65,
    trainingAcc: 70,
    sleepAcc: 60,
    suppAcc: 50,
    globalAcc: 64, // Malo/Desastroso — rojos, pico hacia abajo
    foodLogs: [
      { protein: 60, carbs: 100, fat: 45, food_name: 'Bocadillo rápido', meal_type: 'Comida', logged_date: '2026-02-26', calories: 350 },
    ],
    setLogs: [
      { exercise_id: 'ex3', reps: 5, weight: 40, is_warmup: false, logged_at: '2026-02-26T19:00:00', exercises: { name: 'Remo con barra', series: 4, reps: '10-12' } },
      { exercise_id: 'ex3', reps: 4, weight: 40, is_warmup: false, logged_at: '2026-02-26T19:05:00', exercises: { name: 'Remo con barra', series: 4, reps: '10-12' } },
    ],
    suppLogs: [{ supplement_id: 's1', logged_date: '2026-02-26' }],
    hasData: true,
  },
  {
    date: '2026-02-27',
    dateFormatted: '27 de febrero',
    nutritionAcc: 90,
    trainingAcc: 88,
    sleepAcc: 85,
    suppAcc: 90,
    globalAcc: 88, // Recuperación/Regular
    foodLogs: [
      { protein: 135, carbs: 230, fat: 65, food_name: 'Arroz con pollo', meal_type: 'Comida', logged_date: '2026-02-27', calories: 500 },
      { protein: 30, carbs: 45, fat: 10, food_name: 'Yogur con frutos secos', meal_type: 'Merienda', logged_date: '2026-02-27', calories: 260 },
    ],
    setLogs: [
      { exercise_id: 'ex4', reps: 10, weight: 50, is_warmup: false, logged_at: '2026-02-27T10:00:00', exercises: { name: 'Press Militar', series: 3, reps: '10-12' } },
      { exercise_id: 'ex4', reps: 9, weight: 50, is_warmup: false, logged_at: '2026-02-27T10:05:00', exercises: { name: 'Press Militar', series: 3, reps: '10-12' } },
      { exercise_id: 'ex4', reps: 8, weight: 50, is_warmup: false, logged_at: '2026-02-27T10:10:00', exercises: { name: 'Press Militar', series: 3, reps: '10-12' } },
    ],
    suppLogs: [{ supplement_id: 's1', logged_date: '2026-02-27' }, { supplement_id: 's2', logged_date: '2026-02-27' }],
    hasData: true,
  },
  {
    date: '2026-02-28',
    dateFormatted: '28 de febrero',
    nutritionAcc: 100,
    trainingAcc: 100,
    sleepAcc: 100,
    suppAcc: 100,
    globalAcc: 100, // Perfecto — toca el tope
    foodLogs: [
      { protein: 150, carbs: 250, fat: 70, food_name: 'Plan perfecto', meal_type: 'Comida', logged_date: '2026-02-28', calories: 540 },
      { protein: 40, carbs: 60, fat: 15, food_name: 'Batido proteico', meal_type: 'Desayuno', logged_date: '2026-02-28', calories: 340 },
    ],
    setLogs: [
      { exercise_id: 'ex5', reps: 12, weight: 70, is_warmup: false, logged_at: '2026-02-28T09:00:00', exercises: { name: 'Peso Muerto', series: 4, reps: '10-12' } },
      { exercise_id: 'ex5', reps: 11, weight: 70, is_warmup: false, logged_at: '2026-02-28T09:05:00', exercises: { name: 'Peso Muerto', series: 4, reps: '10-12' } },
      { exercise_id: 'ex5', reps: 11, weight: 70, is_warmup: false, logged_at: '2026-02-28T09:10:00', exercises: { name: 'Peso Muerto', series: 4, reps: '10-12' } },
      { exercise_id: 'ex5', reps: 10, weight: 70, is_warmup: false, logged_at: '2026-02-28T09:15:00', exercises: { name: 'Peso Muerto', series: 4, reps: '10-12' } },
    ],
    suppLogs: [{ supplement_id: 's1', logged_date: '2026-02-28' }, { supplement_id: 's2', logged_date: '2026-02-28' }],
    hasData: true,
  },
];

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

  // Day-level AI summary
  const positives: string[] = [];
  const negatives: string[] = [];
  if (day.nutritionAcc >= 95) positives.push('nutrición');
  else if (day.nutritionAcc < 90) negatives.push(`nutrición al ${day.nutritionAcc}%`);
  if (day.trainingAcc >= 95) positives.push('entrenamiento');
  else if (day.trainingAcc < 90) negatives.push(`entrenamiento al ${day.trainingAcc}%`);
  if (day.sleepAcc >= 95) positives.push('sueño');
  else if (day.sleepAcc < 90) negatives.push(`sueño al ${day.sleepAcc}%`);
  if (day.suppAcc >= 95) positives.push('suplementación');
  else if (day.suppAcc < 90) negatives.push(`suplementación al ${day.suppAcc}%`);

  const summaryText = `Precisión del ${day.globalAcc}% este día.${positives.length > 0 ? ` Puntos fuertes: ${positives.join(', ')}.` : ''}${negatives.length > 0 ? ` Áreas a mejorar: ${negatives.join(', ')}.` : ''} ${day.globalAcc >= 95 ? '¡Día excelente!' : day.globalAcc >= 90 ? 'Buen día, con margen de mejora.' : 'Hay aspectos importantes que ajustar.'}`;

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
        <p className="text-sm text-foreground leading-relaxed">{summaryText}</p>
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
          <p className="text-xs text-muted-foreground">{day.suppLogs.length} suplemento(s) registrado(s)</p>
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

        // Supplements
        const daySuppLogs = allSuppLogs.filter((s: any) => s.logged_date === dateStr);
        const suppAcc = supps.length > 0
          ? calcGeneralAccuracy(supps.length, daySuppLogs.length)
          : 100;

        // Sleep (mock for now)
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

  // Fallback to mock data when no real data exists
  const effectiveData = useMemo(() => {
    const realWithData = daysData.filter(d => d.hasData);
    return realWithData.length > 0 ? daysData : mockMicrocycleData;
  }, [daysData]);

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

  // AI Microcycle summary
  const microcycleSummary = useMemo(() => {
    if (daysWithData.length === 0) return 'Aún no hay datos suficientes para generar un análisis del microciclo.';

    const avgNut = Math.round(daysWithData.reduce((a, d) => a + d.nutritionAcc, 0) / daysWithData.length);
    const avgTrain = Math.round(daysWithData.reduce((a, d) => a + d.trainingAcc, 0) / daysWithData.length);
    const avgSleep = Math.round(daysWithData.reduce((a, d) => a + d.sleepAcc, 0) / daysWithData.length);
    const avgSupp = Math.round(daysWithData.reduce((a, d) => a + d.suppAcc, 0) / daysWithData.length);

    const bestDay = [...daysWithData].sort((a, b) => b.globalAcc - a.globalAcc)[0];
    const worstDay = [...daysWithData].sort((a, b) => a.globalAcc - b.globalAcc)[0];

    const positives: string[] = [];
    const negatives: string[] = [];

    if (avgNut >= 95) positives.push(`nutrición excelente (${avgNut}%)`);
    else if (avgNut < 90) negatives.push(`nutrición por debajo del objetivo (${avgNut}%)`);

    if (avgTrain >= 95) positives.push(`entrenamiento impecable (${avgTrain}%)`);
    else if (avgTrain < 90) negatives.push(`entrenamiento con desviaciones (${avgTrain}%)`);

    if (avgSupp >= 95) positives.push(`suplementación perfecta (${avgSupp}%)`);
    else if (avgSupp < 90) negatives.push(`suplementación inconsistente (${avgSupp}%)`);

    let summary = `Análisis del microciclo (${daysWithData.length} días registrados): Precisión media del ${microcycleAvg}%. `;

    if (positives.length > 0) summary += `Puntos fuertes: ${positives.join(', ')}. `;
    if (negatives.length > 0) summary += `Áreas de mejora: ${negatives.join(', ')}. `;

    summary += `Mejor día: ${bestDay.dateFormatted} (${bestDay.globalAcc}%). `;
    if (worstDay.globalAcc !== bestDay.globalAcc) {
      summary += `Día más bajo: ${worstDay.dateFormatted} (${worstDay.globalAcc}%). `;
    }

    summary += microcycleAvg >= 95
      ? '¡Microciclo sobresaliente! Mantén esta consistencia.'
      : microcycleAvg >= 90
        ? 'Buen microciclo en general. Ajusta los puntos débiles para el siguiente.'
        : 'Hay margen de mejora significativo. Revisa los días con menor precisión para identificar patrones.';

    return summary;
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
  const showingMock = dateRange.length === 0 || daysData.filter(d => d.hasData).length === 0;

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
              <p className="text-sm text-foreground leading-relaxed">{microcycleSummary}</p>
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
