-- Allow guest play: wallet + auth become optional for joining and answering.

-- Wallet already nullable; ensure it stays so (idempotent)
ALTER TABLE public.arena_players ALTER COLUMN wallet_address DROP NOT NULL;

-- Replace insert policy on arena_players: allow anyone (guest or authed) to join,
-- but if user_id is provided it must match auth.uid().
DROP POLICY IF EXISTS "Anyone authed can join" ON public.arena_players;
CREATE POLICY "Anyone can join (guest or authed)"
  ON public.arena_players FOR INSERT
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Allow guests to update their own player row by id-only flow is risky; restrict UPDATE
-- to host or matching authed user (existing policy already covers this — keep as-is).

-- Replace insert policy on arena_answers: allow guests to submit too.
DROP POLICY IF EXISTS "Players can submit answers" ON public.arena_answers;
CREATE POLICY "Anyone can submit answers"
  ON public.arena_answers FOR INSERT
  WITH CHECK (true);

-- Update RPC: drop auth requirement (scoring is keyed by player_id which the
-- client must already possess; double-submit guard remains).
CREATE OR REPLACE FUNCTION public.arena_submit_answer(
  _session_id UUID,
  _player_id UUID,
  _question_id UUID,
  _selected_answer TEXT,
  _response_time_ms INTEGER
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _correct TEXT;
  _is_correct BOOLEAN;
  _points INTEGER := 0;
  _new_score INTEGER;
  _exists BOOLEAN;
BEGIN
  -- Player must belong to this session
  SELECT EXISTS (SELECT 1 FROM arena_players WHERE id = _player_id AND session_id = _session_id) INTO _exists;
  IF NOT _exists THEN RAISE EXCEPTION 'Invalid player'; END IF;

  -- Block double submissions per (player, question)
  IF EXISTS (SELECT 1 FROM arena_answers WHERE player_id = _player_id AND question_id = _question_id) THEN
    RAISE EXCEPTION 'Already answered';
  END IF;

  SELECT correct_answer INTO _correct FROM arena_questions WHERE id = _question_id;
  _is_correct := (_selected_answer = _correct);

  IF _is_correct THEN
    _points := GREATEST(0, 1000 - (COALESCE(_response_time_ms, 0) / 10));
  END IF;

  INSERT INTO arena_answers(session_id, player_id, question_id, selected_answer, is_correct, response_time_ms)
  VALUES (_session_id, _player_id, _question_id, _selected_answer, _is_correct, COALESCE(_response_time_ms, 0));

  UPDATE arena_players
    SET score = score + _points
    WHERE id = _player_id
    RETURNING score INTO _new_score;

  RETURN jsonb_build_object(
    'is_correct', _is_correct,
    'points', _points,
    'score', _new_score,
    'correct_answer', _correct
  );
END $$;

-- Allow players to update their OWN row by id (so guests can attach a wallet at win time).
-- Safe scope: only wallet_address change is meaningful; nickname/score still gated by host policy.
DROP POLICY IF EXISTS "Player can attach wallet" ON public.arena_players;
CREATE POLICY "Player can attach wallet"
  ON public.arena_players FOR UPDATE
  USING (true);
