import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  Team, Player, GameSession, TileOwner, Reward,
  GRID_SIZE, GRID_SIZE_MOBILE, GAME_DURATION, CLICK_COOLDOWN, TEAMS,
  createEmptyGrid, countTiles, getWinner, generateMockPlayers, EMOJIS,
  getTier, calculateEloChange, ALL_ACHIEVEMENTS,
  assignMatchRewards, checkAchievements,
  savePlayerToStorage, loadPlayerFromStorage, clearPlayerStorage,
  ACTIVE_EVENTS,
} from './gameState';
import {
  GameEvent, ActivityFeedItem,
  generateRandomEvent, createFeedItem,
} from './gameEvents';

export type GamePhase = 'landing' | 'profile' | 'team' | 'lobby' | 'playing' | 'results';

export type TileState = 'normal' | 'bonus' | 'blocked';

interface GameContextType {
  walletConnected: boolean;
  walletAddress: string;
  connectWallet: () => void;
  disconnectWallet: () => void;
  currentPlayer: Player | null;
  currentSession: GameSession | null;
  setPlayerProfile: (name: string, emoji: string) => void;
  selectTeam: (team: Team) => void;
  joinSession: () => void;
  leaveSession: () => void;
  startGame: () => void;
  claimTile: (row: number, col: number) => void;
  tileCounts: Record<Team, number>;
  gamePhase: GamePhase;
  setGamePhase: (phase: GamePhase) => void;
  toggleReady: () => void;
  gridSize: number;
  eloChange: number;
  activeEvent: GameEvent | null;
  activityFeed: ActivityFeedItem[];
  tileStates: TileState[][];
  matchRewards: Reward[];
  selectedEventId: string;
  setSelectedEventId: (id: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('landing');
  const [tileCounts, setTileCounts] = useState<Record<Team, number>>({ red: 0, blue: 0, green: 0, yellow: 0 });
  const [eloChange, setEloChange] = useState(0);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [tileStates, setTileStates] = useState<TileState[][]>([]);
  const [matchRewards, setMatchRewards] = useState<Reward[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(ACTIVE_EVENTS[0]?.id || '');
  const lastClickRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const eventRef = useRef<ReturnType<typeof setInterval>>();

  const addFeedItem = useCallback((message: string, emoji: string, type: ActivityFeedItem['type']) => {
    setActivityFeed(prev => [createFeedItem(message, emoji, type), ...prev].slice(0, 30));
  }, []);

  const [gridSize, setGridSize] = useState(GRID_SIZE);
  useEffect(() => {
    const check = () => setGridSize(window.innerWidth < 640 ? GRID_SIZE_MOBILE : GRID_SIZE);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Persist player changes to localStorage
  useEffect(() => {
    if (currentPlayer) savePlayerToStorage(currentPlayer);
  }, [currentPlayer]);

  const generateTileStates = useCallback((size: number): TileState[][] => {
    const states: TileState[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => 'normal' as TileState)
    );
    const bonusCount = Math.floor(size * size * 0.04);
    for (let i = 0; i < bonusCount; i++) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      states[r][c] = 'bonus';
    }
    const blockedCount = Math.floor(size * size * 0.03);
    for (let i = 0; i < blockedCount; i++) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (states[r][c] === 'normal') states[r][c] = 'blocked';
    }
    return states;
  }, []);

  const connectWallet = useCallback(() => {
    // Try to restore persisted player
    const saved = loadPlayerFromStorage();
    if (saved) {
      setCurrentPlayer(saved);
      setWalletAddress(saved.address);
      setWalletConnected(true);
      setGamePhase('team');
      return;
    }
    const addr = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    setWalletAddress(addr);
    setWalletConnected(true);
    setGamePhase('profile');
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletConnected(false);
    setWalletAddress('');
    setCurrentPlayer(null);
    setCurrentSession(null);
    setGamePhase('landing');
    setEloChange(0);
    setActivityFeed([]);
    setActiveEvent(null);
    setMatchRewards([]);
  }, []);

  const setPlayerProfile = useCallback((name: string, emoji: string) => {
    setCurrentPlayer(prev => {
      const now = Date.now();
      const base: Player = prev || {
        id: 'local-player',
        name,
        team: 'red' as Team,
        clicks: 0,
        address: walletAddress,
        emoji,
        ready: false,
        elo: 1000,
        xp: 0,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        tier: 'Rising' as const,
        achievements: [],
        rewards: [],
        eventId: selectedEventId,
        createdAt: now,
        lastPlayed: now,
      };
      return { ...base, name, emoji, eventId: selectedEventId };
    });
    setGamePhase('team');
  }, [walletAddress, selectedEventId]);

  const selectTeam = useCallback((team: Team) => {
    setCurrentPlayer(prev => prev ? { ...prev, team } : prev);
  }, []);

  const joinSession = useCallback(() => {
    const mockPlayers = generateMockPlayers(15);
    const session: GameSession = {
      id: 'live-session',
      name: 'Live Battle',
      players: currentPlayer ? [currentPlayer, ...mockPlayers] : mockPlayers,
      maxPlayers: 50,
      status: 'waiting',
      grid: createEmptyGrid(gridSize),
      timeLeft: GAME_DURATION,
      rounds: 3,
      host: currentPlayer?.name || 'Host',
      date: 'Today',
      games: ['Plug Grid'],
      eventId: selectedEventId,
    };
    setCurrentSession(session);
    setGamePhase('lobby');
    addFeedItem(`${currentPlayer?.name || 'Player'} joined the lobby`, '👋', 'join');
  }, [currentPlayer, gridSize, addFeedItem, selectedEventId]);

  const toggleReady = useCallback(() => {
    setCurrentPlayer(prev => prev ? { ...prev, ready: !prev.ready } : prev);
  }, []);

  const leaveSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (eventRef.current) clearInterval(eventRef.current);
    setCurrentSession(null);
    setGamePhase('team');
    setActiveEvent(null);
  }, []);

  // Simulate AI players
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'playing') return;
    const ai = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev || prev.status !== 'playing') return prev;
        const grid = prev.grid.map(r => [...r]);
        const size = grid.length;
        for (let t = 0; t < 3; t++) {
          const team = TEAMS[Math.floor(Math.random() * 4)];
          const r = Math.floor(Math.random() * size);
          const c = Math.floor(Math.random() * size);
          if (tileStates[r]?.[c] !== 'blocked') {
            grid[r][c] = team;
          }
        }
        const counts = countTiles(grid);
        setTileCounts(counts);
        return { ...prev, grid };
      });
    }, 800);
    return () => clearInterval(ai);
  }, [currentSession?.status, tileStates]);

  // Game events
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'playing') return;
    eventRef.current = setInterval(() => {
      const event = generateRandomEvent();
      setActiveEvent(event);
      addFeedItem(`${event.emoji} ${event.name}: ${event.description}`, event.emoji, 'event');
      setTimeout(() => setActiveEvent(prev => prev?.id === event.id ? null : prev), event.duration * 1000);
    }, 12000 + Math.random() * 8000);
    return () => { if (eventRef.current) clearInterval(eventRef.current); };
  }, [currentSession?.status, addFeedItem]);

  const startGame = useCallback(() => {
    const newTileStates = generateTileStates(gridSize);
    setTileStates(newTileStates);
    setMatchRewards([]);
    setCurrentSession(prev => {
      if (!prev) return prev;
      return { ...prev, status: 'playing', grid: createEmptyGrid(gridSize) };
    });
    setGamePhase('playing');
    addFeedItem('Game started! Claim tiles now!', '🎮', 'event');

    timerRef.current = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return prev;
        const newTime = prev.timeLeft - 1;
        if (newTime <= 0) {
          clearInterval(timerRef.current);
          if (eventRef.current) clearInterval(eventRef.current);
          const winner = getWinner(prev.grid);
          return { ...prev, timeLeft: 0, status: 'finished', winner };
        }
        return { ...prev, timeLeft: newTime };
      });
    }, 1000);
  }, [gridSize, generateTileStates, addFeedItem]);

  // Handle game end: ELO, XP, rewards, achievements
  useEffect(() => {
    if (currentSession?.status === 'finished' && currentPlayer) {
      const won = currentPlayer.team === currentSession.winner;
      const change = calculateEloChange(currentPlayer.elo, 1000, won);
      setEloChange(change);

      // Assign rewards
      const rewards = assignMatchRewards(currentPlayer, won, currentSession.winner!);
      setMatchRewards(rewards);

      setCurrentPlayer(prev => {
        if (!prev) return prev;
        const newElo = prev.elo + change;
        const newXp = prev.xp + (won ? 100 : 30);
        const updated: Player = {
          ...prev,
          elo: newElo,
          xp: newXp,
          wins: prev.wins + (won ? 1 : 0),
          losses: prev.losses + (won ? 0 : 1),
          gamesPlayed: prev.gamesPlayed + 1,
          tier: getTier(newElo),
          lastPlayed: Date.now(),
          rewards: [...prev.rewards, ...rewards],
        };

        // Check achievements
        const newAchievements = checkAchievements(updated);
        if (newAchievements.length > 0) {
          updated.achievements = [
            ...updated.achievements.filter(a => !newAchievements.find(n => n.id === a.id)),
            ...newAchievements,
          ];
        }

        return updated;
      });

      // Feed items for rewards
      if (rewards.length > 0) {
        addFeedItem(`${currentPlayer.name} earned ${rewards.length} reward${rewards.length > 1 ? 's' : ''}!`, '🎁', 'reward');
      }

      addFeedItem(
        won ? `${currentPlayer.name}'s team wins! 🎉` : 'Match complete!',
        won ? '🏆' : '⏱️',
        'round-end'
      );
      setGamePhase('results');
    }
  }, [currentSession?.status]);

  const claimTile = useCallback((row: number, col: number) => {
    const now = Date.now();
    const cooldown = activeEvent?.type === 'gas-spike' ? CLICK_COOLDOWN * 2 : CLICK_COOLDOWN;
    if (now - lastClickRef.current < cooldown) return;
    lastClickRef.current = now;

    if (!currentPlayer || !currentSession || currentSession.status !== 'playing') return;
    if (tileStates[row]?.[col] === 'blocked') return;

    setCurrentSession(prev => {
      if (!prev) return prev;
      const grid = prev.grid.map(r => [...r]);
      grid[row][col] = currentPlayer.team;
      const counts = countTiles(grid);
      setTileCounts(counts);
      return { ...prev, grid };
    });
    setCurrentPlayer(prev => prev ? { ...prev, clicks: prev.clicks + 1 } : prev);
  }, [currentPlayer, currentSession, activeEvent, tileStates]);

  return (
    <GameContext.Provider value={{
      walletConnected, walletAddress, connectWallet, disconnectWallet,
      currentPlayer, currentSession, setPlayerProfile, selectTeam,
      joinSession, leaveSession, startGame, claimTile, tileCounts,
      gamePhase, setGamePhase, toggleReady, gridSize, eloChange,
      activeEvent, activityFeed, tileStates, matchRewards,
      selectedEventId, setSelectedEventId,
    }}>
      {children}
    </GameContext.Provider>
  );
}
