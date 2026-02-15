export type ExerciseAnimationType =
  | 'bench-press' | 'overhead-press' | 'squat' | 'deadlift'
  | 'bicep-curl' | 'tricep-extension' | 'lateral-raise' | 'row'
  | 'pulldown' | 'pullup' | 'lunge' | 'leg-press' | 'leg-extension'
  | 'leg-curl' | 'calf-raise' | 'chest-fly' | 'crunch' | 'plank'
  | 'dip' | 'hip-thrust' | 'shrug' | 'generic';

const exerciseMap: Record<string, ExerciseAnimationType> = {
  // Bench press variations
  'press banca': 'bench-press',
  'press de banca': 'bench-press',
  'bench press': 'bench-press',
  'press inclinado': 'bench-press',
  'incline bench press': 'bench-press',
  'press declinado': 'bench-press',
  'decline bench press': 'bench-press',

  // Overhead press
  'press militar': 'overhead-press',
  'press hombro': 'overhead-press',
  'overhead press': 'overhead-press',
  'shoulder press': 'overhead-press',
  'press arnold': 'overhead-press',
  'arnold press': 'overhead-press',

  // Squat
  'sentadilla': 'squat',
  'sentadillas': 'squat',
  'squat': 'squat',
  'barbell squat': 'squat',
  'front squat': 'squat',
  'goblet squat': 'squat',
  'hack squat': 'squat',
  'sentadilla búlgara': 'squat',
  'bulgarian split squat': 'squat',

  // Deadlift
  'peso muerto': 'deadlift',
  'peso muerto rumano': 'deadlift',
  'deadlift': 'deadlift',
  'romanian deadlift': 'deadlift',
  'sumo deadlift': 'deadlift',

  // Bicep curl
  'curl biceps': 'bicep-curl',
  'curl bíceps': 'bicep-curl',
  'bicep curl': 'bicep-curl',
  'curl martillo': 'bicep-curl',
  'hammer curl': 'bicep-curl',
  'curl predicador': 'bicep-curl',
  'preacher curl': 'bicep-curl',
  'curl concentrado': 'bicep-curl',
  'concentration curl': 'bicep-curl',
  'curl con barra': 'bicep-curl',

  // Tricep
  'extensión tríceps': 'tricep-extension',
  'extension triceps': 'tricep-extension',
  'tricep extension': 'tricep-extension',
  'press francés': 'tricep-extension',
  'press frances': 'tricep-extension',
  'skull crusher': 'tricep-extension',
  'patada de tríceps': 'tricep-extension',

  // Lateral raise
  'elevaciones laterales': 'lateral-raise',
  'elevacion lateral': 'lateral-raise',
  'lateral raise': 'lateral-raise',
  'elevaciones frontales': 'lateral-raise',
  'front raise': 'lateral-raise',

  // Row
  'remo con barra': 'row',
  'remo con mancuerna': 'row',
  'barbell row': 'row',
  'dumbbell row': 'row',
  'remo en polea': 'row',
  'cable row': 'row',
  'remo': 'row',
  'face pull': 'row',
  'pájaros': 'row',
  'pajaros': 'row',
  'reverse fly': 'row',

  // Pulldown
  'jalón al pecho': 'pulldown',
  'jalon al pecho': 'pulldown',
  'lat pulldown': 'pulldown',
  'jalón en polea': 'pulldown',
  'cable pulldown': 'pulldown',
  'pullover': 'pulldown',

  // Pullup
  'dominadas': 'pullup',
  'pull up': 'pullup',
  'chin up': 'pullup',

  // Lunge
  'zancadas': 'lunge',
  'lunge': 'lunge',

  // Leg press
  'prensa': 'leg-press',
  'prensa de piernas': 'leg-press',
  'leg press': 'leg-press',

  // Leg extension
  'extensión de cuádriceps': 'leg-extension',
  'extension de cuadriceps': 'leg-extension',
  'leg extension': 'leg-extension',

  // Leg curl
  'curl femoral': 'leg-curl',
  'curl de piernas': 'leg-curl',
  'leg curl': 'leg-curl',

  // Calf raise
  'gemelos': 'calf-raise',
  'elevación de gemelos': 'calf-raise',
  'calf raise': 'calf-raise',

  // Chest fly
  'aperturas': 'chest-fly',
  'apertura con mancuernas': 'chest-fly',
  'dumbbell fly': 'chest-fly',
  'chest fly': 'chest-fly',

  // Core
  'crunch': 'crunch',
  'abdominales': 'crunch',
  'plancha': 'plank',
  'plank': 'plank',

  // Dip
  'fondos': 'dip',
  'dip': 'dip',

  // Hip thrust
  'hip thrust': 'hip-thrust',

  // Shrug
  'encogimientos': 'shrug',
  'encogimiento de hombros': 'shrug',
  'barbell shrug': 'shrug',
  'shrug': 'shrug',
};

export function getAnimationForExercise(name: string): ExerciseAnimationType {
  const lower = name.toLowerCase().trim();

  // Direct match
  if (exerciseMap[lower]) return exerciseMap[lower];

  // Partial match
  for (const [key, value] of Object.entries(exerciseMap)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }

  return 'generic';
}
