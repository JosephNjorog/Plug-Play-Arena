-- =====================================================
-- Gaming on Avalanche: arena questions + game session
-- event linkage + leaderboard includes arena scores
-- =====================================================

-- Add event_id and topic to game_sessions
ALTER TABLE public.game_sessions
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS topic TEXT;

-- 10 Gaming on Avalanche arena questions
INSERT INTO public.arena_questions (topic, question_text, options, correct_answer, difficulty) VALUES

('gaming_avax',
 'Which of these games is built and playable on Avalanche?',
 '{"A":"Fortnite","B":"Off the Grid","C":"Minecraft","D":"Among Us"}',
 'B', 'easy'),

('gaming_avax',
 'Which studio developed the AAA battle royale game "Off the Grid" on Avalanche?',
 '{"A":"Epic Games","B":"Ubisoft","C":"Gunzilla","D":"Riot Games"}',
 'C', 'easy'),

('gaming_avax',
 'DeFi Kingdoms on Avalanche is best described as which genre?',
 '{"A":"First-Person Shooter","B":"Real-Time Strategy","C":"Battle Royale","D":"RPG combined with DeFi mechanics"}',
 'D', 'easy'),

('gaming_avax',
 'What is an Avalanche Subnet (L1) used for in gaming?',
 '{"A":"Storing player data offline","B":"A custom blockchain with dedicated rules and validators for a game","C":"Broadcasting live gameplay","D":"Hosting centralised NFT marketplaces"}',
 'B', 'medium'),

('gaming_avax',
 'Which wallet is the official gateway for interacting with Avalanche games?',
 '{"A":"MetaMask","B":"Trust Wallet","C":"Core Wallet","D":"Phantom"}',
 'C', 'easy'),

('gaming_avax',
 'What is Arcad3 in the Avalanche ecosystem?',
 '{"A":"A game development studio","B":"An NFT auction platform","C":"The Avalanche gaming community hub built by gamers for gamers","D":"A Layer 2 scaling solution"}',
 'C', 'medium'),

('gaming_avax',
 'What does Play-to-Earn (P2E) mean for players?',
 '{"A":"Pay an entry fee to play premium titles","B":"Earn real blockchain tokens and NFTs with true ownership while playing","C":"Play offline to unlock discount codes","D":"Earn money by streaming your gameplay on Twitch"}',
 'B', 'easy'),

('gaming_avax',
 'Approximately what is Avalanche''s transaction finality time — crucial for real-time gaming?',
 '{"A":"10 minutes","B":"3 minutes","C":"~1 second","D":"30 seconds"}',
 'C', 'easy'),

('gaming_avax',
 'Which of these is a real game featured on gamingonavax.com?',
 '{"A":"Call of Duty","B":"Spellborne","C":"Roblox","D":"GTA V"}',
 'B', 'easy'),

('gaming_avax',
 'What key combination makes Avalanche ideal for game developers?',
 '{"A":"High fees and slow finality","B":"No smart contract support","C":"Creative freedom, scalable subnets, and low-latency infrastructure","D":"Limited developer tools"}',
 'C', 'medium')

ON CONFLICT DO NOTHING;

-- Update get_leaderboard to include arena scores alongside profile XP
-- (quest XP is already in profiles.xp via auto-award on submission)
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  _limit INTEGER DEFAULT 50,
  _persona public.persona DEFAULT NULL
)
RETURNS TABLE (
  user_id    UUID,
  username   TEXT,
  emoji      TEXT,
  persona    public.persona,
  xp         INTEGER,
  level      INTEGER,
  stage      TEXT,
  streak     INTEGER,
  status_tag TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.username,
    p.emoji,
    p.persona,
    (p.xp + COALESCE(a.arena_score, 0))::INTEGER AS xp,
    p.level,
    p.stage,
    p.streak,
    p.status_tag
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, SUM(score)::INTEGER AS arena_score
    FROM public.arena_players
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  ) a ON a.user_id = p.user_id
  WHERE _persona IS NULL OR p.persona = _persona
  ORDER BY (p.xp + COALESCE(a.arena_score, 0)) DESC, p.created_at ASC
  LIMIT GREATEST(1, LEAST(200, _limit));
$$;
