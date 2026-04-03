
-- Custom microcycles table
CREATE TABLE public.custom_microcycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_microcycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom microcycles" ON public.custom_microcycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom microcycles" ON public.custom_microcycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom microcycles" ON public.custom_microcycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom microcycles" ON public.custom_microcycles FOR DELETE USING (auth.uid() = user_id);

-- Custom microcycle exercises table
CREATE TABLE public.custom_microcycle_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microcycle_id UUID NOT NULL REFERENCES public.custom_microcycles(id) ON DELETE CASCADE,
  exercise_catalog_id UUID NOT NULL REFERENCES public.exercise_catalog(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL DEFAULT 3,
  rep_range_min INTEGER NOT NULL DEFAULT 8,
  rep_range_max INTEGER NOT NULL DEFAULT 12,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_microcycle_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own microcycle exercises" ON public.custom_microcycle_exercises FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.custom_microcycles cm WHERE cm.id = microcycle_id AND cm.user_id = auth.uid()));
CREATE POLICY "Users can insert own microcycle exercises" ON public.custom_microcycle_exercises FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.custom_microcycles cm WHERE cm.id = microcycle_id AND cm.user_id = auth.uid()));
CREATE POLICY "Users can update own microcycle exercises" ON public.custom_microcycle_exercises FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.custom_microcycles cm WHERE cm.id = microcycle_id AND cm.user_id = auth.uid()));
CREATE POLICY "Users can delete own microcycle exercises" ON public.custom_microcycle_exercises FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.custom_microcycles cm WHERE cm.id = microcycle_id AND cm.user_id = auth.uid()));

-- Index for performance
CREATE INDEX idx_custom_microcycle_exercises_microcycle ON public.custom_microcycle_exercises(microcycle_id);
