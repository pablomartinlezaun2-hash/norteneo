// Muscle data with anatomical information
export interface MuscleGroup {
  id: string;
  name: string;
  nameKey: string;
  descKey: string;
  subgroups?: MuscleSubgroup[];
  color: string;
  position: [number, number, number];
  size: [number, number, number];
}

export interface MuscleSubgroup {
  id: string;
  name: string;
  nameKey: string;
  descKey: string;
  parentId: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    id: 'chest',
    name: 'Pecho',
    nameKey: 'muscles.chest',
    descKey: 'muscleDesc.chest',
    color: '#ef4444',
    position: [0, 1.2, 0.15],
    size: [0.4, 0.25, 0.1],
    subgroups: [
      { id: 'chest-upper', name: 'Pecho Superior', nameKey: 'muscles.chestUpper', descKey: 'muscleDesc.chestUpper', parentId: 'chest' },
      { id: 'chest-middle', name: 'Pecho Medio', nameKey: 'muscles.chestMiddle', descKey: 'muscleDesc.chestMiddle', parentId: 'chest' },
      { id: 'chest-lower', name: 'Pecho Inferior', nameKey: 'muscles.chestLower', descKey: 'muscleDesc.chestLower', parentId: 'chest' },
    ],
  },
  {
    id: 'back',
    name: 'Espalda',
    nameKey: 'muscles.back',
    descKey: 'muscleDesc.back',
    color: '#3b82f6',
    position: [0, 1.2, -0.15],
    size: [0.45, 0.35, 0.1],
    subgroups: [
      { id: 'lats', name: 'Dorsal Ancho', nameKey: 'muscles.lats', descKey: 'muscleDesc.lats', parentId: 'back' },
      { id: 'traps', name: 'Trapecios', nameKey: 'muscles.traps', descKey: 'muscleDesc.traps', parentId: 'back' },
      { id: 'lower-back', name: 'Zona Lumbar', nameKey: 'muscles.lowerBack', descKey: 'muscleDesc.lowerBack', parentId: 'back' },
    ],
  },
  {
    id: 'shoulders',
    name: 'Hombros',
    nameKey: 'muscles.shoulders',
    descKey: 'muscleDesc.shoulders',
    color: '#f97316',
    position: [0, 1.45, 0],
    size: [0.5, 0.1, 0.15],
    subgroups: [
      { id: 'front-delt', name: 'Deltoides Frontal', nameKey: 'muscles.frontDelt', descKey: 'muscleDesc.frontDelt', parentId: 'shoulders' },
      { id: 'side-delt', name: 'Deltoides Lateral', nameKey: 'muscles.sideDelt', descKey: 'muscleDesc.sideDelt', parentId: 'shoulders' },
      { id: 'rear-delt', name: 'Deltoides Posterior', nameKey: 'muscles.rearDelt', descKey: 'muscleDesc.rearDelt', parentId: 'shoulders' },
    ],
  },
  {
    id: 'arms',
    name: 'Brazos',
    nameKey: 'muscles.arms',
    descKey: 'muscleDesc.arms',
    color: '#8b5cf6',
    position: [0.35, 1.1, 0],
    size: [0.08, 0.25, 0.08],
    subgroups: [
      { id: 'biceps', name: 'Bíceps', nameKey: 'muscles.biceps', descKey: 'muscleDesc.biceps', parentId: 'arms' },
      { id: 'triceps', name: 'Tríceps', nameKey: 'muscles.triceps', descKey: 'muscleDesc.triceps', parentId: 'arms' },
      { id: 'brachialis', name: 'Braquial', nameKey: 'muscles.brachialis', descKey: 'muscleDesc.brachialis', parentId: 'arms' },
    ],
  },
  {
    id: 'legs',
    name: 'Piernas',
    nameKey: 'muscles.legs',
    descKey: 'muscleDesc.legs',
    color: '#22c55e',
    position: [0.12, 0.4, 0],
    size: [0.12, 0.4, 0.12],
    subgroups: [
      { id: 'quads', name: 'Cuádriceps', nameKey: 'muscles.quads', descKey: 'muscleDesc.quads', parentId: 'legs' },
      { id: 'hamstrings', name: 'Isquiosurales', nameKey: 'muscles.hamstrings', descKey: 'muscleDesc.hamstrings', parentId: 'legs' },
      { id: 'adductors', name: 'Aductores', nameKey: 'muscles.adductors', descKey: 'muscleDesc.adductors', parentId: 'legs' },
      { id: 'calves', name: 'Gemelos', nameKey: 'muscles.calves', descKey: 'muscleDesc.calves', parentId: 'legs' },
      { id: 'tibialis', name: 'Tibiales', nameKey: 'muscles.tibialis', descKey: 'muscleDesc.tibialis', parentId: 'legs' },
    ],
  },
  {
    id: 'core',
    name: 'Core',
    nameKey: 'muscles.core',
    descKey: 'muscleDesc.core',
    color: '#eab308',
    position: [0, 0.9, 0.1],
    size: [0.25, 0.2, 0.08],
    subgroups: [
      { id: 'abs', name: 'Recto Abdominal', nameKey: 'muscles.abs', descKey: 'muscleDesc.abs', parentId: 'core' },
      { id: 'obliques', name: 'Oblicuos', nameKey: 'muscles.obliques', descKey: 'muscleDesc.obliques', parentId: 'core' },
    ],
  },
  {
    id: 'glutes',
    name: 'Glúteos',
    nameKey: 'muscles.glutes',
    descKey: 'muscleDesc.glutes',
    color: '#ec4899',
    position: [0, 0.7, -0.1],
    size: [0.35, 0.15, 0.12],
    subgroups: [
      { id: 'glute-max', name: 'Glúteo Mayor', nameKey: 'muscles.gluteMax', descKey: 'muscleDesc.gluteMax', parentId: 'glutes' },
      { id: 'glute-med', name: 'Glúteo Medio', nameKey: 'muscles.gluteMed', descKey: 'muscleDesc.gluteMed', parentId: 'glutes' },
    ],
  },
];

// Map exercise names to muscle groups
export const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  // Chest
  'press banca': ['chest', 'chest-upper', 'chest-middle', 'chest-lower'],
  'press inclinado': ['chest', 'chest-upper'],
  'press declinado': ['chest', 'chest-lower'],
  'aperturas': ['chest', 'chest-middle'],
  'cruces': ['chest'],
  'fondos': ['chest', 'chest-lower', 'triceps'],
  'push up': ['chest', 'triceps'],
  'flexiones': ['chest', 'triceps'],
  
  // Back
  'dominadas': ['back', 'lats', 'biceps'],
  'jalón': ['back', 'lats'],
  'remo': ['back', 'lats', 'traps'],
  'peso muerto': ['back', 'lower-back', 'glutes', 'hamstrings'],
  'pull over': ['back', 'lats', 'chest'],
  'face pull': ['back', 'rear-delt', 'traps'],
  
  // Shoulders
  'press militar': ['shoulders', 'front-delt'],
  'press hombro': ['shoulders', 'front-delt', 'side-delt'],
  'elevaciones laterales': ['shoulders', 'side-delt'],
  'elevaciones frontales': ['shoulders', 'front-delt'],
  'pájaros': ['shoulders', 'rear-delt'],
  'encogimientos': ['shoulders', 'traps'],
  
  // Arms
  'curl bíceps': ['arms', 'biceps'],
  'curl martillo': ['arms', 'biceps', 'brachialis'],
  'curl predicador': ['arms', 'biceps'],
  'extensiones tríceps': ['arms', 'triceps'],
  'press francés': ['arms', 'triceps'],
  'fondos en banco': ['arms', 'triceps'],
  
  // Legs
  'sentadillas': ['legs', 'quads', 'glutes'],
  'prensa': ['legs', 'quads', 'glutes'],
  'extensiones': ['legs', 'quads'],
  'curl femoral': ['legs', 'hamstrings'],
  'peso muerto rumano': ['legs', 'hamstrings', 'glutes', 'lower-back'],
  'zancadas': ['legs', 'quads', 'glutes'],
  'hip thrust': ['glutes', 'glute-max', 'hamstrings'],
  'elevación talones': ['legs', 'calves'],
  'gemelos': ['legs', 'calves'],
  
  // Core
  'crunch': ['core', 'abs'],
  'plancha': ['core', 'abs', 'obliques'],
  'russian twist': ['core', 'obliques'],
  'elevación piernas': ['core', 'abs'],
  'ab wheel': ['core', 'abs'],
};

export const getMuscleGroupsForExercise = (exerciseName: string): string[] => {
  const normalizedName = exerciseName.toLowerCase();
  
  for (const [key, muscles] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (normalizedName.includes(key)) {
      return muscles;
    }
  }
  
  // Default mapping based on common keywords
  if (normalizedName.includes('pecho') || normalizedName.includes('chest') || normalizedName.includes('bench')) {
    return ['chest'];
  }
  if (normalizedName.includes('espalda') || normalizedName.includes('back') || normalizedName.includes('dorsal')) {
    return ['back', 'lats'];
  }
  if (normalizedName.includes('hombro') || normalizedName.includes('shoulder') || normalizedName.includes('delt')) {
    return ['shoulders'];
  }
  if (normalizedName.includes('bíceps') || normalizedName.includes('biceps') || normalizedName.includes('curl')) {
    return ['arms', 'biceps'];
  }
  if (normalizedName.includes('tríceps') || normalizedName.includes('triceps')) {
    return ['arms', 'triceps'];
  }
  if (normalizedName.includes('pierna') || normalizedName.includes('leg') || normalizedName.includes('cuádriceps') || normalizedName.includes('quad')) {
    return ['legs', 'quads'];
  }
  if (normalizedName.includes('glúteo') || normalizedName.includes('glute')) {
    return ['glutes'];
  }
  if (normalizedName.includes('abdominal') || normalizedName.includes('abs') || normalizedName.includes('core')) {
    return ['core', 'abs'];
  }
  
  return [];
};
