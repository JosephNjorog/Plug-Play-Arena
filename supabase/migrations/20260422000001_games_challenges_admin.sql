-- =====================================================
-- GAMES CATALOG TABLE
-- Replaces the hardcoded AVALANCHE_GAMES array.
-- =====================================================
CREATE TABLE public.games (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  persona      TEXT NOT NULL,
  category     TEXT NOT NULL,
  difficulty   TEXT NOT NULL DEFAULT 'beginner',
  themes       TEXT[] NOT NULL DEFAULT '{}',
  description  TEXT NOT NULL DEFAULT '',
  learning_outcome TEXT NOT NULL DEFAULT '',
  emoji        TEXT NOT NULL DEFAULT '🎮',
  duration     TEXT NOT NULL DEFAULT '5 min',
  xp_reward    INTEGER NOT NULL DEFAULT 100,
  reward_type  TEXT NOT NULL DEFAULT 'xp' CHECK (reward_type IN ('xp','nft','merch','token')),
  event_types  TEXT[] NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','soon')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Games viewable by everyone" ON public.games FOR SELECT USING (true);
CREATE POLICY "Admins manage games" ON public.games FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- CHALLENGES CATALOG TABLE
-- Replaces the hardcoded AVALANCHE_CHALLENGES array.
-- =====================================================
CREATE TABLE public.challenges (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  tagline      TEXT NOT NULL DEFAULT '',
  emoji        TEXT NOT NULL DEFAULT '🏆',
  accent       TEXT NOT NULL DEFAULT 'cyan',
  tier         TEXT NOT NULL DEFAULT 'Beginner',
  ai_ready     BOOLEAN NOT NULL DEFAULT false,
  est_minutes  INTEGER NOT NULL DEFAULT 20,
  xp_reward    INTEGER NOT NULL DEFAULT 500,
  badge_title  TEXT NOT NULL DEFAULT '',
  concept      TEXT NOT NULL DEFAULT '',
  brief        TEXT NOT NULL DEFAULT '',
  steps        JSONB NOT NULL DEFAULT '[]',
  build_prompt TEXT NOT NULL DEFAULT '',
  ai_prompt    TEXT,
  submission   JSONB NOT NULL DEFAULT '{}',
  verification JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges viewable by everyone" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Admins manage challenges" ON public.challenges FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- EXPAND EVENTS TABLE
-- Add the display fields that were previously in the
-- hardcoded AVALANCHE_EVENTS TypeScript array.
-- =====================================================
ALTER TABLE public.events
  ALTER COLUMN host_user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS category         TEXT DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS zoom_url         TEXT,
  ADD COLUMN IF NOT EXISTS tracks           TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty       TEXT DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS agenda           JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS missions         TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capacity         INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS ends_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_platform_event BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_image_url  TEXT;

-- Allow anyone (incl. anon) to read platform events
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT USING (true);

-- Admins can insert/update/delete any event
CREATE POLICY "Admins manage all events" ON public.events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- ADMIN FLAG ON PROFILES
-- =====================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Only service-role / DB owner can flip is_admin
-- (regular users cannot update each other's is_admin)

-- =====================================================
-- is_admin() HELPER
-- Use in RLS policies to avoid circular SELECT.
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()), false);
$$;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon, authenticated;

-- =====================================================
-- ADMIN STATS RPC
-- Fast single-query dashboard summary.
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_users',        (SELECT COUNT(*) FROM public.profiles),
    'total_missions',     (SELECT COUNT(*) FROM public.mission_attempts WHERE status = 'completed'),
    'total_xp',           (SELECT COALESCE(SUM(xp), 0) FROM public.profiles),
    'total_nft_mints',    (SELECT COUNT(*) FROM public.nft_mints),
    'active_events',      (SELECT COUNT(*) FROM public.events WHERE status IN ('live','draft')),
    'arena_sessions',     (SELECT COUNT(*) FROM public.game_sessions),
    'pending_subs',       (SELECT COUNT(*) FROM public.challenge_submissions WHERE status = 'pending'),
    'total_challenges',   (SELECT COUNT(*) FROM public.challenge_submissions WHERE status = 'verified')
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_stats TO authenticated;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_games_persona   ON public.games(persona);
CREATE INDEX IF NOT EXISTS idx_games_status    ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_challenges_slug ON public.challenges(slug);
CREATE INDEX IF NOT EXISTS idx_events_status   ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_platform ON public.events(is_platform_event);
