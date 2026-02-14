
-- Table for detailed cardio session logs (running & swimming)
CREATE TABLE public.cardio_session_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('running', 'swimming')),
  session_name TEXT,
  total_distance_m NUMERIC NOT NULL DEFAULT 0,
  total_duration_seconds INTEGER,
  avg_pace_seconds_per_unit NUMERIC,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for intervals/sets within a session
CREATE TABLE public.cardio_session_intervals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_log_id UUID NOT NULL REFERENCES public.cardio_session_logs(id) ON DELETE CASCADE,
  interval_order INTEGER NOT NULL DEFAULT 0,
  distance_m NUMERIC NOT NULL,
  duration_seconds INTEGER,
  pace_seconds_per_unit NUMERIC,
  pace_unit_m INTEGER NOT NULL DEFAULT 1000,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cardio_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_session_intervals ENABLE ROW LEVEL SECURITY;

-- RLS for cardio_session_logs
CREATE POLICY "Users can view own cardio logs" ON public.cardio_session_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cardio logs" ON public.cardio_session_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cardio logs" ON public.cardio_session_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cardio logs" ON public.cardio_session_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS for intervals (through parent session)
CREATE POLICY "Users can view own intervals" ON public.cardio_session_intervals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cardio_session_logs s WHERE s.id = cardio_session_intervals.session_log_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users can insert own intervals" ON public.cardio_session_intervals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cardio_session_logs s WHERE s.id = cardio_session_intervals.session_log_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users can update own intervals" ON public.cardio_session_intervals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.cardio_session_logs s WHERE s.id = cardio_session_intervals.session_log_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users can delete own intervals" ON public.cardio_session_intervals FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.cardio_session_logs s WHERE s.id = cardio_session_intervals.session_log_id AND s.user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_cardio_logs_user_type ON public.cardio_session_logs(user_id, activity_type);
CREATE INDEX idx_cardio_intervals_session ON public.cardio_session_intervals(session_log_id);
