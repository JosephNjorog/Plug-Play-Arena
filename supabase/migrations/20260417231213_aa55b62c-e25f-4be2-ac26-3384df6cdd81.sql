DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
  WITH (security_invoker = true) AS
SELECT id, user_id, username, emoji, persona, xp, level, stage, streak, status_tag, created_at
FROM public.profiles;

-- Allow anonymous read of leaderboard data (no wallet here)
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Need a public-readable policy for that anonymous select to actually work
CREATE POLICY "Anon can read non-sensitive profile fields via view"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);