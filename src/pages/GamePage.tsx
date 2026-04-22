import { useGame } from '@/lib/gameContext';
import { WalletConnect } from '@/components/game/WalletConnect';
import { GameGrid } from '@/components/game/GameGrid';
import { Timer } from '@/components/game/Timer';
import { Leaderboard } from '@/components/game/Leaderboard';
import { RewardPanel } from '@/components/game/RewardPanel';
import { TeamIndicator } from '@/components/game/TeamIndicator';
import { ActivityFeed } from '@/components/game/ActivityFeed';
import { GameEventBanner } from '@/components/game/GameEventBanner';
import { motion } from 'framer-motion';

export default function GamePage() {
  const { currentPlayer, tileCounts } = useGame();

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-sm tracking-wider text-primary neon-text">plugn'play</span>
        <Timer />
        <WalletConnect />
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-2">
        <GameEventBanner />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
            {currentPlayer && (
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentPlayer.emoji}</span>
                  <TeamIndicator team={currentPlayer.team} score={tileCounts[currentPlayer.team]} active />
                </div>
                <span className="text-xs text-muted-foreground font-display">CLICKS: {currentPlayer.clicks}</span>
              </div>
            )}
            <GameGrid />
          </motion.div>

          <div className="space-y-3">
            <Leaderboard />
            <RewardPanel />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
