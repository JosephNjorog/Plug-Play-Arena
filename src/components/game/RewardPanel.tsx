import { useGame } from '@/lib/gameContext';
import { TEAM_LABELS, TEAM_BG_COLORS } from '@/lib/gameState';
import { TrendingUp } from 'lucide-react';

export function RewardPanel() {
  const { currentSession, currentPlayer } = useGame();
  if (!currentSession) return null;

  return (
    <div className="rounded-xl bg-card p-4 neon-border">
      <div className="mb-3 flex items-center gap-2 font-display text-sm tracking-wider text-muted-foreground">
        <TrendingUp className="h-4 w-4 text-primary" />
        REPUTATION
      </div>
      <div className="text-center">
        <p className="font-display text-3xl neon-text">{currentPlayer?.elo || 1000}</p>
        <p className="mt-1 text-xs text-muted-foreground">Current ELO · {currentPlayer?.tier || 'Rising'}</p>
      </div>
      <div className="mt-3 text-center">
        <p className="text-xs text-muted-foreground">{currentSession.players.length} players competing</p>
      </div>
      {currentSession.winner && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-secondary p-2">
          <div className={`h-3 w-3 rounded-full ${TEAM_BG_COLORS[currentSession.winner]}`} />
          <span className="text-sm font-medium">{TEAM_LABELS[currentSession.winner]} wins!</span>
        </div>
      )}
    </div>
  );
}
