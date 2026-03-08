
CREATE TABLE public.sleep_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bedtime TIME,
  wake_time TIME,
  total_hours NUMERIC,
  quality INTEGER CHECK (quality >= 1 AND quality <= 5),
  deep_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  awakenings INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_date)
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep logs" ON public.sleep_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sleep logs" ON public.sleep_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sleep logs" ON public.sleep_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sleep logs" ON public.sleep_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
