
-- 1. Drop the overly permissive SELECT policy
DROP POLICY "Users can view own profile or coach views assigned" ON public.profiles;

-- 2. Create a policy that only allows users to view their OWN full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Create a security-definer function for coaches to read only non-sensitive athlete fields
CREATE OR REPLACE FUNCTION public.get_coach_athlete_profiles(_coach_auth_uid uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  full_name text,
  avatar_url text,
  age integer,
  main_goal text,
  disciplines text[],
  years_training text,
  role text,
  coach_id uuid,
  active_model text,
  vb2_enabled boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.display_name, p.full_name, p.avatar_url,
    p.age, p.main_goal, p.disciplines, p.years_training,
    p.role, p.coach_id, p.active_model, p.vb2_enabled,
    p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.coach_id = (SELECT pp.id FROM public.profiles pp WHERE pp.user_id = _coach_auth_uid LIMIT 1);
$$;

-- 4. Drop the UPDATE policy and recreate with column restriction on role and coach_id
DROP POLICY "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Create a trigger to prevent users from changing their own role or coach_id
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Prevent changing role unless it matches old value
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  -- Prevent changing coach_id
  IF NEW.coach_id IS DISTINCT FROM OLD.coach_id THEN
    RAISE EXCEPTION 'Cannot change your own coach assignment';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_escalation();
