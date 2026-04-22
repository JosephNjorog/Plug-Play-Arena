-- =====================================================
-- PLUG N' PLAY ARENA — Live Multiplayer Foundation
-- =====================================================

-- Persona enum
CREATE TYPE public.persona AS ENUM ('student', 'developer', 'builder', 'founder', 'business');

-- Event lifecycle
CREATE TYPE public.event_status AS ENUM ('draft', 'live', 'paused', 'ended');

-- Round / mission attempt status
CREATE TYPE public.round_status AS ENUM ('pending', 'active', 'completed');
CREATE TYPE public.attempt_status AS ENUM ('in_progress', 'completed', 'failed', 'timeout');

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🔺',
  persona public.persona NOT NULL DEFAULT 'student',
  wallet_address TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  stage TEXT NOT NULL DEFAULT 'explorer',
  streak INTEGER NOT NULL DEFAULT 0,
  status_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- EVENTS (host-owned)
-- =====================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT 'irl',
  location TEXT,
  starts_at TIMESTAMPTZ,
  status public.event_status NOT NULL DEFAULT 'draft',
  current_round_id UUID,
  leaderboard_visible BOOLEAN NOT NULL DEFAULT true,
  reward_pool TEXT,
  cover_emoji TEXT DEFAULT '⚡',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Helper: is current user the host of this event?
CREATE OR REPLACE FUNCTION public.is_event_host(_event_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND host_user_id = auth.uid()
  );
$$;

CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "Hosts can update their events"
  ON public.events FOR UPDATE USING (auth.uid() = host_user_id);
CREATE POLICY "Hosts can delete their events"
  ON public.events FOR DELETE USING (auth.uid() = host_user_id);

-- =====================================================
-- TEAMS (persona-based, auto-created per event)
-- =====================================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  persona public.persona NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, persona)
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT USING (true);
CREATE POLICY "Hosts can manage teams for their events"
  ON public.teams FOR ALL USING (public.is_event_host(event_id))
  WITH CHECK (public.is_event_host(event_id));

-- =====================================================
-- EVENT PARTICIPANTS (check-ins)
-- =====================================================
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_score INTEGER NOT NULL DEFAULT 0,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants viewable by everyone"
  ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Users can check themselves in"
  ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own participation; hosts update any"
  ON public.event_participants FOR UPDATE USING (
    auth.uid() = user_id OR public.is_event_host(event_id)
  );

-- =====================================================
-- ROUNDS (host-triggered missions)
-- =====================================================
CREATE TABLE public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  time_limit_seconds INTEGER NOT NULL DEFAULT 300,
  status public.round_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rounds viewable by everyone"
  ON public.rounds FOR SELECT USING (true);
CREATE POLICY "Hosts manage rounds for their events"
  ON public.rounds FOR ALL USING (public.is_event_host(event_id))
  WITH CHECK (public.is_event_host(event_id));

-- =====================================================
-- MISSION ATTEMPTS (timed scoring)
-- =====================================================
CREATE TABLE public.mission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  round_id UUID REFERENCES public.rounds(id) ON DELETE SET NULL,
  game_id TEXT NOT NULL,
  status public.attempt_status NOT NULL DEFAULT 'in_progress',
  score INTEGER NOT NULL DEFAULT 0,
  speed_bonus INTEGER NOT NULL DEFAULT 0,
  accuracy_pct INTEGER NOT NULL DEFAULT 0,
  difficulty_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  attempts_used INTEGER NOT NULL DEFAULT 1,
  perfect_run BOOLEAN NOT NULL DEFAULT false,
  fast_finisher BOOLEAN NOT NULL DEFAULT false,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.mission_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attempts viewable by everyone"
  ON public.mission_attempts FOR SELECT USING (true);
CREATE POLICY "Users insert own attempts"
  ON public.mission_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attempts"
  ON public.mission_attempts FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- BROADCASTS (host announcements)
-- =====================================================
CREATE TABLE public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'announcement',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Broadcasts viewable by everyone"
  ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "Hosts can broadcast"
  ON public.broadcasts FOR INSERT WITH CHECK (public.is_event_host(event_id));

-- =====================================================
-- ACTIVITY TICKER (auto-fed by attempts)
-- =====================================================
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT,
  emoji TEXT,
  message TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'mission',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activity viewable by everyone"
  ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post their own activity"
  ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- NFTs (badges minted on completion)
-- =====================================================
CREATE TABLE public.nft_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  game_id TEXT,
  title TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  emoji TEXT DEFAULT '🏅',
  minted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nft_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by everyone"
  ON public.nft_badges FOR SELECT USING (true);
CREATE POLICY "Users insert own badges"
  ON public.nft_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- REWARDS (claims)
-- =====================================================
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'digital',
  rarity TEXT NOT NULL DEFAULT 'common',
  value TEXT,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own rewards"
  ON public.rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own rewards"
  ON public.rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own rewards"
  ON public.rewards FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, emoji, persona)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'emoji', '🔺'),
    COALESCE((NEW.raw_user_meta_data ->> 'persona')::public.persona, 'student')
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- REALTIME
-- =====================================================
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.rounds REPLICA IDENTITY FULL;
ALTER TABLE public.teams REPLICA IDENTITY FULL;
ALTER TABLE public.event_participants REPLICA IDENTITY FULL;
ALTER TABLE public.mission_attempts REPLICA IDENTITY FULL;
ALTER TABLE public.broadcasts REPLICA IDENTITY FULL;
ALTER TABLE public.activity_feed REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mission_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Indexes
CREATE INDEX idx_attempts_user ON public.mission_attempts(user_id);
CREATE INDEX idx_attempts_event ON public.mission_attempts(event_id);
CREATE INDEX idx_attempts_round ON public.mission_attempts(round_id);
CREATE INDEX idx_participants_event ON public.event_participants(event_id);
CREATE INDEX idx_rounds_event ON public.rounds(event_id);
CREATE INDEX idx_activity_event ON public.activity_feed(event_id, created_at DESC);
CREATE INDEX idx_broadcasts_event ON public.broadcasts(event_id, created_at DESC);
CREATE INDEX idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX idx_nfts_user ON public.nft_badges(user_id);