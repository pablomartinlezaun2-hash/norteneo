
INSERT INTO storage.buckets (id, name, public)
VALUES ('microcycle-briefings', 'microcycle-briefings', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read briefings'
  ) THEN
    CREATE POLICY "Public read briefings"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'microcycle-briefings');
  END IF;
END$$;
