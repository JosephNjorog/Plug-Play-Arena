-- =====================================================
-- SEED: PLATFORM EVENTS (7 events)
-- is_platform_event = true means admin-owned.
-- host_user_id = NULL for platform events.
-- =====================================================
INSERT INTO public.events (
  title, description, format, location, status,
  category, zoom_url, tracks, difficulty, reward_pool,
  cover_emoji, agenda, missions, capacity, starts_at, ends_at,
  is_platform_event, leaderboard_visible
) VALUES

-- 1. Nairobi Blockchain Week (LIVE)
(
  'Nairobi Blockchain Week — Avalanche Day',
  'A full day inside the Avalanche ecosystem at NBW — workshops, missions, and a live leaderboard.',
  'irl', 'Sarit Expo, Nairobi',
  'live',
  'Conference', NULL,
  ARRAY['student','developer','founder','business'],
  'intermediate', '$5,000 + Merch + NFTs',
  '⚡',
  '[{"time":"09:00","title":"Check-in & Wallet Setup Mission"},{"time":"10:00","title":"Avalanche Fundamentals Live Quiz"},{"time":"12:00","title":"Subnet Builder Hands-on"},{"time":"15:00","title":"Founder Pitch Boss Fight"},{"time":"17:00","title":"NFT Mint & Awards"}]',
  ARRAY['wallet-setup','av-explorer-quiz','subnet-builder-sim','pitch-deck-boss'],
  600,
  now() - interval '1 day',
  now() + interval '2 days',
  true, true
),

-- 2. Avalanche Dev Session #7 (UPCOMING – Zoom)
(
  'Avalanche Dev Session #7 — Subnets in 60',
  'Live Zoom session: spin up a subnet, deploy a precompile, and ship to Fuji.',
  'zoom', 'Virtual',
  'draft',
  'Builder Workshop',
  'https://zoom.us/j/avalanche',
  ARRAY['developer','builder'],
  'advanced', 'NFT Badge + 0.5 AVAX top performer',
  '🖥️',
  '[{"time":"17:00","title":"Welcome & Check-in"},{"time":"17:10","title":"Subnet Builder Sim (live)"},{"time":"18:00","title":"Deploy on Fuji mission"},{"time":"18:45","title":"Q&A + NFT mint"}]',
  ARRAY['subnet-builder-sim','deploy-on-fuji','smart-contract-sprint'],
  200,
  now() + interval '5 days',
  now() + interval '5 days' + interval '3 hours',
  true, true
),

-- 3. Strathmore Campus Activation (UPCOMING – Hybrid)
(
  'Strathmore Campus Activation',
  'Hands-on Avalanche onboarding for students — wallet setup, scavenger hunt, dev sprint.',
  'hybrid', 'Strathmore University, Nairobi',
  'draft',
  'Campus Event',
  'https://zoom.us/j/campus',
  ARRAY['student','developer'],
  'beginner', 'Merch packs + Genesis NFT for top 25',
  '🎓',
  '[{"time":"10:00","title":"Wallet Setup + Bingo"},{"time":"11:30","title":"Ecosystem Scavenger Hunt"},{"time":"14:00","title":"Smart Contract Sprint"},{"time":"16:00","title":"NFT mint + photos"}]',
  ARRAY['wallet-setup','blockchain-bingo','eco-scavenger','smart-contract-sprint'],
  250,
  now() + interval '12 days',
  now() + interval '12 days' + interval '5 hours',
  true, true
),

-- 4. Founder Roundtable Lagos (UPCOMING – IRL)
(
  'Founder Roundtable — Lagos',
  'Closed-door session with Avalanche founders. Pitch, fundraise, partner.',
  'irl', 'Lekki, Lagos',
  'draft',
  'Founder Session', NULL,
  ARRAY['founder','business'],
  'intermediate', 'Mentor intros + Pitch slot + NFT',
  '🚀',
  '[{"time":"14:00","title":"Founder Fit Challenge"},{"time":"15:00","title":"GTM Arena (live)"},{"time":"16:30","title":"Pitch Deck Boss Fight"}]',
  ARRAY['founder-fit','gtm-arena','pitch-deck-boss','eco-partnership'],
  40,
  now() + interval '25 days',
  now() + interval '25 days' + interval '4 hours',
  true, true
),

-- 5. Kigali Avalanche Hackathon (UPCOMING – IRL)
(
  'Kigali Avalanche Hackathon',
  '48-hour hackathon to ship subnets, dApps, and AI×Avalanche experiences.',
  'irl', 'Norrsken House, Kigali',
  'draft',
  'Hackathon', NULL,
  ARRAY['developer','builder','founder'],
  'advanced', '$15,000 + Subnet credits + NFTs',
  '⚔️',
  '[{"time":"Day 1 09:00","title":"Opening + Team Formation"},{"time":"Day 1 12:00","title":"Subnet Builder Workshop"},{"time":"Day 2 09:00","title":"Build Sprint"},{"time":"Day 3 14:00","title":"Demos + NFT mint"}]',
  ARRAY['subnet-builder-sim','smart-contract-sprint','launch-strategy','pitch-deck-boss'],
  300,
  now() + interval '40 days',
  now() + interval '42 days',
  true, true
),

-- 6. Avalanche for Business Q2 Briefing (COMPLETED)
(
  'Avalanche for Business — Q2 Briefing',
  'Executive briefing for enterprises evaluating Avalanche subnets and tokenisation.',
  'zoom', 'Virtual',
  'ended',
  'Conference',
  'https://zoom.us/j/business',
  ARRAY['business','founder'],
  'beginner', 'Briefing NFT + Pilot intro',
  '🏢',
  '[{"time":"15:00","title":"Avalanche for Enterprise"},{"time":"15:45","title":"Use Case Sprint"}]',
  ARRAY['enterprise-integration','av-use-case-sprint','business-explorer'],
  500,
  now() - interval '30 days',
  now() - interval '30 days' + interval '2 hours',
  true, true
),

-- 7. Community Meetup Dar es Salaam (COMPLETED)
(
  'Avalanche Community Meetup — Dar',
  'Casual meetup, lightning talks, and live missions.',
  'irl', 'Mlimani City, Dar es Salaam',
  'ended',
  'Community Meetup', NULL,
  ARRAY['student','developer','builder'],
  'beginner', 'Merch + Participation NFT',
  '🌍',
  '[{"time":"18:00","title":"Lightning talks"},{"time":"19:00","title":"Live missions + Bingo"}]',
  ARRAY['av-explorer-quiz','blockchain-bingo','community-growth'],
  150,
  now() - interval '60 days',
  now() - interval '60 days' + interval '4 hours',
  true, true
)

ON CONFLICT DO NOTHING;
