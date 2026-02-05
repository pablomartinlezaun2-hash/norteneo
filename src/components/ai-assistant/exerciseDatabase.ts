import { ExerciseCard } from './types';

// Sample exercises database with GIF URLs and muscle mappings
export const exerciseDatabase: ExerciseCard[] = [
  // Chest exercises
  {
    id: 'press-banca-plano',
    name: 'Press de Banca Plano',
    muscleGroups: ['Pecho', 'Tríceps', 'Hombros'],
    primaryMuscle: 'Pecho',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif',
    series: 4,
    reps: '8-10',
    rest: '90s',
    difficulty: 'intermedio',
    equipment: ['Barra', 'Banco'],
    tips: ['Espalda arqueada', 'Retracción escapular', 'Codos a 45°'],
  },
  {
    id: 'press-inclinado',
    name: 'Press Inclinado',
    muscleGroups: ['Pecho', 'Hombros'],
    primaryMuscle: 'Pecho',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Barbell-Bench-Press.gif',
    series: 4,
    reps: '10-12',
    rest: '75s',
    difficulty: 'intermedio',
    equipment: ['Mancuernas', 'Banco'],
    tips: ['Inclinación de 30-45°', 'Control en el descenso'],
  },
  {
    id: 'aperturas-mancuernas',
    name: 'Aperturas con Mancuernas',
    muscleGroups: ['Pecho'],
    primaryMuscle: 'Pecho',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Fly.gif',
    series: 3,
    reps: '12-15',
    rest: '60s',
    difficulty: 'principiante',
    equipment: ['Mancuernas', 'Banco'],
    tips: ['Ligera flexión de codos', 'Contracción en el centro'],
  },

  // Back exercises
  {
    id: 'dominadas',
    name: 'Dominadas',
    muscleGroups: ['Espalda', 'Bíceps'],
    primaryMuscle: 'Espalda',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif',
    series: 4,
    reps: '6-10',
    rest: '90s',
    difficulty: 'avanzado',
    equipment: ['Barra de dominadas'],
    tips: ['Retracción escapular', 'Barbilla sobre la barra'],
  },
  {
    id: 'remo-barra',
    name: 'Remo con Barra',
    muscleGroups: ['Espalda', 'Bíceps'],
    primaryMuscle: 'Espalda',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif',
    series: 4,
    reps: '8-12',
    rest: '75s',
    difficulty: 'intermedio',
    equipment: ['Barra'],
    tips: ['Espalda recta', 'Codos pegados al cuerpo'],
  },
  {
    id: 'jalon-polea',
    name: 'Jalón al Pecho',
    muscleGroups: ['Espalda', 'Bíceps'],
    primaryMuscle: 'Espalda',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif',
    series: 4,
    reps: '10-12',
    rest: '60s',
    difficulty: 'principiante',
    equipment: ['Máquinas'],
    tips: ['Agarre ancho', 'Llevar la barra al pecho'],
  },

  // Legs
  {
    id: 'sentadilla-libre',
    name: 'Sentadilla Libre',
    muscleGroups: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
    primaryMuscle: 'Cuádriceps',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif',
    series: 4,
    reps: '8-10',
    rest: '120s',
    difficulty: 'intermedio',
    equipment: ['Barra', 'Rack'],
    tips: ['Rodillas hacia afuera', 'Profundidad paralela o más'],
  },
  {
    id: 'peso-muerto',
    name: 'Peso Muerto Convencional',
    muscleGroups: ['Isquiotibiales', 'Espalda', 'Glúteos'],
    primaryMuscle: 'Isquiotibiales',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Deadlift.gif',
    series: 4,
    reps: '5-8',
    rest: '150s',
    difficulty: 'avanzado',
    equipment: ['Barra'],
    tips: ['Barra pegada al cuerpo', 'Espalda neutral'],
  },
  {
    id: 'prensa-piernas',
    name: 'Prensa de Piernas',
    muscleGroups: ['Cuádriceps', 'Glúteos'],
    primaryMuscle: 'Cuádriceps',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Press.gif',
    series: 4,
    reps: '10-15',
    rest: '90s',
    difficulty: 'principiante',
    equipment: ['Máquinas'],
    tips: ['Pies a la anchura de hombros', 'No bloquear rodillas'],
  },
  {
    id: 'extension-cuadriceps',
    name: 'Extensión de Cuádriceps',
    muscleGroups: ['Cuádriceps'],
    primaryMuscle: 'Cuádriceps',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif',
    series: 3,
    reps: '12-15',
    rest: '60s',
    difficulty: 'principiante',
    equipment: ['Máquinas'],
    tips: ['Contracción en la cima', 'Control en el descenso'],
  },
  {
    id: 'curl-femoral',
    name: 'Curl Femoral',
    muscleGroups: ['Isquiotibiales'],
    primaryMuscle: 'Isquiotibiales',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Leg-Curl.gif',
    series: 3,
    reps: '10-12',
    rest: '60s',
    difficulty: 'principiante',
    equipment: ['Máquinas'],
    tips: ['Caderas pegadas al banco', 'Squeeze en la contracción'],
  },

  // Shoulders
  {
    id: 'press-militar',
    name: 'Press Militar',
    muscleGroups: ['Hombros', 'Tríceps'],
    primaryMuscle: 'Hombros',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Shoulder-Press.gif',
    series: 4,
    reps: '8-10',
    rest: '90s',
    difficulty: 'intermedio',
    equipment: ['Barra'],
    tips: ['Core apretado', 'No arquear espalda'],
  },
  {
    id: 'elevaciones-laterales',
    name: 'Elevaciones Laterales',
    muscleGroups: ['Hombros'],
    primaryMuscle: 'Hombros',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif',
    series: 4,
    reps: '12-15',
    rest: '45s',
    difficulty: 'principiante',
    equipment: ['Mancuernas'],
    tips: ['Ligera inclinación', 'Codos ligeramente flexionados'],
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    muscleGroups: ['Hombros', 'Espalda'],
    primaryMuscle: 'Hombros',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Face-Pull.gif',
    series: 3,
    reps: '15-20',
    rest: '45s',
    difficulty: 'principiante',
    equipment: ['Poleas'],
    tips: ['Codos altos', 'Rotación externa'],
  },

  // Arms
  {
    id: 'curl-biceps-barra',
    name: 'Curl de Bíceps con Barra',
    muscleGroups: ['Bíceps'],
    primaryMuscle: 'Bíceps',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Curl.gif',
    series: 4,
    reps: '10-12',
    rest: '60s',
    difficulty: 'principiante',
    equipment: ['Barra'],
    tips: ['Codos fijos', 'Sin balanceo'],
  },
  {
    id: 'press-frances',
    name: 'Press Francés',
    muscleGroups: ['Tríceps'],
    primaryMuscle: 'Tríceps',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Lying-Triceps-Extension.gif',
    series: 4,
    reps: '10-12',
    rest: '60s',
    difficulty: 'intermedio',
    equipment: ['Barra EZ', 'Banco'],
    tips: ['Codos fijos', 'Bajar hasta la frente'],
  },
  {
    id: 'fondos-triceps',
    name: 'Fondos en Paralelas',
    muscleGroups: ['Tríceps', 'Pecho'],
    primaryMuscle: 'Tríceps',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Triceps-Dip.gif',
    series: 3,
    reps: '8-12',
    rest: '75s',
    difficulty: 'intermedio',
    equipment: ['Paralelas'],
    tips: ['Cuerpo vertical para tríceps', 'Inclinado para pecho'],
  },

  // Core
  {
    id: 'planchas',
    name: 'Plancha Abdominal',
    muscleGroups: ['Core'],
    primaryMuscle: 'Core',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Front-Plank.gif',
    series: 3,
    reps: '30-60s',
    rest: '45s',
    difficulty: 'principiante',
    equipment: ['Solo cuerpo'],
    tips: ['Cuerpo recto', 'Glúteos apretados'],
  },
  {
    id: 'crunch-polea',
    name: 'Crunch en Polea Alta',
    muscleGroups: ['Core'],
    primaryMuscle: 'Core',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Crunch.gif',
    series: 3,
    reps: '15-20',
    rest: '45s',
    difficulty: 'intermedio',
    equipment: ['Poleas'],
    tips: ['Flexión de columna', 'No tirar con brazos'],
  },

  // Glutes
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    muscleGroups: ['Glúteos', 'Isquiotibiales'],
    primaryMuscle: 'Glúteos',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Hip-Thrust.gif',
    series: 4,
    reps: '10-12',
    rest: '90s',
    difficulty: 'intermedio',
    equipment: ['Barra', 'Banco'],
    tips: ['Contracción máxima arriba', 'Barbilla al pecho'],
  },
  {
    id: 'zancadas',
    name: 'Zancadas con Mancuernas',
    muscleGroups: ['Cuádriceps', 'Glúteos'],
    primaryMuscle: 'Glúteos',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Walking-Lunge.gif',
    series: 3,
    reps: '12 cada pierna',
    rest: '60s',
    difficulty: 'principiante',
    equipment: ['Mancuernas'],
    tips: ['Rodilla a 90°', 'Torso erguido'],
  },

  // Calves
  {
    id: 'elevacion-gemelos',
    name: 'Elevación de Gemelos',
    muscleGroups: ['Gemelos'],
    primaryMuscle: 'Gemelos',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Calf-Raise.gif',
    series: 4,
    reps: '15-20',
    rest: '45s',
    difficulty: 'principiante',
    equipment: ['Máquinas'],
    tips: ['Estiramiento completo abajo', 'Pausa arriba'],
  },
];

// Get exercises by muscle group
export const getExercisesByMuscle = (muscle: string): ExerciseCard[] => {
  return exerciseDatabase.filter(ex => 
    ex.muscleGroups.includes(muscle) || ex.primaryMuscle === muscle
  );
};

// Get exercises by difficulty
export const getExercisesByDifficulty = (difficulty: string): ExerciseCard[] => {
  return exerciseDatabase.filter(ex => ex.difficulty === difficulty);
};

// Get exercises by equipment
export const getExercisesByEquipment = (equipment: string[]): ExerciseCard[] => {
  if (equipment.length === 0) return exerciseDatabase;
  return exerciseDatabase.filter(ex => 
    ex.equipment.some(eq => equipment.includes(eq)) || 
    equipment.includes('Solo cuerpo')
  );
};

// Generate a routine based on user profile
export const generateRoutine = (
  goal: string,
  level: string,
  muscleGroups: string[],
  equipment: string[] = [],
  injuries: string[] = []
): ExerciseCard[] => {
  let exercises = exerciseDatabase;

  // Filter by difficulty
  if (level === 'principiante') {
    exercises = exercises.filter(ex => ex.difficulty !== 'avanzado');
  } else if (level === 'avanzado') {
    exercises = exercises.filter(ex => ex.difficulty !== 'principiante');
  }

  // Filter by equipment if specified
  if (equipment.length > 0) {
    exercises = getExercisesByEquipment(equipment);
  }

  // Filter by muscle groups
  if (muscleGroups.length > 0) {
    exercises = exercises.filter(ex => 
      muscleGroups.some(m => ex.muscleGroups.includes(m))
    );
  }

  // Adjust sets/reps based on goal
  return exercises.slice(0, 6).map(ex => {
    let adjustedEx = { ...ex };
    
    switch (goal) {
      case 'fuerza':
        adjustedEx.series = Math.min(ex.series + 1, 5);
        adjustedEx.reps = '4-6';
        adjustedEx.rest = '180s';
        break;
      case 'hipertrofia':
        adjustedEx.reps = '8-12';
        adjustedEx.rest = '90s';
        break;
      case 'resistencia':
        adjustedEx.series = 3;
        adjustedEx.reps = '15-20';
        adjustedEx.rest = '45s';
        break;
      case 'tonificacion':
        adjustedEx.series = 3;
        adjustedEx.reps = '12-15';
        adjustedEx.rest = '60s';
        break;
    }
    
    return adjustedEx;
  });
};
