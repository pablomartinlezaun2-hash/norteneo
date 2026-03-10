
-- Fix search_path on validation trigger functions
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS NOT NULL AND NEW.role NOT IN ('athlete', 'coach') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be athlete or coach', NEW.role;
  END IF;
  IF NEW.active_model IS NOT NULL AND NEW.active_model NOT IN ('VB1', 'VB2') THEN
    RAISE EXCEPTION 'Invalid active_model: %. Must be VB1 or VB2', NEW.active_model;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_coach_note_priority()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.priority IS NOT NULL AND NEW.priority NOT IN ('high', 'review', 'stable', 'one_to_one') THEN
    RAISE EXCEPTION 'Invalid priority: %. Must be high, review, stable, or one_to_one', NEW.priority;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_coach_alert_severity()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.severity IS NOT NULL AND NEW.severity NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'Invalid severity: %. Must be low, medium, or high', NEW.severity;
  END IF;
  RETURN NEW;
END;
$$;
