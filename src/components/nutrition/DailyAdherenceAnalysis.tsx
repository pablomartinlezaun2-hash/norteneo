import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { UtensilsCrossed, Dumbbell, Moon, Pill, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NutritionGoals } from '@/hooks/useNutritionData';
import { ComparisonRow, ComparisonRowBreakdown } from './ComparisonRow';
import {
  calcMacroAccuracy,
  calcFoodAccuracy,
  calcSetsScore,
  calcRepsScore,
  calcRirScore,
  calcExerciseAccuracy,
  calcSleepAccuracy,
  calcGlobalAccuracy,
  getAdherenceColor,
  DEFAULT_WEIGHTS,
} from './adherenceCalculations';
import { cn } from '@/lib/utils';

interface DailyAdherenceAnalysisProps {
  goals: NutritionGoals | null;
  refreshTrigger?: number;
}

interface CategoryScore {
  accuracy: number;
  label: string;
  icon: React.ReactNode;
}

export const DailyAdherenceAnalysis = ({ goals, refreshTrigger = 0 }: DailyAdherenceAnalysisProps) => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [setLogs, setSetLogs] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const defaultGoals = { daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 70 };
  const g = goals || defaultGoals;

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
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
    fetch();
  }, [user, today, refreshTrigger]);

  // ── Nutrition accuracy ──
  const nutritionData = useMemo(() => {
    const totalProtein = foodLogs.reduce((s, l) => s + (Number(l.protein) || 0), 0);
    const totalCarbs = foodLogs.reduce((s, l) => s + (Number(l.carbs) || 0), 0);
    const totalFat = foodLogs.reduce((s, l) => s + (Number(l.fat) || 0), 0);
    const totalCal = foodLogs.reduce((s, l) => s + (Number(l.calories) || 0), 0);

    const accP = calcMacroAccuracy(totalProtein, g.daily_protein);
    const accC = calcMacroAccuracy(totalCarbs, g.daily_carbs);
    const accF = calcMacroAccuracy(totalFat, g.daily_fat);
    const accK = calcMacroAccuracy(totalCal, g.daily_calories);
    const avg = (accP + accC + accF + accK) / 4;

    return {
      accuracy: avg,
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
      totalCal: Math.round(totalCal),
      accP, accC, accF, accK,
    };
  }, [foodLogs, g]);

  // ── Training accuracy ──
  const trainingData = useMemo(() => {
    if (setLogs.length === 0) return { accuracy: 100, exercises: [] };

    // Group by exercise
    const byExercise: Record<string, any[]> = {};
    setLogs.forEach(log => {
      const exId = log.exercise_id;
      if (!byExercise[exId]) byExercise[exId] = [];
      byExercise[exId].push(log);
    });

    const exerciseScores: { name: string; accuracy: number; sets: number; targetSets: number }[] = [];
    Object.entries(byExercise).forEach(([exId, logs]) => {
      const exInfo = logs[0]?.exercises;
      const name = exInfo?.name || 'Ejercicio';
      const targetSets = exInfo?.series || 3;
      const repsStr = exInfo?.reps || '8-12';
      const [minR, maxR] = repsStr.includes('-')
        ? repsStr.split('-').map(Number)
        : [Number(repsStr), Number(repsStr)];

      const workSets = logs.filter((l: any) => !l.is_warmup);
      const sScore = calcSetsScore(workSets.length, targetSets);
      const rScore = calcRepsScore(workSets.map((l: any) => l.reps), minR || 8, maxR || 12);
      const rirScore = calcRirScore(workSets.map((l: any) => l.rir), null);
      const acc = calcExerciseAccuracy(sScore, rScore, rirScore);

      exerciseScores.push({ name, accuracy: acc, sets: workSets.length, targetSets });
    });

    const avg = exerciseScores.length > 0
      ? exerciseScores.reduce((s, e) => s + e.accuracy, 0) / exerciseScores.length
      : 100;

    return { accuracy: avg, exercises: exerciseScores };
  }, [setLogs]);

  // ── Sleep accuracy (placeholder – user can set target later) ──
  const sleepData = useMemo(() => {
    const targetHours = 8;
    // For now, we don't have sleep data in DB, so show as N/A
    return { accuracy: 100, realHours: targetHours, targetHours, hasData: false };
  }, []);

  // ── Supplement accuracy ──
  const supplementData = useMemo(() => {
    if (supplements.length === 0) return { accuracy: 100, taken: 0, total: 0, hasData: false };
    const taken = supplements.filter(s => supplementLogs.some(l => l.supplement_id === s.id)).length;
    const acc = (taken / supplements.length) * 100;
    return { accuracy: acc, taken, total: supplements.length, hasData: true };
  }, [supplements, supplementLogs]);

  // ── Timing accuracy (placeholder) ──
  const timingData = useMemo(() => {
    return { accuracy: 100, hasData: false };
  }, []);

  // ── Global ──
  const globalAccuracy = useMemo(() => {
    // Only count categories with data
    let totalWeight = 0;
    let weighted = 0;

    if (foodLogs.length > 0) {
      weighted += nutritionData.accuracy * DEFAULT_WEIGHTS.nutrition;
      totalWeight += DEFAULT_WEIGHTS.nutrition;
    }
    if (setLogs.length > 0) {
      weighted += trainingData.accuracy * DEFAULT_WEIGHTS.training;
      totalWeight += DEFAULT_WEIGHTS.training;
    }
    if (sleepData.hasData) {
      weighted += sleepData.accuracy * DEFAULT_WEIGHTS.sleep;
      totalWeight += DEFAULT_WEIGHTS.sleep;
    }
    if (supplementData.hasData) {
      weighted += supplementData.accuracy * DEFAULT_WEIGHTS.supplements;
      totalWeight += DEFAULT_WEIGHTS.supplements;
    }
    if (timingData.hasData) {
      weighted += timingData.accuracy * DEFAULT_WEIGHTS.timing;
      totalWeight += DEFAULT_WEIGHTS.timing;
    }

    return totalWeight > 0 ? weighted / totalWeight : 0;
  }, [nutritionData, trainingData, sleepData, supplementData, timingData, foodLogs, setLogs]);

  const handleRequestAI = async () => {
    setAiLoading(true);
    try {
      const summary = `Adherencia ${Math.round(globalAccuracy)}%. ` +
        `Nutrición ${Math.round(nutritionData.accuracy)}% (Prot: ${nutritionData.totalProtein}g/${g.daily_protein}g, Carbs: ${nutritionData.totalCarbs}g/${g.daily_carbs}g, Grasa: ${nutritionData.totalFat}g/${g.daily_fat}g). ` +
        `Entreno ${Math.round(trainingData.accuracy)}% (${trainingData.exercises.length} ejercicios). ` +
        `Sueño ${sleepData.hasData ? Math.round(sleepData.accuracy) + '%' : 'sin datos'}. ` +
        `Suplementación ${supplementData.hasData ? Math.round(supplementData.accuracy) + '% (' + supplementData.taken + '/' + supplementData.total + ')' : 'sin datos'}.`;
      setAiAdvice(summary);
    } catch {
      setAiAdvice('No se pudo generar el análisis.');
    }
    setAiLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAnyData = foodLogs.length > 0 || setLogs.length > 0 || supplementData.hasData;

  if (!hasAnyData) {
    return (
      <div className="rounded-xl bg-muted/50 p-5 text-center">
        <p className="text-sm text-muted-foreground">Sin datos de adherencia hoy</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Registra alimentos, entrenos o suplementos para ver tu análisis</p>
      </div>
    );
  }

  const globalColor = getAdherenceColor(globalAccuracy);

  return (
    <div className="space-y-4 p-4">
      {/* ── Global bar ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-foreground">Adherencia diaria global</p>
          <span className="text-2xl font-black tabular-nums" style={{ color: globalColor }}>
            {Math.round(globalAccuracy)}%
          </span>
        </div>
        <div className="h-4 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: globalColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(globalAccuracy, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ── Category rows ── */}
      <div className="space-y-2">
        {/* Nutrition */}
        {foodLogs.length > 0 && (
          <ComparisonRow
            icon={<UtensilsCrossed className="w-4 h-4 text-foreground" />}
            title="Nutrición"
            subtitle={`${nutritionData.totalCal} kcal consumidas`}
            targetValue={g.daily_calories}
            realValue={nutritionData.totalCal}
            unit=" kcal"
            calculationType="nutrition"
            accuracy={nutritionData.accuracy}
            breakdowns={[
              { label: 'Proteína', target: g.daily_protein, real: nutritionData.totalProtein, unit: 'g', accuracy: nutritionData.accP },
              { label: 'Carbos', target: g.daily_carbs, real: nutritionData.totalCarbs, unit: 'g', accuracy: nutritionData.accC },
              { label: 'Grasa', target: g.daily_fat, real: nutritionData.totalFat, unit: 'g', accuracy: nutritionData.accF },
              { label: 'Calorías', target: g.daily_calories, real: nutritionData.totalCal, unit: '', accuracy: nutritionData.accK },
            ]}
          />
        )}

        {/* Training */}
        {setLogs.length > 0 && (
          <ComparisonRow
            icon={<Dumbbell className="w-4 h-4 text-foreground" />}
            title="Entrenamiento"
            subtitle={`${trainingData.exercises.length} ejercicio${trainingData.exercises.length !== 1 ? 's' : ''} registrado${trainingData.exercises.length !== 1 ? 's' : ''}`}
            targetValue={trainingData.exercises.reduce((s, e) => s + e.targetSets, 0)}
            realValue={trainingData.exercises.reduce((s, e) => s + e.sets, 0)}
            unit=" series"
            calculationType="training"
            accuracy={trainingData.accuracy}
            breakdowns={trainingData.exercises.map(e => ({
              label: e.name.length > 12 ? e.name.substring(0, 12) + '…' : e.name,
              target: e.targetSets,
              real: e.sets,
              unit: ' sets',
              accuracy: e.accuracy,
            }))}
          />
        )}

        {/* Sleep */}
        <ComparisonRow
          icon={<Moon className="w-4 h-4 text-foreground" />}
          title="Sueño"
          subtitle={sleepData.hasData ? `${sleepData.realHours}h de ${sleepData.targetHours}h` : 'Sin datos registrados'}
          targetValue={sleepData.targetHours}
          realValue={sleepData.realHours}
          unit="h"
          calculationType="sleep"
          accuracy={sleepData.accuracy}
        />

        {/* Supplements */}
        {supplementData.hasData && (
          <ComparisonRow
            icon={<Pill className="w-4 h-4 text-foreground" />}
            title="Suplementación"
            subtitle={`${supplementData.taken} de ${supplementData.total} tomados`}
            targetValue={supplementData.total}
            realValue={supplementData.taken}
            unit=""
            calculationType="supplement"
            accuracy={supplementData.accuracy}
          />
        )}

        {/* Timing */}
        <ComparisonRow
          icon={<Clock className="w-4 h-4 text-foreground" />}
          title="Horarios"
          subtitle={timingData.hasData ? 'Puntualidad de comidas' : 'Sin datos registrados'}
          targetValue={100}
          realValue={Math.round(timingData.accuracy)}
          unit="%"
          calculationType="timing"
          accuracy={timingData.accuracy}
        />
      </div>

      {/* ── AI Summary ── */}
      <div className="pt-1">
        {aiAdvice ? (
          <div className="rounded-xl bg-muted/60 border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Resumen IA</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{aiAdvice}</p>
          </div>
        ) : (
          <button
            onClick={handleRequestAI}
            disabled={aiLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-sm font-semibold text-primary hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <Sparkles className={cn("w-4 h-4", aiLoading && "animate-spin")} />
            {aiLoading ? 'Analizando...' : 'Ver consejo IA'}
          </button>
        )}
      </div>
    </div>
  );
};
