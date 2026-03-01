
-- Add fatigue_score to completed_sessions
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS fatigue_score NUMERIC DEFAULT NULL;

-- Add metrics columns to microcycles
ALTER TABLE public.microcycles ADD COLUMN IF NOT EXISTS fatigue_index NUMERIC DEFAULT NULL;
ALTER TABLE public.microcycles ADD COLUMN IF NOT EXISTS performance_trend NUMERIC DEFAULT NULL;
ALTER TABLE public.microcycles ADD COLUMN IF NOT EXISTS recommendation TEXT DEFAULT 'optimal';
