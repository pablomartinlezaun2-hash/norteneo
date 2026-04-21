-- Tabla para auditar la generación de audios del coach.
-- Cada audio queda enlazado a su evento de intervención y al mensaje de chat
-- en el que se entrega al atleta (cuando se envía).

CREATE TABLE IF NOT EXISTS public.coach_audio_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intervention_event_id uuid REFERENCES public.coach_intervention_events(id) ON DELETE SET NULL,
  coach_message_id uuid,                         -- FK lógica a coach_messages cuando se envía
  voice_id text NOT NULL,                        -- ElevenLabs voice id
  model_id text NOT NULL DEFAULT 'eleven_multilingual_v2',
  script text NOT NULL,                          -- script optimizado para voz
  storage_path text,                             -- ruta dentro del bucket privado
  duration_seconds numeric,                      -- duración estimada (calculada en cliente)
  status text NOT NULL DEFAULT 'pending',        -- pending | generating | ready | sent | failed
  error_message text,
  listened_at timestamptz,                       -- cuando el atleta lo escuchó por primera vez
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_audio_coach ON public.coach_audio_messages(coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_audio_athlete ON public.coach_audio_messages(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_audio_event ON public.coach_audio_messages(intervention_event_id);

ALTER TABLE public.coach_audio_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach selects own audio messages"
  ON public.coach_audio_messages FOR SELECT TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Coach inserts own audio messages"
  ON public.coach_audio_messages FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = public.get_profile_id(auth.uid())
    AND public.is_coach_of(auth.uid(), athlete_id)
  );

CREATE POLICY "Coach updates own audio messages"
  ON public.coach_audio_messages FOR UPDATE TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Coach deletes own audio messages"
  ON public.coach_audio_messages FOR DELETE TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

-- Atleta puede ver los audios que le han sido enviados (estado sent o ready vinculado)
CREATE POLICY "Athlete reads own delivered audio messages"
  ON public.coach_audio_messages FOR SELECT TO authenticated
  USING (
    athlete_id = public.get_profile_id(auth.uid())
    AND sent_at IS NOT NULL
  );

-- Atleta puede marcar como escuchado
CREATE POLICY "Athlete updates listened state"
  ON public.coach_audio_messages FOR UPDATE TO authenticated
  USING (
    athlete_id = public.get_profile_id(auth.uid())
    AND sent_at IS NOT NULL
  );

-- Validación de status
CREATE OR REPLACE FUNCTION public.validate_coach_audio_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','generating','ready','sent','failed') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be pending|generating|ready|sent|failed', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_coach_audio_message
  BEFORE INSERT OR UPDATE ON public.coach_audio_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_coach_audio_message();

CREATE TRIGGER trg_coach_audio_message_updated_at
  BEFORE UPDATE ON public.coach_audio_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Bucket privado para los audios ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-audio-messages', 'coach-audio-messages', false)
ON CONFLICT (id) DO NOTHING;

-- RLS sobre storage.objects: el coach gestiona sus audios y el atleta solo lee los suyos.
-- Convención de path: {coach_id}/{athlete_id}/{audio_id}.mp3

CREATE POLICY "Coach reads own audio files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'coach-audio-messages'
    AND (storage.foldername(name))[1] = public.get_profile_id(auth.uid())::text
  );

CREATE POLICY "Coach uploads own audio files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'coach-audio-messages'
    AND (storage.foldername(name))[1] = public.get_profile_id(auth.uid())::text
  );

CREATE POLICY "Coach updates own audio files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'coach-audio-messages'
    AND (storage.foldername(name))[1] = public.get_profile_id(auth.uid())::text
  );

CREATE POLICY "Coach deletes own audio files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'coach-audio-messages'
    AND (storage.foldername(name))[1] = public.get_profile_id(auth.uid())::text
  );

-- Atleta puede leer los audios cuyo segundo segmento del path coincide con su perfil
CREATE POLICY "Athlete reads own delivered audio files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'coach-audio-messages'
    AND (storage.foldername(name))[2] = public.get_profile_id(auth.uid())::text
  );