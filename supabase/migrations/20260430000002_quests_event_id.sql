-- Add event_id to quests — quests with event_id are exclusive to that event page
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Link the 10 Gamers Roundtable quests to their event
UPDATE public.quests
SET event_id = (
  SELECT id FROM public.events
  WHERE title = 'Gamers Roundtable with Avalanche Team1'
  LIMIT 1
)
WHERE id IN (
  'grt-q1-intro-gaming',
  'grt-q2-why-avalanche',
  'grt-q3-off-the-grid',
  'grt-q4-defi-kingdoms',
  'grt-q5-gaming-subnet',
  'grt-q6-game-types',
  'grt-q7-core-wallet',
  'grt-q8-arcad3',
  'grt-q9-play-to-earn',
  'grt-q10-avax-advantage'
);
