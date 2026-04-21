-- Coach Intervention Events: registra eventos detectados por NEO que pueden
-- convertirse en mensajes del coach. Sirve como historial auditable y traza
-- entre evento → mensaje enviado.

CREATE TABLE IF NOT EXISTS public.coach_intervention_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,           -- reps_out_of_range | missing_set | load_drop | performance_drop | low_sleep | high_fatigue | low_protein | calorie_off_target | low_adherence | progress_milestone
  severity text NOT NULL DEFAULT 'medium',  -- low | medium | high
  summary text NOT NULL,              -- resumen interno corto (lo que ve el coach)
  metadata jsonb DEFAULT '{}'::jsonb, -- payload con valores concretos del evento
  source_alert_id uuid,               -- referencia opcional a performance_alerts/coach_performance_alerts
  source_table text,                  -- 'performance_alerts' | 'coach_performance_alerts' | 'derived'
  status text NOT NULL DEFAULT 'pending',   -- pending | drafted | sent | dismissed
  generated_message text,             -- mensaje generado/editable
  sent_message_id uuid,               -- referencia a coach_messages cuando se envía
  sent_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intervention_events_coach ON public.coach_intervention_events(coach_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intervention_events_athlete ON public.coach_intervention_events(athlete_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_intervention_event_source
  ON public.coach_intervention_events(coach_id, athlete_id, event_type, source_alert_id)
  WHERE source_alert_id IS NOT NULL;

-- RLS
ALTER TABLE public.coach_intervention_events ENABLE ROW LEVEL SECURITY;

-- Coach sees & manages events for their athletes
CREATE POLICY "Coach selects own intervention events"
  ON public.coach_intervention_events
  FOR SELECT
  TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Coach inserts own intervention events"
  ON public.coach_intervention_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coach_id = public.get_profile_id(auth.uid())
    AND public.is_coach_of(auth.uid(), athlete_id)
  );

CREATE POLICY "Coach updates own intervention events"
  ON public.coach_intervention_events
  FOR UPDATE
  TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Coach deletes own intervention events"
  ON public.coach_intervention_events
  FOR DELETE
  TO authenticated
  USING (coach_id = public.get_profile_id(auth.uid()));

-- Athlete can see events about themselves (read-only, transparency)
CREATE POLICY "Athlete reads own intervention events"
  ON public.coach_intervention_events
  FOR SELECT
  TO authenticated
  USING (athlete_id = public.get_profile_id(auth.uid()));

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_intervention_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.severity NOT IN ('low','medium','high') THEN
    RAISE EXCEPTION 'Invalid severity: %. Must be low|medium|high', NEW.severity;
  END IF;
  IF NEW.status NOT IN ('pending','drafted','sent','dismissed') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be pending|drafted|sent|dismissed', NEW.status;
  END IF;
  IF NEW.event_type NOT IN (
    'reps_out_of_range','missing_set','load_drop','performance_drop',
    'low_sleep','high_fatigue','low_protein','calorie_off_target',
    'low_adherence','progress_milestone'
  ) THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_intervention_event
  BEFORE INSERT OR UPDATE ON public.coach_intervention_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_intervention_event();

CREATE TRIGGER trg_intervention_event_updated_at
  BEFORE UPDATE ON public.coach_intervention_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Allow context_type='intervention' on coach_messages (nothing to alter — column is free text)
COMMENT ON COLUMN public.coach_messages.context_type IS
  'training | alert | nutrition | adherence | fatigue | review | intervention';