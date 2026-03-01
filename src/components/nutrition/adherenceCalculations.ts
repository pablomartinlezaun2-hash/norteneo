// ══════════════════════════════════════════════════════════════
// Daily Adherence Accuracy Calculations — STRICT LOGIC
// ══════════════════════════════════════════════════════════════

// ── A) Lógica General (Macros, Cantidades, Series genérica) ──
export const calcGeneralAccuracy = (planned: number, real: number): number => {
  if (planned === 0) return real === 0 ? 100 : 0;
  const errorMargin = Math.abs(planned - real) / planned;
  return Math.round(Math.max(0, 100 - errorMargin * 100));
};

// ── B) Lógica de Horarios (Comidas, Sueño, Suplementos) ──
// Compara dos strings HH:MM y devuelve exactitud
export const calcTimeAccuracy = (plannedTime: string, realTime: string): number => {
  const diffMin = getTimeDiffMinutes(plannedTime, realTime);
  if (diffMin <= 60) return 100;
  if (diffMin <= 120) return 90;
  return 80;
};

export const getTimeDiffMinutes = (t1: string, t2: string): number => {
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  const min1 = h1 * 60 + m1;
  let min2 = h2 * 60 + m2;
  // Handle crossing midnight (e.g., planned 23:00 real 00:30)
  if (min2 < min1 - 720) min2 += 1440;
  return Math.abs(min2 - min1);
};

// ── C) Lógica de Rangos de Repeticiones (Entrenamiento) ──
export const calcRepsRangeAccuracy = (minReps: number, maxReps: number, realReps: number): { accuracy: number; colorType: 'green' | 'blue' | 'orange' | 'red' } => {
  if (realReps >= minReps && realReps <= maxReps) {
    return { accuracy: 100, colorType: 'green' };
  }
  const deviation = realReps < minReps ? minReps - realReps : realReps - maxReps;
  if (deviation === 1) return { accuracy: 95, colorType: 'blue' };
  if (deviation === 2) return { accuracy: 90, colorType: 'orange' };
  return { accuracy: 80, colorType: 'red' };
};

// ── D) Lógica de Series (Entrenamiento) ──
export const calcSetsAccuracy = (planned: number, real: number): { accuracy: number; colorType: 'green' | 'orange' | 'red' } => {
  const diff = Math.abs(planned - real);
  if (diff === 0) return { accuracy: 100, colorType: 'green' };
  if (diff === 1) return { accuracy: 90, colorType: 'orange' };
  return { accuracy: 80, colorType: 'red' };
};

// ── E) Colores según exactitud ──
export const getAccuracyTextColor = (pct: number, colorType?: 'green' | 'blue' | 'orange' | 'red'): string => {
  if (colorType === 'blue') return 'text-blue-500';
  if (pct >= 95) return 'text-green-500';
  if (pct >= 90) return 'text-orange-500';
  return 'text-red-500';
};

export const getAccuracyBgColor = (pct: number, colorType?: 'green' | 'blue' | 'orange' | 'red'): string => {
  if (colorType === 'blue') return 'bg-blue-500';
  if (pct >= 95) return 'bg-green-500';
  if (pct >= 90) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getAdherenceColor = (pct: number): string => {
  if (pct >= 95) return 'hsl(142 71% 45%)'; // green
  if (pct >= 90) return 'hsl(38 92% 50%)';  // orange
  return 'hsl(0 62% 50%)';                   // red
};

// ── F) Exactitud media de macros de una comida ──
export const calcMealMacroAverage = (macros: { planned: number; real: number }[]): number => {
  if (macros.length === 0) return 100;
  const sum = macros.reduce((acc, m) => acc + calcGeneralAccuracy(m.planned, m.real), 0);
  return Math.round(sum / macros.length);
};

// ── G) Ponderaciones globales ──
export interface AdherenceWeights {
  nutrition: number;
  training: number;
  sleep: number;
  supplements: number;
}

export const DEFAULT_WEIGHTS: AdherenceWeights = {
  nutrition: 0.35,
  training: 0.35,
  sleep: 0.15,
  supplements: 0.15,
};

export const calcGlobalAccuracy = (
  nutritionAcc: number,
  trainingAcc: number,
  sleepAcc: number,
  supplementAcc: number,
  weights: AdherenceWeights = DEFAULT_WEIGHTS
): number => {
  return Math.round(
    nutritionAcc * weights.nutrition +
    trainingAcc * weights.training +
    sleepAcc * weights.sleep +
    supplementAcc * weights.supplements
  );
};
