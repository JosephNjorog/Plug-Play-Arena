import { useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { GAME_LIBRARY, GameDef } from '@/lib/gameState';
import { motion } from 'framer-motion';
import { Gamepad2, Star, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GamesPage() {
  const trending = useMemo(() => [...GAME_LIBRARY].sort((a, b) => b.playCount - a.playCount).slice(0, 4), []);
  const totalPlays = GAME_LIBRARY.reduce((s, g) => s + g.playCount, 0);
  const avgRating = (GAME_LIBRARY.reduce((s, g) => s + g.rating, 0) / GAME_LIBRARY.length).toFixed(1);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-card to-background px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Gamepad2 className="h-3 w-3" /> GAME LIBRARY
          </div>
          <h1 className="font-display text-4xl tracking-wider">
            Your crew's<br />
            <span className="text-primary neon-text">game shelf.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Every game you own, every session you've played, every stat worth bragging about.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <StatBox value={`${GAME_LIBRARY.length}`} label="GAMES" />
            <StatBox value={`${totalPlays}`} label="TOTAL PLAYS" />
            <StatBox value={avgRating} label="AVG RATING" />
          </div>
        </div>
      </div>

      {/* Trending */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="mb-6 font-display text-xl tracking-wider">🔥 Trending this week</h2>
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {trending.map((game, i) => (
            <motion.div
              key={game.id}
              className="rounded-xl border border-border bg-card p-5 text-center hover:border-primary/30 transition-colors cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="mx-auto mb-3 text-4xl">{game.emoji}</div>
              <h3 className="font-display text-sm tracking-wider">{game.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{game.playCount}× played</p>
            </motion.div>
          ))}
        </div>

        <h2 className="mb-6 font-display text-xl tracking-wider">All Games</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAME_LIBRARY.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 px-6 py-4 text-center">
      <p className="font-display text-2xl text-primary">{value}</p>
      <p className="text-xs text-muted-foreground tracking-wider">{label}</p>
    </div>
  );
}

function GameCard({ game, index }: { game: GameDef; index: number }) {
  return (
    <motion.div
      className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
        {game.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-sm tracking-wider">{game.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{game.description}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-team-yellow" /> {game.rating}</span>
          <span>{game.playCount} plays</span>
          <span className="rounded-full bg-muted px-2 py-0.5">{game.category}</span>
        </div>
      </div>
      <Button size="sm" variant="secondary" className="shrink-0 gap-1 text-xs">
        <Play className="h-3 w-3" /> Play
      </Button>
    </motion.div>
  );
}
