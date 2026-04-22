-- ============================================================
-- SECURITY HARDENING
-- ============================================================

-- ---- PROFILES: hide wallet from public ----
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Public-safe leaderboard view (no wallet)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, user_id, username, emoji, persona, xp, level, stage, streak, status_tag, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- ---- MISSION ATTEMPTS: lock down ----
DROP POLICY IF EXISTS "Attempts viewable by everyone" ON public.mission_attempts;
DROP POLICY IF EXISTS "Users insert own attempts" ON public.mission_attempts;
DROP POLICY IF EXISTS "Users update own attempts" ON public.mission_attempts;

CREATE POLICY "Authenticated users can view attempts"
  ON public.mission_attempts FOR SELECT
  TO authenticated
  USING (true);

-- No direct INSERT/UPDATE — submission goes through submit_attempt()

-- ---- NFT BADGES: lock down ----
DROP POLICY IF EXISTS "Users insert own badges" ON public.nft_badges;
-- Read remains public (for showing off). Insert only via mint_badge().

-- ---- REWARDS: lock down ----
DROP POLICY IF EXISTS "Users insert own rewards" ON public.rewards;
-- Insert only via issue_reward(). Update (claim) stays user-controlled.

-- ============================================================
-- SERVER-SIDE GAMEPLAY FUNCTIONS
-- ============================================================

-- Submit a mission attempt with computed score. Trusted scoring lives here.
CREATE OR REPLACE FUNCTION public.submit_attempt(
  _game_id TEXT,
  _event_id UUID,
  _round_id UUID,
  _accuracy_pct INTEGER,
  _duration_ms INTEGER,
  _difficulty_multiplier NUMERIC,
  _attempts_used INTEGER,
  _time_limit_seconds INTEGER,
  _xp_reward INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _accuracy INTEGER := GREATEST(0, LEAST(100, COALESCE(_accuracy_pct, 0)));
  _multiplier NUMERIC := GREATEST(0.5, LEAST(3.0, COALESCE(_difficulty_multiplier, 1.0)));
  _retry_penalty NUMERIC := GREATEST(0.5, 1.0 - (GREATEST(_attempts_used, 1) - 1) * 0.15);
  _speed_ratio NUMERIC := 0;
  _speed_bonus INTEGER := 0;
  _base_score INTEGER := 0;
  _final_score INTEGER := 0;
  _perfect BOOLEAN := false;
  _fast BOOLEAN := false;
  _attempt_id UUID;
  _new_xp INTEGER;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Speed bonus: faster = better. Up to +200.
  IF _time_limit_seconds > 0 AND _duration_ms IS NOT NULL THEN
    _speed_ratio := 1.0 - LEAST(1.0, (_duration_ms::NUMERIC / 1000.0) / _time_limit_seconds::NUMERIC);
    _speed_bonus := GREATEST(0, FLOOR(_speed_ratio * 200))::INTEGER;
  END IF;

  _base_score := FLOOR(_accuracy * 5 + _speed_bonus)::INTEGER;
  _final_score := FLOOR(_base_score * _multiplier * _retry_penalty)::INTEGER;
  _perfect := (_accuracy = 100 AND _attempts_used = 1);
  _fast := (_speed_ratio >= 0.5);

  IF _perfect THEN _final_score := _final_score + 100; END IF;
  IF _fast THEN _final_score := _final_score + 50; END IF;

  -- Insert attempt
  INSERT INTO public.mission_attempts (
    user_id, event_id, round_id, game_id, status,
    score, speed_bonus, accuracy_pct, difficulty_multiplier,
    attempts_used, perfect_run, fast_finisher, duration_ms, completed_at
  ) VALUES (
    _uid, _event_id, _round_id, _game_id, 'completed',
    _final_score, _speed_bonus, _accuracy, _multiplier,
    _attempts_used, _perfect, _fast, _duration_ms, now()
  ) RETURNING id INTO _attempt_id;

  -- Award XP to profile
  UPDATE public.profiles
    SET xp = xp + _xp_reward,
        level = 1 + ((xp + _xp_reward) / 500),
        stage = CASE
          WHEN xp + _xp_reward >= 4000 THEN 'champion'
          WHEN xp + _xp_reward >= 2200 THEN 'founder'
          WHEN xp + _xp_reward >= 1200 THEN 'architect'
          WHEN xp + _xp_reward >= 600  THEN 'builder'
          WHEN xp + _xp_reward >= 200  THEN 'learner'
          ELSE 'explorer'
        END,
        updated_at = now()
    WHERE user_id = _uid
  RETURNING xp INTO _new_xp;

  -- Bump event participant score
  IF _event_id IS NOT NULL THEN
    UPDATE public.event_participants
      SET event_score = event_score + _final_score
      WHERE event_id = _event_id AND user_id = _uid;
    -- Bump team score
    UPDATE public.teams t
      SET score = score + _final_score
      FROM public.event_participants p
      WHERE p.event_id = _event_id
        AND p.user_id = _uid
        AND p.team_id = t.id;
  END IF;

  -- Activity ticker entry
  INSERT INTO public.activity_feed (event_id, user_id, username, emoji, message, kind)
  SELECT _event_id, _uid, p.username, p.emoji,
    p.username || ' scored ' || _final_score || ' on ' || _game_id ||
    CASE WHEN _perfect THEN ' · PERFECT RUN' WHEN _fast THEN ' · FAST FINISH' ELSE '' END,
    'mission_complete'
  FROM public.profiles p WHERE p.user_id = _uid;

  RETURN jsonb_build_object(
    'attempt_id', _attempt_id,
    'score', _final_score,
    'speed_bonus', _speed_bonus,
    'accuracy', _accuracy,
    'perfect', _perfect,
    'fast', _fast,
    'xp_earned', _xp_reward,
    'new_xp', _new_xp
  );
END; $$;

GRANT EXECUTE ON FUNCTION public.submit_attempt TO authenticated;

-- Mint a badge tied to a completed attempt
CREATE OR REPLACE FUNCTION public.mint_badge(
  _attempt_id UUID,
  _title TEXT,
  _rarity TEXT,
  _emoji TEXT,
  _game_id TEXT,
  _event_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _ok BOOLEAN;
  _badge_id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.mission_attempts
    WHERE id = _attempt_id AND user_id = _uid AND status = 'completed'
  ) INTO _ok;

  IF NOT _ok THEN RAISE EXCEPTION 'Invalid attempt'; END IF;

  INSERT INTO public.nft_badges (user_id, event_id, game_id, title, rarity, emoji)
  VALUES (_uid, _event_id, _game_id, _title,
    CASE WHEN _rarity IN ('common','rare','legendary') THEN _rarity ELSE 'common' END,
    COALESCE(_emoji, '🏅'))
  RETURNING id INTO _badge_id;

  RETURN _badge_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.mint_badge TO authenticated;

-- Issue a reward tied to a completed attempt
CREATE OR REPLACE FUNCTION public.issue_reward(
  _attempt_id UUID,
  _title TEXT,
  _description TEXT,
  _kind TEXT,
  _rarity TEXT,
  _value TEXT,
  _event_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _ok BOOLEAN;
  _r_id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.mission_attempts
    WHERE id = _attempt_id AND user_id = _uid AND status = 'completed'
  ) INTO _ok;

  IF NOT _ok THEN RAISE EXCEPTION 'Invalid attempt'; END IF;

  INSERT INTO public.rewards (user_id, event_id, title, description, kind, rarity, value)
  VALUES (_uid, _event_id, _title, _description,
    CASE WHEN _kind IN ('digital','physical','token','merch','perk','mentorship','nft') THEN _kind ELSE 'digital' END,
    CASE WHEN _rarity IN ('common','rare','legendary') THEN _rarity ELSE 'common' END,
    _value)
  RETURNING id INTO _r_id;

  RETURN _r_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.issue_reward TO authenticated;

-- Convenience: get caller's own profile (with wallet)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile TO authenticated;

-- ============================================================
-- REALTIME AUTHORIZATION
-- Only authenticated users can subscribe to channels.
-- ============================================================
CREATE POLICY "Authenticated users can subscribe to realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);