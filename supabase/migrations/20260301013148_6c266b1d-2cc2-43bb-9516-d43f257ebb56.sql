
-- Mesocycles table
CREATE TABLE public.mesocycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  mesocycle_number INTEGER NOT NULL DEFAULT 1,
  total_microcycles INTEGER NOT NULL DEFAULT 4,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mesocycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mesocycles" ON public.mesocycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mesocycles" ON public.mesocycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mesocycles" ON public.mesocycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mesocycles" ON public.mesocycles FOR DELETE USING (auth.uid() = user_id);

-- Microcycles table
CREATE TABLE public.microcycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mesocycle_id UUID NOT NULL REFERENCES public.mesocycles(id) ON DELETE CASCADE,
  microcycle_number INTEGER NOT NULL DEFAULT 1,
  duration_weeks INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.microcycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own microcycles" ON public.microcycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own microcycles" ON public.microcycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own microcycles" ON public.microcycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own microcycles" ON public.microcycles FOR DELETE USING (auth.uid() = user_id);

-- Link completed_sessions to microcycle (optional FK)
ALTER TABLE public.completed_sessions ADD COLUMN microcycle_id UUID REFERENCES public.microcycles(id) ON DELETE SET NULL;

-- Triggers for updated_at
CREATE TRIGGER update_mesocycles_updated_at BEFORE UPDATE ON public.mesocycles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_microcycles_updated_at BEFORE UPDATE ON public.microcycles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
