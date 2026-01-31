// Database types for the workout app
export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgram {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  program_id: string;
  name: string;
  short_name: string;
  order_index: number;
  created_at: string;
}

export interface Exercise {
  id: string;
  session_id: string;
  name: string;
  series: number;
  reps: string;
  approach_sets: string | null;
  rest: string | null;
  technique: string | null;
  execution: string | null;
  video_url: string | null;
  order_index: number;
  created_at: string;
}

export interface ExerciseNote {
  id: string;
  user_id: string;
  exercise_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface SetLog {
  id: string;
  user_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  partial_reps: number;
  rir: number | null;
  is_warmup: boolean;
  logged_at: string;
  created_at: string;
}

export interface CompletedSession {
  id: string;
  user_id: string;
  session_id: string;
  completed_at: string;
}

// Extended types with relations
export interface ExerciseWithLogs extends Exercise {
  setLogs: SetLog[];
  note: ExerciseNote | null;
  lastSets: { [setNumber: number]: SetLog | null };
  bestWeight: { [setNumber: number]: number };
}

export interface WorkoutSessionWithExercises extends WorkoutSession {
  exercises: ExerciseWithLogs[];
}

export interface TrainingProgramWithSessions extends TrainingProgram {
  sessions: WorkoutSessionWithExercises[];
}
