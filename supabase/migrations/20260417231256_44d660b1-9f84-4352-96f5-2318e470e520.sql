-- Remove the over-broad anon policy
DROP POLICY IF EXISTS "Anon can read non-sensitive profile fields via view" ON public.profiles;

-- Drop the view too — replace with a security definer function
DROP VIEW IF EXISTS public.profiles_public;

-- Public leaderboard function (anon-safe, no wallet)
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit INTEGER DEFAULT 50, _persona public.persona DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  emoji TEXT,
  persona public.persona,
  xp INTEGER,
  level INTEGER,
  stage TEXT,
  streak INTEGER,
  status_tag TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, username, emoji, persona, xp, level, stage, streak, status_tag
  FROM public.profiles
  WHERE _persona IS NULL OR persona = _persona
  ORDER BY xp DESC
  LIMIT GREATEST(1, LEAST(200, _limit));
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard TO anon, authenticated;

-- ---- MISSION ATTEMPTS: tighten ----
DROP POLICY IF EXISTS "Authenticated users can view attempts" ON public.mission_attempts;

CREATE POLICY "Users see own attempts; hosts see attempts for their events"
  ON public.mission_attempts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (event_id IS NOT NULL AND public.is_event_host(event_id))
  );

-- Public-safe attempt summary for live leaderboards (no timing details)
CREATE OR REPLACE FUNCTION public.get_event_leaderboard(_event_id UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  emoji TEXT,
  persona public.persona,
  team_id UUID,
  team_name TEXT,
  team_color TEXT,
  event_score INTEGER,
  attempts_completed INTEGER
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id, pr.username, pr.emoji, pr.persona,
    t.id, t.name, t.color,
    p.event_score,
    (SELECT COUNT(*)::INTEGER FROM public.mission_attempts a
       WHERE a.user_id = p.user_id AND a.event_id = _event_id AND a.status = 'completed')
  FROM public.event_participants p
  JOIN public.profiles pr ON pr.user_id = p.user_id
  LEFT JOIN public.teams t ON t.id = p.team_id
  WHERE p.event_id = _event_id
  ORDER BY p.event_score DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_leaderboard TO anon, authenticated;

-- ---- REWARDS: explicit no-direct-insert ----
CREATE POLICY "Block direct inserts on rewards"
  ON public.rewards FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ---- REALTIME: allow only authenticated; client must filter by event ----
DROP POLICY IF EXISTS "Authenticated users can subscribe to realtime" ON realtime.messages;

CREATE POLICY "Authenticated users can subscribe to realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);