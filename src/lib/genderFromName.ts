// Heurística simple de género por nombre (español).
// Devuelve 'f' (femenino), 'm' (masculino) o 'u' (desconocido).
// Usada para elegir entre "Bienvenido" / "Bienvenida".

const FEMALE_NAMES = new Set([
  // Nombres comunes que NO terminan en -a (excepciones a la regla general)
  'carmen', 'pilar', 'isabel', 'mercedes', 'dolores', 'concepcion', 'consuelo',
  'rocio', 'belen', 'maria', 'esther', 'raquel', 'soledad', 'inmaculada',
  'milagros', 'asuncion', 'encarnacion', 'nieves', 'sol', 'mar', 'luz',
  'beatriz', 'cruz', 'estefani', 'estefany', 'jennifer', 'jenifer',
]);

const MALE_NAMES_ENDING_A = new Set([
  // Nombres masculinos que terminan en -a (excepciones)
  'luca', 'noa', 'elias', 'isaias', 'jeremias', 'matias', 'tobias',
  'andrea', // ambiguo en español, pero más común masculino en Italia; lo dejamos masculino
  'cuba', 'iosua', 'joshua',
]);

const MALE_SUFFIXES = ['os', 'on', 'or', 'el', 'an', 'en', 'in', 'un'];

export type Gender = 'f' | 'm' | 'u';

export function detectGender(rawName: string): Gender {
  if (!rawName) return 'u';
  // Tomar solo el primer nombre, normalizar
  const first = rawName
    .trim()
    .split(/\s+/)[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

  if (!first) return 'u';

  if (FEMALE_NAMES.has(first)) return 'f';
  if (MALE_NAMES_ENDING_A.has(first)) return 'm';

  const last = first.slice(-1);
  const last2 = first.slice(-2);

  // Terminaciones típicamente femeninas
  if (last === 'a') return 'f';
  if (['ia', 'ina', 'ela', 'isa', 'ana', 'ena'].includes(last2)) return 'f';

  // Terminaciones típicamente masculinas
  if (MALE_SUFFIXES.includes(last2)) return 'm';
  if (last === 'o') return 'm';

  return 'u';
}

export function welcomeWord(rawName: string): 'Bienvenido' | 'Bienvenida' {
  return detectGender(rawName) === 'f' ? 'Bienvenida' : 'Bienvenido';
}
