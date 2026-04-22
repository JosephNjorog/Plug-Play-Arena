import { useGame } from '@/lib/gameContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Zap, Users, Grid3X3, Trophy, ChevronRight, Star, TrendingUp, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { ACTIVE_EVENTS } from '@/lib/gameState';

export default function LandingPage() {
  const { walletConnected, connectWallet } = useGame();

  const steps = [
    { icon: Zap, title: 'Connect', desc: 'Link your wallet in seconds' },
    { icon: Users, title: 'Pick Team', desc: 'Choose your name, avatar & team' },
    { icon: Grid3X3, title: 'Compete', desc: 'Claim tiles in real-time battles' },
    { icon: Trophy, title: 'Rise Up', desc: 'Earn ELO, climb tiers, win rewards' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-5xl font-bold tracking-wider neon-text sm:text-7xl">
            plugn'play
          </h1>
          <p className="mt-4 font-display text-lg tracking-widest text-primary">
            EVERY EVENT REMEMBERED.
          </p>
          <p className="mx-auto mt-6 max-w-lg text-muted-foreground">
            Play. Compete. Build identity. Earn rewards. Leave a legacy.
          </p>
        </motion.div>

        <motion.div
          className="mt-10 flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {!walletConnected && (
            <Button size="lg" className="gap-2 font-display text-sm tracking-wider" onClick={connectWallet}>
              Connect Wallet <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </motion.div>

        <motion.div
          className="mt-8 flex items-center gap-2 rounded-full bg-muted px-4 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">3 live games · 52 players online</span>
        </motion.div>

        {/* Live Events Strip */}
        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {ACTIVE_EVENTS.slice(0, 3).map(event => (
            <div key={event.id} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
              <MapPin className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">{event.name}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="rounded-lg border border-border bg-card p-5 text-left">
            <Star className="h-5 w-5 text-team-yellow mb-3" />
            <h3 className="font-display text-sm tracking-wider mb-1">Reputation</h3>
            <p className="text-xs text-muted-foreground">Earn ELO, climb tiers, unlock achievements. Your skill is your currency.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-left">
            <Users className="h-5 w-5 text-primary mb-3" />
            <h3 className="font-display text-sm tracking-wider mb-1">Multiplayer</h3>
            <p className="text-xs text-muted-foreground">Compete in real-time sessions with players at events across Africa.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-left">
            <TrendingUp className="h-5 w-5 text-secondary mb-3" />
            <h3 className="font-display text-sm tracking-wider mb-1">On-Chain</h3>
            <p className="text-xs text-muted-foreground">Built on Avalanche. Your identity, achievements, and rewards — all verifiable.</p>
          </div>
        </motion.div>
      </section>

      <section className="px-6 py-16">
        <h2 className="mb-10 text-center font-display text-2xl tracking-wider">HOW IT WORKS</h2>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="rounded-lg bg-card p-5 text-center border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.4 }}
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-sm tracking-wider">{step.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        Built on <span className="text-primary">Avalanche</span> · plugn'play © 2026
      </footer>
    </div>
  );
}
