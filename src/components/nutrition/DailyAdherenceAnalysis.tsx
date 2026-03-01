import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  UtensilsCrossed, Dumbbell, Moon, Pill, Droplets, ChevronDown, Sparkles, Clock, AlertTriangle, TrendingUp } from
'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NutritionGoals } from '@/hooks/useNutritionData';
import {
  calcGeneralAccuracy,
  calcTimeAccuracy,
  calcRepsRangeAccuracy,
  calcSetsAccuracy,
  calcMealMacroAverage,
  calcGlobalAccuracy,
  getAccuracyTextColor,
  getAccuracyBgColor,
  getAdherenceColor,
  DEFAULT_WEIGHTS } from
'./adherenceCalculations';
import { MicrocycleAnalysis } from '@/components/performance/MicrocycleAnalysis';
import { cn } from '@/lib/utils';

/* ───────────────────── MOCK DATA (strict specs) ───────────────────── */

const MOCK_MEALS = [
{
  name: 'Comida 1',
  scheduledTime: '14:00',
  realTime: '14:30',
  food: { planned: '75g Arroz', real: '72g Pasta' },
  macros: [
  { label: 'Carbohidratos', planned: 63, real: 61, unit: 'g' },
  { label: 'Proteínas', planned: 25, real: 25, unit: 'g' },
  { label: 'Grasas', planned: 10, real: 12, unit: 'g' }]

},
{
  name: 'Comida 2',
  scheduledTime: '18:00',
  realTime: '20:30',
  food: { planned: '200g Pavo', real: '100g Pavo' },
  macros: [
  { label: 'Proteína', planned: 60, real: 30, unit: 'g' }]

}];


const MOCK_WATER = { planned: 3, real: 2, unit: 'L' };

const MOCK_EXERCISES = [
{
  name: 'Press Inclinado',
  planned: { sets: 2, minReps: 10, maxReps: 15, rir: '1-2' },
  real: { sets: 2, reps: [9] as number[], rir: '1, 0' }
}];


const MOCK_SLEEP = {
  plannedTime: '23:00',
  realTime: '00:30',
  plannedHours: 8,
  realHours: 6
};

const MOCK_SUPPLEMENTS = [
{
  name: 'Creatina',
  plannedTime: '09:00',
  realTime: '10:30',
  plannedDose: 5,
  realDose: 5,
  unit: 'g'
}];


/* ───────────── Circular Score ───────────── */

const CircularScore = ({ value }: {value: number;}) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(value, 100) / 100 * circumference;
  const colorClass = getAccuracyTextColor(value);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" className="stroke-secondary" strokeWidth="10" />
        <motion.circle
          cx="64" cy="64" r={radius} fill="none"
          strokeWidth="10" strokeLinecap="round"
          stroke={getAdherenceColor(value)}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />

      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-black tabular-nums', colorClass)}>{Math.round(value)}%</span>
        <span className="text-xs text-muted-foreground font-semibold mt-1">Precisión Diaria</span>
      </div>
    </div>);

};

/* ───────────── Horizontal Progress Bar ───────────── */

const ProgressBar = ({ value, colorType }: {value: number;colorType?: 'green' | 'blue' | 'orange' | 'red';}) =>
<div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
    





  </div>;


/* ───────────── Accordion Section ───────────── */

interface AccordionSectionProps {
  icon: React.ElementType;
  title: string;
  accuracy: number;
  hideAccuracy?: boolean;
  colorType?: 'green' | 'blue' | 'orange' | 'red';
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const AccordionSection = ({ icon: Icon, title, accuracy, hideAccuracy, colorType, defaultOpen = false, children }: AccordionSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-4 min-h-[68px] text-left active:bg-muted/30 transition-colors">

        <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">{title}</p>
        </div>
        {!hideAccuracy &&
        <span className={cn('text-xl font-black tabular-nums mr-1', getAccuracyTextColor(accuracy, colorType))}>
            {Math.round(accuracy)}%
          </span>
        }
        <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden">

            <div className="px-4 pb-5 pt-1 space-y-4 border-t border-border">
              {children}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

};

/* ───────────── Deviation Badge ───────────── */
const DeviationBadge = () =>
<span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
    <AlertTriangle className="w-3 h-3" /> Desviación detectada
  </span>;


/* ───────────── Metric Row ───────────── */
const MetricRow = ({
  label, planned, real, unit, accuracy, colorType



}: {label: string;planned: string | number;real: string | number;unit?: string;accuracy: number;colorType?: 'green' | 'blue' | 'orange' | 'red';}) =>
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
        <span className="text-muted-foreground font-medium">{planned}{unit ? unit : ''}</span>
      </div>
      <div className="flex-1">
        <span className="text-foreground">Real: </span>
        <span className="text-foreground font-bold">{real}{unit ? unit : ''}</span>
      </div>
    </div>
    <ProgressBar value={accuracy} colorType={colorType} />
  </div>;


/* ═══════════════════ MAIN COMPONENT ═══════════════════ */

interface DailyAdherenceAnalysisProps {
  goals: NutritionGoals | null;
  refreshTrigger?: number;
  microcycleId?: string;
  microcycleStart?: string;
  microcycleEnd?: string | null;
  durationWeeks?: number;
}

export const DailyAdherenceAnalysis = ({ goals, refreshTrigger = 0, microcycleId, microcycleStart, microcycleEnd, durationWeeks }: DailyAdherenceAnalysisProps) => {
  const { user } = useAuth();
  const [microAnalysisOpen, setMicroAnalysisOpen] = useState(false);
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
      supabase.from('supplement_logs').select('*').eq('user_id', user.id).eq('logged_date', today)]
      );
      setFoodLogs(foodRes.data || []);
      setSetLogs(setLogRes.data || []);
      setSupplements(suppRes.data || []);
      setSupplementLogs(suppLogRes.data || []);
      setLoading(false);
    };
    load();
  }, [user, today, refreshTrigger]);

  /* ── Real data: nutrition ── */
  const realNutrition = useMemo(() => {
    if (foodLogs.length === 0) return null;
    const totalProtein = foodLogs.reduce((s, l) => s + (Number(l.protein) || 0), 0);
    const totalCarbs = foodLogs.reduce((s, l) => s + (Number(l.carbs) || 0), 0);
    const totalFat = foodLogs.reduce((s, l) => s + (Number(l.fat) || 0), 0);
    const accP = calcGeneralAccuracy(g.daily_protein, totalProtein);
    const accC = calcGeneralAccuracy(g.daily_carbs, totalCarbs);
    const accF = calcGeneralAccuracy(g.daily_fat, totalFat);
    return { totalProtein, totalCarbs, totalFat, accP, accC, accF, avg: Math.round((accP + accC + accF) / 3) };
  }, [foodLogs, g]);

  /* ── Real data: training ── */
  const realTraining = useMemo(() => {
    if (setLogs.length === 0) return null;
    const byEx: Record<string, any[]> = {};
    setLogs.forEach((log) => {const id = log.exercise_id;if (!byEx[id]) byEx[id] = [];byEx[id].push(log);});
    const exercises: any[] = [];
    Object.entries(byEx).forEach(([, logs]) => {
      const ex = logs[0]?.exercises;
      const name = ex?.name || 'Ejercicio';
      const tSets = ex?.series || 3;
      const repsStr = ex?.reps || '8-12';
      const [minR, maxR] = repsStr.includes('-') ? repsStr.split('-').map(Number) : [Number(repsStr), Number(repsStr)];
      const work = logs.filter((l: any) => !l.is_warmup);
      const setsResult = calcSetsAccuracy(tSets, work.length);
      // Average reps accuracy across sets
      const repsResults = work.map((l: any) => calcRepsRangeAccuracy(minR || 8, maxR || 12, l.reps));
      const avgRepsAcc = repsResults.length > 0 ? Math.round(repsResults.reduce((a, r) => a + r.accuracy, 0) / repsResults.length) : 100;
      const overallAcc = Math.round((setsResult.accuracy + avgRepsAcc) / 2);
      exercises.push({ name, accuracy: overallAcc, sets: work.length, targetSets: tSets, reps: work.map((l: any) => l.reps), minR, maxR, setsResult, repsResults });
    });
    const avg = exercises.length ? Math.round(exercises.reduce((a, e) => a + e.accuracy, 0) / exercises.length) : 100;
    return { exercises, avg };
  }, [setLogs]);

  /* ── Real data: supplements ── */
  const realSupplements = useMemo(() => {
    if (supplements.length === 0) return null;
    const taken = supplements.filter((s: any) => supplementLogs.some((l: any) => l.supplement_id === s.id)).length;
    const acc = calcGeneralAccuracy(supplements.length, taken);
    return { taken, total: supplements.length, acc };
  }, [supplements, supplementLogs]);

  const hasRealData = foodLogs.length > 0 || setLogs.length > 0 || supplements.length > 0 && supplementLogs.length > 0;

  /* ── Mock calculations ── */
  const mockMealAccuracies = MOCK_MEALS.map((meal) => {
    const macroAcc = calcMealMacroAverage(meal.macros.map((m) => ({ planned: m.planned, real: m.real })));
    const timeAcc = calcTimeAccuracy(meal.scheduledTime, meal.realTime);
    return { ...meal, macroAcc, timeAcc, overallAcc: Math.round((macroAcc + timeAcc) / 2) };
  });
  const mockWaterAcc = calcGeneralAccuracy(MOCK_WATER.planned, MOCK_WATER.real);
  const mockNutritionAcc = Math.round(
    (mockMealAccuracies.reduce((a, m) => a + m.overallAcc, 0) + mockWaterAcc) / (mockMealAccuracies.length + 1)
  );

  const mockExerciseCalcs = MOCK_EXERCISES.map((ex) => {
    const setsResult = calcSetsAccuracy(ex.planned.sets, ex.real.sets);
    // For mock, real sets count = planned (2 series done)
    const setsAcc = calcSetsAccuracy(ex.planned.sets, 2);
    const repsResults = ex.real.reps.map((r) => calcRepsRangeAccuracy(ex.planned.minReps, ex.planned.maxReps, r));
    const avgRepsAcc = repsResults.length > 0 ? Math.round(repsResults.reduce((a, r) => a + r.accuracy, 0) / repsResults.length) : 100;
    const overallAcc = Math.round((setsAcc.accuracy + avgRepsAcc) / 2);
    const hasDeviation = setsAcc.accuracy < 90 || repsResults.some((r) => r.accuracy < 90);
    return { ...ex, setsAcc, repsResults, avgRepsAcc, overallAcc, hasDeviation };
  });
  const mockTrainingAcc = Math.round(mockExerciseCalcs.reduce((a, e) => a + e.overallAcc, 0) / mockExerciseCalcs.length);

  const mockSleepTimeAcc = calcTimeAccuracy(MOCK_SLEEP.plannedTime, MOCK_SLEEP.realTime);
  const mockSleepHoursAcc = calcGeneralAccuracy(MOCK_SLEEP.plannedHours, MOCK_SLEEP.realHours);
  const mockSleepAcc = Math.round((mockSleepTimeAcc + mockSleepHoursAcc) / 2);

  const mockSuppCalcs = MOCK_SUPPLEMENTS.map((s) => {
    const timeAcc = calcTimeAccuracy(s.plannedTime, s.realTime);
    const doseAcc = calcGeneralAccuracy(s.plannedDose, s.realDose);
    const overallAcc = Math.round((timeAcc + doseAcc) / 2);
    return { ...s, timeAcc, doseAcc, overallAcc };
  });
  const mockSuppAcc = Math.round(mockSuppCalcs.reduce((a, s) => a + s.overallAcc, 0) / mockSuppCalcs.length);

  /* ── Section accuracies ── */
  const nutritionAcc = realNutrition ? realNutrition.avg : mockNutritionAcc;
  const trainingAcc = realTraining ? realTraining.avg : mockTrainingAcc;
  const sleepAcc = mockSleepAcc; // No sleep table yet
  const suppAcc = realSupplements ? realSupplements.acc : mockSuppAcc;

  const globalScore = calcGlobalAccuracy(nutritionAcc, trainingAcc, sleepAcc, suppAcc);

  /* ── AI Summary Text (structured: positive, negative, positive) ── */
  const aiText = useMemo(() => {
    const positives: string[] = [];
    const negatives: string[] = [];

    if (nutritionAcc >= 95) positives.push('los alimentos y macros');else
    if (nutritionAcc < 90) negatives.push(`la nutrición está al ${nutritionAcc}%`);

    if (trainingAcc >= 95) positives.push('el entrenamiento');else
    if (trainingAcc < 90) negatives.push(`el entrenamiento marca ${trainingAcc}%`);

    if (sleepAcc >= 95) positives.push('tu sueño');else
    if (sleepAcc < 90) negatives.push(`dormiste menos de lo pautado (${sleepAcc}%)`);

    if (suppAcc >= 95) positives.push('la adherencia a los suplementos');else
    if (suppAcc < 90) negatives.push(`suplementación al ${suppAcc}%`);

    const posText = positives.length > 0 ? `¡Excelente disciplina hoy! Has clavado ${positives.join(' y ')}.` : '¡Buen esfuerzo hoy!';
    const negText = negatives.length > 0 ? ` Sin embargo, ${negatives.join(', ')}, lo que afecta tu recuperación.` : '';
    const closeText = ' Aún así, tu esfuerzo general es brutal, ¡sigamos ajustando para mañana!';

    return posText + negText + closeText;
  }, [nutritionAcc, trainingAcc, sleepAcc, suppAcc]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  return (
    <div className="space-y-5 p-4">

      {/* ═══════ 1. GLOBAL SCORE + AI SUMMARY ═══════ */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <CircularScore value={globalScore} />

        <div className="rounded-xl bg-muted/50 p-4 flex gap-3 items-start">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">{aiText}</p>
        </div>
      </div>

      {/* ═══════ 2. NUTRICIÓN E HIDRATACIÓN ═══════ */}
      <AccordionSection icon={UtensilsCrossed} title="Nutrición e Hidratación" accuracy={nutritionAcc}>
        {hasRealData && realNutrition ?
        <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-bold text-foreground">Resumen del día</p>
              <MetricRow label="Proteína" planned={g.daily_protein} real={Math.round(realNutrition.totalProtein)} unit="g" accuracy={realNutrition.accP} />
              <MetricRow label="Carbohidratos" planned={g.daily_carbs} real={Math.round(realNutrition.totalCarbs)} unit="g" accuracy={realNutrition.accC} />
              <MetricRow label="Grasas" planned={g.daily_fat} real={Math.round(realNutrition.totalFat)} unit="g" accuracy={realNutrition.accF} />
              <div className="pt-2">
                <ProgressBar value={realNutrition.avg} />
              </div>
            </div>
          </div> :

        <div className="space-y-3">
            {mockMealAccuracies.map((meal, idx) => {
            const timeAcc = meal.timeAcc;
            return (
              <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                  {/* Meal header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{meal.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">
                          Pautada {meal.scheduledTime} | Real {meal.realTime}
                        </span>
                        <span className={cn('text-[11px] font-bold ml-1', getAccuracyTextColor(timeAcc))}>
                          ({timeAcc}%)
                        </span>
                      </div>
                    </div>
                    <span className={cn('text-lg font-black tabular-nums', getAccuracyTextColor(meal.overallAcc))}>
                      {meal.overallAcc}%
                    </span>
                  </div>

                  {/* Food */}
                  <div className="text-xs space-y-0.5">
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">Pautado: <span className="font-medium">{meal.food.planned}</span></span>
                      <span className="text-foreground">Real: <span className="font-bold">{meal.food.real}</span></span>
                    </div>
                  </div>

                  {/* Macros */}
                  {meal.macros.map((m, i) => {
                  const acc = calcGeneralAccuracy(m.planned, m.real);
                  return (
                    <MetricRow key={i} label={m.label} planned={m.planned} real={m.real} unit={m.unit} accuracy={acc} />);

                })}

                  <ProgressBar value={meal.macroAcc} />
                </div>);

          })}

            {/* Water */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-foreground" />
                <span className="text-sm font-bold text-foreground">Hidratación</span>
              </div>
              <MetricRow label="Agua" planned={MOCK_WATER.planned} real={MOCK_WATER.real} unit="L" accuracy={mockWaterAcc} />
              <ProgressBar value={mockWaterAcc} />
            </div>
          </div>
        }
      </AccordionSection>

      {/* ═══════ 3. ENTRENAMIENTO ═══════ */}
      <AccordionSection icon={Dumbbell} title="Entrenamiento" accuracy={trainingAcc}>
        {hasRealData && realTraining ?
        <div className="space-y-3">
            {realTraining.exercises.map((ex: any, idx: number) =>
          <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{ex.name}</p>
                  <span className={cn('text-lg font-black tabular-nums', getAccuracyTextColor(ex.accuracy))}>
                    {ex.accuracy}%
                  </span>
                </div>
                <MetricRow
              label="Series"
              planned={ex.targetSets}
              real={ex.sets}
              accuracy={ex.setsResult.accuracy}
              colorType={ex.setsResult.colorType} />

                {ex.reps.map((r: number, i: number) =>
            <MetricRow
              key={i}
              label={`Reps Serie ${i + 1}`}
              planned={`${ex.minR}-${ex.maxR}`}
              real={r}
              accuracy={ex.repsResults[i]?.accuracy ?? 100}
              colorType={ex.repsResults[i]?.colorType} />

            )}
                {ex.accuracy < 90 && <DeviationBadge />}
                <ProgressBar value={ex.accuracy} />
              </div>
          )}
          </div> :

        <div className="space-y-3">
            {mockExerciseCalcs.map((ex, idx) =>
          <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{ex.name}</p>
                  <span className={cn('text-lg font-black tabular-nums', getAccuracyTextColor(ex.overallAcc))}>
                    {ex.overallAcc}%
                  </span>
                </div>

                {/* Sets */}
                <MetricRow
              label="Series"
              planned={ex.planned.sets}
              real={2}
              accuracy={ex.setsAcc.accuracy}
              colorType={ex.setsAcc.colorType} />


                {/* Reps */}
                <MetricRow
              label="Repeticiones"
              planned={`${ex.planned.minReps}-${ex.planned.maxReps}`}
              real={ex.real.reps.join(', ')}
              accuracy={ex.avgRepsAcc}
              colorType={ex.repsResults[0]?.colorType} />


                {/* RIR */}
                <div className="text-xs flex gap-4">
                  <span className="text-muted-foreground">RIR Pautado: <span className="font-medium">{ex.planned.rir}</span></span>
                  <span className="text-foreground">RIR Real: <span className="font-bold">{ex.real.rir}</span></span>
                </div>

                {ex.hasDeviation && <DeviationBadge />}
                <ProgressBar value={ex.overallAcc} colorType={ex.repsResults[0]?.colorType} />
              </div>
          )}
          </div>
        }
      </AccordionSection>

      {/* ═══════ 4. RECUPERACIÓN Y SUPLEMENTOS ═══════ */}
      <AccordionSection icon={Moon} title="Recuperación y Suplementos" accuracy={Math.round((sleepAcc + suppAcc) / 2)}>
        {/* Sleep */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-4 h-4 text-foreground" />
            <span className="text-sm font-bold text-foreground">Sueño</span>
          </div>
          <MetricRow
            label="Horario"
            planned={MOCK_SLEEP.plannedTime}
            real={MOCK_SLEEP.realTime}
            accuracy={mockSleepTimeAcc} />

          <MetricRow
            label="Horas"
            planned={MOCK_SLEEP.plannedHours}
            real={MOCK_SLEEP.realHours}
            unit="h"
            accuracy={mockSleepHoursAcc} />

          <ProgressBar value={mockSleepAcc} />
        </div>

        {/* Supplements */}
        {hasRealData && realSupplements ?
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Pill className="w-4 h-4 text-foreground" />
              <span className="text-sm font-bold text-foreground">Suplementación</span>
            </div>
            <MetricRow
            label="Tomados"
            planned={realSupplements.total}
            real={realSupplements.taken}
            accuracy={realSupplements.acc} />

            <ProgressBar value={realSupplements.acc} />
          </div> :

        <div className="space-y-3">
            {mockSuppCalcs.map((supp, idx) =>
          <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Pill className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-bold text-foreground">{supp.name}</span>
                </div>
                <MetricRow
              label="Horario"
              planned={supp.plannedTime}
              real={supp.realTime}
              accuracy={supp.timeAcc} />

                <MetricRow
              label="Dosis"
              planned={supp.plannedDose}
              real={supp.realDose}
              unit={supp.unit}
              accuracy={supp.doseAcc} />

                <ProgressBar value={supp.overallAcc} />
              </div>
          )}
          </div>
        }
      </AccordionSection>

      {/* ═══════ 5. ANÁLISIS DEL MICROCICLO ═══════ */}
      <AccordionSection icon={TrendingUp} title="Análisis del Microciclo" accuracy={0} hideAccuracy defaultOpen={false}>
        <MicrocycleAnalysis
          goals={goals}
          microcycleId={microcycleId}
          microcycleStart={microcycleStart}
          microcycleEnd={microcycleEnd}
          durationWeeks={durationWeeks} />

      </AccordionSection>
    </div>);

};