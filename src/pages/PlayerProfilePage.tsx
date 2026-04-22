import { Navbar } from '@/components/Navbar';
import { useGame } from '@/lib/gameContext';
import { getTierInfo, ALL_ACHIEVEMENTS, ACTIVE_EVENTS } from '@/lib/gameState';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Award, Gamepad2, Gift, MapPin } from 'lucide-react';

export default function PlayerProfilePage() {
  const { currentPlayer, walletAddress } = useGame();

  const player = currentPlayer || {
    id: 'guest',
    name: 'Guest Player',
    emoji: '🎮',
    team: 'red' as const,
    clicks: 0,
    address: walletAddress || '0x0000...0000',
    ready: false,
    elo: 1000,
    xp: 0,
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    tier: 'Rising' as const,
    achievements: [],
    rewards: [],
    createdAt: Date.now(),
    lastPlayed: Date.now(),
  };

  const tierInfo = getTierInfo(player.tier);
  const winRate = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;
  const eventName = ACTIVE_EVENTS.find(e => e.id === player.eventId)?.name;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-12">
        <motion.div
          className="rounded-2xl bg-card border border-border p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary bg-muted text-5xl">
              {player.emoji}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-display text-3xl tracking-wider">{player.name}</h1>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{player.address}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span className={`inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm ${tierInfo.color}`}>
                  {tierInfo.emoji} {player.tier}
                </span>
                <span className="text-sm text-muted-foreground font-display">{player.elo} ELO</span>
                {eventName && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {eventName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard icon={<Trophy className="h-5 w-5 text-team-yellow" />} value={player.wins} label="Wins" />
          <StatCard icon={<Target className="h-5 w-5 text-destructive" />} value={player.losses} label="Losses" />
          <StatCard icon={<TrendingUp className="h-5 w-5 text-primary" />} value={`${winRate}%`} label="Win Rate" />
          <StatCard icon={<Gamepad2 className="h-5 w-5 text-accent" />} value={player.gamesPlayed} label="Games" />
          <StatCard icon={<Gift className="h-5 w-5 text-secondary" />} value={player.rewards?.length || 0} label="Rewards" />
        </div>

        {/* Rewards */}
        {player.rewards && player.rewards.length > 0 && (
          <motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="mb-4 font-display text-xl tracking-wider flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Rewards
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {player.rewards.map(reward => (
                <div key={reward.id} className="rounded-xl border border-border bg-card p-3 text-center">
                  <span className="text-2xl">{reward.emoji}</span>
                  <p className="mt-1 font-display text-xs tracking-wider">{reward.name}</p>
                  <p className="text-[10px] text-muted-foreground">{reward.value}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] ${reward.claimed ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {reward.claimed ? 'Claimed' : 'Unclaimed'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        <motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="mb-4 font-display text-xl tracking-wider flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" /> Achievements
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ALL_ACHIEVEMENTS.map(achievement => {
              const unlocked = player.achievements?.some(a => a.id === achievement.id && a.unlocked);
              return (
                <div
                  key={achievement.id}
                  className={`rounded-xl border p-4 text-center transition-colors ${
                    unlocked
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card opacity-40'
                  }`}
                >
                  <span className="text-2xl">{achievement.emoji}</span>
                  <p className="mt-2 font-display text-xs tracking-wider">{achievement.name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{achievement.description}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <motion.div
      className="rounded-xl border border-border bg-card p-4 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <p className="font-display text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}
