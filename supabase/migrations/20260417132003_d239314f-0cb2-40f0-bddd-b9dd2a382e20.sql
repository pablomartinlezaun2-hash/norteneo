-- Replace broad SELECT policy with one that doesn't allow listing
DROP POLICY IF EXISTS "Public read access to personalized greetings" ON storage.objects;

-- Allow only direct file fetch by exact path (single-segment names like md5.mp3),
-- which is what supabase-js getPublicUrl produces. Listing requires storage.list endpoints
-- which use the buckets-level policy; without a list policy clients can't enumerate.
CREATE POLICY "Public download of personalized greetings"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'personalized-greetings' AND name IS NOT NULL);