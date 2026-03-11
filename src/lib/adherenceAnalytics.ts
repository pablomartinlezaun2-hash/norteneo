import { calcGeneralAccuracy, calcRepsRangeAccuracy, calcSetsAccuracy } from '@/components/nutrition/adherenceCalculations';
import { calcDynamicAdherence, type AdherenceMetricSettings } from '@/hooks/useAdherenceSettings';

export type AdherenceMetricKey = 'nutrition' | 'training' | 'sleep' | 'supplements';

export interface AdherenceExclusionReasons {
  nutrition?: string;
  training?: string;
  sleep?: string;
  supplements?: string;
}

export interface AdherenceAnalyticsDay {
  date: string;
  nutrition_adherence: number | null;
  training_adherence: number | null;
  sleep_adherence: number | null;
  supplement_adherence: number | null;
  total_adherence: number | null;
  exclusion_reasons: AdherenceExclusionReasons;
}

interface NutritionGoalLike {
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fat: number | null;
}

interface FoodLogLike {
  logged_date: string;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface SetLogLike {
  logged_at: string;
  exercise_id: string;
  reps: number;
  is_warmup: boolean | null;
  exercises?: { series?: number | null; reps?: string | null } | { series?: number | null; reps?: string | null }[] | null;
}

interface SleepLogLike {
  logged_date: string;
  total_hours: number | null;
  quality: number | null;
  awakenings: number | null;
}

interface SupplementLogLike {
  logged_date: string;
}

interface ActiveSupplementLike {
  id: string;
}

export interface BuildAdherenceAnalyticsInput {
  dates: string[];
  settings: AdherenceMetricSettings;
  nutritionGoals: NutritionGoalLike | null;
  foodLogs: FoodLogLike[];
  setLogs: SetLogLike[];
  sleepLogs: SleepLogLike[];
  supplementLogs: SupplementLogLike[];
  activeSupplements: ActiveSupplementLike[];
  sleepTargetHours?: number | null;
}

const toNumber = (value: unknown): number => Number(value ?? 0);

const hasNutritionTargets = (goals: NutritionGoalLike | null): goals is NutritionGoalLike => {
  if (!goals) return false;
  return [goals.daily_protein, goals.daily_carbs, goals.daily_fat].every((v) => typeof v === 'number' && v > 0);
};

const getExerciseMeta = (setLog: SetLogLike): { series: number; reps: string } => {
  const raw = Array.isArray(setLog.exercises) ? setLog.exercises[0] : setLog.exercises;
  return {
    series: raw?.series ?? 3,
    reps: raw?.reps ?? '8-12',
  };
};

const calculateTrainingAccuracy = (daySets: SetLogLike[]): number => {
  const byExercise = new Map<string, SetLogLike[]>();

  for (const set of daySets) {
    if (!byExercise.has(set.exercise_id)) byExercise.set(set.exercise_id, []);
    byExercise.get(set.exercise_id)!.push(set);
  }

  const exerciseScores: number[] = [];

  for (const logs of byExercise.values()) {
    const exerciseMeta = getExerciseMeta(logs[0]);
    const workSets = logs.filter((l) => !l.is_warmup);

    const [minReps, maxReps] = exerciseMeta.reps.includes('-')
      ? exerciseMeta.reps.split('-').map(Number)
      : [Number(exerciseMeta.reps), Number(exerciseMeta.reps)];

    const setsAcc = calcSetsAccuracy(exerciseMeta.series, workSets.length).accuracy;

    const repsAcc = workSets.length > 0
      ? Math.round(
          workSets
            .map((set) => calcRepsRangeAccuracy(minReps || 8, maxReps || 12, set.reps).accuracy)
            .reduce((sum, value) => sum + value, 0) / workSets.length
        )
      : 100;

    exerciseScores.push(Math.round((setsAcc + repsAcc) / 2));
  }

  return Math.round(exerciseScores.reduce((sum, value) => sum + value, 0) / exerciseScores.length);
};

const getMetricDisabledReason = () => 'Métrica desactivada';

export const buildAdherenceAnalytics = ({
  dates,
  settings,
  nutritionGoals,
  foodLogs,
  setLogs,
  sleepLogs,
  supplementLogs,
  activeSupplements,
  sleepTargetHours = 8,
}: BuildAdherenceAnalyticsInput): AdherenceAnalyticsDay[] => {
  return dates.map((date) => {
    const exclusionReasons: AdherenceExclusionReasons = {};

    const dayFoodLogs = foodLogs.filter((log) => log.logged_date === date);
    const daySetLogs = setLogs.filter((log) => typeof log.logged_at === 'string' && log.logged_at.startsWith(date));
    const daySleepLog = sleepLogs.find((log) => log.logged_date === date) ?? null;
    const daySupplementLogs = supplementLogs.filter((log) => log.logged_date === date);

    let nutritionAdherence: number | null = null;
    if (!settings.nutritionEnabled) {
      exclusionReasons.nutrition = getMetricDisabledReason();
    } else if (!hasNutritionTargets(nutritionGoals)) {
      exclusionReasons.nutrition = 'Sin objetivo nutricional configurado';
    } else if (dayFoodLogs.length === 0) {
      exclusionReasons.nutrition = 'Sin registros de nutrición';
    } else {
      const totalProtein = dayFoodLogs.reduce((sum, log) => sum + toNumber(log.protein), 0);
      const totalCarbs = dayFoodLogs.reduce((sum, log) => sum + toNumber(log.carbs), 0);
      const totalFat = dayFoodLogs.reduce((sum, log) => sum + toNumber(log.fat), 0);

      nutritionAdherence = Math.round(
        (
          calcGeneralAccuracy(nutritionGoals.daily_protein!, totalProtein) +
          calcGeneralAccuracy(nutritionGoals.daily_carbs!, totalCarbs) +
          calcGeneralAccuracy(nutritionGoals.daily_fat!, totalFat)
        ) / 3
      );
    }

    let trainingAdherence: number | null = null;
    if (!settings.trainingEnabled) {
      exclusionReasons.training = getMetricDisabledReason();
    } else if (daySetLogs.length === 0) {
      exclusionReasons.training = 'Sin registros de entrenamiento';
    } else {
      trainingAdherence = calculateTrainingAccuracy(daySetLogs);
    }

    let sleepAdherence: number | null = null;
    if (!settings.sleepEnabled) {
      exclusionReasons.sleep = getMetricDisabledReason();
    } else if (sleepTargetHours == null || sleepTargetHours <= 0) {
      exclusionReasons.sleep = 'Sin objetivo de sueño configurado';
    } else if (!daySleepLog) {
      exclusionReasons.sleep = 'Sin registro de sueño';
    } else if (daySleepLog.total_hours == null) {
      exclusionReasons.sleep = 'Sin horas de sueño registradas';
    } else {
      const hoursAccuracy = calcGeneralAccuracy(sleepTargetHours, Number(daySleepLog.total_hours));
      const qualityAccuracy = daySleepLog.quality ? (daySleepLog.quality / 5) * 100 : 50;
      const awakeningsPenalty = Math.max(0, 100 - (daySleepLog.awakenings || 0) * 15);
      sleepAdherence = Math.round(hoursAccuracy * 0.45 + qualityAccuracy * 0.35 + awakeningsPenalty * 0.2);
    }

    let supplementAdherence: number | null = null;
    if (!settings.supplementsEnabled) {
      exclusionReasons.supplements = getMetricDisabledReason();
    } else if (activeSupplements.length === 0) {
      exclusionReasons.supplements = 'Sin suplementos activos configurados';
    } else if (daySupplementLogs.length === 0) {
      exclusionReasons.supplements = 'Sin registros de suplementación';
    } else {
      supplementAdherence = calcGeneralAccuracy(activeSupplements.length, daySupplementLogs.length);
    }

    const totalAdherence = calcDynamicAdherence(
      {
        nutrition: { acc: nutritionAdherence ?? 0, hasData: nutritionAdherence != null },
        training: { acc: trainingAdherence ?? 0, hasData: trainingAdherence != null },
        sleep: { acc: sleepAdherence ?? 0, hasData: sleepAdherence != null },
        supplements: { acc: supplementAdherence ?? 0, hasData: supplementAdherence != null },
      },
      settings
    );

    return {
      date,
      nutrition_adherence: nutritionAdherence,
      training_adherence: trainingAdherence,
      sleep_adherence: sleepAdherence,
      supplement_adherence: supplementAdherence,
      total_adherence: totalAdherence,
      exclusion_reasons: exclusionReasons,
    };
  });
};
