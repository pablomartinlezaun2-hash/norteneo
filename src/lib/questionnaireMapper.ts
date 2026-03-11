import type { ProfileDataFromQuestionnaire } from './activateVB2';

/**
 * Context/metrics data extracted from questionnaire answers.
 * Saved into athlete_metrics table.
 */
export interface MetricsDataFromQuestionnaire {
  sleep_hours?: string;
  sleep_quality?: string;
  stress_level?: string;
  mental_load?: string;
  injuries_or_discomfort?: string;
  fatigue_subjective?: number;
}

/**
 * Maps VB1 questionnaire raw answers (by index) to profile fields.
 * VB1 indices: 0=objetivo, 1=experiencia, 2=disciplinas, 3=frecuencia, 4=sueno, 5=estres, 6=lesiones, 7=peso
 */
export function mapVB1AnswersToProfile(answers: Record<number, string>): ProfileDataFromQuestionnaire {
  const result: ProfileDataFromQuestionnaire = {};

  if (answers[0]) result.main_goal = answers[0];
  if (answers[1]) result.years_training = answers[1];
  if (answers[2]) {
    const d = answers[2];
    if (d === 'Gimnasio') result.disciplines = ['Gimnasio'];
    else if (d === 'Running') result.disciplines = ['Running'];
    else if (d === 'Natación') result.disciplines = ['Natación'];
    else if (d === 'Varias de las anteriores') result.disciplines = ['Gimnasio', 'Running', 'Natación'];
    else result.disciplines = [d];
  }
  if (answers[7]) {
    const w = parseFloat(answers[7]);
    if (!isNaN(w) && w > 0) result.weight = w;
  }

  return result;
}

/**
 * Maps VB1 questionnaire answers to initial athlete_metrics data.
 * VB1 indices: 4=sueno, 5=estres, 6=lesiones
 */
export function mapVB1AnswersToMetrics(answers: Record<number, string>): MetricsDataFromQuestionnaire {
  const result: MetricsDataFromQuestionnaire = {};

  // Index 4: sleep hours
  if (answers[4]) {
    result.sleep_hours = answers[4]; // e.g. "6–7", "7–8"
  }
  // Index 5: stress level
  if (answers[5]) {
    result.stress_level = answers[5]; // "Bajo", "Medio", "Alto"
  }
  // Index 6: injuries
  if (answers[6]) {
    result.injuries_or_discomfort = answers[6]; // "No", "Sí, leve", "Sí, importante"
  }

  return result;
}

/**
 * Maps VB2 questionnaire raw answers (by index) to profile fields.
 * VB2 indices: 0=disciplinas, 1=edad, 2=peso, 3=altura, 4=anos_entrenando, 5=frecuencia, ...
 */
export function mapVB2AnswersToProfile(answers: Record<number, string>): ProfileDataFromQuestionnaire {
  const result: ProfileDataFromQuestionnaire = {};

  if (answers[0]) {
    const d = answers[0];
    if (d === 'Solo gimnasio') result.disciplines = ['Gimnasio'];
    else if (d === 'Gimnasio + running') result.disciplines = ['Gimnasio', 'Running'];
    else if (d === 'Gimnasio + natación') result.disciplines = ['Gimnasio', 'Natación'];
    else if (d === 'Gimnasio + running + natación') result.disciplines = ['Gimnasio', 'Running', 'Natación'];
    else result.disciplines = [d];
  }
  if (answers[1]) {
    const a = parseInt(answers[1], 10);
    if (!isNaN(a) && a > 0) result.age = a;
  }
  if (answers[2]) {
    const w = parseFloat(answers[2]);
    if (!isNaN(w) && w > 0) result.weight = w;
  }
  if (answers[3]) {
    const h = parseFloat(answers[3]);
    if (!isNaN(h) && h > 0) result.height = h;
  }
  if (answers[4]) result.years_training = answers[4];

  return result;
}

/**
 * Maps VB2 questionnaire answers to initial athlete_metrics data.
 * VB2 indices: 12=sleep_hours, 13=sleep_quality, 14=stress, 15=mental_load, 16=physical_fatigue, 22=injuries
 */
export function mapVB2AnswersToMetrics(answers: Record<number, string>): MetricsDataFromQuestionnaire {
  const result: MetricsDataFromQuestionnaire = {};

  // Index 12: sleep hours
  if (answers[12]) {
    result.sleep_hours = answers[12];
  }
  // Index 13: sleep quality
  if (answers[13]) {
    result.sleep_quality = answers[13];
  }
  // Index 14: stress level
  if (answers[14]) {
    result.stress_level = answers[14];
  }
  // Index 15: anxiety / mental load
  if (answers[15]) {
    result.mental_load = answers[15];
  }
  // Index 16: physical work fatigue → subjective fatigue (1-10 scale approximation)
  if (answers[16]) {
    const map: Record<string, number> = {
      'No demasiado': 2,
      'Un poco': 4,
      'Bastante': 6,
      'Muchísimo': 8,
    };
    result.fatigue_subjective = map[answers[16]] ?? undefined;
  }
  // Index 22: injuries
  if (answers[22]) {
    result.injuries_or_discomfort = answers[22];
  }

  return result;
}

/**
 * Convert sleep hours answer string to a numeric approximation.
 */
export function parseSleepHoursToNumber(answer: string): number | null {
  if (answer.includes('Menos de 6') || answer.includes('< 6')) return 5.5;
  if (answer.includes('6–7') || answer.includes('6-7')) return 6.5;
  if (answer.includes('7–8') || answer.includes('7-8')) return 7.5;
  if (answer.includes('8+') || answer.includes('Más de 8')) return 8.5;
  const n = parseFloat(answer);
  return isNaN(n) ? null : n;
}
