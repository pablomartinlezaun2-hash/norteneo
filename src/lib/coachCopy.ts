/**
 * Coach Copy Helper — Centraliza el copy obligatorio de TODA intervención
 * del coach (texto, audio, vídeo, futura WhatsApp).
 *
 * Regla global: cada intervención debe abrirse con un saludo personalizado
 * + nombre del atleta. Apertura por defecto: "Buenas, {nombre}, …"
 *
 * Ver mem://features/coach/intervention-copy-rule.md
 */

import { normalizeFirstName } from "./firstName";

export type GreetingVariant = 0 | 1 | 2 | 3;

const GREETINGS: Record<GreetingVariant, (name: string | null) => string> = {
  0: (name) => (name ? `Buenas, ${name}, ` : `Buenas, `),
  1: (name) => (name ? `Hola, ${name}, ` : `Hola, `),
  2: (name) => (name ? `Buenas, ${name}. He visto que ` : `Buenas. He visto que `),
  3: (name) => (name ? `Hola, ${name}. Me ha llegado una alerta de que ` : `Hola. Me ha llegado una alerta de que `),
};

/** Resuelve el primer nombre desde campos disponibles del perfil. */
export function resolveAthleteFirstName(input: {
  display_name?: string | null;
  full_name?: string | null;
  email?: string | null;
}): string | null {
  const candidates = [input.display_name, input.full_name];
  for (const c of candidates) {
    if (!c) continue;
    const n = normalizeFirstName(c);
    if (n && n.length >= 2) return n;
  }
  // Fallback extremo: parte local del email capitalizada (sin números)
  if (input.email) {
    const local = input.email.split("@")[0]?.replace(/[0-9._-]+/g, " ").trim();
    if (local) {
      const n = normalizeFirstName(local);
      if (n && n.length >= 2) return n;
    }
  }
  return null;
}

/**
 * Construye el saludo obligatorio para mensajes del coach.
 * Si no hay nombre, devuelve la apertura neutra premium correspondiente.
 */
export function buildCoachGreeting(
  athleteFirstName?: string | null,
  variant: GreetingVariant = 0,
): string {
  const name = athleteFirstName?.trim() ? normalizeFirstName(athleteFirstName) : null;
  return GREETINGS[variant](name);
}

/**
 * Garantiza que el texto cumpla la regla de apertura.
 * Si ya empieza con un saludo permitido, lo deja. Si no, lo antepone.
 */
export function ensureGreeting(
  rawText: string,
  athleteFirstName?: string | null,
  variant: GreetingVariant = 0,
): string {
  const trimmed = (rawText ?? "").trim();
  const lower = trimmed.toLowerCase();
  const hasGreeting = ["buenas,", "hola,", "buenas.", "hola."].some((p) =>
    lower.startsWith(p),
  );
  if (hasGreeting) return trimmed;
  return buildCoachGreeting(athleteFirstName, variant) + trimmed;
}

// ────────────────────────────────────────────────────────────────────────────
// Plantillas por tipo de evento — copy breve, humano, premium.
// El cuerpo NO incluye el saludo: se antepone con buildCoachGreeting().
// ────────────────────────────────────────────────────────────────────────────

export type InterventionEventType =
  | "reps_out_of_range"
  | "missing_set"
  | "load_drop"
  | "performance_drop"
  | "low_sleep"
  | "high_fatigue"
  | "low_protein"
  | "calorie_off_target"
  | "low_adherence"
  | "progress_milestone";

export interface InterventionTemplateInput {
  exerciseName?: string;
  setNumber?: number;
  deltaPercent?: number;
  hours?: number;
  proteinGap?: number;
  caloriesGap?: number;
  adherencePct?: number;
  detail?: string;
}

interface TemplateEntry {
  variant: GreetingVariant;
  body: (i: InterventionTemplateInput) => string;
}

const TEMPLATES: Record<InterventionEventType, TemplateEntry> = {
  reps_out_of_range: {
    variant: 2,
    body: (i) =>
      `hoy te has salido del rango pautado${i.exerciseName ? ` en ${i.exerciseName}` : ""}. ¿Cómo te has encontrado en esa serie?`,
  },
  missing_set: {
    variant: 2,
    body: (i) =>
      `hoy te has quedado una serie por debajo de lo pautado${i.exerciseName ? ` en ${i.exerciseName}` : ""}. ¿Cómo te has encontrado?`,
  },
  load_drop: {
    variant: 0,
    body: (i) => {
      const pct = typeof i.deltaPercent === "number" ? Math.abs(Math.round(i.deltaPercent)) : null;
      return `hoy aparece una bajada de carga${pct ? ` superior al ${pct}%` : " mayor de lo habitual"}${i.exerciseName ? ` en ${i.exerciseName}` : ""}. Cuéntame si te has sentido fatigado o algo no ha ido bien.`;
    },
  },
  performance_drop: {
    variant: 3,
    body: () =>
      `tu rendimiento ha bajado respecto a tu media. Quería preguntarte cómo has llegado a la sesión.`,
  },
  low_sleep: {
    variant: 3,
    body: (i) =>
      `${typeof i.hours === "number" ? `anoche has dormido ${i.hours.toFixed(1)} h` : "has dormido menos de lo habitual"}. ¿Pasó algo o lo notas puntual?`,
  },
  high_fatigue: {
    variant: 3,
    body: () =>
      `tu fatiga está alta. Vamos a ajustar la próxima sesión para que recuperes bien antes de seguir empujando.`,
  },
  low_protein: {
    variant: 2,
    body: (i) =>
      `hoy la proteína se ha quedado por debajo del objetivo${typeof i.proteinGap === "number" ? ` (faltan ${Math.round(i.proteinGap)} g)` : ""}. Intenta corregirlo en la siguiente comida.`,
  },
  calorie_off_target: {
    variant: 2,
    body: (i) => {
      const gap = typeof i.caloriesGap === "number" ? Math.round(i.caloriesGap) : null;
      if (gap === null) return `hoy las calorías se han desviado del objetivo. Vamos a ajustar la siguiente comida.`;
      return gap > 0
        ? `hoy te has pasado ${gap} kcal del objetivo. Vamos a ajustar la siguiente comida.`
        : `hoy te has quedado ${Math.abs(gap)} kcal por debajo. Intenta compensarlo en lo que queda de día.`;
    },
  },
  low_adherence: {
    variant: 0,
    body: (i) =>
      `tu adherencia esta semana está por debajo de lo habitual${typeof i.adherencePct === "number" ? ` (${Math.round(i.adherencePct)}%)` : ""}. ¿Te encaja que repasemos la planificación?`,
  },
  progress_milestone: {
    variant: 0,
    body: (i) =>
      `progreso top esta semana${i.detail ? `: ${i.detail}` : ""}. Sigue así, vamos en la línea correcta.`,
  },
};

/** Genera el texto completo (saludo + cuerpo) para un evento. */
export function generateInterventionMessage(
  eventType: InterventionEventType,
  athleteFirstName: string | null,
  input: InterventionTemplateInput = {},
): string {
  const entry = TEMPLATES[eventType];
  const greeting = buildCoachGreeting(athleteFirstName, entry.variant);
  return greeting + entry.body(input);
}

/** Etiqueta humana corta por tipo de evento. */
export const EVENT_TYPE_LABEL: Record<InterventionEventType, string> = {
  reps_out_of_range: "Reps fuera de rango",
  missing_set: "Serie faltante",
  load_drop: "Caída de carga",
  performance_drop: "Caída de rendimiento",
  low_sleep: "Sueño bajo",
  high_fatigue: "Fatiga alta",
  low_protein: "Proteína baja",
  calorie_off_target: "Calorías fuera de objetivo",
  low_adherence: "Mala adherencia",
  progress_milestone: "Progreso relevante",
};
