
DROP FUNCTION IF EXISTS public.get_coach_athlete_profiles(uuid);

CREATE OR REPLACE FUNCTION public.get_coach_athlete_profiles(_coach_auth_uid uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  full_name text,
  avatar_url text,
  age integer,
  weight numeric,
  height numeric,
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
    p.age, p.weight, p.height, p.main_goal, p.disciplines, p.years_training,
    p.role, p.coach_id, p.active_model, p.vb2_enabled,
    p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.coach_id = (SELECT pp.id FROM public.profiles pp WHERE pp.user_id = _coach_auth_uid LIMIT 1);
$$;
