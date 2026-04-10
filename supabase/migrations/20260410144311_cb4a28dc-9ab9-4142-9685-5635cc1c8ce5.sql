
-- Add deviation_reason to set_logs
ALTER TABLE public.set_logs ADD COLUMN IF NOT EXISTS deviation_reason TEXT;

-- Validation trigger for deviation_reason
CREATE OR REPLACE FUNCTION public.validate_set_log_deviation_reason()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deviation_reason IS NOT NULL AND NEW.deviation_reason NOT IN (
    'REGISTER_ERROR', 'DID_NOT_FEEL_WELL', 'PAIN_OR_DISCOMFORT',
    'PREFERRED_NOT_TO_PUSH', 'TECHNIQUE_UNSTABLE', 'OTHER'
  ) THEN
    RAISE EXCEPTION 'Invalid deviation_reason: %', NEW.deviation_reason;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_set_log_deviation_reason_trigger
BEFORE INSERT OR UPDATE ON public.set_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_set_log_deviation_reason();
