import { useGame } from '@/lib/gameContext';
import { WalletConnect } from '@/components/game/WalletConnect';
import { TeamIndicator } from '@/components/game/TeamIndicator';
import { Button } from '@/components/ui/button';
import { TEAM_BG_COLORS, TEAM_LABELS } from '@/lib/gameState';
import { Users, Play, ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LobbyPage() {
  const { currentPlayer, currentSession, startGame, setGamePhase, toggleReady } = useGame();

  if (!currentSession) return null;

  const readyCount = currentSession.players.filter(p => p.ready).length;
  const isReady = currentPlayer?.ready;

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setGamePhase('team')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-display text-base tracking-wider text-primary neon-text">plugn'play</span>
        </button>
        <WalletConnect />
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="font-display text-2xl tracking-wider mb-1">GAME LOBBY</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {readyCount}/{currentSession.players.length} players ready
        </p>

        {currentPlayer && (
          <motion.div
            className="mb-6 rounded-lg bg-card p-4 border border-border"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentPlayer.emoji}</span>
                <div>
                  <p className="font-display text-sm tracking-wider">{currentPlayer.name}</p>
                  <TeamIndicator team={currentPlayer.team} active />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isReady ? 'default' : 'secondary'}
                  onClick={toggleReady}
                  className="gap-2 font-display text-xs tracking-wider"
                  size="sm"
                >
                  {isReady ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  {isReady ? 'Ready!' : 'Ready Up'}
                </Button>
                <Button onClick={startGame} className="gap-2 font-display text-xs tracking-wider" size="sm">
                  <Play className="h-3.5 w-3.5" /> Start
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <h2 className="font-display text-xs tracking-wider text-muted-foreground mb-3">
          PLAYERS ({currentSession.players.length}/{currentSession.maxPlayers})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {currentSession.players.map((player, i) => (
            <motion.div
              key={player.id}
              className="flex items-center gap-3 rounded-lg bg-card p-3 border border-border"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <span className="text-lg">{player.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate font-display tracking-wider">
                  {player.id === 'local-player' ? `${player.name} (You)` : player.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`h-2 w-2 rounded-full ${TEAM_BG_COLORS[player.team]}`} />
                  <span className="text-xs text-muted-foreground">{TEAM_LABELS[player.team]}</span>
                </div>
              </div>
              {player.ready ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
