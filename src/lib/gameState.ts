export type Team = 'red' | 'blue' | 'green' | 'yellow';
export type TileOwner = Team | null;

export const EMOJIS = ['😀', '😎', '🤖', '👾', '🐸', '🐼', '🦊', '🐱', '🐵', '🐙', '🦄', '🐧', '🔥', '⚡', '🎯', '🎮'];

export const TEAM_EMOJIS: Record<Team, string> = {
  red: '🔴',
  blue: '🔵',
  green: '🟢',
  yellow: '🟡',
};

// ── Reward System ──────────────────────────────────────────────

export interface Reward {
  id: string;
  type: 'financial' | 'merch' | 'social';
  name: string;
  description: string;
  value: string;
  emoji: string;
  claimed: boolean;
  claimedAt?: number;
}

// ── Event System ───────────────────────────────────────────────

export interface GameEventDef {
  id: string;
  name: string;
  location: string;
  startTime: number;
  endTime: number;
}

export const ACTIVE_EVENTS: GameEventDef[] = [
  { id: 'avalanche-nairobi-2026', name: 'Nairobi Blockchain Week', location: 'Nairobi', startTime: Date.now(), endTime: Date.now() + 7 * 86400000 },
  { id: 'business-safari-2026', name: 'Business Safari', location: 'Dar es Salaam', startTime: Date.now(), endTime: Date.now() + 3 * 86400000 },
  { id: 'hackathon-kigali-2026', name: 'Kigali Hackathon', location: 'Kigali', startTime: Date.now(), endTime: Date.now() + 2 * 86400000 },
  { id: 'uni-lagos-2026', name: 'Lagos University Activation', location: 'Lagos', startTime: Date.now(), endTime: Date.now() + 1 * 86400000 },
];

// ── Player ─────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  team: Team;
  clicks: number;
  address: string;
  emoji: string;
  ready: boolean;
  elo: number;
  xp: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  tier: EloTier;
  achievements: Achievement[];
  rewards: Reward[];
  eventId?: string;
  twitter?: string;
  email?: string;
  createdAt: number;
  lastPlayed: number;
}

export type EloTier = 'Rising' | 'Contender' | 'Veteran' | 'Elite' | 'Legend';

export const ELO_TIERS: { tier: EloTier; min: number; emoji: string; color: string }[] = [
  { tier: 'Legend', min: 1800, emoji: '👑', color: 'text-yellow-400' },
  { tier: 'Elite', min: 1600, emoji: '🔥', color: 'text-orange-400' },
  { tier: 'Veteran', min: 1400, emoji: '⚡', color: 'text-blue-400' },
  { tier: 'Contender', min: 1200, emoji: '🎯', color: 'text-green-400' },
  { tier: 'Rising', min: 0, emoji: '🌱', color: 'text-emerald-300' },
];

export function getTier(elo: number): EloTier {
  for (const t of ELO_TIERS) {
    if (elo >= t.min) return t.tier;
  }
  return 'Rising';
}

export function getTierInfo(tier: EloTier) {
  return ELO_TIERS.find(t => t.tier === tier)!;
}

// ── Achievements ───────────────────────────────────────────────

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win', name: 'First Win', description: 'Win your first match', emoji: '🏆', unlocked: false },
  { id: '5-wins', name: '5 Wins', description: 'Win 5 matches', emoji: '⭐', unlocked: false },
  { id: '10-wins', name: '10 Wins', description: 'Win 10 matches', emoji: '🌟', unlocked: false },
  { id: 'comeback', name: 'Comeback King', description: 'Win from behind', emoji: '👑', unlocked: false },
  { id: 'top-player', name: 'Top Player', description: 'Reach #1 on leaderboard', emoji: '🥇', unlocked: false },
  { id: 'legend', name: 'Legend', description: 'Reach Legend tier', emoji: '🔥', unlocked: false },
  { id: '100-clicks', name: 'Click Master', description: 'Make 100 clicks in one game', emoji: '🖱️', unlocked: false },
  { id: 'streak-3', name: 'Hot Streak', description: 'Win 3 games in a row', emoji: '🔥', unlocked: false },
  { id: 'vip-founder', name: 'VIP Founder', description: 'Reach Elite tier', emoji: '💎', unlocked: false },
  { id: 'event-pioneer', name: 'Event Pioneer', description: 'Play at your first event', emoji: '🎪', unlocked: false },
];

// ── Reward Assignment Logic ────────────────────────────────────

let rewardCounter = 0;

export function assignMatchRewards(player: Player, won: boolean, winningTeam: Team): Reward[] {
  const rewards: Reward[] = [];

  if (won) {
    rewards.push({
      id: `reward-${++rewardCounter}`,
      type: 'financial',
      name: 'Victory AVAX',
      description: 'Winner bonus',
      value: '0.5 AVAX',
      emoji: '💰',
      claimed: false,
    });
  }

  if (player.xp > 500) {
    rewards.push({
      id: `reward-${++rewardCounter}`,
      type: 'merch',
      name: 'Genesis Hoodie',
      description: 'Redeem at event booth',
      value: 'Hoodie Voucher',
      emoji: '🧥',
      claimed: false,
    });
  }

  if (player.clicks >= 50) {
    rewards.push({
      id: `reward-${++rewardCounter}`,
      type: 'merch',
      name: 'Avalanche Sticker Pack',
      description: 'Redeem at event booth',
      value: 'Sticker Pack',
      emoji: '🎨',
      claimed: false,
    });
  }

  // Everyone gets an XP badge
  rewards.push({
    id: `reward-${++rewardCounter}`,
    type: 'social',
    name: won ? 'Winner Badge' : 'Participant Badge',
    description: 'Achievement badge',
    value: won ? '100 XP' : '30 XP',
    emoji: won ? '🏅' : '🎖️',
    claimed: false,
  });

  return rewards;
}

// ── Check & Unlock Achievements ────────────────────────────────

export function checkAchievements(player: Player): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  const unlockedIds = new Set(player.achievements.filter(a => a.unlocked).map(a => a.id));

  const checks: [string, boolean][] = [
    ['first-win', player.wins >= 1],
    ['5-wins', player.wins >= 5],
    ['10-wins', player.wins >= 10],
    ['100-clicks', player.clicks >= 100],
    ['legend', player.tier === 'Legend'],
    ['vip-founder', player.tier === 'Elite' || player.tier === 'Legend'],
    ['event-pioneer', !!player.eventId],
  ];

  for (const [id, condition] of checks) {
    if (condition && !unlockedIds.has(id)) {
      const ach = ALL_ACHIEVEMENTS.find(a => a.id === id);
      if (ach) newlyUnlocked.push({ ...ach, unlocked: true });
    }
  }

  return newlyUnlocked;
}

// ── Sessions ───────────────────────────────────────────────────

export interface GameSession {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  grid: TileOwner[][];
  timeLeft: number;
  winner?: Team;
  rounds: number;
  host: string;
  date: string;
  games: string[];
  eventId?: string;
}

export interface GameDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  playCount: number;
  rating: number;
  category: string;
}

export const GAME_LIBRARY: GameDef[] = [
  { id: 'plug-grid', name: 'Plug Grid', description: 'Claim tiles, dominate the board. The classic plugn\'play experience.', emoji: '🟩', playCount: 87, rating: 4.8, category: 'Strategy' },
  { id: 'mafia', name: 'Mafia', description: 'Social deduction: find the impostor before time runs out.', emoji: '🕵️', playCount: 45, rating: 4.6, category: 'Social' },
  { id: 'trivia', name: 'Trivia Blast', description: 'Test your knowledge across multiple categories.', emoji: '🧠', playCount: 62, rating: 4.5, category: 'Knowledge' },
  { id: 'spelling-bee', name: 'Spelling Bee', description: 'Create words from a set of letters. Longest word wins.', emoji: '🐝', playCount: 38, rating: 4.7, category: 'Word' },
  { id: 'split-steal', name: 'Split/Steal', description: 'Game theory in action. Trust or betray your opponent.', emoji: '🤝', playCount: 29, rating: 4.3, category: 'Strategy' },
  { id: 'kubaf', name: 'Kubaf', description: 'Fast-paced card matching. Quick reflexes required.', emoji: '🃏', playCount: 33, rating: 4.4, category: 'Speed' },
  { id: 'action-numbers', name: 'Action Numbers', description: 'Math-based speed game. Solve equations to score.', emoji: '🔢', playCount: 21, rating: 4.2, category: 'Math' },
  { id: 'password', name: 'Password', description: 'Give one-word clues to help your team guess the secret word.', emoji: '🔑', playCount: 41, rating: 4.6, category: 'Social' },
  { id: 'whats-the-image', name: "What's the Image", description: 'Identify pixelated images as they slowly reveal.', emoji: '😶', playCount: 27, rating: 4.1, category: 'Visual' },
  { id: 'kenya-at-50', name: 'Kenya at 50', description: 'Cultural trivia about Kenya. How well do you know it?', emoji: '📗', playCount: 18, rating: 4.0, category: 'Knowledge' },
  { id: 'garbage', name: 'Garbage', description: 'Card game of luck and strategy. First to fill your row wins.', emoji: '🗑️', playCount: 15, rating: 3.9, category: 'Card' },
];

export const GRID_SIZE = 20;
export const GRID_SIZE_MOBILE = 12;
export const GAME_DURATION = 300;
export const CLICK_COOLDOWN = 300;
export const TEAMS: Team[] = ['red', 'blue', 'green', 'yellow'];

export const TEAM_COLORS: Record<Team, string> = {
  red: 'tile-red',
  blue: 'tile-blue',
  green: 'tile-green',
  yellow: 'tile-yellow',
};

export const TEAM_LABELS: Record<Team, string> = {
  red: 'Team Red',
  blue: 'Team Blue',
  green: 'Team Green',
  yellow: 'Team Yellow',
};

export const TEAM_TEXT_COLORS: Record<Team, string> = {
  red: 'text-team-red',
  blue: 'text-team-blue',
  green: 'text-team-green',
  yellow: 'text-team-yellow',
};

export const TEAM_BG_COLORS: Record<Team, string> = {
  red: 'bg-team-red',
  blue: 'bg-team-blue',
  green: 'bg-team-green',
  yellow: 'bg-team-yellow',
};

export function createEmptyGrid(size = GRID_SIZE): TileOwner[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
}

export function countTiles(grid: TileOwner[][]): Record<Team, number> {
  const counts: Record<Team, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const row of grid) {
    for (const tile of row) {
      if (tile) counts[tile]++;
    }
  }
  return counts;
}

export function getWinner(grid: TileOwner[][]): Team {
  const counts = countTiles(grid);
  return TEAMS.reduce((a, b) => (counts[a] >= counts[b] ? a : b));
}

export function calculateEloChange(playerElo: number, opponentAvgElo: number, won: boolean): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentAvgElo - playerElo) / 400));
  const score = won ? 1 : 0;
  return Math.round(K * (score - expected));
}

// ── localStorage persistence ───────────────────────────────────

const PLAYER_STORAGE_KEY = 'plugnplay_player';

export function savePlayerToStorage(player: Player) {
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
  } catch {}
}

export function loadPlayerFromStorage(): Player | null {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPlayerStorage() {
  try {
    localStorage.removeItem(PLAYER_STORAGE_KEY);
  } catch {}
}

// ── Mock data generators ───────────────────────────────────────

const MOCK_NAMES = ['CryptoKing', 'AvaLanche', 'BlockBuster', 'TokenTiger', 'ChainMaster', 'PixelPunk', 'NeonNinja', 'GridGuru', 'TileTitan', 'WaveMaker', 'ByteBoss', 'HashHero', 'Sonnie', 'Abeisgay', 'Superman', 'Lola', 'Marsh', 'Rambo', 'Babu', 'Gee', 'Potato'];

export function generateMockPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => {
    const elo = 950 + Math.floor(Math.random() * 150);
    const wins = Math.floor(Math.random() * 12);
    const losses = Math.floor(Math.random() * 10);
    return {
      id: `player-${i}`,
      name: MOCK_NAMES[i % MOCK_NAMES.length] + (i >= MOCK_NAMES.length ? i : ''),
      team: TEAMS[i % 4],
      clicks: Math.floor(Math.random() * 50),
      address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      emoji: EMOJIS[i % EMOJIS.length],
      ready: Math.random() > 0.3,
      elo,
      xp: wins * 100 + Math.floor(Math.random() * 200),
      wins,
      losses,
      gamesPlayed: wins + losses,
      tier: getTier(elo),
      achievements: ALL_ACHIEVEMENTS.slice(0, Math.floor(Math.random() * 3)).map(a => ({ ...a, unlocked: true })),
      rewards: [],
      createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 30),
      lastPlayed: Date.now() - Math.floor(Math.random() * 86400000 * 7),
    };
  });
}

export interface SessionHistory {
  id: string;
  name: string;
  host: string;
  date: string;
  status: 'completed' | 'live' | 'upcoming';
  playerCount: number;
  rounds: number;
  winnerTeam: string;
  winnerMembers: string[];
  games: string[];
  playerAvatars: string[];
  eventId?: string;
}

export function generateMockSessionHistory(): SessionHistory[] {
  return [
    {
      id: 's1', name: 'Trial 3', host: 'Abe', date: 'Sun, 12 Apr 2026',
      status: 'completed', playerCount: 15, rounds: 2,
      winnerTeam: 'Poa Gang', winnerMembers: ['Sonnie', 'castro', 'Ladi', 'Jano K', 'Rambo'],
      games: ['Action Numbers', 'Password'],
      playerAvatars: ['🦋', '🐸', '🤖', '😎'],
      eventId: 'avalanche-nairobi-2026',
    },
    {
      id: 's2', name: 'Trial 1', host: 'Abe', date: 'Sun, 12 Apr 2026',
      status: 'completed', playerCount: 31, rounds: 4,
      winnerTeam: 'Team Tembo', winnerMembers: ['Superman', 'Tata Nyaks', 'Gee', 'Potato', 'Sonnie', 'Lovely'],
      games: ['Spelling Bee', 'Kubaf', 'Split/Steal', 'Kenya at 50'],
      playerAvatars: ['🐸', '😎', '🤖', '🦊', '🐱'],
      eventId: 'avalanche-nairobi-2026',
    },
    {
      id: 's3', name: "plugn'play", host: 'Kitchen 533', date: 'Sat, 11 Apr 2026',
      status: 'completed', playerCount: 30, rounds: 5,
      winnerTeam: 'Team Mamba', winnerMembers: ['Lola', 'Abeisgay', 'Marsh', 'Sonnie', 'Rambo', 'Babu'],
      games: ['Kubaf', 'Password', "What's the image", 'Kenya at 50', 'Split/Steal'],
      playerAvatars: ['😎', '🤖', '👾', '🐸', '🦊'],
      eventId: 'business-safari-2026',
    },
    {
      id: 's4', name: "Plot n Play #Game 2", host: 'Kitchen533', date: 'Sat, 11 Apr 2026',
      status: 'completed', playerCount: 25, rounds: 3,
      winnerTeam: 'Alpha Squad', winnerMembers: ['CryptoKing', 'NeonNinja', 'GridGuru'],
      games: ['Plug Grid', 'Trivia Blast', 'Garbage'],
      playerAvatars: ['🔥', '⚡', '🎮', '🦄'],
      eventId: 'hackathon-kigali-2026',
    },
  ];
}

export function generateMockLeaderboard(): Player[] {
  const players = generateMockPlayers(32);
  return players
    .map((p, i) => ({
      ...p,
      elo: 1038 - i * 3 + Math.floor(Math.random() * 5),
      wins: 10 - Math.floor(i / 4),
      losses: Math.floor(Math.random() * 8),
    }))
    .map(p => ({ ...p, tier: getTier(p.elo), gamesPlayed: p.wins + p.losses }))
    .sort((a, b) => b.elo - a.elo);
}

export function generateMockSessions(): GameSession[] {
  return [
    { id: '1', name: 'Avalanche Arena #1', players: generateMockPlayers(12), maxPlayers: 50, status: 'waiting', grid: createEmptyGrid(), timeLeft: GAME_DURATION, rounds: 3, host: 'CryptoKing', date: 'Today', games: ['Plug Grid'], eventId: 'avalanche-nairobi-2026' },
    { id: '2', name: 'Summit Showdown', players: generateMockPlayers(32), maxPlayers: 50, status: 'playing', grid: createEmptyGrid(), timeLeft: 180, rounds: 5, host: 'AvaLanche', date: 'Today', games: ['Plug Grid', 'Trivia'], eventId: 'avalanche-nairobi-2026' },
    { id: '3', name: 'Hackathon Battle', players: generateMockPlayers(8), maxPlayers: 20, status: 'waiting', grid: createEmptyGrid(), timeLeft: GAME_DURATION, rounds: 2, host: 'BlockBuster', date: 'Today', games: ['Plug Grid'], eventId: 'hackathon-kigali-2026' },
  ];
}
