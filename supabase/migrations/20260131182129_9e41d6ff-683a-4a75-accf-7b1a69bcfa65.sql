-- ========================================
-- SISTEMA DE ENTRENAMIENTO - SCHEMA COMPLETO
-- ========================================

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Programas de entrenamiento (cada usuario puede tener uno o más)
CREATE TABLE public.training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sesiones de entrenamiento (Push, Pull, Legs, etc.)
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ejercicios dentro de cada sesión
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  series INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL,
  approach_sets TEXT,
  rest TEXT,
  technique TEXT,
  execution TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notas de usuario por ejercicio
CREATE TABLE public.exercise_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

-- Registros de series (el corazón del tracking)
CREATE TABLE public.set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number >= 1 AND set_number <= 4),
  weight DECIMAL(6,2) NOT NULL,
  reps INTEGER NOT NULL,
  partial_reps INTEGER DEFAULT 0,
  rir INTEGER CHECK (rir >= 0 AND rir <= 5),
  is_warmup BOOLEAN DEFAULT false,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sesiones completadas (para tracking de ciclos)
CREATE TABLE public.completed_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_set_logs_user_exercise ON public.set_logs(user_id, exercise_id);
CREATE INDEX idx_set_logs_logged_at ON public.set_logs(logged_at DESC);
CREATE INDEX idx_completed_sessions_user ON public.completed_sessions(user_id, completed_at DESC);
CREATE INDEX idx_exercises_session ON public.exercises(session_id, order_index);
CREATE INDEX idx_workout_sessions_program ON public.workout_sessions(program_id, order_index);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_exercise_notes_updated_at
  BEFORE UPDATE ON public.exercise_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para training_programs
CREATE POLICY "Users can view own programs"
  ON public.training_programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own programs"
  ON public.training_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own programs"
  ON public.training_programs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own programs"
  ON public.training_programs FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para workout_sessions (via program ownership)
CREATE POLICY "Users can view sessions of own programs"
  ON public.workout_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.training_programs tp 
    WHERE tp.id = program_id AND tp.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sessions to own programs"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.training_programs tp 
    WHERE tp.id = program_id AND tp.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sessions of own programs"
  ON public.workout_sessions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.training_programs tp 
    WHERE tp.id = program_id AND tp.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sessions of own programs"
  ON public.workout_sessions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.training_programs tp 
    WHERE tp.id = program_id AND tp.user_id = auth.uid()
  ));

-- Políticas para exercises (via session -> program ownership)
CREATE POLICY "Users can view exercises of own sessions"
  ON public.exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    JOIN public.training_programs tp ON tp.id = ws.program_id
    WHERE ws.id = session_id AND tp.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert exercises to own sessions"
  ON public.exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    JOIN public.training_programs tp ON tp.id = ws.program_id
    WHERE ws.id = session_id AND tp.user_id = auth.uid()
  ));

CREATE POLICY "Users can update exercises of own sessions"
  ON public.exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    JOIN public.training_programs tp ON tp.id = ws.program_id
    WHERE ws.id = session_id AND tp.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete exercises of own sessions"
  ON public.exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    JOIN public.training_programs tp ON tp.id = ws.program_id
    WHERE ws.id = session_id AND tp.user_id = auth.uid()
  ));

-- Políticas para exercise_notes
CREATE POLICY "Users can view own exercise notes"
  ON public.exercise_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise notes"
  ON public.exercise_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise notes"
  ON public.exercise_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise notes"
  ON public.exercise_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para set_logs
CREATE POLICY "Users can view own set logs"
  ON public.set_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own set logs"
  ON public.set_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own set logs"
  ON public.set_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own set logs"
  ON public.set_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para completed_sessions
CREATE POLICY "Users can view own completed sessions"
  ON public.completed_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completed sessions"
  ON public.completed_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completed sessions"
  ON public.completed_sessions FOR DELETE
  USING (auth.uid() = user_id);