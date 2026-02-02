-- Create table for activity completions (swimming, running, etc.)
CREATE TABLE public.activity_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'swimming', 'running'
  activity_name TEXT NOT NULL, -- Name of the specific workout
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own activity completions"
ON public.activity_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity completions"
ON public.activity_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity completions"
ON public.activity_completions
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_activity_completions_user_type ON public.activity_completions(user_id, activity_type);