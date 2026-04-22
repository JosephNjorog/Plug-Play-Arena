import { useGame } from '@/lib/gameContext';
import { TEAM_LABELS, TEAM_BG_COLORS, TEAMS, getTierInfo } from '@/lib/gameState';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, TrendingUp, TrendingDown, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Confetti } from '@/components/game/Confetti';
import { QRRewardClaim } from '@/components/game/QRRewardClaim';

export default function ResultsPage() {
  const { currentSession, currentPlayer, tileCounts, disconnectWallet, eloChange, matchRewards } = useGame();

  if (!currentSession) return null;

  const winner = currentSession.winner!;
  const sorted = [...TEAMS].sort((a, b) => tileCounts[b] - tileCounts[a]);
  const playerWon = currentPlayer?.team === winner;

  const newAchievements = currentPlayer?.achievements.filter(a => a.unlocked) || [];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 overflow-hidden">
      {playerWon && <Confetti />}

      <motion.div
        className="w-full max-w-md text-center relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Trophy className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="font-display text-3xl tracking-wider neon-text">GAME OVER</h1>
        <p className="mt-1 text-xs text-muted-foreground font-display tracking-wider">
          Every event remembered.
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          {playerWon ? '🎉 Your team won!' : 'Better luck next time!'}
        </p>

        <div className="mt-6 rounded-lg bg-card p-4 border border-border">
          <p className="text-xs text-muted-foreground font-display tracking-wider mb-2">WINNER</p>
          <div className="flex items-center justify-center gap-3">
            <div className={`h-4 w-4 rounded-full ${TEAM_BG_COLORS[winner]}`} />
            <span className="font-display text-xl tracking-wider">{TEAM_LABELS[winner]}</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-card p-4 border border-border">
          <p className="text-xs text-muted-foreground font-display tracking-wider mb-3">STANDINGS</p>
          {sorted.map((team, i) => (
            <div key={team} className="flex items-center gap-3 py-1">
              <span className="w-5 text-center font-display text-xs text-muted-foreground">#{i + 1}</span>
              <div className={`h-3 w-3 rounded-full ${TEAM_BG_COLORS[team]}`} />
              <span className="flex-1 text-sm text-left">{TEAM_LABELS[team]}</span>
              <span className="font-display text-sm">{tileCounts[team]}</span>
            </div>
          ))}
        </div>

        {currentPlayer && (
          <div className="mt-4 rounded-lg bg-card p-4 border border-border">
            <p className="text-xs text-muted-foreground font-display tracking-wider mb-2">YOUR STATS</p>
            <div className="flex justify-around text-sm">
              <div>
                <p className="font-display text-lg">{currentPlayer.clicks}</p>
                <p className="text-xs text-muted-foreground">clicks</p>
              </div>
              <div>
                <p className={`font-display text-lg flex items-center justify-center gap-1 ${eloChange >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {eloChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {eloChange >= 0 ? '+' : ''}{eloChange}
                </p>
                <p className="text-xs text-muted-foreground">ELO</p>
              </div>
              <div>
                <p className="font-display text-lg">{currentPlayer.elo}</p>
                <p className="text-xs text-muted-foreground">rating</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              <span>{getTierInfo(currentPlayer.tier).emoji}</span>
              <span className={getTierInfo(currentPlayer.tier).color}>{currentPlayer.tier}</span>
              <span className="text-xs text-muted-foreground">· {currentPlayer.xp} XP</span>
            </div>

            {/* New achievements */}
            {newAchievements.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {newAchievements.slice(0, 3).map(a => (
                  <span key={a.id} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs">
                    {a.emoji} {a.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <QRRewardClaim />
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <Button onClick={disconnectWallet} className="gap-2 font-display text-sm tracking-wider">
            <RotateCcw className="h-4 w-4" /> Play Again
          </Button>
          <Button variant="secondary" className="gap-2 font-display text-sm tracking-wider" onClick={() => {
            if (navigator.share) {
              navigator.share({ title: "plugn'play", text: `I just ${playerWon ? 'won' : 'played'} on plugn'play! My ELO: ${currentPlayer?.elo}`, url: window.location.href });
            }
          }}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
