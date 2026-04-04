
-- Mesocycles table
CREATE TABLE public.planning_mesocycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  microcycle_count INTEGER NOT NULL DEFAULT 4,
  goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_mesocycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planning mesocycles" ON public.planning_mesocycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own planning mesocycles" ON public.planning_mesocycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own planning mesocycles" ON public.planning_mesocycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own planning mesocycles" ON public.planning_mesocycles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_planning_mesocycles_updated_at
  BEFORE UPDATE ON public.planning_mesocycles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Microcycles table
CREATE TABLE public.planning_microcycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mesocycle_id UUID NOT NULL REFERENCES public.planning_mesocycles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_microcycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planning microcycles" ON public.planning_microcycles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.planning_mesocycles m WHERE m.id = planning_microcycles.mesocycle_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can insert own planning microcycles" ON public.planning_microcycles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.planning_mesocycles m WHERE m.id = planning_microcycles.mesocycle_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can update own planning microcycles" ON public.planning_microcycles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.planning_mesocycles m WHERE m.id = planning_microcycles.mesocycle_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can delete own planning microcycles" ON public.planning_microcycles FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.planning_mesocycles m WHERE m.id = planning_microcycles.mesocycle_id AND m.user_id = auth.uid()));

-- Sessions table
CREATE TABLE public.planning_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microcycle_id UUID NOT NULL REFERENCES public.planning_microcycles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planning sessions" ON public.planning_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.planning_microcycles mc JOIN public.planning_mesocycles m ON m.id = mc.mesocycle_id WHERE mc.id = planning_sessions.microcycle_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can insert own planning sessions" ON public.planning_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.planning_microcycles mc JOIN public.planning_mesocycles m ON m.id = mc.mesocycle_id WHERE mc.id = planning_sessions.microcycle_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can update own planning sessions" ON public.planning_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.planning_microcycles mc JOIN public.planning_mesocycles m ON m.id = mc.mesocycle_id WHERE mc.id = planning_sessions.microcycle_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can delete own planning sessions" ON public.planning_sessions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.planning_microcycles mc JOIN public.planning_mesocycles m ON m.id = mc.mesocycle_id WHERE mc.id = planning_sessions.microcycle_id AND m.user_id = auth.uid()));

-- Session exercises table
CREATE TABLE public.planning_session_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.planning_sessions(id) ON DELETE CASCADE,
  exercise_catalog_id UUID NOT NULL REFERENCES public.exercise_catalog(id),
  sets INTEGER NOT NULL DEFAULT 3,
  rep_range_min INTEGER NOT NULL DEFAULT 8,
  rep_range_max INTEGER NOT NULL DEFAULT 12,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_session_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planning session exercises" ON public.planning_session_exercises FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.planning_sessions s JOIN public.planning_microcycles mc ON mc.id = s.microcycle_id JOIN public.planning_mesocycles m ON m.id = mc.mesocycle_id WHERE s.id = planning_session_exercises.session_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can insert own planning session exercises" ON public.planning_session_exercises FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.planning_sessions s JOIN public.planning_microcycles mc ON mc.id = s.microcycle_id JOIN public.planning_mesocycles m ON m.id = mc.mesocycle_id WHERE s.id = planning_session_exercises.session_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can update own planning session exercises" ON public.planning_session_exercises FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.planning_sessions s JOIN public.planning_microcycles mc ON mc.id = s.microcycle_id JOIN public.planning_mesocycles m ON m.id = mc.mesocycle_id WHERE s.id = planning_session_exercises.session_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can delete own planning session exercises" ON public.planning_session_exercises FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.planning_sessions s JOIN public.planning_microcycles mc ON mc.id = s.microcycle_id JOIN public.planning_mesocycles m ON m.id = mc.mesocycle_id WHERE s.id = planning_session_exercises.session_id AND m.user_id = auth.uid()));
