ALTER TABLE public.coach_conversations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'stable';

CREATE OR REPLACE FUNCTION public.validate_conversation_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('stable', 'review_today', 'waiting_response', 'action_pending', 'followup_1on1') THEN
    RAISE EXCEPTION 'Invalid conversation status: %. Must be stable, review_today, waiting_response, action_pending, or followup_1on1', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_conversation_status
BEFORE INSERT OR UPDATE ON public.coach_conversations
FOR EACH ROW EXECUTE FUNCTION public.validate_conversation_status();