export type GameEventType = 'gas-spike' | 'avalanche-boost' | 'network-congestion' | 'tile-multiplier';

export interface GameEvent {
  id: string;
  type: GameEventType;
  name: string;
  description: string;
  emoji: string;
  duration: number;
  startedAt: number;
  multiplier?: number;
}

export interface ActivityFeedItem {
  id: string;
  message: string;
  emoji: string;
  timestamp: number;
  type: 'claim' | 'event' | 'tier-up' | 'round-end' | 'join' | 'reward' | 'achievement';
}

export const GAME_EVENT_DEFS: Omit<GameEvent, 'id' | 'startedAt'>[] = [
  {
    type: 'gas-spike',
    name: 'Gas Spike',
    description: 'Cooldown increased! Choose tiles wisely.',
    emoji: '⛽',
    duration: 15,
  },
  {
    type: 'avalanche-boost',
    name: 'Avalanche Boost',
    description: '2x XP for all claims!',
    emoji: '🔺',
    duration: 20,
    multiplier: 2,
  },
  {
    type: 'network-congestion',
    name: 'Network Congestion',
    description: 'Visual distortion active. Stay focused!',
    emoji: '🌐',
    duration: 10,
  },
  {
    type: 'tile-multiplier',
    name: 'Tile Multiplier',
    description: 'Bonus tiles worth 3x!',
    emoji: '✨',
    duration: 15,
    multiplier: 3,
  },
];

let eventCounter = 0;

export function generateRandomEvent(): GameEvent {
  const def = GAME_EVENT_DEFS[Math.floor(Math.random() * GAME_EVENT_DEFS.length)];
  return {
    ...def,
    id: `event-${++eventCounter}`,
    startedAt: Date.now(),
  };
}

let feedCounter = 0;

export function createFeedItem(
  message: string,
  emoji: string,
  type: ActivityFeedItem['type']
): ActivityFeedItem {
  return {
    id: `feed-${++feedCounter}`,
    message,
    emoji,
    timestamp: Date.now(),
    type,
  };
}
