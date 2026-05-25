
-- Lock down microcycle-briefings: make private and remove broad SELECT policy.
UPDATE storage.buckets SET public = false WHERE id = 'microcycle-briefings';

DROP POLICY IF EXISTS "Public read briefings" ON storage.objects;
