
-- daily_checkins: add general_discomfort, drop removed fields
ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS general_discomfort integer;

ALTER TABLE public.daily_checkins
  DROP COLUMN IF EXISTS general_soreness,
  DROP COLUMN IF EXISTS motivation,
  DROP COLUMN IF EXISTS joint_discomfort;

-- pre_workout_checkins: drop removed fields, convert specific_pain_or_discomfort to numeric
ALTER TABLE public.pre_workout_checkins
  DROP COLUMN IF EXISTS general_freshness,
  DROP COLUMN IF EXISTS willingness_to_push;

-- specific_pain_or_discomfort is currently text, change to integer
ALTER TABLE public.pre_workout_checkins
  ALTER COLUMN specific_pain_or_discomfort TYPE integer USING (CASE WHEN specific_pain_or_discomfort ~ '^\d+$' THEN specific_pain_or_discomfort::integer ELSE 1 END);
