CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent changing role unless it matches old value
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  -- Prevent changing coach_id only if it was already set (not null -> different value)
  IF OLD.coach_id IS NOT NULL AND NEW.coach_id IS DISTINCT FROM OLD.coach_id THEN
    RAISE EXCEPTION 'Cannot change your own coach assignment';
  END IF;
  RETURN NEW;
END;
$function$;