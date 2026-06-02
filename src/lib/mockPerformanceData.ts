/**
 * Mock performance data — used as visual fallback when user has no real logs.
 * Allows showcasing the "Análisis de rendimiento" and "Alertas de rendimiento"
 * panels without requiring training history.
 */
import type { ExerciseSessionAlert } from './performanceAlertEngine';

// ── Mock alerts for PerformanceAlertsPanel ──
export const MOCK_PERFORMANCE_ALERTS: ExerciseSessionAlert[] = [
  {
    exerciseId: 'mock-ex-1',
    exerciseName: 'Press Banca',
    sessionDate: '2026-05-30',
    score: 132.4,
    topSetScores: [134.2, 130.6],
    baselineScore: 118.5,
    deltaPercent: 11.7,
    alertLevel: 'positive_level_2',
    explanation: 'Subida sólida vs tu media reciente. Has movido 5 kg más con el mismo RIR.',
    latestAvgWeight: 92.5,
    baselineAvgWeight: 87.5,
    latestAvgReps: 8,
    baselineAvgReps: 8,
    latestAvgRir: 1,
    baselineAvgRir: 1,
  },
  {
    exerciseId: 'mock-ex-2',
    exerciseName: 'Sentadilla Trasera',
    sessionDate: '2026-05-29',
    score: 188.1,
    topSetScores: [190.0, 186.2],
    baselineScore: 195.4,
    deltaPercent: -3.7,
    alertLevel: 'negative_level_1',
    explanation: 'Ligera caída. Has terminado con 1 rep menos en la serie top. Vigila el descanso.',
    latestAvgWeight: 130,
    baselineAvgWeight: 132.5,
    latestAvgReps: 6,
    baselineAvgReps: 7,
    latestAvgRir: 0,
    baselineAvgRir: 1,
  },
  {
    exerciseId: 'mock-ex-3',
    exerciseName: 'Peso Muerto Rumano',
    sessionDate: '2026-05-28',
    score: 165.3,
    topSetScores: [167.0, 163.6],
    baselineScore: 142.8,
    deltaPercent: 15.7,
    alertLevel: 'positive_outlier',
    explanation: 'Salto atípico hacia arriba. Confirma en la próxima sesión que el peso es real.',
    latestAvgWeight: 110,
    baselineAvgWeight: 100,
    latestAvgReps: 8,
    baselineAvgReps: 8,
    latestAvgRir: 2,
    baselineAvgRir: 2,
  },
  {
    exerciseId: 'mock-ex-4',
    exerciseName: 'Dominadas Lastradas',
    sessionDate: '2026-05-27',
    score: 78.4,
    topSetScores: [80.0, 76.8],
    baselineScore: 91.2,
    deltaPercent: -14.0,
    alertLevel: 'negative_level_3',
    explanation: 'Caída marcada. RIR mucho menor del previsto: revisa fatiga acumulada y sueño.',
    latestAvgWeight: 15,
    baselineAvgWeight: 17.5,
    latestAvgReps: 6,
    baselineAvgReps: 8,
    latestAvgRir: 0,
    baselineAvgRir: 2,
  },
  {
    exerciseId: 'mock-ex-5',
    exerciseName: 'Curl con Mancuernas',
    sessionDate: '2026-05-26',
    score: 52.1,
    topSetScores: [52.8, 51.4],
    baselineScore: 51.8,
    deltaPercent: 0.6,
    alertLevel: 'stable',
    explanation: null,
    latestAvgWeight: 14,
    baselineAvgWeight: 14,
    latestAvgReps: 10,
    baselineAvgReps: 10,
    latestAvgRir: 1,
    baselineAvgRir: 1,
  },
  {
    exerciseId: 'mock-ex-6',
    exerciseName: 'Press Militar',
    sessionDate: '2026-05-25',
    score: 96.7,
    topSetScores: [98.0, 95.4],
    baselineScore: 91.3,
    deltaPercent: 5.9,
    alertLevel: 'positive_level_1',
    explanation: 'Ligera mejora, dentro de la tendencia ascendente del meso.',
    latestAvgWeight: 55,
    baselineAvgWeight: 52.5,
    latestAvgReps: 8,
    baselineAvgReps: 8,
    latestAvgRir: 1,
    baselineAvgRir: 1,
  },
];

// ── Mock set logs for usePerformanceEngine ──
interface MockSetLogRow {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number | null;
  partial_reps: number | null;
  is_warmup: boolean | null;
  logged_at: string;
  est_1rm_set: number | null;
  iem_set: number | null;
}
interface MockExerciseRow {
  id: string;
  name: string;
}

const MOCK_EXERCISES: { id: string; name: string; muscleId: string; muscleName: string; baseWeight: number; baseReps: number }[] = [
  { id: 'mock-ex-1', name: 'Press Banca', muscleId: 'mock-mg-pecho', muscleName: 'Pecho', baseWeight: 85, baseReps: 8 },
  { id: 'mock-ex-2', name: 'Sentadilla Trasera', muscleId: 'mock-mg-cuad', muscleName: 'Cuádriceps', baseWeight: 120, baseReps: 6 },
  { id: 'mock-ex-3', name: 'Peso Muerto Rumano', muscleId: 'mock-mg-isq', muscleName: 'Isquiotibiales', baseWeight: 100, baseReps: 8 },
  { id: 'mock-ex-4', name: 'Dominadas Lastradas', muscleId: 'mock-mg-espalda', muscleName: 'Espalda', baseWeight: 12, baseReps: 8 },
  { id: 'mock-ex-5', name: 'Curl con Mancuernas', muscleId: 'mock-mg-biceps', muscleName: 'Bíceps', baseWeight: 14, baseReps: 10 },
  { id: 'mock-ex-6', name: 'Press Militar', muscleId: 'mock-mg-hombro', muscleName: 'Hombro', baseWeight: 50, baseReps: 8 },
  { id: 'mock-ex-7', name: 'Extensión Tríceps Polea', muscleId: 'mock-mg-triceps', muscleName: 'Tríceps', baseWeight: 35, baseReps: 12 },
  { id: 'mock-ex-8', name: 'Remo con Barra', muscleId: 'mock-mg-espalda', muscleName: 'Espalda', baseWeight: 80, baseReps: 8 },
];

function epley1rm(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function buildMockSetLogs(): { setLogs: MockSetLogRow[]; exercises: MockExerciseRow[]; catalogMap: Map<string, { muscleId: string; muscleName: string }> } {
  const logs: MockSetLogRow[] = [];
  const exercises: MockExerciseRow[] = MOCK_EXERCISES.map(e => ({ id: e.id, name: e.name }));
  const catalogMap = new Map<string, { muscleId: string; muscleName: string }>();
  MOCK_EXERCISES.forEach(e => catalogMap.set(e.id, { muscleId: e.muscleId, muscleName: e.muscleName }));

  const today = new Date();
  // 6 sessions per exercise, ~3 days apart
  let logId = 1;
  MOCK_EXERCISES.forEach((ex, exIdx) => {
    for (let s = 0; s < 6; s++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (5 - s) * 3 - exIdx);
      const iso = date.toISOString();
      // Mild progression
      const wProgress = ex.baseWeight + s * (ex.baseWeight * 0.015);
      for (let setNum = 1; setNum <= 4; setNum++) {
        const isWarm = setNum === 1;
        const weight = isWarm ? Math.round(wProgress * 0.6) : Math.round(wProgress);
        const reps = isWarm ? Math.min(10, ex.baseReps + 2) : ex.baseReps + (setNum === 4 ? -1 : 0);
        const rir = isWarm ? 4 : (setNum === 4 ? 0 : 1);
        logs.push({
          id: `mock-log-${logId++}`,
          exercise_id: ex.id,
          set_number: setNum,
          weight,
          reps,
          rir,
          partial_reps: 0,
          is_warmup: isWarm,
          logged_at: iso,
          est_1rm_set: epley1rm(weight, reps),
          iem_set: weight * reps,
        });
      }
    }
  });

  return { setLogs: logs, exercises, catalogMap };
}
