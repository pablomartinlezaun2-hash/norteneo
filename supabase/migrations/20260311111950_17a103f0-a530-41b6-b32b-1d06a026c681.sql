ALTER TABLE public.coach_messages 
  ADD COLUMN IF NOT EXISTS context_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

COMMENT ON COLUMN public.coach_messages.context_type IS 'Optional context link: training, alert, nutrition, adherence, fatigue, review';
COMMENT ON COLUMN public.coach_messages.metadata IS 'Structured data for reviews or context details. For reviews: {estado, mantener, corregir, proximo_paso}. For future AI summaries.';