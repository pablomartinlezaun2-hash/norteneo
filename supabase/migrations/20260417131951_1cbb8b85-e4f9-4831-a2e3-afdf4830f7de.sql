-- Create public storage bucket for cached personalized greetings
INSERT INTO storage.buckets (id, name, public)
VALUES ('personalized-greetings', 'personalized-greetings', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access (audios are non-sensitive personalized greetings)
CREATE POLICY "Public read access to personalized greetings"
ON storage.objects FOR SELECT
USING (bucket_id = 'personalized-greetings');

-- Only service role writes (via edge function); no public insert/update/delete policies needed