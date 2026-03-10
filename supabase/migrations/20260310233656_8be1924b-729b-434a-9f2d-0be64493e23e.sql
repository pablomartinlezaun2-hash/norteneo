
-- ============================================================
-- 1) EXTEND profiles TABLE with coach-related columns
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'athlete',
  ADD COLUMN IF NOT EXISTS active_model text,
  ADD COLUMN IF NOT EXISTS vb2_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS height numeric,
  ADD COLUMN IF NOT EXISTS disciplines text[],
  ADD COLUMN IF NOT EXISTS years_training text,
  ADD COLUMN IF NOT EXISTS main_goal text;

-- Validation trigger for profiles role and active_model
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger LANGUAGE plpgsql AS $$
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

CREATE TRIGGER validate_profile_fields_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_fields();

-- ============================================================
-- 2) athlete_metrics
-- ============================================================
CREATE TABLE public.athlete_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight numeric,
  sleep_hours numeric,
  sleep_quality text,
  stress_level text,
  fatigue_subjective integer,
  readiness_score numeric,
  mental_load text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.athlete_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3) adherence_logs
-- ============================================================
CREATE TABLE public.adherence_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  training_adherence numeric,
  nutrition_adherence numeric,
  sleep_adherence numeric,
  supplement_adherence numeric,
  total_adherence numeric,
  microcycle_adherence numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.adherence_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4) fatigue_state
-- ============================================================
CREATE TABLE public.fatigue_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  muscular_fatigue numeric,
  neuro_fatigue numeric,
  connective_fatigue numeric,
  global_fatigue numeric,
  alert_level text,
  recovery_trend text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.fatigue_state ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5) coach_training_sessions (named to avoid conflict with existing workout_sessions)
-- ============================================================
CREATE TABLE public.coach_training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  session_type text,
  microcycle_name text,
  planned boolean DEFAULT true,
  completed boolean DEFAULT false,
  deviation_score numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.coach_training_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6) nutrition_daily
-- ============================================================
CREATE TABLE public.nutrition_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  calories_target numeric,
  calories_actual numeric,
  protein_target numeric,
  protein_actual numeric,
  carbs_target numeric,
  carbs_actual numeric,
  fats_target numeric,
  fats_actual numeric,
  hydration_status text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nutrition_daily ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7) coach_notes
-- ============================================================
CREATE TABLE public.coach_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text,
  priority text DEFAULT 'stable',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

-- Validation trigger for coach_notes priority
CREATE OR REPLACE FUNCTION public.validate_coach_note_priority()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.priority IS NOT NULL AND NEW.priority NOT IN ('high', 'review', 'stable', 'one_to_one') THEN
    RAISE EXCEPTION 'Invalid priority: %. Must be high, review, stable, or one_to_one', NEW.priority;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_coach_note_priority_trigger
  BEFORE INSERT OR UPDATE ON public.coach_notes
  FOR EACH ROW EXECUTE FUNCTION public.validate_coach_note_priority();

-- ============================================================
-- 8) coach_performance_alerts (separate from existing performance_alerts)
-- ============================================================
CREATE TABLE public.coach_performance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  alert_type text,
  alert_title text,
  alert_message text,
  severity text DEFAULT 'low',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.coach_performance_alerts ENABLE ROW LEVEL SECURITY;

-- Validation trigger for coach_performance_alerts severity
CREATE OR REPLACE FUNCTION public.validate_coach_alert_severity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.severity IS NOT NULL AND NEW.severity NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'Invalid severity: %. Must be low, medium, or high', NEW.severity;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_coach_alert_severity_trigger
  BEFORE INSERT OR UPDATE ON public.coach_performance_alerts
  FOR EACH ROW EXECUTE FUNCTION public.validate_coach_alert_severity();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active_model ON public.profiles(active_model);
CREATE INDEX IF NOT EXISTS idx_profiles_vb2_enabled ON public.profiles(vb2_enabled);
CREATE INDEX IF NOT EXISTS idx_profiles_coach_id ON public.profiles(coach_id);
CREATE INDEX IF NOT EXISTS idx_athlete_metrics_user_date ON public.athlete_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_adherence_logs_user_date ON public.adherence_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fatigue_state_user_date ON public.fatigue_state(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_coach_training_sessions_user_date ON public.coach_training_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_daily_user_date ON public.nutrition_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_coach_perf_alerts_user_active ON public.coach_performance_alerts(user_id, is_active);

-- ============================================================
-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- ============================================================

-- Get user role from profiles via auth user_id
CREATE OR REPLACE FUNCTION public.get_user_role(_auth_uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _auth_uid LIMIT 1;
$$;

-- Get profile id from auth user_id
CREATE OR REPLACE FUNCTION public.get_profile_id(_auth_uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _auth_uid LIMIT 1;
$$;

-- Check if auth user (coach) is assigned to an athlete's profile
CREATE OR REPLACE FUNCTION public.is_coach_of(_coach_auth_uid uuid, _athlete_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _athlete_profile_id
      AND coach_id = (SELECT id FROM public.profiles WHERE user_id = _coach_auth_uid LIMIT 1)
  );
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- --- PROFILES: update existing policies ---
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or coach views assigned"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR coach_id = public.get_profile_id(auth.uid())
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- --- ATHLETE_METRICS ---
CREATE POLICY "Select own or coach-assigned metrics"
  ON public.athlete_metrics FOR SELECT TO authenticated
  USING (
    user_id = public.get_profile_id(auth.uid())
    OR public.is_coach_of(auth.uid(), user_id)
  );
CREATE POLICY "Insert own metrics"
  ON public.athlete_metrics FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Update own metrics"
  ON public.athlete_metrics FOR UPDATE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Delete own metrics"
  ON public.athlete_metrics FOR DELETE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));

-- --- ADHERENCE_LOGS ---
CREATE POLICY "Select own or coach-assigned adherence"
  ON public.adherence_logs FOR SELECT TO authenticated
  USING (
    user_id = public.get_profile_id(auth.uid())
    OR public.is_coach_of(auth.uid(), user_id)
  );
CREATE POLICY "Insert own adherence"
  ON public.adherence_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Update own adherence"
  ON public.adherence_logs FOR UPDATE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Delete own adherence"
  ON public.adherence_logs FOR DELETE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));

-- --- FATIGUE_STATE ---
CREATE POLICY "Select own or coach-assigned fatigue"
  ON public.fatigue_state FOR SELECT TO authenticated
  USING (
    user_id = public.get_profile_id(auth.uid())
    OR public.is_coach_of(auth.uid(), user_id)
  );
CREATE POLICY "Insert own fatigue"
  ON public.fatigue_state FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Update own fatigue"
  ON public.fatigue_state FOR UPDATE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Delete own fatigue"
  ON public.fatigue_state FOR DELETE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));

-- --- COACH_TRAINING_SESSIONS ---
CREATE POLICY "Select own or coach-assigned training"
  ON public.coach_training_sessions FOR SELECT TO authenticated
  USING (
    user_id = public.get_profile_id(auth.uid())
    OR public.is_coach_of(auth.uid(), user_id)
  );
CREATE POLICY "Insert own training"
  ON public.coach_training_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Update own training"
  ON public.coach_training_sessions FOR UPDATE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Delete own training"
  ON public.coach_training_sessions FOR DELETE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));

-- --- NUTRITION_DAILY ---
CREATE POLICY "Select own or coach-assigned nutrition"
  ON public.nutrition_daily FOR SELECT TO authenticated
  USING (
    user_id = public.get_profile_id(auth.uid())
    OR public.is_coach_of(auth.uid(), user_id)
  );
CREATE POLICY "Insert own nutrition"
  ON public.nutrition_daily FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Update own nutrition"
  ON public.nutrition_daily FOR UPDATE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Delete own nutrition"
  ON public.nutrition_daily FOR DELETE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));

-- --- COACH_NOTES: only coaches, athletes cannot see ---
CREATE POLICY "Coach can select notes for assigned athletes"
  ON public.coach_notes FOR SELECT TO authenticated
  USING (
    coach_id = public.get_profile_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'coach'
  );
CREATE POLICY "Coach can insert notes for assigned athletes"
  ON public.coach_notes FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = public.get_profile_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'coach'
    AND public.is_coach_of(auth.uid(), athlete_id)
  );
CREATE POLICY "Coach can update own notes"
  ON public.coach_notes FOR UPDATE TO authenticated
  USING (
    coach_id = public.get_profile_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'coach'
  );
CREATE POLICY "Coach can delete own notes"
  ON public.coach_notes FOR DELETE TO authenticated
  USING (
    coach_id = public.get_profile_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'coach'
  );

-- --- COACH_PERFORMANCE_ALERTS ---
CREATE POLICY "Select own or coach-assigned coach alerts"
  ON public.coach_performance_alerts FOR SELECT TO authenticated
  USING (
    user_id = public.get_profile_id(auth.uid())
    OR public.is_coach_of(auth.uid(), user_id)
  );
CREATE POLICY "Insert own coach alerts"
  ON public.coach_performance_alerts FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Update own coach alerts"
  ON public.coach_performance_alerts FOR UPDATE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Delete own coach alerts"
  ON public.coach_performance_alerts FOR DELETE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
