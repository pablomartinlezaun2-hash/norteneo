/**
 * PerformanceEngine — Centralized calculation engine for all performance metrics.
 * 
 * Formulas (Epley default):
 *   RTF = reps + rir
 *   est_1RM_set = weight_kg * (1 + RTF / 30)
 *   IEM_set = est_1RM_set * (reps / max(1, RTF))
 *   session_est_1RM_exercise = MAX(est_1RM_set) for that exercise in the session
 *   session_IEM_exercise = SUM(IEM_set) for that exercise in the session
 *   baseline_exercise = ROLLING_MAX(session_est_1RM_exercise, last N sessions)
 *   pct_change = (session_est_1RM - baseline) / baseline
 *   adjusted_pct = pct_change * sensitivity
 */

// ── Configuration (admin-editable defaults) ──
export interface PerformanceConfig {
  n_baseline_sessions: number;
  rir_default: number;
  sensitivity_default: number;
  formula: '1rm_epley' | '1rm_brzycki';
  alert_thresholds: {
    improvement_pct: number;    // >0.02 = mejora
    stagnation_pct: number;     // <0.01 = estancamiento
    regression_pct: number;     // <-0.03 = retroceso
    systemic_fatigue_max: number;
  };
  recovery_k: Record<RecoveryGroup, number>; // decay constant per muscle group
  interference_matrix: Record<string, Record<string, number>>;
  running_muscle_map: Record<string, number>;
  swimming_muscle_map: Record<string, number>;
  running_d_factors: Record<string, number>;
}

export type RecoveryGroup = 'large' | 'medium' | 'fast';

export const DEFAULT_CONFIG: PerformanceConfig = {
  n_baseline_sessions: 8,
  rir_default: 0,
  sensitivity_default: 1.0,
  formula: '1rm_epley',
  alert_thresholds: {
    improvement_pct: 0.02,
    stagnation_pct: 0.01,
    regression_pct: -0.03,
    systemic_fatigue_max: 80,
  },
  recovery_k: {
    large: 0.046,   // ~72h to ~95% recovery: k = ln(20)/65 ≈ 0.046
    medium: 0.063,  // ~48h
    fast: 0.125,    // ~24h
  },
  interference_matrix: {
    strength: { running: 1.3, swimming: 1.15, strength: 1.0 },
    running: { strength: 1.2, swimming: 1.1, running: 1.0 },
    swimming: { strength: 1.1, running: 1.05, swimming: 1.0 },
  },
  running_muscle_map: {
    quadriceps: 0.40, calves: 0.15, glutes: 0.20, core: 0.10, hamstrings: 0.15,
  },
  swimming_muscle_map: {
    back: 0.35, shoulders: 0.30, core: 0.20, chest: 0.15,
  },
  running_d_factors: {
    rodaje: 1.0, easy: 1.0, tempo: 1.2, series_pista: 1.4, interval: 1.4, long: 1.1,
  },
};

// ── Muscle recovery group mapping ──
const MUSCLE_RECOVERY_MAP: Record<string, RecoveryGroup> = {
  'cuádriceps': 'large', 'quadriceps': 'large', 'cuadriceps': 'large',
  'isquiotibiales': 'large', 'hamstrings': 'large', 'isquios': 'large',
  'dorsal': 'large', 'espalda': 'large', 'back': 'large', 'lats': 'large',
  'pectoral': 'large', 'pecho': 'large', 'chest': 'large',
  'glúteos': 'large', 'gluteos': 'large', 'glutes': 'large', 'glúteo mayor': 'large',
  'trapecio': 'large', 'traps': 'large',
  'abductor': 'large', 'aductor': 'large', 'adductor': 'large',
  'bíceps': 'medium', 'biceps': 'medium',
  'tríceps': 'medium', 'triceps': 'medium',
  'gemelos': 'medium', 'calves': 'medium', 'pantorrillas': 'medium',
  'antebrazo': 'medium', 'forearm': 'medium', 'forearms': 'medium',
  'lumbar': 'medium', 'lower back': 'medium', 'erector': 'medium',
  'deltoides': 'fast', 'hombros': 'fast', 'shoulders': 'fast', 'delts': 'fast',
  'abdominales': 'fast', 'abdomen': 'fast', 'abs': 'fast', 'core': 'fast',
  'oblicuos': 'fast', 'obliques': 'fast',
};

// ── Set-level calculations ──

export interface SetMetrics {
  weight_kg: number;
  reps: number;
  rir: number;
  rtf: number;
  est_1rm_set: number;
  iem_set: number;
}

export function calculateSetMetrics(
  weight_kg: number,
  reps: number,
  rir: number | null,
  config: PerformanceConfig = DEFAULT_CONFIG
): SetMetrics {
  const effectiveRir = rir ?? config.rir_default;
  const rtf = reps + effectiveRir;
  
  let est_1rm_set: number;
  if (config.formula === '1rm_brzycki') {
    est_1rm_set = rtf >= 37 ? weight_kg : weight_kg * (36 / (37 - rtf));
  } else {
    // Epley (default)
    est_1rm_set = weight_kg * (1 + rtf / 30);
  }
  
  const iem_set = est_1rm_set * (reps / Math.max(1, rtf));
  
  return {
    weight_kg,
    reps,
    rir: effectiveRir,
    rtf,
    est_1rm_set: round2(est_1rm_set),
    iem_set: round2(iem_set),
  };
}

// ── Session-level aggregation ──

export interface SessionExerciseMetrics {
  exerciseId: string;
  sessionDate: string;
  session_est_1rm: number;
  session_iem: number;
  sets: SetMetrics[];
  totalReps: number;
  totalWeight: number;
  bestWeight: number;
  bestReps: number;
}

export function aggregateSessionExercise(
  exerciseId: string,
  sessionDate: string,
  sets: Array<{ weight: number; reps: number; rir: number | null; is_warmup?: boolean }>,
  config: PerformanceConfig = DEFAULT_CONFIG
): SessionExerciseMetrics {
  const workingSets = sets.filter(s => !s.is_warmup);
  const metricsArr = workingSets.map(s => calculateSetMetrics(s.weight, s.reps, s.rir, config));
  
  const session_est_1rm = metricsArr.length > 0
    ? Math.max(...metricsArr.map(m => m.est_1rm_set))
    : 0;
  const session_iem = metricsArr.reduce((sum, m) => sum + m.iem_set, 0);
  
  return {
    exerciseId,
    sessionDate,
    session_est_1rm: round2(session_est_1rm),
    session_iem: round2(session_iem),
    sets: metricsArr,
    totalReps: metricsArr.reduce((a, m) => a + m.reps, 0),
    totalWeight: round2(metricsArr.reduce((a, m) => a + m.weight_kg, 0)),
    bestWeight: metricsArr.length > 0 ? Math.max(...metricsArr.map(m => m.weight_kg)) : 0,
    bestReps: metricsArr.length > 0 ? Math.max(...metricsArr.map(m => m.reps)) : 0,
  };
}

// ── Baseline & pct_change ──

export interface BaselineResult {
  baseline: number;
  pct_change: number;
  adjusted_pct: number;
}

export function calculateBaseline(
  currentSessionEst1rm: number,
  previousSessions: number[], // ordered oldest → newest, session_est_1rm values
  config: PerformanceConfig = DEFAULT_CONFIG,
  sensitivity: number = config.sensitivity_default
): BaselineResult {
  const lastN = previousSessions.slice(-config.n_baseline_sessions);
  const baseline = lastN.length > 0 ? Math.max(...lastN) : currentSessionEst1rm;
  const pct_change = baseline > 0 ? (currentSessionEst1rm - baseline) / baseline : 0;
  const adjusted_pct = pct_change * sensitivity;
  
  return {
    baseline: round2(baseline),
    pct_change: round4(pct_change),
    adjusted_pct: round4(adjusted_pct),
  };
}

// ── Running load ──

export interface RunningLoadResult {
  trimp: number;
  running_load: number;
  muscle_loads: Record<string, number>;
}

export function calculateRunningLoad(
  duration_minutes: number,
  intensity_rel: number, // 0..1
  session_type: string,
  config: PerformanceConfig = DEFAULT_CONFIG
): RunningLoadResult {
  const trimp = duration_minutes * intensity_rel;
  const d_factor = config.running_d_factors[session_type] ?? 1.0;
  const running_load = round2(trimp * d_factor);
  
  const muscle_loads: Record<string, number> = {};
  for (const [muscle, pct] of Object.entries(config.running_muscle_map)) {
    muscle_loads[muscle] = round2(running_load * pct);
  }
  
  return { trimp: round2(trimp), running_load, muscle_loads };
}

// ── Swimming load ──

export interface SwimmingLoadResult {
  swim_load: number;
  muscle_loads: Record<string, number>;
}

export function calculateSwimmingLoad(
  total_minutes: number,
  intensity_rel: number,
  stroke_factor: number = 1.0,
  config: PerformanceConfig = DEFAULT_CONFIG
): SwimmingLoadResult {
  const swim_load = round2(total_minutes * intensity_rel * stroke_factor);
  
  const muscle_loads: Record<string, number> = {};
  for (const [muscle, pct] of Object.entries(config.swimming_muscle_map)) {
    muscle_loads[muscle] = round2(swim_load * pct);
  }
  
  return { swim_load, muscle_loads };
}

// ── Neo Fatigue 2.0 ──

export interface FatigueState {
  muscleId: string;
  muscleName: string;
  current_fatigue: number; // 0-100 (100 = fully fatigued)
  recovery_pct: number;    // 0-100 (100 = fully recovered)
  hours_remaining: number;
  hours_since_last: number;
  color: string;
  label: string;
  recovery_group: RecoveryGroup;
}

export function getRecoveryGroup(muscleName: string): RecoveryGroup {
  const n = muscleName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, group] of Object.entries(MUSCLE_RECOVERY_MAP)) {
    if (n.includes(key)) return group;
  }
  return 'medium';
}

export function calculateFatigue(
  muscleName: string,
  lastTrainedDate: string | null,
  loadAmount: number = 50, // base load, scales fatigue
  config: PerformanceConfig = DEFAULT_CONFIG
): FatigueState {
  const group = getRecoveryGroup(muscleName);
  const k = config.recovery_k[group];
  
  if (!lastTrainedDate) {
    return {
      muscleId: '', muscleName, current_fatigue: 0, recovery_pct: 100,
      hours_remaining: 0, hours_since_last: 999, color: '#10B981',
      label: 'Recuperado', recovery_group: group,
    };
  }
  
  const hoursAgo = (Date.now() - new Date(lastTrainedDate).getTime()) / 3_600_000;
  
  // Exponential decay: fatigue = initial_fatigue * e^(-k * t)
  const initial_fatigue = Math.min(100, loadAmount);
  const current_fatigue = initial_fatigue * Math.exp(-k * hoursAgo);
  const recovery_pct = Math.min(100, Math.round(100 - current_fatigue));
  
  // Hours remaining to reach 95% recovery (fatigue < 5)
  const hours_remaining = current_fatigue > 5
    ? Math.max(0, Math.ceil((Math.log(initial_fatigue / 5)) / k - hoursAgo))
    : 0;
  
  let color = '#10B981', label = 'Recuperado';
  if (recovery_pct < 33) { color = '#EF4444'; label = 'Fatigado'; }
  else if (recovery_pct < 67) { color = '#F97316'; label = 'Recuperándose'; }
  else if (recovery_pct < 100) { color = '#EAB308'; label = 'Casi listo'; }
  
  return {
    muscleId: '', muscleName, current_fatigue: round2(current_fatigue),
    recovery_pct, hours_remaining, hours_since_last: Math.round(hoursAgo),
    color, label, recovery_group: group,
  };
}

// ── Interference ──

export function applyInterference(
  baseLoad: number,
  sourceModality: string,
  overlappingModalities: string[],
  config: PerformanceConfig = DEFAULT_CONFIG
): number {
  let maxFactor = 1.0;
  for (const mod of overlappingModalities) {
    const factor = config.interference_matrix[sourceModality]?.[mod] ?? 1.0;
    if (factor > maxFactor) maxFactor = factor;
  }
  return round2(baseLoad * maxFactor);
}

// ── Alerts ──

export type AlertType = 'improvement' | 'stagnation' | 'regression' | 'overtraining';
export type AlertSeverity = 'info' | 'warn' | 'error';

export interface PerformanceAlert {
  type: AlertType;
  severity: AlertSeverity;
  exerciseId?: string;
  exerciseName?: string;
  message: string;
  pct_change?: number;
  metadata?: Record<string, any>;
}

export function detectAlerts(
  exerciseId: string,
  exerciseName: string,
  recentSessions: number[], // last 6 session_est_1rm values, newest last
  systemicFatigue: number,  // 0-100
  config: PerformanceConfig = DEFAULT_CONFIG
): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];
  if (recentSessions.length < 4) return alerts;
  
  const last3 = recentSessions.slice(-3);
  const prev3 = recentSessions.slice(-6, -3);
  
  if (prev3.length >= 3) {
    const avgLast = mean(last3);
    const avgPrev = mean(prev3);
    const changePct = avgPrev > 0 ? (avgLast - avgPrev) / avgPrev : 0;
    
    if (changePct > config.alert_thresholds.improvement_pct) {
      alerts.push({
        type: 'improvement', severity: 'info',
        exerciseId, exerciseName,
        message: `Mejora significativa en ${exerciseName}: +${(changePct * 100).toFixed(1)}%`,
        pct_change: changePct,
      });
    }
    
    if (Math.abs(changePct) < config.alert_thresholds.stagnation_pct && recentSessions.length >= 8) {
      alerts.push({
        type: 'stagnation', severity: 'warn',
        exerciseId, exerciseName,
        message: `Posible estancamiento en ${exerciseName}`,
        pct_change: changePct,
      });
    }
  }
  
  // Regression: pct_change < -3% in last 2 consecutive sessions
  if (recentSessions.length >= 3) {
    const l = recentSessions.length;
    const base = recentSessions[l - 3];
    if (base > 0) {
      const chg1 = (recentSessions[l - 2] - base) / base;
      const chg2 = (recentSessions[l - 1] - base) / base;
      if (chg1 < config.alert_thresholds.regression_pct && chg2 < config.alert_thresholds.regression_pct) {
        alerts.push({
          type: 'regression', severity: 'warn',
          exerciseId, exerciseName,
          message: `Retroceso detectado en ${exerciseName}`,
          pct_change: chg2,
        });
      }
    }
  }
  
  // Overtraining
  if (systemicFatigue > config.alert_thresholds.systemic_fatigue_max) {
    const l = recentSessions.length;
    if (l >= 2) {
      const lastChg = recentSessions[l - 2] > 0
        ? (recentSessions[l - 1] - recentSessions[l - 2]) / recentSessions[l - 2]
        : 0;
      if (lastChg < 0) {
        alerts.push({
          type: 'overtraining', severity: 'error',
          exerciseId, exerciseName,
          message: `Posible sobreentrenamiento: fatiga sistémica alta + rendimiento decreciente`,
          metadata: { systemicFatigue, lastChg },
        });
      }
    }
  }
  
  return alerts;
}

// ── Tooltip data builder (for chart points) ──

export interface ChartPointData {
  date: string;
  best_weight: number;
  best_reps: number;
  best_rir: number | null;
  est_1rm_set: number;
  session_iem: number;
  baseline: number;
  pct_change: number;
  adjusted_pct: number;
  rir_estimated: boolean;
  color: string; // green/gray/red based on pct_change
}

export function getPointColor(pct_change: number): string {
  if (pct_change > 0.005) return '#10B981';  // green
  if (pct_change < -0.005) return '#EF4444'; // red
  return '#6B7280';                           // gray
}

export function getPointColorIntensity(pct_change: number): number {
  return Math.min(1, Math.abs(pct_change) * 10);
}

// ── Utility ──

function round2(n: number): number { return Math.round(n * 100) / 100; }
function round4(n: number): number { return Math.round(n * 10000) / 10000; }
function mean(arr: number[]): number { return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

// ── Export CSV/JSON ──

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
