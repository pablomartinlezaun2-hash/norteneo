-- Fix educational_articles UPDATE policy: prevent any user from modifying default articles
DROP POLICY IF EXISTS "Users can update their own articles" ON public.educational_articles;
DROP POLICY IF EXISTS "Users can update their educational articles" ON public.educational_articles;
DROP POLICY IF EXISTS "educational_articles_update" ON public.educational_articles;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'educational_articles' AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.educational_articles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can update only their own articles"
ON public.educational_articles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Lock down realtime.messages so users can only subscribe to their own topics.
-- Topic convention: "<table>:<user_id>" — clients must subscribe to topics scoped by their auth.uid().
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe to own topic" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
);
