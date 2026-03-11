
-- Allow coaches to SELECT their athletes' set_logs
CREATE POLICY "Coach can view athlete set logs"
ON public.set_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = set_logs.user_id
      AND profiles.coach_id = get_profile_id(auth.uid())
  )
);

-- Allow coaches to SELECT their athletes' training_programs
CREATE POLICY "Coach can view athlete programs"
ON public.training_programs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = training_programs.user_id
      AND profiles.coach_id = get_profile_id(auth.uid())
  )
);

-- Allow coaches to SELECT their athletes' workout_sessions
CREATE POLICY "Coach can view athlete sessions"
ON public.workout_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.profiles p ON p.user_id = tp.user_id
    WHERE tp.id = workout_sessions.program_id
      AND p.coach_id = get_profile_id(auth.uid())
  )
);

-- Allow coaches to SELECT their athletes' exercises
CREATE POLICY "Coach can view athlete exercises"
ON public.exercises FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    JOIN public.training_programs tp ON tp.id = ws.program_id
    JOIN public.profiles p ON p.user_id = tp.user_id
    WHERE ws.id = exercises.session_id
      AND p.coach_id = get_profile_id(auth.uid())
  )
);

-- Allow coaches to SELECT their athletes' muscle_fatigue_states
CREATE POLICY "Coach can view athlete fatigue states"
ON public.muscle_fatigue_states FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = muscle_fatigue_states.user_id
      AND profiles.coach_id = get_profile_id(auth.uid())
  )
);
