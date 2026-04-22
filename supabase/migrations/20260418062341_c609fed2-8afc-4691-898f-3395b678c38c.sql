
-- =========================
-- app_settings (key/value)
-- =========================
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App settings viewable by everyone"
  ON public.app_settings FOR SELECT USING (true);

-- No client-side writes; only SECURITY DEFINER functions can change settings.

-- =========================
-- challenge_submissions
-- =========================
CREATE TYPE public.submission_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.submission_kind AS ENUM ('wallet','tx_hash','contract','github','json');

CREATE TABLE public.challenge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  round_id UUID REFERENCES public.rounds(id) ON DELETE SET NULL,
  attempt_id UUID REFERENCES public.mission_attempts(id) ON DELETE SET NULL,
  kind public.submission_kind NOT NULL,
  payload JSONB NOT NULL,
  status public.submission_status NOT NULL DEFAULT 'pending',
  evidence JSONB,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX idx_subs_user ON public.challenge_submissions(user_id);
CREATE INDEX idx_subs_event ON public.challenge_submissions(event_id);
CREATE INDEX idx_subs_challenge ON public.challenge_submissions(challenge_id);

ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own submissions; hosts see event submissions"
  ON public.challenge_submissions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (event_id IS NOT NULL AND public.is_event_host(event_id))
  );

-- No direct INSERT/UPDATE/DELETE — only SECURITY DEFINER functions.

-- =========================
-- nft_mints (real on-chain)
-- =========================
CREATE TABLE public.nft_mints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  network TEXT NOT NULL DEFAULT 'fuji',
  metadata JSONB,
  minted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mints_user ON public.nft_mints(user_id);
CREATE INDEX idx_mints_challenge ON public.nft_mints(challenge_id);

ALTER TABLE public.nft_mints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "NFT mints viewable by everyone"
  ON public.nft_mints FOR SELECT USING (true);

-- =========================
-- Functions
-- =========================

-- Record a submission (called by client)
CREATE OR REPLACE FUNCTION public.record_submission(
  _challenge_id TEXT,
  _kind public.submission_kind,
  _payload JSONB,
  _event_id UUID,
  _round_id UUID,
  _attempt_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _payload IS NULL OR jsonb_typeof(_payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid payload';
  END IF;
  INSERT INTO public.challenge_submissions
    (user_id, challenge_id, kind, payload, event_id, round_id, attempt_id)
  VALUES (_uid, _challenge_id, _kind, _payload, _event_id, _round_id, _attempt_id)
  RETURNING id INTO _id;
  RETURN _id;
END $$;

-- Mark verified (called by edge function w/ service role)
CREATE OR REPLACE FUNCTION public.mark_submission_verified(
  _submission_id UUID,
  _evidence JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.challenge_submissions
    SET status = 'verified',
        evidence = COALESCE(_evidence, '{}'::jsonb),
        verified_at = now()
    WHERE id = _submission_id;
END $$;

CREATE OR REPLACE FUNCTION public.mark_submission_rejected(
  _submission_id UUID,
  _reason TEXT,
  _evidence JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.challenge_submissions
    SET status = 'rejected',
        rejection_reason = _reason,
        evidence = COALESCE(_evidence, '{}'::jsonb)
    WHERE id = _submission_id;
END $$;

-- Record a real Fuji mint
CREATE OR REPLACE FUNCTION public.record_nft_mint(
  _user_id UUID,
  _challenge_id TEXT,
  _event_id UUID,
  _contract_address TEXT,
  _token_id TEXT,
  _recipient_address TEXT,
  _tx_hash TEXT,
  _metadata JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.nft_mints
    (user_id, challenge_id, event_id, contract_address, token_id,
     recipient_address, tx_hash, metadata)
  VALUES
    (_user_id, _challenge_id, _event_id, _contract_address, _token_id,
     _recipient_address, _tx_hash, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END $$;

-- App settings helpers
CREATE OR REPLACE FUNCTION public.get_app_setting(_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT value FROM public.app_settings WHERE key = _key $$;

CREATE OR REPLACE FUNCTION public.set_app_setting(_key TEXT, _value TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_settings(key, value)
  VALUES (_key, _value)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = now();
END $$;
