
-- 1. User training baselines
CREATE TABLE public.user_training_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  baseline_readiness NUMERIC DEFAULT 7,
  baseline_sleep NUMERIC DEFAULT 7,
  baseline_energy NUMERIC DEFAULT 7,
  baseline_volume_tolerance TEXT NOT NULL DEFAULT 'moderate',
  training_experience TEXT NOT NULL DEFAULT 'intermediate',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_training_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baselines" ON public.user_training_baselines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own baselines" ON public.user_training_baselines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own baselines" ON public.user_training_baselines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own baselines" ON public.user_training_baselines FOR DELETE USING (auth.uid() = user_id);

-- 2. Daily check-ins
CREATE TABLE public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours NUMERIC,
  sleep_quality INTEGER,
  general_energy INTEGER,
  mental_stress INTEGER,
  general_soreness INTEGER,
  motivation INTEGER,
  joint_discomfort INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.daily_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkins" ON public.daily_checkins FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view athlete checkins" ON public.daily_checkins FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = daily_checkins.user_id AND p.coach_id = get_profile_id(auth.uid())));

-- 3. Pre-workout check-ins
CREATE TABLE public.pre_workout_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  expected_strength INTEGER,
  general_freshness INTEGER,
  local_fatigue_target_muscle INTEGER,
  specific_pain_or_discomfort TEXT,
  willingness_to_push INTEGER,
  available_time_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_workout_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pre-workout" ON public.pre_workout_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pre-workout" ON public.pre_workout_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pre-workout" ON public.pre_workout_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pre-workout" ON public.pre_workout_checkins FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view athlete pre-workout" ON public.pre_workout_checkins FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = pre_workout_checkins.user_id AND p.coach_id = get_profile_id(auth.uid())));

-- 4. Session autoregulation state
CREATE TABLE public.session_autoregulation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  completed_session_id UUID REFERENCES public.completed_sessions(id) ON DELETE SET NULL,
  readiness_score NUMERIC,
  systemic_fatigue_score NUMERIC,
  local_fatigue_score NUMERIC,
  planned_state JSONB DEFAULT '{}',
  recommended_state JSONB DEFAULT '{}',
  active_state JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.session_autoregulation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own autoreg state" ON public.session_autoregulation_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own autoreg state" ON public.session_autoregulation_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own autoreg state" ON public.session_autoregulation_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own autoreg state" ON public.session_autoregulation_state FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view athlete autoreg state" ON public.session_autoregulation_state FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = session_autoregulation_state.user_id AND p.coach_id = get_profile_id(auth.uid())));

-- 5. Session exercise state
CREATE TABLE public.session_exercise_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autoregulation_state_id UUID NOT NULL REFERENCES public.session_autoregulation_state(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  planned_sets INTEGER NOT NULL,
  recommended_sets INTEGER,
  active_sets INTEGER,
  planned_rep_range TEXT NOT NULL,
  recommended_rep_range TEXT,
  active_rep_range TEXT,
  planned_rir INTEGER NOT NULL DEFAULT 0,
  recommended_rir INTEGER,
  active_rir INTEGER,
  fatigue_cost NUMERIC,
  target_muscle_group TEXT,
  substituted_by_exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.session_exercise_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercise state" ON public.session_exercise_state FOR SELECT
  USING (EXISTS (SELECT 1 FROM session_autoregulation_state s WHERE s.id = session_exercise_state.autoregulation_state_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can insert own exercise state" ON public.session_exercise_state FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM session_autoregulation_state s WHERE s.id = session_exercise_state.autoregulation_state_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can update own exercise state" ON public.session_exercise_state FOR UPDATE
  USING (EXISTS (SELECT 1 FROM session_autoregulation_state s WHERE s.id = session_exercise_state.autoregulation_state_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can delete own exercise state" ON public.session_exercise_state FOR DELETE
  USING (EXISTS (SELECT 1 FROM session_autoregulation_state s WHERE s.id = session_exercise_state.autoregulation_state_id AND s.user_id = auth.uid()));

-- 6. Autoregulation recommendations
CREATE TABLE public.autoregulation_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_autoregulation_id UUID NOT NULL REFERENCES public.session_autoregulation_state(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  recommendation_type TEXT NOT NULL,
  recommendation_reason TEXT,
  recommendation_payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.autoregulation_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations" ON public.autoregulation_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON public.autoregulation_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON public.autoregulation_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recommendations" ON public.autoregulation_recommendations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view athlete recommendations" ON public.autoregulation_recommendations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = autoregulation_recommendations.user_id AND p.coach_id = get_profile_id(auth.uid())));

-- 7. Add target_rir and rir_deviation to existing set_logs
ALTER TABLE public.set_logs ADD COLUMN IF NOT EXISTS target_rir INTEGER DEFAULT 0;
ALTER TABLE public.set_logs ADD COLUMN IF NOT EXISTS rir_deviation INTEGER GENERATED ALWAYS AS (COALESCE(rir, 0) - target_rir) STORED;

-- 8. Validation triggers
CREATE OR REPLACE FUNCTION public.validate_recommendation_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recommendation_type NOT IN ('ADD_SET', 'REMOVE_SET', 'SUBSTITUTE_EXERCISE', 'INCREASE_RIR', 'RESTRUCTURE_SESSION', 'KEEP_PLAN') THEN
    RAISE EXCEPTION 'Invalid recommendation_type: %', NEW.recommendation_type;
  END IF;
  IF NEW.status NOT IN ('pending', 'accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_recommendation_fields_trigger
BEFORE INSERT OR UPDATE ON public.autoregulation_recommendations
FOR EACH ROW EXECUTE FUNCTION public.validate_recommendation_fields();

CREATE OR REPLACE FUNCTION public.validate_baseline_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.baseline_volume_tolerance NOT IN ('low', 'moderate', 'high') THEN
    RAISE EXCEPTION 'Invalid volume_tolerance: %', NEW.baseline_volume_tolerance;
  END IF;
  IF NEW.training_experience NOT IN ('beginner', 'intermediate', 'advanced') THEN
    RAISE EXCEPTION 'Invalid training_experience: %', NEW.training_experience;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_baseline_fields_trigger
BEFORE INSERT OR UPDATE ON public.user_training_baselines
FOR EACH ROW EXECUTE FUNCTION public.validate_baseline_fields();
