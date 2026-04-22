-- ---- PROFILES: owner-only direct read ----
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Public-safe single profile lookup (no wallet)
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id UUID)
RETURNS TABLE (
  user_id UUID, username TEXT, emoji TEXT, persona public.persona,
  xp INTEGER, level INTEGER, stage TEXT, streak INTEGER, status_tag TEXT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, username, emoji, persona, xp, level, stage, streak, status_tag
  FROM public.profiles WHERE user_id = _user_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_profile TO anon, authenticated;

-- ---- REWARDS: freeze immutable fields on update ----
CREATE OR REPLACE FUNCTION public.protect_reward_fields()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Only allow toggling claimed/claimed_at on existing rows
  IF NEW.title       IS DISTINCT FROM OLD.title       OR
     NEW.description IS DISTINCT FROM OLD.description OR
     NEW.kind        IS DISTINCT FROM OLD.kind        OR
     NEW.rarity      IS DISTINCT FROM OLD.rarity      OR
     NEW.value       IS DISTINCT FROM OLD.value       OR
     NEW.event_id    IS DISTINCT FROM OLD.event_id    OR
     NEW.user_id     IS DISTINCT FROM OLD.user_id     THEN
    RAISE EXCEPTION 'Reward fields are immutable; only claimed/claimed_at may change';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_rewards_protect
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.protect_reward_fields();

-- ---- ACTIVITY FEED: authenticated only ----
DROP POLICY IF EXISTS "Authenticated users can post their own activity" ON public.activity_feed;
CREATE POLICY "Authenticated users can post their own activity"
  ON public.activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);