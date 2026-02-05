// User profile for personalized recommendations
export interface UserProfile {
  level: 'principiante' | 'intermedio' | 'avanzado' | null;
  goal: 'fuerza' | 'hipertrofia' | 'resistencia' | 'tonificacion' | null;
  sex: 'hombre' | 'mujer' | null;
  age?: number;
  weight?: number;
  height?: number;
  injuries?: string[];
  limitations?: string[];
  allergies?: string[];
  equipment?: string[];
  daysPerWeek?: number;
}

// Exercise card data
export interface ExerciseCard {
  id: string;
  name: string;
  muscleGroups: string[];
  primaryMuscle: string;
  gifUrl?: string;
  series: number;
  reps: string;
  rest: string;
  duration?: string;
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
  equipment: string[];
  tips?: string[];
}

// Workout routine
export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: ExerciseCard[];
  estimatedDuration: number;
  musclesFocused: string[];
}

// Chat message types
export type MessageType = 
  | 'text'
  | 'level-select'
  | 'goal-select'
  | 'sex-select'
  | 'optional-data'
  | 'exercise-cards'
  | 'routine-summary'
  | 'muscle-highlight'
  | 'progress-update'
  | 'quick-actions';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content?: string;
  data?: any;
  timestamp: Date;
  isUser?: boolean;
}

// Progress tracking
export interface WeeklyProgress {
  day: string;
  completed: boolean;
  workoutType?: string;
}

export interface MuscleHeatMap {
  muscle: string;
  intensity: number; // 0-100
  lastWorked?: Date;
}

// Gamification
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface UserStats {
  streak: number;
  totalWorkouts: number;
  totalMinutes: number;
  achievements: Achievement[];
}
