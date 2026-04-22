import { useGame } from '@/lib/gameContext';
import { TEAMS, TEAM_LABELS, TEAM_EMOJIS, TEAM_BG_COLORS, Team, generateMockPlayers } from '@/lib/gameState';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Users } from 'lucide-react';
import { useMemo } from 'react';

export default function TeamSelectionPage() {
  const { currentPlayer, selectTeam, joinSession, setGamePhase } = useGame();

  const teamCounts = useMemo(() => {
    const mock = generateMockPlayers(20);
    const counts: Record<Team, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
    mock.forEach(p => counts[p.team]++);
    return counts;
  }, []);

  const handleJoin = () => {
    if (!currentPlayer) return;
    joinSession();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => setGamePhase('profile')}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="font-display text-3xl tracking-wider neon-text text-center mb-2">
          CHOOSE TEAM
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Pick your side in the battle
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {TEAMS.map((team, i) => {
            const selected = currentPlayer?.team === team;
            return (
              <motion.button
                key={team}
                onClick={() => selectTeam(team)}
                className={`relative rounded-xl bg-card p-6 text-center transition-all neon-border ${
                  selected ? 'ring-2 ring-primary scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="text-4xl mb-3">{TEAM_EMOJIS[team]}</div>
                <h3 className="font-display text-sm tracking-wider mb-2">{TEAM_LABELS[team]}</h3>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{teamCounts[team]} players</span>
                </div>
                {selected && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"
                    layoutId="team-ring"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {currentPlayer && (
          <div className="mb-4 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="text-xl">{currentPlayer.emoji}</span>
            <span>{currentPlayer.name}</span>
            <span>·</span>
            <div className={`h-3 w-3 rounded-full ${TEAM_BG_COLORS[currentPlayer.team]}`} />
            <span>{TEAM_LABELS[currentPlayer.team]}</span>
          </div>
        )}

        <Button
          onClick={handleJoin}
          disabled={!currentPlayer}
          className="w-full gap-2 font-display text-sm tracking-wider"
          size="lg"
        >
          Join Lobby <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
