
-- Add indexes for coach_conversations
CREATE INDEX IF NOT EXISTS idx_coach_conversations_athlete_id ON public.coach_conversations(athlete_id);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_coach_id ON public.coach_conversations(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_last_message_at ON public.coach_conversations(last_message_at DESC);

-- Add indexes for coach_messages
CREATE INDEX IF NOT EXISTS idx_coach_messages_conversation_created ON public.coach_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_coach_messages_athlete_id ON public.coach_messages(athlete_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_coach_id ON public.coach_messages(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_read_at ON public.coach_messages(read_at);

-- Add unique constraint to prevent duplicate conversations
ALTER TABLE public.coach_conversations ADD CONSTRAINT unique_coach_athlete_conversation UNIQUE (coach_id, athlete_id);
