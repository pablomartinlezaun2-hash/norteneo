
-- 1. Create coach_conversations table
CREATE TABLE public.coach_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,
  last_message_preview text,
  UNIQUE(athlete_id, coach_id)
);

-- 2. Create coach_messages table
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  is_system_message boolean NOT NULL DEFAULT false
);

-- 3. Validation trigger for sender_role
CREATE OR REPLACE FUNCTION public.validate_message_sender_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.sender_role NOT IN ('coach', 'athlete') THEN
    RAISE EXCEPTION 'Invalid sender_role: %. Must be coach or athlete', NEW.sender_role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_message_sender_role
  BEFORE INSERT OR UPDATE ON public.coach_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_message_sender_role();

-- 4. Indexes
CREATE INDEX idx_coach_conversations_athlete ON public.coach_conversations(athlete_id);
CREATE INDEX idx_coach_conversations_coach ON public.coach_conversations(coach_id);
CREATE INDEX idx_coach_conversations_last_msg ON public.coach_conversations(last_message_at DESC);
CREATE INDEX idx_coach_messages_conv_created ON public.coach_messages(conversation_id, created_at ASC);
CREATE INDEX idx_coach_messages_athlete ON public.coach_messages(athlete_id);
CREATE INDEX idx_coach_messages_coach ON public.coach_messages(coach_id);
CREATE INDEX idx_coach_messages_read ON public.coach_messages(read_at);

-- 5. Enable RLS
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for coach_conversations
CREATE POLICY "Select own conversations"
  ON public.coach_conversations FOR SELECT TO authenticated
  USING (
    coach_id = get_profile_id(auth.uid())
    OR athlete_id = get_profile_id(auth.uid())
  );

CREATE POLICY "Insert own conversations"
  ON public.coach_conversations FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = get_profile_id(auth.uid())
    OR athlete_id = get_profile_id(auth.uid())
  );

CREATE POLICY "Update own conversations"
  ON public.coach_conversations FOR UPDATE TO authenticated
  USING (
    coach_id = get_profile_id(auth.uid())
    OR athlete_id = get_profile_id(auth.uid())
  );

-- 7. RLS policies for coach_messages
CREATE POLICY "Select own messages"
  ON public.coach_messages FOR SELECT TO authenticated
  USING (
    coach_id = get_profile_id(auth.uid())
    OR athlete_id = get_profile_id(auth.uid())
  );

CREATE POLICY "Insert own messages"
  ON public.coach_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = get_profile_id(auth.uid())
    AND (
      coach_id = get_profile_id(auth.uid())
      OR athlete_id = get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Update own messages"
  ON public.coach_messages FOR UPDATE TO authenticated
  USING (
    coach_id = get_profile_id(auth.uid())
    OR athlete_id = get_profile_id(auth.uid())
  );

-- 8. Enable realtime for coach_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_messages;
