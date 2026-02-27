
-- Add computed fields to set_logs
ALTER TABLE public.set_logs ADD COLUMN IF NOT EXISTS est_1rm_set numeric;
ALTER TABLE public.set_logs ADD COLUMN IF NOT EXISTS iem_set numeric;

-- Session exercise summary (aggregated per session per exercise)
CREATE TABLE IF NOT EXISTS public.session_exercise_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_date date NOT NULL,
  exercise_id uuid NOT NULL,
  session_est_1rm numeric NOT NULL DEFAULT 0,
  session_iem numeric NOT NULL DEFAULT 0,
  baseline numeric,
  pct_change numeric,
  adjusted_pct numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.session_exercise_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries" ON public.session_exercise_summary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON public.session_exercise_summary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summaries" ON public.session_exercise_summary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own summaries" ON public.session_exercise_summary FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_session_exercise_summary_user_exercise ON public.session_exercise_summary (user_id, exercise_id, session_date);

-- Muscle load logs (per session, per muscle, from any modality)
CREATE TABLE IF NOT EXISTS public.muscle_load_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  muscle_id uuid NOT NULL REFERENCES public.muscle_groups(id),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  load_amount numeric NOT NULL DEFAULT 0,
  source_modality text NOT NULL DEFAULT 'strength',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.muscle_load_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own muscle loads" ON public.muscle_load_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own muscle loads" ON public.muscle_load_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own muscle loads" ON public.muscle_load_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own muscle loads" ON public.muscle_load_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_muscle_load_logs_user_muscle ON public.muscle_load_logs (user_id, muscle_id, session_date);

-- Muscle fatigue states (current snapshot per muscle per user)
CREATE TABLE IF NOT EXISTS public.muscle_fatigue_states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  muscle_id uuid NOT NULL REFERENCES public.muscle_groups(id),
  current_fatigue_value numeric NOT NULL DEFAULT 0,
  last_updated_at timestamp with time zone NOT NULL DEFAULT now(),
  hours_remaining_estimate numeric DEFAULT 0,
  UNIQUE(user_id, muscle_id)
);

ALTER TABLE public.muscle_fatigue_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fatigue" ON public.muscle_fatigue_states FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fatigue" ON public.muscle_fatigue_states FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fatigue" ON public.muscle_fatigue_states FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fatigue" ON public.muscle_fatigue_states FOR DELETE USING (auth.uid() = user_id);

-- Performance alerts
CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_flag boolean NOT NULL DEFAULT false
);

ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.performance_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.performance_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.performance_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.performance_alerts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_user ON public.performance_alerts (user_id, created_at DESC);
