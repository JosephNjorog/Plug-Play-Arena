// ═══════════════════════════════════════════════════════════════════
// Avalanche Plug n' Play — Types & Pure Helpers
// All catalog data now lives in Supabase (games, challenges, events).
// ═══════════════════════════════════════════════════════════════════

// ── Personas ───────────────────────────────────────────────────────
export type Persona = 'student' | 'developer' | 'builder' | 'founder' | 'business';

export const PERSONAS: { id: Persona; label: string; emoji: string; tagline: string; color: string }[] = [
  { id: 'student',   label: 'Student',    emoji: '🎓', tagline: 'Learn the basics, on-chain.',          color: 'persona-student' },
  { id: 'developer', label: 'Developer',  emoji: '💻', tagline: 'Ship subnets, contracts, dApps.',      color: 'persona-developer' },
  { id: 'builder',   label: 'Builder',    emoji: '🛠️', tagline: 'Design systems & ecosystems.',         color: 'persona-builder' },
  { id: 'founder',   label: 'Founder',    emoji: '🚀', tagline: 'Launch, fundraise, grow.',             color: 'persona-founder' },
  { id: 'business',  label: 'Business',   emoji: '🏢', tagline: 'Integrate Avalanche at scale.',        color: 'persona-business' },
];

// ── Journey Stages ─────────────────────────────────────────────────
export type JourneyStage = 'Explorer' | 'Learner' | 'Builder' | 'Architect' | 'Founder' | 'Champion';

export const JOURNEY_STAGES: { stage: JourneyStage; minXp: number; emoji: string }[] = [
  { stage: 'Explorer',  minXp: 0,    emoji: '🧭' },
  { stage: 'Learner',   minXp: 200,  emoji: '📘' },
  { stage: 'Builder',   minXp: 600,  emoji: '🔨' },
  { stage: 'Architect', minXp: 1200, emoji: '🏛️' },
  { stage: 'Founder',   minXp: 2200, emoji: '🚀' },
  { stage: 'Champion',  minXp: 4000, emoji: '👑' },
];

export function getJourneyStage(xp: number): JourneyStage {
  let stage: JourneyStage = 'Explorer';
  for (const s of JOURNEY_STAGES) if (xp >= s.minXp) stage = s.stage;
  return stage;
}

export function getNextJourneyStage(xp: number) {
  const idx = JOURNEY_STAGES.findIndex(s => xp < s.minXp);
  return idx === -1 ? null : JOURNEY_STAGES[idx];
}

// ── Game Types ────────────────────────────────────────────────────
export type GameCategory =
  | 'Quiz' | 'Simulation' | 'Puzzle' | 'Build Challenge'
  | 'Team Challenge' | 'Trivia' | 'Mission Quest' | 'Case Study'
  | 'Decision Game' | 'Leaderboard Challenge';

export type LearningTheme =
  | 'Avalanche Basics' | 'Consensus' | 'Subnets' | 'Wallets' | 'Testnet'
  | 'Smart Contracts' | 'Bridges' | 'NFTs' | 'DeFi' | 'Tokenomics'
  | 'Community' | 'Ecosystem Growth' | 'Business Use Cases' | 'Launch & Adoption';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface AvalancheGame {
  id: string;
  title: string;
  persona: Persona;
  category: GameCategory;
  difficulty: Difficulty;
  themes: LearningTheme[];
  description: string;
  learningOutcome: string;
  emoji: string;
  duration: string;
  xpReward: number;
  rewardType: 'xp' | 'nft' | 'merch' | 'token';
  eventTypes: ('IRL' | 'Zoom' | 'Hybrid')[];
  status: 'live' | 'soon';
}

// ── Event Types ───────────────────────────────────────────────────
export type EventFormat = 'IRL' | 'Zoom' | 'Hybrid';
export type EventCategory =
  | 'Hackathon' | 'Campus Event' | 'Founder Session'
  | 'Builder Workshop' | 'Community Meetup' | 'Conference';
export type EventStatus = 'upcoming' | 'live' | 'completed';

export interface AvalancheEvent {
  id: string;
  title: string;
  date: string;
  startTime: number;
  endTime: number;
  format: EventFormat;
  category: EventCategory;
  location: string;
  zoomUrl?: string;
  tracks: Persona[];
  difficulty: Difficulty;
  rewardPool: string;
  description: string;
  agenda: { time: string; title: string }[];
  missions: string[];
  attendees: number;
  capacity: number;
  status: EventStatus;
  ecosystem: 'Avalanche';
}

// ── Player Types ──────────────────────────────────────────────────
export interface NFTBadge {
  id: string;
  title: string;
  eventId: string;
  eventName: string;
  date: string;
  achievement: string;
  emoji: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
  mintedAt: number;
}

export interface RewardItem {
  id: string;
  type: 'token' | 'merch' | 'nft' | 'perk' | 'mentorship';
  title: string;
  description: string;
  value: string;
  emoji: string;
  eventId?: string;
  claimed: boolean;
  claimedAt?: number;
}

export interface MissionRecord {
  gameId: string;
  completedAt: number;
  score: number;
  xpEarned: number;
  eventId?: string;
}

export interface AvalanchePlayer {
  id: string;
  walletAddress: string;
  username: string;
  emoji: string;
  persona: Persona;
  xp: number;
  elo: number;
  stage: JourneyStage;
  streak: number;
  wins: number;
  gamesPlayed: number;
  events: string[];
  missions: MissionRecord[];
  rewards: RewardItem[];
  nfts: NFTBadge[];
  twitter?: string;
  email?: string;
  createdAt: number;
  lastPlayed: number;
}

// ── DB row → AvalancheGame mapper ─────────────────────────────────
export function dbRowToGame(row: {
  id: string; title: string; persona: string; category: string;
  difficulty: string; themes: string[]; description: string;
  learning_outcome: string; emoji: string; duration: string;
  xp_reward: number; reward_type: string; event_types: string[];
  status: string;
}): AvalancheGame {
  return {
    id: row.id,
    title: row.title,
    persona: row.persona as Persona,
    category: row.category as GameCategory,
    difficulty: row.difficulty as Difficulty,
    themes: row.themes as LearningTheme[],
    description: row.description,
    learningOutcome: row.learning_outcome,
    emoji: row.emoji,
    duration: row.duration,
    xpReward: row.xp_reward,
    rewardType: row.reward_type as AvalancheGame['rewardType'],
    eventTypes: row.event_types as AvalancheGame['eventTypes'],
    status: row.status as 'live' | 'soon',
  };
}

// ── DB row → AvalancheEvent mapper ────────────────────────────────
export function dbRowToEvent(row: {
  id: string; title: string; description: string | null;
  format: string; location: string | null; starts_at: string | null;
  ends_at: string | null; status: string; category: string | null;
  zoom_url: string | null; tracks: string[] | null; difficulty: string | null;
  reward_pool: string | null; agenda: unknown; missions: string[] | null;
  capacity: number | null;
}): AvalancheEvent {
  const startMs = row.starts_at ? new Date(row.starts_at).getTime() : Date.now();
  const endMs = row.ends_at ? new Date(row.ends_at).getTime() : startMs + 86_400_000;
  const now = Date.now();

  let status: EventStatus = 'upcoming';
  const dbStatus = row.status?.toLowerCase();
  if (dbStatus === 'live') status = 'live';
  else if (dbStatus === 'ended' || dbStatus === 'paused') status = 'completed';
  else if (endMs < now) status = 'completed';
  else if (startMs <= now) status = 'live';

  return {
    id: row.id,
    title: row.title,
    date: row.starts_at ? new Date(row.starts_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC',
    startTime: startMs,
    endTime: endMs,
    format: (() => {
      const f = row.format?.toLowerCase();
      if (f === 'zoom' || f === 'virtual' || f === 'online') return 'Zoom';
      if (f === 'hybrid') return 'Hybrid';
      return 'IRL';
    })() as EventFormat,
    category: (row.category || 'Community Meetup') as EventCategory,
    location: row.location || 'TBC',
    zoomUrl: row.zoom_url || undefined,
    tracks: (row.tracks || []) as Persona[],
    difficulty: (row.difficulty ? (row.difficulty.charAt(0).toUpperCase() + row.difficulty.slice(1)) : 'Beginner') as Difficulty,
    rewardPool: row.reward_pool || '',
    description: row.description || '',
    agenda: (Array.isArray(row.agenda) ? row.agenda : []) as { time: string; title: string }[],
    missions: row.missions || [],
    attendees: 0,
    capacity: row.capacity || 100,
    status,
    ecosystem: 'Avalanche',
  };
}
