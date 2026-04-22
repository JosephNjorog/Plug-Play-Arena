ALTER TABLE public.game_sessions
  ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS winner_player_id UUID,
  ADD COLUMN IF NOT EXISTS winner_claimed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.arena_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  winner_player_id UUID NOT NULL REFERENCES public.arena_players(id) ON DELETE CASCADE,
  user_id UUID,
  wallet_address TEXT,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  nft_tx_hash TEXT,
  nft_token_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

ALTER TABLE public.arena_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Arena results viewable by everyone"
  ON public.arena_results FOR SELECT USING (true);

CREATE POLICY "Host can record winner"
  ON public.arena_results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = arena_results.session_id AND s.host_user_id = auth.uid()
  ));

CREATE POLICY "Host can update winner record"
  ON public.arena_results FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = arena_results.session_id AND s.host_user_id = auth.uid()
  ));

-- Atomic, secure scoring RPC: insert answer + bump score in one shot.
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
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

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

ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_results;