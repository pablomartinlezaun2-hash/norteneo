import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  UtensilsCrossed, Dumbbell, Moon, Pill, Droplets, ChevronDown, Sparkles, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NutritionGoals } from '@/hooks/useNutritionData';
import {
  calcMacroAccuracy,
  calcSetsScore,
  calcRepsScore,
  calcRirScore,
  calcExerciseAccuracy,
  getAdherenceColor,
  DEFAULT_WEIGHTS,
} from './adherenceCalculations';
import { cn } from '@/lib/utils';

/* ───────────────────── helpers ───────────────────── */

const pctColor = (v: number) => {
  if (v >= 95) return 'text-green-500';
  if (v >= 90) return 'text-orange-500';
  return 'text-red-500';
};
const barColor = (v: number) => {
  if (v >= 95) return 'bg-green-500';
  if (v >= 90) return 'bg-orange-500';
  return 'bg-red-500';
};
const barBg = (v: number) => getAdherenceColor(v);

/* ───────────────── MOCK DATA ───────────────── */

const MOCK_AI_TEXT =
  'Buen trabajo hoy. Has clavado el entrenamiento de pecho, pero te has quedado corto en los carbohidratos de la comida 2 y en las horas de sueño. Ajustaremos la recuperación para mañana.';

const MOCK_MEALS = [
  {
    name: 'Comida 1',
    scheduledTime: '09:00',
    realTime: '09:30',
    macros: [
      { label: 'Proteína', planned: '200g pollo (46g)', real: '200g pollo (46g)', plannedG: 46, realG: 46 },
      { label: 'Carbohidratos', planned: '250g arroz (200g CH)', real: '250g arroz (200g CH)', plannedG: 200, realG: 200 },
      { label: 'Grasas', planned: '15ml aceite (13g)', real: '15ml aceite (13g)', plannedG: 13, realG: 13 },
    ],
    accuracy: 100,
  },
  {
    name: 'Comida 2',
    scheduledTime: '13:00',
    realTime: '13:20',
    macros: [
      { label: 'Proteína', planned: '200g pavo (50g)', real: '180g pavo (45g)', plannedG: 50, realG: 45 },
      { label: 'Carbohidratos', planned: '200g arroz (170g CH)', real: '150g arroz (127g CH)', plannedG: 170, realG: 127 },
      { label: 'Grasas', planned: '10g mantequilla (8g)', real: '10g mantequilla (8g)', plannedG: 8, realG: 8 },
    ],
    accuracy: 75,
  },
  {
    name: 'Comida 3',
    scheduledTime: '17:00',
    realTime: '17:10',
    macros: [
      { label: 'Proteína', planned: '2 scoops whey (50g)', real: '2 scoops whey (50g)', plannedG: 50, realG: 50 },
      { label: 'Carbohidratos', planned: '80g avena (60g CH)', real: '80g avena (60g CH)', plannedG: 60, realG: 60 },
      { label: 'Grasas', planned: '30g cacahuete (15g)', real: '25g cacahuete (12g)', plannedG: 15, realG: 12 },
    ],
    accuracy: 93,
  },
];

const MOCK_WATER = { planned: 3, real: 3.2, accuracy: 100 };

const MOCK_EXERCISES = [
  {
    name: 'Press Inclinado',
    planned: { sets: 2, reps: '8-10', rir: '1-2' },
    real: { sets: 2, reps: '9, 8', rir: '1, 0' },
    accuracy: 95,
  },
  {
    name: 'Aperturas con Mancuernas',
    planned: { sets: 3, reps: '10-12', rir: '2' },
    real: { sets: 3, reps: '12, 11, 10', rir: '2, 1, 1' },
    accuracy: 97,
  },
];

const MOCK_SLEEP = { planned: 8, real: 6.5, accuracy: 81 };

const MOCK_SUPPLEMENTS = [
  {
    name: 'Creatina 5g',
    plannedTime: '09:00',
    realTime: '10:15',
    dosePlanned: 5,
    doseReal: 5,
    accuracy: 90,
  },
];

const MOCK_GLOBAL = 92;

/* ───────────── Circular Score ───────────── */

const CircularScore = ({ value }: { value: number }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const colorClass = pctColor(value);

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" className="stroke-secondary" strokeWidth="10" />
        <motion.circle
          cx="64" cy="64" r={radius} fill="none"
          strokeWidth="10" strokeLinecap="round"
          stroke={getAdherenceColor(value)}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-black tabular-nums', colorClass)}>{Math.round(value)}%</span>
        <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Precisión</span>
      </div>
    </div>
  );
};

/* ───────────── Accordion Section ───────────── */

interface AccordionSectionProps {
  icon: React.ElementType;
  title: string;
  accuracy: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const AccordionSection = ({ icon: Icon, title, accuracy, defaultOpen = false, children }: AccordionSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const colorClass = pctColor(accuracy);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-4 min-h-[64px] text-left active:bg-muted/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">{title}</p>
        </div>
        <span className={cn('text-xl font-black tabular-nums mr-1', colorClass)}>
          {Math.round(accuracy)}%
        </span>
        <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 space-y-4 border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───────────── Horizontal Bar ───────────── */

const HorizontalBar = ({ value }: { value: number }) => (
  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
    <motion.div
      className={cn('h-full rounded-full', barColor(value))}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(value, 100)}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  </div>
);

/* ───────────── Meal Card ───────────── */

const MealCard = ({ meal }: { meal: typeof MOCK_MEALS[0] }) => {
  const colorClass = pctColor(meal.accuracy);
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">{meal.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              Pautada {meal.scheduledTime} | Real {meal.realTime}
            </span>
          </div>
        </div>
        <span className={cn('text-lg font-black tabular-nums', colorClass)}>
          {meal.accuracy}%
        </span>
      </div>

      {/* Macro rows */}
      <div className="space-y-2.5">
        {meal.macros.map((m, i) => {
          const acc = calcMacroAccuracy(m.realG, m.plannedG);
          const color = pctColor(acc);
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{m.label}</span>
                <span className={cn('font-bold tabular-nums', color)}>{Math.round(acc)}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Pautado: </span>
                  <span className="text-muted-foreground font-medium">{m.planned}</span>
                </div>
                <div>
                  <span className="text-foreground">Real: </span>
                  <span className="text-foreground font-bold">{m.real}</span>
                </div>
              </div>
              <HorizontalBar value={acc} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────────── Exercise Card ───────────── */

const ExerciseCard = ({ exercise }: { exercise: typeof MOCK_EXERCISES[0] }) => {
  const colorClass = pctColor(exercise.accuracy);
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">{exercise.name}</p>
        <span className={cn('text-lg font-black tabular-nums', colorClass)}>
          {exercise.accuracy}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {/* Headers */}
        <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Pautado</p>
        <p className="text-foreground font-semibold uppercase tracking-wider text-[10px]">Realizado</p>

        {/* Sets */}
        <p className="text-muted-foreground">{exercise.planned.sets} Series</p>
        <p className="text-foreground font-bold">{exercise.real.sets} Series</p>

        {/* Reps */}
        <p className="text-muted-foreground">{exercise.planned.reps} Reps</p>
        <p className="text-foreground font-bold">{exercise.real.reps} Reps</p>

        {/* RIR */}
        <p className="text-muted-foreground">RIR {exercise.planned.rir}</p>
        <p className="text-foreground font-bold">RIR {exercise.real.rir}</p>
      </div>

      <HorizontalBar value={exercise.accuracy} />
    </div>
  );
};

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */

interface DailyAdherenceAnalysisProps {
  goals: NutritionGoals | null;
  refreshTrigger?: number;
}

export const DailyAdherenceAnalysis = ({ goals, refreshTrigger = 0 }: DailyAdherenceAnalysisProps) => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [setLogs, setSetLogs] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultGoals = { daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 70 };
  const g = goals || defaultGoals;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [foodRes, setLogRes, suppRes, suppLogRes] = await Promise.all([
        supabase.from('food_logs').select('*').eq('user_id', user.id).eq('logged_date', today),
        supabase.from('set_logs').select('*, exercises(name, series, reps, session_id)').eq('user_id', user.id).gte('logged_at', today + 'T00:00:00').lte('logged_at', today + 'T23:59:59'),
        supabase.from('user_supplements').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('supplement_logs').select('*').eq('user_id', user.id).eq('logged_date', today),
      ]);
      setFoodLogs(foodRes.data || []);
      setSetLogs(setLogRes.data || []);
      setSupplements(suppRes.data || []);
      setSupplementLogs(suppLogRes.data || []);
      setLoading(false);
    };
    load();
  }, [user, today, refreshTrigger]);

  /* ── Real data calculations (used when real data exists) ── */
  const nutritionData = useMemo(() => {
    const totalProtein = foodLogs.reduce((s, l) => s + (Number(l.protein) || 0), 0);
    const totalCarbs = foodLogs.reduce((s, l) => s + (Number(l.carbs) || 0), 0);
    const totalFat = foodLogs.reduce((s, l) => s + (Number(l.fat) || 0), 0);
    const totalCal = foodLogs.reduce((s, l) => s + (Number(l.calories) || 0), 0);
    const accP = calcMacroAccuracy(totalProtein, g.daily_protein);
    const accC = calcMacroAccuracy(totalCarbs, g.daily_carbs);
    const accF = calcMacroAccuracy(totalFat, g.daily_fat);
    const accK = calcMacroAccuracy(totalCal, g.daily_calories);
    return { accuracy: (accP + accC + accF + accK) / 4, totalProtein, totalCarbs, totalFat, totalCal, accP, accC, accF, accK };
  }, [foodLogs, g]);

  const trainingData = useMemo(() => {
    if (setLogs.length === 0) return { accuracy: 100, exercises: [] as any[] };
    const byEx: Record<string, any[]> = {};
    setLogs.forEach(log => { const id = log.exercise_id; if (!byEx[id]) byEx[id] = []; byEx[id].push(log); });
    const scores: any[] = [];
    Object.entries(byEx).forEach(([, logs]) => {
      const ex = logs[0]?.exercises;
      const name = ex?.name || 'Ejercicio';
      const tSets = ex?.series || 3;
      const repsStr = ex?.reps || '8-12';
      const [minR, maxR] = repsStr.includes('-') ? repsStr.split('-').map(Number) : [Number(repsStr), Number(repsStr)];
      const work = logs.filter((l: any) => !l.is_warmup);
      const s = calcSetsScore(work.length, tSets);
      const r = calcRepsScore(work.map((l: any) => l.reps), minR || 8, maxR || 12);
      const ri = calcRirScore(work.map((l: any) => l.rir), null);
      scores.push({ name, accuracy: calcExerciseAccuracy(s, r, ri), sets: work.length, targetSets: tSets });
    });
    return { accuracy: scores.length ? scores.reduce((a, e) => a + e.accuracy, 0) / scores.length : 100, exercises: scores };
  }, [setLogs]);

  const supplementData = useMemo(() => {
    if (supplements.length === 0) return { accuracy: 100, taken: 0, total: 0, hasData: false };
    const taken = supplements.filter((s: any) => supplementLogs.some((l: any) => l.supplement_id === s.id)).length;
    return { accuracy: (taken / supplements.length) * 100, taken, total: supplements.length, hasData: true };
  }, [supplements, supplementLogs]);

  /* decide if we use real or mock */
  const hasRealData = foodLogs.length > 0 || setLogs.length > 0 || supplementData.hasData;

  // Compute real global if real data
  const realGlobal = useMemo(() => {
    if (!hasRealData) return MOCK_GLOBAL;
    let w = 0, s = 0;
    if (foodLogs.length > 0) { s += nutritionData.accuracy * DEFAULT_WEIGHTS.nutrition; w += DEFAULT_WEIGHTS.nutrition; }
    if (setLogs.length > 0) { s += trainingData.accuracy * DEFAULT_WEIGHTS.training; w += DEFAULT_WEIGHTS.training; }
    if (supplementData.hasData) { s += supplementData.accuracy * DEFAULT_WEIGHTS.supplements; w += DEFAULT_WEIGHTS.supplements; }
    return w > 0 ? s / w : MOCK_GLOBAL;
  }, [hasRealData, nutritionData, trainingData, supplementData, foodLogs, setLogs]);

  const globalScore = hasRealData ? realGlobal : MOCK_GLOBAL;

  /* Nutrition section accuracy for accordion header */
  const nutritionSectionAcc = hasRealData && foodLogs.length > 0
    ? nutritionData.accuracy
    : Math.round(MOCK_MEALS.reduce((a, m) => a + m.accuracy, 0) / MOCK_MEALS.length);

  const trainingSectionAcc = hasRealData && setLogs.length > 0
    ? trainingData.accuracy
    : Math.round(MOCK_EXERCISES.reduce((a, e) => a + e.accuracy, 0) / MOCK_EXERCISES.length);

  const recoverySectionAcc = hasRealData && supplementData.hasData
    ? (MOCK_SLEEP.accuracy + supplementData.accuracy) / 2
    : Math.round((MOCK_SLEEP.accuracy + MOCK_SUPPLEMENTS[0].accuracy) / 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">

      {/* ═══════ 1. AI SUMMARY + GLOBAL SCORE ═══════ */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <CircularScore value={globalScore} />

        <p className="text-center text-base font-bold text-foreground">Precisión Diaria</p>

        <div className="rounded-xl bg-muted/50 p-4 flex gap-3 items-start">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">{MOCK_AI_TEXT}</p>
        </div>
      </div>

      {/* ═══════ 2. NUTRICIÓN E HIDRATACIÓN ═══════ */}
      <AccordionSection icon={UtensilsCrossed} title="Nutrición e Hidratación" accuracy={nutritionSectionAcc}>
        {/* Meals (mock or real) */}
        {hasRealData && foodLogs.length > 0 ? (
          <div className="space-y-3">
            {/* Show real summary */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-bold text-foreground">Resumen del día</p>
              {[
                { label: 'Proteína', planned: g.daily_protein, real: Math.round(nutritionData.totalProtein), acc: nutritionData.accP },
                { label: 'Carbohidratos', planned: g.daily_carbs, real: Math.round(nutritionData.totalCarbs), acc: nutritionData.accC },
                { label: 'Grasas', planned: g.daily_fat, real: Math.round(nutritionData.totalFat), acc: nutritionData.accF },
                { label: 'Calorías', planned: g.daily_calories, real: nutritionData.totalCal, acc: nutritionData.accK },
              ].map((row, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{row.label}</span>
                    <span className={cn('font-bold tabular-nums', pctColor(row.acc))}>{Math.round(row.acc)}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <span className="text-muted-foreground">Pautado: {row.planned}g</span>
                    <span className="text-foreground font-bold">Real: {row.real}g</span>
                  </div>
                  <HorizontalBar value={row.acc} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {MOCK_MEALS.map((meal, i) => (
              <MealCard key={i} meal={meal} />
            ))}
          </div>
        )}

        {/* Water */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-bold text-foreground">Hidratación</p>
            <span className={cn('ml-auto text-lg font-black tabular-nums', pctColor(MOCK_WATER.accuracy))}>
              {MOCK_WATER.accuracy}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-muted-foreground">Pautado: {MOCK_WATER.planned}L</span>
            <span className="text-foreground font-bold">Real: {MOCK_WATER.real}L</span>
          </div>
          <HorizontalBar value={MOCK_WATER.accuracy} />
        </div>
      </AccordionSection>

      {/* ═══════ 3. ENTRENAMIENTO ═══════ */}
      <AccordionSection icon={Dumbbell} title="Entrenamiento" accuracy={trainingSectionAcc}>
        {hasRealData && setLogs.length > 0 ? (
          <div className="space-y-3">
            {trainingData.exercises.map((ex: any, i: number) => (
              <div key={i} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{ex.name}</p>
                  <span className={cn('text-lg font-black tabular-nums', pctColor(ex.accuracy))}>{Math.round(ex.accuracy)}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Pautado: {ex.targetSets} series</span>
                  <span className="text-foreground font-bold">Real: {ex.sets} series</span>
                </div>
                <HorizontalBar value={ex.accuracy} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {MOCK_EXERCISES.map((ex, i) => (
              <ExerciseCard key={i} exercise={ex} />
            ))}
          </div>
        )}
      </AccordionSection>

      {/* ═══════ 4. RECUPERACIÓN ═══════ */}
      <AccordionSection icon={Moon} title="Recuperación" accuracy={recoverySectionAcc}>
        {/* Sleep */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <p className="text-sm font-bold text-foreground">Sueño</p>
            <span className={cn('ml-auto text-lg font-black tabular-nums', pctColor(MOCK_SLEEP.accuracy))}>
              {MOCK_SLEEP.accuracy}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-muted-foreground">Pautado: {MOCK_SLEEP.planned}h</span>
            <span className="text-foreground font-bold">Real: {MOCK_SLEEP.real}h</span>
          </div>
          <HorizontalBar value={MOCK_SLEEP.accuracy} />
        </div>

        {/* Supplements */}
        {MOCK_SUPPLEMENTS.map((sup, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-bold text-foreground">{sup.name}</p>
              <span className={cn('ml-auto text-lg font-black tabular-nums', pctColor(sup.accuracy))}>
                {sup.accuracy}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-0.5">
                <p className="text-muted-foreground">Pautado: {sup.dosePlanned}g</p>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {sup.plannedTime}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-foreground font-bold">Real: {sup.doseReal}g</p>
                <p className="text-foreground font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {sup.realTime}
                </p>
              </div>
            </div>
            <HorizontalBar value={sup.accuracy} />
          </div>
        ))}
      </AccordionSection>
    </div>
  );
};
