-- Lock down direct INSERTs on arena_answers; force everything through arena_submit_answer (SECURITY DEFINER).
DROP POLICY IF EXISTS "Anyone can submit answers" ON public.arena_answers;
-- (no INSERT policy = no direct inserts; RPC bypasses RLS via SECURITY DEFINER)

-- Tighten the player UPDATE policy: only allow when nickname/score/user_id/session_id are unchanged.
-- This effectively limits guest updates to wallet_address attachment.
DROP POLICY IF EXISTS "Player can attach wallet" ON public.arena_players;

CREATE OR REPLACE FUNCTION public.arena_attach_wallet(_player_id UUID, _wallet TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _wallet IS NULL OR _wallet !~ '^0x[a-fA-F0-9]{40}$' THEN
    RAISE EXCEPTION 'Invalid wallet address';
  END IF;
  UPDATE arena_players SET wallet_address = _wallet WHERE id = _player_id;
END $$;
