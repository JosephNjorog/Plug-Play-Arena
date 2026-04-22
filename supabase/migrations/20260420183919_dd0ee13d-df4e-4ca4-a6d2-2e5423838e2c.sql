
-- Arena game sessions
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','live','finished')),
  join_code TEXT NOT NULL UNIQUE,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions viewable by everyone" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "Host can create sessions" ON public.game_sessions FOR INSERT WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "Host can update own sessions" ON public.game_sessions FOR UPDATE USING (auth.uid() = host_user_id);

-- Arena players (per session)
CREATE TABLE public.arena_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  nickname TEXT NOT NULL,
  wallet_address TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.arena_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena players viewable by everyone" ON public.arena_players FOR SELECT USING (true);
CREATE POLICY "Anyone authed can join" ON public.arena_players FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Score updates by host" ON public.arena_players FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND s.host_user_id = auth.uid())
  OR auth.uid() = user_id
);

-- Arena questions (reusable pool)
CREATE TABLE public.arena_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL DEFAULT 'stablecoins',
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard'))
);
ALTER TABLE public.arena_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions viewable by everyone" ON public.arena_questions FOR SELECT USING (true);

-- Arena answers (per session per question per player)
CREATE TABLE public.arena_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.arena_players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.arena_questions(id),
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.arena_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers viewable by session participants" ON public.arena_answers FOR SELECT USING (true);
CREATE POLICY "Players can submit answers" ON public.arena_answers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_answers;
