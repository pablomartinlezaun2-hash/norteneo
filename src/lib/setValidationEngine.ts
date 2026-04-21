/**
 * Set Validation Engine — Real-time micro-validation layer for NEO.
 *
 * Validates each logged set immediately against:
 *   1. Pautado rep range (parsed from string like "8-10", "6 a 8", "10/lado")
 *   2. Load drop > 5% vs valid reference (previous effective set or target)
 *   3. Missing sets (when leaving exercise / closing session)
 *
 * Aligned with PerformanceAlertEngine for consistency.
 */

// ── Types ──

export type ValidationSeverity = 'mild' | 'moderate' | 'strong';

export type ValidationKind =
  | 'reps_out_of_range'
  | 'load_drop'
  | 'missing_sets';

export interface SetValidationAlert {
  /** Stable identifier — exercise + set + kind */
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  kind: ValidationKind;
  severity: ValidationSeverity;
  /** 0-100, premium accuracy score */
  precision: number;
  /** Short banner title (premium copy) */
  title: string;
  /** Body explaining what happened */
  description: string;
  /** Action the user must take next */
  actionHint: string;
  /** Raw context for debugging / analytics */
  context: Record<string, number | string | null>;
  createdAt: number;
}

export interface RepRange {
  min: number;
  max: number;
}

export interface ValidatedSetInput {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  totalSetsPlanned: number;
  weight: number;
  reps: number;
  rir: number | null;
  isWarmup: boolean;
  /** Raw "reps" string from exercise (e.g. "8-10", "6 a 8", "AMRAP") */
  pautadoRepsRaw: string | null;
  /** Optional explicit numeric range (from planning_session_exercises) */
  pautadoRange?: RepRange | null;
  /** Previous valid (non-warmup) sets in this same session for this exercise */
  previousSetsThisSession: Array<{ weight: number; reps: number; rir: number | null }>;
  /** Optional historical reference weight (e.g. last session top set) */
  referenceWeight?: number | null;
}

// ── Rep range parsing ──

/**
 * Parses any reasonable pautado string into a numeric range.
 * Supports: "8-10", "8 a 10", "8 to 10", "8–10", "8—10", "10", "10 reps", "10/lado".
 * Returns null for AMRAP, "max", empty, or unparseable strings.
 */
export function parseRepRange(raw: string | null | undefined): RepRange | null {
  if (!raw) return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/[–—−]/g, '-') // unify dashes
    .replace(/\s+a\s+/g, '-') // "8 a 10" → "8-10"
    .replace(/\s+to\s+/g, '-')
    .trim();

  if (/amrap|max|al\s*fallo|fallo/.test(cleaned)) return null;

  // Range pattern
  const rangeMatch = cleaned.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (min > 0 && max >= min && max < 100) return { min, max };
  }

  // Single number pattern (treat as exact target with ±0 tolerance)
  const singleMatch = cleaned.match(/^(\d+)/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10);
    if (n > 0 && n < 100) return { min: n, max: n };
  }

  return null;
}

// ── Severity helpers ──

/**
 * Reps distance from range → severity + precision.
 *   in range  → none / 100%
 *   ±1        → mild / 95%
 *   ±2        → moderate / 90%
 *   ±3        → strong / 80%
 *   ±4+       → strong / 70%
 */
function classifyRepsDistance(reps: number, range: RepRange): {
  severity: ValidationSeverity | null;
  precision: number;
  distance: number;
  direction: 'below' | 'above';
} {
  const distance =
    reps < range.min ? range.min - reps : reps > range.max ? reps - range.max : 0;
  const direction = reps < range.min ? 'below' : 'above';

  if (distance === 0) return { severity: null, precision: 100, distance, direction };
  if (distance === 1) return { severity: 'mild', precision: 95, distance, direction };
  if (distance === 2) return { severity: 'moderate', precision: 90, distance, direction };
  if (distance === 3) return { severity: 'strong', precision: 80, distance, direction };
  return { severity: 'strong', precision: 70, distance, direction };
}

/**
 * Load drop severity.
 *   <5%       → none
 *   5–9.99%   → mild
 *   10–14.99% → moderate
 *   15%+      → strong
 */
function classifyLoadDrop(dropPct: number): {
  severity: ValidationSeverity | null;
  precision: number;
} {
  if (dropPct < 5) return { severity: null, precision: 100 };
  if (dropPct < 10) return { severity: 'mild', precision: 92 };
  if (dropPct < 15) return { severity: 'moderate', precision: 84 };
  return { severity: 'strong', precision: 72 };
}

// ── Premium copy generators ──

function buildRepsCopy(
  reps: number,
  range: RepRange,
  direction: 'below' | 'above',
  distance: number,
  severity: ValidationSeverity,
): { title: string; description: string; actionHint: string } {
  const rangeLabel =
    range.min === range.max ? `${range.min} reps` : `${range.min}–${range.max} reps`;

  if (direction === 'below') {
    const titles: Record<ValidationSeverity, string> = {
      mild: 'Una rep por debajo del rango',
      moderate: 'Te quedaste corto en esta serie',
      strong: 'Caída clara de repeticiones',
    };
    return {
      title: titles[severity],
      description: `Hiciste ${reps} reps con un objetivo de ${rangeLabel}. Faltaron ${distance} ${distance === 1 ? 'repetición' : 'repeticiones'} para entrar en rango.`,
      actionHint:
        severity === 'strong'
          ? 'Baja la carga 5–10% en la próxima serie para asegurar el rango pautado.'
          : severity === 'moderate'
            ? 'Reduce un poco la carga o aumenta el descanso antes de la siguiente serie.'
            : 'Mantén la carga y empuja una rep más en la próxima serie.',
    };
  }

  // above range
  const titles: Record<ValidationSeverity, string> = {
    mild: 'Una rep por encima del rango',
    moderate: 'Pasaste el rango pautado',
    strong: 'Muy por encima del objetivo',
  };
  return {
    title: titles[severity],
    description: `Hiciste ${reps} reps con un objetivo de ${rangeLabel}. ${distance} ${distance === 1 ? 'rep' : 'reps'} por encima del techo.`,
    actionHint:
      severity === 'strong'
        ? 'Sube la carga 5–10% en la próxima serie. Estás dejando estímulo sin usar.'
        : severity === 'moderate'
          ? 'Sube ligeramente la carga para entrar en rango la próxima serie.'
          : 'Considera subir 1–2 kg para acercarte al techo del rango.',
  };
}

function buildLoadDropCopy(
  weight: number,
  reference: number,
  dropPct: number,
  severity: ValidationSeverity,
): { title: string; description: string; actionHint: string } {
  const dropLabel = `${dropPct.toFixed(1)}%`;
  const titles: Record<ValidationSeverity, string> = {
    mild: 'Pequeña caída de carga',
    moderate: 'Caída de carga relevante',
    strong: 'Caída fuerte de carga',
  };
  return {
    title: titles[severity],
    description: `Esta serie va con ${weight} kg frente a ${reference} kg de referencia (−${dropLabel}). NEO lo registra como pérdida real de rendimiento.`,
    actionHint:
      severity === 'strong'
        ? 'Verifica fatiga, técnica o descanso. Si la caída es involuntaria, considera cerrar el ejercicio.'
        : severity === 'moderate'
          ? 'Revisa el descanso entre series y la activación previa. Mantén la carga si fue intencionado.'
          : 'Caída leve. Si fue intencionado (back-off), ignora; si no, sube el descanso.',
  };
}

function buildMissingSetsCopy(
  exerciseName: string,
  done: number,
  total: number,
): { title: string; description: string; actionHint: string } {
  const missing = total - done;
  return {
    title: `${missing} ${missing === 1 ? 'serie pendiente' : 'series pendientes'} en ${exerciseName}`,
    description: `Llevas ${done} de ${total} series pautadas. NEO solo computa el ejercicio como completo cuando registras todas.`,
    actionHint:
      'Vuelve al ejercicio y completa las series restantes, o márcalo como interrumpido para que el análisis lo refleje correctamente.',
  };
}

// ── Reference weight selection ──

function selectReferenceWeight(input: ValidatedSetInput): number | null {
  const prevValid = input.previousSetsThisSession.filter(s => s.weight > 0 && s.reps > 0);
  if (prevValid.length > 0) {
    // Use max of previous valid sets in this session
    return Math.max(...prevValid.map(s => s.weight));
  }
  if (input.referenceWeight && input.referenceWeight > 0) return input.referenceWeight;
  return null;
}

// ── Main API: validate a freshly logged set ──

export function validateLoggedSet(input: ValidatedSetInput): SetValidationAlert[] {
  if (input.isWarmup) return [];
  if (input.weight <= 0 || input.reps <= 0) return [];

  const alerts: SetValidationAlert[] = [];
  const now = Date.now();

  // 1) Reps vs pautado range
  const range = input.pautadoRange ?? parseRepRange(input.pautadoRepsRaw);
  if (range) {
    const cls = classifyRepsDistance(input.reps, range);
    if (cls.severity) {
      const copy = buildRepsCopy(input.reps, range, cls.direction, cls.distance, cls.severity);
      alerts.push({
        id: `${input.exerciseId}:${input.setNumber}:reps`,
        exerciseId: input.exerciseId,
        exerciseName: input.exerciseName,
        setNumber: input.setNumber,
        kind: 'reps_out_of_range',
        severity: cls.severity,
        precision: cls.precision,
        title: copy.title,
        description: copy.description,
        actionHint: copy.actionHint,
        context: {
          reps: input.reps,
          range_min: range.min,
          range_max: range.max,
          distance: cls.distance,
          direction: cls.direction,
        },
        createdAt: now,
      });
    }
  }

  // 2) Load drop vs reference
  const reference = selectReferenceWeight(input);
  if (reference && reference > 0) {
    const dropPct = ((reference - input.weight) / reference) * 100;
    if (dropPct >= 5) {
      const cls = classifyLoadDrop(dropPct);
      if (cls.severity) {
        const copy = buildLoadDropCopy(input.weight, reference, dropPct, cls.severity);
        alerts.push({
          id: `${input.exerciseId}:${input.setNumber}:load`,
          exerciseId: input.exerciseId,
          exerciseName: input.exerciseName,
          setNumber: input.setNumber,
          kind: 'load_drop',
          severity: cls.severity,
          precision: cls.precision,
          title: copy.title,
          description: copy.description,
          actionHint: copy.actionHint,
          context: {
            weight: input.weight,
            reference_weight: reference,
            drop_pct: Math.round(dropPct * 10) / 10,
          },
          createdAt: now,
        });
      }
    }
  }

  return alerts;
}

// ── Missing sets validation (called when leaving exercise / closing session) ──

export interface ExerciseProgressInput {
  exerciseId: string;
  exerciseName: string;
  totalSetsPlanned: number;
  effectiveSetsLogged: number; // non-warmup count
}

export function validateExerciseCompletion(
  input: ExerciseProgressInput,
): SetValidationAlert | null {
  if (input.totalSetsPlanned <= 0) return null;
  if (input.effectiveSetsLogged >= input.totalSetsPlanned) return null;
  if (input.effectiveSetsLogged < 0) return null;

  const missing = input.totalSetsPlanned - input.effectiveSetsLogged;
  // Severity scales with how many sets are missing
  const ratio = missing / input.totalSetsPlanned;
  const severity: ValidationSeverity =
    ratio >= 0.5 ? 'strong' : ratio >= 0.34 ? 'moderate' : 'mild';
  const precision = Math.max(40, Math.round(100 - ratio * 80));

  const copy = buildMissingSetsCopy(
    input.exerciseName,
    input.effectiveSetsLogged,
    input.totalSetsPlanned,
  );

  return {
    id: `${input.exerciseId}:missing`,
    exerciseId: input.exerciseId,
    exerciseName: input.exerciseName,
    setNumber: input.effectiveSetsLogged + 1,
    kind: 'missing_sets',
    severity,
    precision,
    title: copy.title,
    description: copy.description,
    actionHint: copy.actionHint,
    context: {
      done: input.effectiveSetsLogged,
      total: input.totalSetsPlanned,
      missing,
    },
    createdAt: Date.now(),
  };
}
