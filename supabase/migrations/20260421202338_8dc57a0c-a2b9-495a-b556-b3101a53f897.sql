-- ============================================================
-- COACH MULTICHANNEL ARCHITECTURE — Phase 4 prep
-- Order: create both tables → indexes → triggers → RLS → policies → helpers
-- ============================================================

-- 1) ASSETS table
CREATE TABLE public.coach_message_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intervention_event_id uuid REFERENCES public.coach_intervention_events(id) ON DELETE SET NULL,
  kind text NOT NULL,
  body_text text,
  storage_bucket text,
  storage_path text,
  duration_seconds numeric,
  voice_id text,
  avatar_id text,
  generation_status text NOT NULL DEFAULT 'ready',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) DELIVERIES table
CREATE TABLE public.coach_message_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id uuid NOT NULL REFERENCES public.coach_message_assets(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intervention_event_id uuid REFERENCES public.coach_intervention_events(id) ON DELETE SET NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  coach_message_id uuid REFERENCES public.coach_messages(id) ON DELETE SET NULL,
  coach_audio_message_id uuid REFERENCES public.coach_audio_messages(id) ON DELETE SET NULL,
  external_provider text,
  external_message_id text,
  external_payload jsonb DEFAULT '{}'::jsonb,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Indexes
CREATE INDEX idx_coach_message_assets_coach ON public.coach_message_assets(coach_id);
CREATE INDEX idx_coach_message_assets_athlete ON public.coach_message_assets(athlete_id);
CREATE INDEX idx_coach_message_assets_event ON public.coach_message_assets(intervention_event_id);
CREATE INDEX idx_coach_message_assets_kind ON public.coach_message_assets(kind);

CREATE INDEX idx_coach_deliveries_asset ON public.coach_message_deliveries(asset_id);
CREATE INDEX idx_coach_deliveries_coach ON public.coach_message_deliveries(coach_id);
CREATE INDEX idx_coach_deliveries_athlete ON public.coach_message_deliveries(athlete_id);
CREATE INDEX idx_coach_deliveries_channel_status ON public.coach_message_deliveries(channel, status);
CREATE INDEX idx_coach_deliveries_pending_external
  ON public.coach_message_deliveries(channel, status)
  WHERE channel LIKE 'whatsapp_%' AND status IN ('queued','sending','failed');

-- 4) Validation triggers
CREATE OR REPLACE FUNCTION public.validate_coach_message_asset()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.kind NOT IN ('text','audio','video') THEN
    RAISE EXCEPTION 'Invalid asset kind: %. Must be text|audio|video', NEW.kind;
  END IF;
  IF NEW.generation_status NOT IN ('pending','generating','ready','failed') THEN
    RAISE EXCEPTION 'Invalid generation_status: %', NEW.generation_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_coach_message_asset
BEFORE INSERT OR UPDATE ON public.coach_message_assets
FOR EACH ROW EXECUTE FUNCTION public.validate_coach_message_asset();

CREATE TRIGGER trg_coach_message_assets_updated_at
BEFORE UPDATE ON public.coach_message_assets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_coach_message_delivery()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.channel NOT IN (
    'in_app_message','in_app_audio','in_app_video',
    'whatsapp_text','whatsapp_audio','whatsapp_video'
  ) THEN
    RAISE EXCEPTION 'Invalid channel: %', NEW.channel;
  END IF;
  IF NEW.status NOT IN ('queued','sending','sent','delivered','read','failed') THEN
    RAISE EXCEPTION 'Invalid delivery status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_coach_message_delivery
BEFORE INSERT OR UPDATE ON public.coach_message_deliveries
FOR EACH ROW EXECUTE FUNCTION public.validate_coach_message_delivery();

CREATE TRIGGER trg_coach_message_deliveries_updated_at
BEFORE UPDATE ON public.coach_message_deliveries
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5) Enable RLS
ALTER TABLE public.coach_message_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_message_deliveries ENABLE ROW LEVEL SECURITY;

-- 6) Policies — assets
CREATE POLICY "Coach selects own assets"
  ON public.coach_message_assets FOR SELECT TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Coach inserts own assets"
  ON public.coach_message_assets FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = public.get_profile_id(auth.uid())
    AND public.is_coach_of(auth.uid(), athlete_id)
  );

CREATE POLICY "Coach updates own assets"
  ON public.coach_message_assets FOR UPDATE TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Coach deletes own assets"
  ON public.coach_message_assets FOR DELETE TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Athlete reads own delivered assets"
  ON public.coach_message_assets FOR SELECT TO authenticated
  USING (
    athlete_id = public.get_profile_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.coach_message_deliveries d
      WHERE d.asset_id = coach_message_assets.id
        AND d.athlete_id = public.get_profile_id(auth.uid())
        AND d.status IN ('sent','delivered','read')
    )
  );

-- 7) Policies — deliveries
CREATE POLICY "Coach selects own deliveries"
  ON public.coach_message_deliveries FOR SELECT TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Coach inserts own deliveries"
  ON public.coach_message_deliveries FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = public.get_profile_id(auth.uid())
    AND public.is_coach_of(auth.uid(), athlete_id)
  );

CREATE POLICY "Coach updates own deliveries"
  ON public.coach_message_deliveries FOR UPDATE TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Coach deletes own deliveries"
  ON public.coach_message_deliveries FOR DELETE TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Athlete reads own delivered messages"
  ON public.coach_message_deliveries FOR SELECT TO authenticated
  USING (
    athlete_id = public.get_profile_id(auth.uid())
    AND status IN ('sent','delivered','read')
  );

CREATE POLICY "Athlete updates own read state"
  ON public.coach_message_deliveries FOR UPDATE TO authenticated
  USING (
    athlete_id = public.get_profile_id(auth.uid())
    AND status IN ('sent','delivered','read')
  );

-- 8) Backwards-compat: optional asset link on existing tables
ALTER TABLE public.coach_messages
  ADD COLUMN asset_id uuid REFERENCES public.coach_message_assets(id) ON DELETE SET NULL;

ALTER TABLE public.coach_audio_messages
  ADD COLUMN asset_id uuid REFERENCES public.coach_message_assets(id) ON DELETE SET NULL;

CREATE INDEX idx_coach_messages_asset_id ON public.coach_messages(asset_id);
CREATE INDEX idx_coach_audio_messages_asset_id ON public.coach_audio_messages(asset_id);

-- 9) Helper: pending external deliveries (for future WhatsApp worker)
CREATE OR REPLACE FUNCTION public.get_pending_external_deliveries(_limit integer DEFAULT 50)
RETURNS TABLE (
  delivery_id uuid,
  asset_id uuid,
  channel text,
  status text,
  athlete_id uuid,
  coach_id uuid,
  retry_count integer,
  scheduled_at timestamptz,
  asset_kind text,
  asset_body_text text,
  asset_storage_bucket text,
  asset_storage_path text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id, d.asset_id, d.channel, d.status,
    d.athlete_id, d.coach_id, d.retry_count, d.scheduled_at,
    a.kind, a.body_text, a.storage_bucket, a.storage_path
  FROM public.coach_message_deliveries d
  JOIN public.coach_message_assets a ON a.id = d.asset_id
  WHERE d.channel LIKE 'whatsapp_%'
    AND d.status IN ('queued','failed')
    AND (d.scheduled_at IS NULL OR d.scheduled_at <= now())
    AND d.retry_count < 5
  ORDER BY d.created_at ASC
  LIMIT _limit;
$$;