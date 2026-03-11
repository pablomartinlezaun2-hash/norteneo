import type { ProfileDataFromQuestionnaire } from './activateVB2';

/**
 * Maps VB1 questionnaire raw answers (by index) to profile fields.
 * VB1 indices: 0=objetivo, 1=experiencia, 2=disciplinas, 3=frecuencia, 4=sueno, 5=estres, 6=lesiones, 7=peso
 */
export function mapVB1AnswersToProfile(answers: Record<number, string>): ProfileDataFromQuestionnaire {
  const result: ProfileDataFromQuestionnaire = {};

  if (answers[0]) result.main_goal = answers[0];
  if (answers[1]) result.years_training = answers[1];
  if (answers[2]) {
    // Map discipline answer to array
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
