-- Shared adherence metric settings persisted in backend
CREATE TABLE IF NOT EXISTS public.adherence_metric_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  nutrition_enabled BOOLEAN NOT NULL DEFAULT true,
  training_enabled BOOLEAN NOT NULL DEFAULT true,
  sleep_enabled BOOLEAN NOT NULL DEFAULT true,
  supplements_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.adherence_metric_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'adherence_metric_settings' AND policyname = 'Users can view own adherence settings'
  ) THEN
    CREATE POLICY "Users can view own adherence settings"
      ON public.adherence_metric_settings
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'adherence_metric_settings' AND policyname = 'Users can insert own adherence settings'
  ) THEN
    CREATE POLICY "Users can insert own adherence settings"
      ON public.adherence_metric_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'adherence_metric_settings' AND policyname = 'Users can update own adherence settings'
  ) THEN
    CREATE POLICY "Users can update own adherence settings"
      ON public.adherence_metric_settings
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'adherence_metric_settings' AND policyname = 'Coaches can view assigned athlete adherence settings'
  ) THEN
    CREATE POLICY "Coaches can view assigned athlete adherence settings"
      ON public.adherence_metric_settings
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = adherence_metric_settings.user_id
            AND public.is_coach_of(auth.uid(), p.id)
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_adherence_metric_settings_updated_at'
  ) THEN
    CREATE TRIGGER set_adherence_metric_settings_updated_at
      BEFORE UPDATE ON public.adherence_metric_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

-- Coach read-only access to raw data used by adherence analytics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'food_logs' AND policyname = 'Coaches can view assigned athlete food logs'
  ) THEN
    CREATE POLICY "Coaches can view assigned athlete food logs"
      ON public.food_logs
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = food_logs.user_id
            AND public.is_coach_of(auth.uid(), p.id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'nutrition_goals' AND policyname = 'Coaches can view assigned athlete nutrition goals'
  ) THEN
    CREATE POLICY "Coaches can view assigned athlete nutrition goals"
      ON public.nutrition_goals
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = nutrition_goals.user_id
            AND public.is_coach_of(auth.uid(), p.id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sleep_logs' AND policyname = 'Coaches can view assigned athlete sleep logs'
  ) THEN
    CREATE POLICY "Coaches can view assigned athlete sleep logs"
      ON public.sleep_logs
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = sleep_logs.user_id
            AND public.is_coach_of(auth.uid(), p.id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplement_logs' AND policyname = 'Coaches can view assigned athlete supplement logs'
  ) THEN
    CREATE POLICY "Coaches can view assigned athlete supplement logs"
      ON public.supplement_logs
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = supplement_logs.user_id
            AND public.is_coach_of(auth.uid(), p.id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_supplements' AND policyname = 'Coaches can view assigned athlete supplements'
  ) THEN
    CREATE POLICY "Coaches can view assigned athlete supplements"
      ON public.user_supplements
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = user_supplements.user_id
            AND public.is_coach_of(auth.uid(), p.id)
        )
      );
  END IF;
END
$$;