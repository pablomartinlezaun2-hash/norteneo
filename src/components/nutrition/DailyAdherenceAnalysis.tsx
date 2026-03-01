import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  UtensilsCrossed, Dumbbell, Moon, Pill, Droplets, ChevronDown, Sparkles, Clock, AlertTriangle, TrendingUp,
} from 'lucide-react';
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
  DEFAULT_WEIGHTS,
} from './adherenceCalculations';
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
      { label: 'Grasas', planned: 10, real: 12, unit: 'g' },
    ],
  },
  {
    name: 'Comida 2',
    scheduledTime: '18:00',
    realTime: '20:30',
    food: { planned: '200g Pavo', real: '100g Pavo' },
    macros: [
      { label: 'Proteína', planned: 60, real: 30, unit: 'g' },
    ],
  },
];

const MOCK_WATER = { planned: 3, real: 2, unit: 'L' };

const MOCK_EXERCISES = [
  {
    name: 'Press Inclinado',
    planned: { sets: 2, repRange: '10-15', minReps: 10, maxReps: 15, rir: '1-2' },
    real: { sets: 2, reps: [9, 12] as number[], rir: [1, 0] as number[] },
  },
  {
    name: 'Aperturas con Mancuerna',
    planned: { sets: 3, repRange: '12-15', minReps: 12, maxReps: 15, rir: '2-3' },
    real: { sets: 3, reps: [14, 13, 12] as number[], rir: [2, 2, 1] as number[] },
  },
];

const MOCK_SLEEP = {
  plannedTime: '23:00',
  realTime: '00:30',
  plannedHours: 8,
  realHours: 6,
};

const MOCK_SUPPLEMENTS = [
  {
    name: 'Creatina',
    plannedTime: '09:00',
    realTime: '10:30',
    plannedDose: 5,
    realDose: 5,
    unit: 'g',
  },
];

/* ───────────── Circular Score ───────────── */

const CircularScore = ({ value }: { value: number }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
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
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-black tabular-nums', colorClass)}>{Math.round(value)}%</span>
        <span className="text-xs text-muted-foreground font-semibold mt-1">Precisión Diaria</span>
      </div>
    </div>
  );
};

/* ───────────── Horizontal Progress Bar ───────────── */

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
        className="w-full flex items-center gap-3 px-4 py-4 min-h-[68px] text-left active:bg-muted/30 transition-colors"
      >
        <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">{title}</p>
        </div>
        {!hideAccuracy && (
          <span className={cn('text-xl font-black tabular-nums mr-1', getAccuracyTextColor(accuracy, colorType))}>
            {Math.round(accuracy)}%
          </span>
        )}
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

/* ───────────── Deviation Badge ───────────── */
const DeviationBadge = () => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
    <AlertTriangle className="w-3 h-3" /> Desviación detectada
  </span>
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
        <span className="text-muted-foreground font-medium">{planned}{unit ? unit : ''}</span>
      </div>
      <div className="flex-1">
        <span className="text-foreground">Real: </span>
        <span className="text-foreground font-bold">{real}{unit ? unit : ''}</span>
      </div>
    </div>
    <ProgressBar value={accuracy} colorType={colorType} />
  </div>
);

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
  const [activeMealIdx, setActiveMealIdx] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const defaultGoals = { daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 70 };
  const g = goals || defaultGoals;

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [foodRes, setLogRes, suppRes, suppLogRes] = await Promise.all([
      supabase.from('food_logs').select('*').eq('user_id', user.id).eq('logged_date', today).order('created_at'),
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

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user, today, refreshTrigger]);

  /* ── Realtime subscriptions ── */
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('adherence-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_logs', filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'set_logs', filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplement_logs', filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  /* ── Real data: nutrition grouped by meal ── */
  const mealGroups = useMemo(() => {
    if (foodLogs.length === 0) return [];
    // Group by meal_type
    const grouped: Record<string, any[]> = {};
    foodLogs.forEach((log: any) => {
      const key = log.meal_type || 'Otro';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });
    // Sort by earliest created_at per group
    const entries = Object.entries(grouped).sort((a, b) => {
      const tA = new Date(a[1][0]?.created_at || 0).getTime();
      const tB = new Date(b[1][0]?.created_at || 0).getTime();
      return tA - tB;
    });
    return entries.map(([mealType, logs], idx) => {
      const protein = logs.reduce((s: number, l: any) => s + (Number(l.protein) || 0), 0);
      const carbs = logs.reduce((s: number, l: any) => s + (Number(l.carbs) || 0), 0);
      const fat = logs.reduce((s: number, l: any) => s + (Number(l.fat) || 0), 0);
      const calories = logs.reduce((s: number, l: any) => s + (Number(l.calories) || 0), 0);
      const loggedTime = logs[0]?.created_at ? format(new Date(logs[0].created_at), 'HH:mm') : '--:--';
      const foods = logs.map((l: any) => `${l.quantity}${l.unit || 'g'} ${l.food_name}`);
      return { mealType, index: idx + 1, protein, carbs, fat, calories, loggedTime, foods, logCount: logs.length };
    });
  }, [foodLogs]);

  const realNutrition = useMemo(() => {
    if (foodLogs.length === 0) return null;
    const totalProtein = foodLogs.reduce((s: number, l: any) => s + (Number(l.protein) || 0), 0);
    const totalCarbs = foodLogs.reduce((s: number, l: any) => s + (Number(l.carbs) || 0), 0);
    const totalFat = foodLogs.reduce((s: number, l: any) => s + (Number(l.fat) || 0), 0);
    const accP = calcGeneralAccuracy(g.daily_protein, totalProtein);
    const accC = calcGeneralAccuracy(g.daily_carbs, totalCarbs);
    const accF = calcGeneralAccuracy(g.daily_fat, totalFat);
    return { totalProtein, totalCarbs, totalFat, accP, accC, accF, avg: Math.round((accP + accC + accF) / 3) };
  }, [foodLogs, g]);

  /* ── Real data: training ── */
  const realTraining = useMemo(() => {
    if (setLogs.length === 0) return null;
    const byEx: Record<string, any[]> = {};
    setLogs.forEach(log => { const id = log.exercise_id; if (!byEx[id]) byEx[id] = []; byEx[id].push(log); });
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

  const hasRealData = foodLogs.length > 0 || setLogs.length > 0 || (supplements.length > 0 && supplementLogs.length > 0);

  /* ── Mock calculations ── */
  const mockMealAccuracies = MOCK_MEALS.map(meal => {
    const macroAcc = calcMealMacroAverage(meal.macros.map(m => ({ planned: m.planned, real: m.real })));
    const timeAcc = calcTimeAccuracy(meal.scheduledTime, meal.realTime);
    return { ...meal, macroAcc, timeAcc, overallAcc: Math.round((macroAcc + timeAcc) / 2) };
  });
  const mockWaterAcc = calcGeneralAccuracy(MOCK_WATER.planned, MOCK_WATER.real);
  const mockNutritionAcc = Math.round(
    (mockMealAccuracies.reduce((a, m) => a + m.overallAcc, 0) + mockWaterAcc) / (mockMealAccuracies.length + 1)
  );

  const mockExerciseCalcs = MOCK_EXERCISES.map(ex => {
    const setsAcc = calcSetsAccuracy(ex.planned.sets, ex.real.sets);
    const repsResults = ex.real.reps.map(r => calcRepsRangeAccuracy(ex.planned.minReps, ex.planned.maxReps, r));
    const avgRepsAcc = repsResults.length > 0 ? Math.round(repsResults.reduce((a, r) => a + r.accuracy, 0) / repsResults.length) : 100;
    const overallAcc = Math.round((setsAcc.accuracy + avgRepsAcc) / 2);
    return { ...ex, setsAcc, repsResults, avgRepsAcc, overallAcc };
  });
  const mockTrainingAcc = Math.round(mockExerciseCalcs.reduce((a, e) => a + e.overallAcc, 0) / mockExerciseCalcs.length);

  const mockSleepTimeAcc = calcTimeAccuracy(MOCK_SLEEP.plannedTime, MOCK_SLEEP.realTime);
  const mockSleepHoursAcc = calcGeneralAccuracy(MOCK_SLEEP.plannedHours, MOCK_SLEEP.realHours);
  const mockSleepAcc = Math.round((mockSleepTimeAcc + mockSleepHoursAcc) / 2);

  const mockSuppCalcs = MOCK_SUPPLEMENTS.map(s => {
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

  /* ── AI Summary Text (exhaustive daily analysis) ── */
  const aiText = useMemo(() => {
    const lines: string[] = [];

    // ── Opening verdict ──
    if (globalScore >= 95) {
      lines.push('📊 **Día sobresaliente.** Tu disciplina hoy ha sido prácticamente perfecta en todas las métricas.');
    } else if (globalScore >= 90) {
      lines.push(`📊 **Buen día (${globalScore}%).** Rendimiento sólido con algunos puntos menores que ajustar.`);
    } else if (globalScore >= 75) {
      lines.push(`⚠️ **Día irregular (${globalScore}%).** Se detectan desviaciones significativas en varias métricas.`);
    } else {
      lines.push(`🔴 **Día crítico (${globalScore}%).** Múltiples áreas presentan desviaciones graves que pueden impactar tu progreso.`);
    }

    // ── Nutrition detail ──
    if (realNutrition) {
      const { totalProtein, totalCarbs, totalFat, accP, accC, accF, avg } = realNutrition;
      const diffP = totalProtein - g.daily_protein;
      const diffC = totalCarbs - g.daily_carbs;
      const diffF = totalFat - g.daily_fat;
      if (avg >= 95) {
        lines.push(`🍽️ **Nutrición excelente (${avg}%).** Macros prácticamente clavados: P ${Math.round(totalProtein)}g, C ${Math.round(totalCarbs)}g, G ${Math.round(totalFat)}g.`);
      } else {
        const issues: string[] = [];
        if (accP < 90) issues.push(`proteína ${diffP > 0 ? '+' : ''}${Math.round(diffP)}g (${accP}%)`);
        if (accC < 90) issues.push(`carbohidratos ${diffC > 0 ? '+' : ''}${Math.round(diffC)}g (${accC}%)`);
        if (accF < 90) issues.push(`grasas ${diffF > 0 ? '+' : ''}${Math.round(diffF)}g (${accF}%)`);
        if (issues.length > 0) {
          lines.push(`🍽️ **Nutrición al ${avg}%.** Desviaciones en: ${issues.join(', ')}. ${diffP < -20 ? 'El déficit de proteína puede comprometer la recuperación muscular y la síntesis proteica.' : diffP > 30 ? 'El exceso de proteína podría indicar un desbalance de macros.' : ''}`);
        } else {
          lines.push(`🍽️ **Nutrición al ${avg}%.** Los macros están cerca del objetivo pero hay margen de mejora en la precisión.`);
        }
      }
      if (mealGroups.length < 3) {
        lines.push(`   ⚠ Solo ${mealGroups.length} comidas registradas. Distribuir las ingestas en 4-5 tomas mejora la absorción de nutrientes y el control del apetito.`);
      }
    } else {
      lines.push(`🍽️ **Nutrición (mock ${nutritionAcc}%).** Sin datos reales registrados hoy. Recuerda loguear tus comidas para un análisis preciso.`);
    }

    // ── Training detail ──
    if (realTraining) {
      const { exercises, avg } = realTraining;
      const failedEx = exercises.filter(e => e.accuracy < 85);
      const perfectEx = exercises.filter(e => e.accuracy >= 98);
      if (avg >= 95) {
        lines.push(`💪 **Entrenamiento impecable (${avg}%).** ${exercises.length} ejercicios completados con alta precisión.${perfectEx.length > 0 ? ` Destacan: ${perfectEx.map(e => e.name).join(', ')}.` : ''}`);
      } else {
        lines.push(`💪 **Entrenamiento al ${avg}%.** ${exercises.length} ejercicios realizados.`);
        if (failedEx.length > 0) {
          failedEx.forEach(ex => {
            const setsIssue = ex.sets < ex.targetSets ? `faltan ${ex.targetSets - ex.sets} series` : '';
            const repsBelow = ex.reps.filter((r: number) => r < ex.minR).length;
            const repsIssue = repsBelow > 0 ? `${repsBelow} series por debajo del rango mínimo (${ex.minR})` : '';
            const details = [setsIssue, repsIssue].filter(Boolean).join(', ');
            lines.push(`   ⚠ ${ex.name} (${ex.accuracy}%): ${details || 'precisión baja en repeticiones'}. ${ex.accuracy < 70 ? 'Considera reducir el peso o ajustar el rango de repeticiones si la fatiga persiste.' : 'Pequeño ajuste necesario.'}`);
          });
        }
      }
    } else {
      lines.push(`💪 **Entrenamiento (mock ${trainingAcc}%).** Sin series registradas hoy. Si fue día de descanso, perfecto.`);
    }

    // ── Sleep ──
    if (sleepAcc >= 95) {
      lines.push(`😴 **Sueño óptimo (${sleepAcc}%).** El descanso adecuado maximiza la síntesis proteica nocturna y la recuperación del SNC.`);
    } else if (sleepAcc >= 80) {
      lines.push(`😴 **Sueño aceptable (${sleepAcc}%).** Una leve desviación en el horario o duración. Intenta mantener la hora de dormir consistente para regular tu ritmo circadiano.`);
    } else {
      lines.push(`😴 **Sueño deficiente (${sleepAcc}%).** El descanso insuficiente reduce hasta un 40% la capacidad de recuperación muscular y aumenta la percepción de fatiga. Prioriza dormir al menos 7h.`);
    }

    // ── Supplements ──
    if (realSupplements) {
      if (realSupplements.acc >= 100) {
        lines.push(`💊 **Suplementación perfecta.** Todos los suplementos tomados (${realSupplements.taken}/${realSupplements.total}).`);
      } else {
        const missed = realSupplements.total - realSupplements.taken;
        lines.push(`💊 **Suplementación al ${realSupplements.acc}%.** Faltan ${missed} suplemento(s) por tomar. La consistencia diaria es clave para obtener beneficios acumulativos.`);
      }
    } else {
      lines.push(`💊 **Suplementación (mock ${suppAcc}%).** Sin datos reales de suplementos hoy.`);
    }

    // ── Closing recommendation ──
    if (globalScore >= 95) {
      lines.push('✅ **Conclusión:** Día excelente. Mantener esta consistencia durante todo el microciclo es la clave para maximizar las adaptaciones.');
    } else if (globalScore >= 85) {
      lines.push('📌 **Conclusión:** Buen día con margen de mejora. Enfócate mañana en las áreas marcadas con ⚠ para acercarte al 95%+.');
    } else {
      lines.push('🚨 **Conclusión:** Hoy se detectan desviaciones que, si se repiten, pueden frenar tu progreso. Revisa las alertas y ajusta para mañana.');
    }

    return lines.join('\n\n');
  }, [nutritionAcc, trainingAcc, sleepAcc, suppAcc, globalScore, realNutrition, realTraining, realSupplements, mealGroups, g]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">

      {/* ═══════ 1. GLOBAL SCORE + AI SUMMARY ═══════ */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <CircularScore value={globalScore} />

        <div className="rounded-xl bg-muted/50 p-4 flex gap-3 items-start">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{aiText}</div>
        </div>
      </div>

      {/* ═══════ 2. NUTRICIÓN E HIDRATACIÓN ═══════ */}
      <AccordionSection icon={UtensilsCrossed} title="Nutrición e Hidratación" accuracy={nutritionAcc}>
        {mealGroups.length > 0 ? (() => {
          const SCHEDULED_TIMES: Record<string, string> = {
            'Desayuno': '08:00', 'Comida': '14:00', 'Merienda': '17:00',
            'Cena': '21:00', 'Snack': '11:00', 'Pre-entreno': '16:00',
            'Post-entreno': '18:00', 'Otro': '12:00',
          };
          const numMeals = mealGroups.length;
          const safeMealIdx = Math.min(activeMealIdx, numMeals - 1);
          const activeMeal = mealGroups[safeMealIdx];
          const mealTargetP = Math.round(g.daily_protein / numMeals);
          const mealTargetC = Math.round(g.daily_carbs / numMeals);
          const mealTargetF = Math.round(g.daily_fat / numMeals);
          const accP = calcGeneralAccuracy(mealTargetP, Math.round(activeMeal.protein));
          const accC = calcGeneralAccuracy(mealTargetC, Math.round(activeMeal.carbs));
          const accF = calcGeneralAccuracy(mealTargetF, Math.round(activeMeal.fat));
          const mealAvg = Math.round((accP + accC + accF) / 3);

          return (
            <div className="space-y-4">
              {/* ── Meal selector circles ── */}
              <div className="flex items-center justify-center gap-3">
                {mealGroups.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMealIdx(idx)}
                    className={cn(
                      'w-10 h-10 rounded-full text-sm font-bold transition-all flex items-center justify-center',
                      idx === safeMealIdx
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* ── Active meal panel ── */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={safeMealIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-border/60 bg-muted/30 p-5 space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-foreground">Comida {safeMealIdx + 1} — {activeMeal.mealType}</p>
                    </div>
                    <span className={cn('text-2xl font-black tabular-nums', getAccuracyTextColor(mealAvg))}>
                      {mealAvg}%
                    </span>
                  </div>

                  {/* Time accuracy */}
                  {(() => {
                    const scheduledTime = SCHEDULED_TIMES[activeMeal.mealType] || '12:00';
                    const timeAcc = calcTimeAccuracy(scheduledTime, activeMeal.loggedTime);
                    return (
                      <div className="rounded-lg bg-background/50 p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">Horario</span>
                          <span className={cn('text-sm font-black tabular-nums ml-auto', getAccuracyTextColor(timeAcc))}>
                            {timeAcc}%
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <div className="flex-1">
                            <span className="text-muted-foreground">Pautada: </span>
                            <span className="text-muted-foreground font-medium">{scheduledTime}</span>
                          </div>
                          <div className="flex-1">
                            <span className="text-foreground">Real: </span>
                            <span className="text-foreground font-bold">{activeMeal.loggedTime}</span>
                          </div>
                        </div>
                        <ProgressBar value={timeAcc} />
                      </div>
                    );
                  })()}

                  {/* Foods */}
                  <div className="text-xs space-y-1 bg-background/50 rounded-lg p-3">
                    {activeMeal.foods.map((f: string, i: number) => (
                      <p key={i} className="text-foreground font-medium">• {f}</p>
                    ))}
                  </div>

                  {/* Individual macro bars */}
                  <div className="space-y-4">
                    <MetricRow label="Proteína" planned={mealTargetP} real={Math.round(activeMeal.protein)} unit="g" accuracy={accP} />
                    <MetricRow label="Carbohidratos" planned={mealTargetC} real={Math.round(activeMeal.carbs)} unit="g" accuracy={accC} />
                    <MetricRow label="Grasas" planned={mealTargetF} real={Math.round(activeMeal.fat)} unit="g" accuracy={accF} />
                  </div>

                  {/* Overall meal bar */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-muted-foreground">Exactitud media comida</span>
                      <span className={cn('font-black', getAccuracyTextColor(mealAvg))}>{mealAvg}%</span>
                    </div>
                    <ProgressBar value={mealAvg} />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* ── Daily total ── */}
              {realNutrition && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-bold text-foreground">📊 Total del día</p>
                  <MetricRow label="Proteína" planned={g.daily_protein} real={Math.round(realNutrition.totalProtein)} unit="g" accuracy={realNutrition.accP} />
                  <MetricRow label="Carbohidratos" planned={g.daily_carbs} real={Math.round(realNutrition.totalCarbs)} unit="g" accuracy={realNutrition.accC} />
                  <MetricRow label="Grasas" planned={g.daily_fat} real={Math.round(realNutrition.totalFat)} unit="g" accuracy={realNutrition.accF} />
                  <ProgressBar value={realNutrition.avg} />
                </div>
              )}

              {/* ── Water ── */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-bold text-foreground">Hidratación</span>
                </div>
                <MetricRow label="Agua" planned={MOCK_WATER.planned} real={MOCK_WATER.real} unit="L" accuracy={mockWaterAcc} />
                <ProgressBar value={mockWaterAcc} />
              </div>
            </div>
          );
        })() : (
          <div className="space-y-3">
            {mockMealAccuracies.map((meal, idx) => {
              const timeAcc = meal.timeAcc;
              return (
                <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
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
                  <div className="text-xs space-y-0.5">
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">Pautado: <span className="font-medium">{meal.food.planned}</span></span>
                      <span className="text-foreground">Real: <span className="font-bold">{meal.food.real}</span></span>
                    </div>
                  </div>
                  {meal.macros.map((m, i) => {
                    const acc = calcGeneralAccuracy(m.planned, m.real);
                    return <MetricRow key={i} label={m.label} planned={m.planned} real={m.real} unit={m.unit} accuracy={acc} />;
                  })}
                  <ProgressBar value={meal.macroAcc} />
                </div>
              );
            })}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-foreground" />
                <span className="text-sm font-bold text-foreground">Hidratación</span>
              </div>
              <MetricRow label="Agua" planned={MOCK_WATER.planned} real={MOCK_WATER.real} unit="L" accuracy={mockWaterAcc} />
              <ProgressBar value={mockWaterAcc} />
            </div>
          </div>
        )}
      </AccordionSection>

      {/* ═══════ 3. ENTRENAMIENTO ═══════ */}
      <AccordionSection icon={Dumbbell} title="Entrenamiento" accuracy={trainingAcc}>
        {(() => {
          // Unified exercise list (real or mock)
          const exercises = realTraining ? realTraining.exercises.map((ex: any) => ({
            id: ex.name,
            name: ex.name,
            accuracy: ex.accuracy,
            targetSets: ex.targetSets,
            realSets: ex.sets,
            setsAcc: ex.setsResult,
            repRange: `${ex.minR}-${ex.maxR}`,
            reps: ex.reps as number[],
            repsResults: ex.repsResults,
          })) : mockExerciseCalcs.map((ex) => ({
            id: ex.name,
            name: ex.name,
            accuracy: ex.overallAcc,
            targetSets: ex.planned.sets,
            realSets: ex.real.sets,
            setsAcc: ex.setsAcc,
            repRange: ex.planned.repRange,
            reps: ex.real.reps,
            repsResults: ex.repsResults,
          }));

          return (
            <div className="space-y-3">
              {exercises.map((ex: any) => {
                const isExpanded = expandedExercise === ex.id;
                return (
                  <div key={ex.id} className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
                    {/* Summary row */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-bold text-foreground">{ex.name}</p>
                        </div>
                        <span className={cn('text-lg font-black tabular-nums', getAccuracyTextColor(ex.accuracy))}>
                          {ex.accuracy}%
                        </span>
                      </div>
                      <ProgressBar value={ex.accuracy} />
                      {ex.accuracy < 90 && <DeviationBadge />}
                      <button
                        onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-1.5 active:opacity-70 transition-opacity"
                      >
                        {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                        <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
                      </button>
                    </div>

                    {/* Detail panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
                            {/* Sets accuracy */}
                            <MetricRow
                              label="Series"
                              planned={ex.targetSets}
                              real={ex.realSets}
                              accuracy={ex.setsAcc.accuracy}
                              colorType={ex.setsAcc.colorType}
                            />

                            {/* Per-set reps detail */}
                            {ex.reps.map((r: number, i: number) => {
                              const result = ex.repsResults[i];
                              return (
                                <div key={i} className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-foreground">Serie {i + 1}</span>
                                    <span className={cn('text-base font-black tabular-nums', getAccuracyTextColor(result?.accuracy ?? 100, result?.colorType))}>
                                      {result?.accuracy ?? 100}%
                                    </span>
                                  </div>
                                  <div className="flex gap-4 text-xs">
                                    <div className="flex-1">
                                      <span className="text-muted-foreground">Rango pautado: </span>
                                      <span className="text-muted-foreground font-medium">{ex.repRange}</span>
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-foreground">Realizado: </span>
                                      <span className="text-foreground font-bold">{r} reps</span>
                                    </div>
                                  </div>
                                  <ProgressBar value={result?.accuracy ?? 100} colorType={result?.colorType} />
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          );
        })()}
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
            accuracy={mockSleepTimeAcc}
          />
          <MetricRow
            label="Horas"
            planned={MOCK_SLEEP.plannedHours}
            real={MOCK_SLEEP.realHours}
            unit="h"
            accuracy={mockSleepHoursAcc}
          />
          <ProgressBar value={mockSleepAcc} />
        </div>

        {/* Supplements */}
        {hasRealData && realSupplements ? (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Pill className="w-4 h-4 text-foreground" />
              <span className="text-sm font-bold text-foreground">Suplementación</span>
            </div>
            <MetricRow
              label="Tomados"
              planned={realSupplements.total}
              real={realSupplements.taken}
              accuracy={realSupplements.acc}
            />
            <ProgressBar value={realSupplements.acc} />
          </div>
        ) : (
          <div className="space-y-3">
            {mockSuppCalcs.map((supp, idx) => (
              <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Pill className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-bold text-foreground">{supp.name}</span>
                </div>
                <MetricRow
                  label="Horario"
                  planned={supp.plannedTime}
                  real={supp.realTime}
                  accuracy={supp.timeAcc}
                />
                <MetricRow
                  label="Dosis"
                  planned={supp.plannedDose}
                  real={supp.realDose}
                  unit={supp.unit}
                  accuracy={supp.doseAcc}
                />
                <ProgressBar value={supp.overallAcc} />
              </div>
            ))}
          </div>
        )}
      </AccordionSection>

      {/* ═══════ 5. ANÁLISIS DEL MICROCICLO ═══════ */}
      <AccordionSection icon={TrendingUp} title="Análisis del Microciclo" accuracy={0} hideAccuracy defaultOpen={false}>
        <MicrocycleAnalysis
          goals={goals}
          microcycleId={microcycleId}
          microcycleStart={microcycleStart}
          microcycleEnd={microcycleEnd}
          durationWeeks={durationWeeks}
        />
      </AccordionSection>
    </div>
  );
};
