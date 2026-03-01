// Daily Adherence Accuracy Calculations

// ── A) Nutrition accuracy (per macro) ──
export const calcMacroAccuracy = (real: number, target: number): number => {
  if (target === 0) return real === 0 ? 100 : 0;
  return Math.max(0, Math.min(200, 100 * (1 - Math.abs(real - target) / target)));
};

export const calcFoodAccuracy = (
  realProtein: number, targetProtein: number,
  realCarbs: number, targetCarbs: number,
  realFat: number, targetFat: number
): number => {
  const accP = calcMacroAccuracy(realProtein, targetProtein);
  const accC = calcMacroAccuracy(realCarbs, targetCarbs);
  const accF = calcMacroAccuracy(realFat, targetFat);
  return (accP + accC + accF) / 3;
};

// ── B) Training accuracy (per exercise) ──
export const calcSetsScore = (realSets: number, targetSets: number): number => {
  if (targetSets === 0) return 100;
  return Math.min(100, (realSets / targetSets) * 100);
};

export const calcRepsScore = (
  repsPerSet: number[],
  minReps: number,
  maxReps: number
): number => {
  if (repsPerSet.length === 0) return 0;
  const scores = repsPerSet.map(r => {
    if (r >= minReps && r <= maxReps) return 100;
    if (r < minReps) return Math.max(0, 100 - ((minReps - r) / minReps) * 100);
    return Math.max(0, 100 - ((r - maxReps) / maxReps) * 100);
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
};

export const calcRirScore = (
  realRir: (number | null)[],
  targetRir: number | null
): number => {
  if (targetRir === null || targetRir === undefined) return 100;
  const valid = realRir.filter((r): r is number => r !== null);
  if (valid.length === 0) return 100;
  const scores = valid.map(r => Math.max(0, 100 - Math.abs(r - targetRir) * 25));
  return scores.reduce((a, b) => a + b, 0) / scores.length;
};

export const calcExerciseAccuracy = (
  setsScore: number,
  repsScore: number,
  rirScore: number
): number => {
  return 0.4 * setsScore + 0.4 * repsScore + 0.2 * rirScore;
};

// ── C) Sleep accuracy ──
export const calcSleepAccuracy = (realHours: number, targetHours: number): number => {
  if (targetHours === 0) return 100;
  return Math.min(100, (realHours / targetHours) * 100);
};

// ── D) Supplement accuracy ──
export const calcDoseScore = (realDose: number, targetDose: number): number => {
  if (targetDose === 0) return realDose === 0 ? 100 : 0;
  return Math.max(0, 100 * (1 - Math.abs(realDose - targetDose) / targetDose));
};

export const calcTimeScore = (diffMinutes: number): number => {
  if (diffMinutes <= 15) return 100;
  if (diffMinutes <= 30) return 80;
  return 50;
};

export const calcSupplementAccuracy = (doseScore: number, timeScore: number): number => {
  return 0.6 * doseScore + 0.4 * timeScore;
};

// ── E) Meal timing accuracy ──
export const calcTimingScore = (diffMinutes: number): number => {
  if (diffMinutes <= 15) return 100;
  if (diffMinutes <= 30) return 80;
  if (diffMinutes <= 60) return 60;
  return 30;
};

export const calcTimingAccuracy = (scores: number[]): number => {
  if (scores.length === 0) return 100;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
};

// ── F) Global daily accuracy ──
export interface AdherenceWeights {
  nutrition: number;
  training: number;
  sleep: number;
  supplements: number;
  timing: number;
}

export const DEFAULT_WEIGHTS: AdherenceWeights = {
  nutrition: 0.35,
  training: 0.35,
  sleep: 0.15,
  supplements: 0.10,
  timing: 0.05,
};

export const calcGlobalAccuracy = (
  nutritionAcc: number,
  trainingAcc: number,
  sleepAcc: number,
  supplementAcc: number,
  timingAcc: number,
  weights: AdherenceWeights = DEFAULT_WEIGHTS
): number => {
  return (
    nutritionAcc * weights.nutrition +
    trainingAcc * weights.training +
    sleepAcc * weights.sleep +
    supplementAcc * weights.supplements +
    timingAcc * weights.timing
  );
};

// ── Color helpers ──
export const getAdherenceColor = (pct: number): string => {
  if (pct >= 95) return 'hsl(142 71% 45%)'; // green
  if (pct >= 90) return 'hsl(38 92% 50%)';  // orange
  return 'hsl(0 62% 50%)';                   // red
};

export const getAdherenceColorClass = (pct: number): string => {
  if (pct >= 95) return 'bg-emerald-500';
  if (pct >= 90) return 'bg-amber-500';
  return 'bg-red-500';
};

export const getAdherenceBarBg = (pct: number): string => {
  if (pct >= 95) return 'bg-emerald-500/80';
  if (pct >= 90) return 'bg-amber-500/80';
  return 'bg-red-500/80';
};

export const getOvershootBg = (): string => 'bg-emerald-500/30';
