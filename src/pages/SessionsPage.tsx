import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { generateMockSessionHistory, SessionHistory } from '@/lib/gameState';
import { motion } from 'framer-motion';
import { Search, Calendar, Users, Trophy, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Filter = 'all' | 'live' | 'upcoming' | 'completed';

export default function SessionsPage() {
  const sessions = useMemo(() => generateMockSessionHistory(), []);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => ({
    all: sessions.length,
    live: sessions.filter(s => s.status === 'live').length,
    upcoming: sessions.filter(s => s.status === 'upcoming').length,
    completed: sessions.filter(s => s.status === 'completed').length,
  }), [sessions]);

  const filtered = useMemo(() => {
    let list = sessions;
    if (filter !== 'all') list = list.filter(s => s.status === filter);
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [sessions, filter, search]);

  const totalPlayers = sessions.reduce((s, sess) => s + sess.playerCount, 0);
  const totalPlays = sessions.reduce((s, sess) => s + sess.rounds, 0);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-card to-background px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Calendar className="h-3 w-3" /> SESSION HISTORY
          </div>
          <h1 className="font-display text-4xl tracking-wider">
            Every night,<br />
            <span className="text-primary neon-text">remembered.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Every session, every score, every comeback. Your crew's game night archive.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <StatBox value={sessions.length} label="SESSIONS" />
            <StatBox value={totalPlayers} label="PLAYERS" />
            <StatBox value={totalPlays} label="TOTAL PLAYS" />
            <StatBox value={counts.upcoming} label="UPCOMING" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sessions, games, players..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'live', 'upcoming', 'completed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm capitalize transition-colors ${
                filter === f
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'live' && <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />}
              {f === 'all' ? 'All Sessions' : f}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{counts[f]}</span>
            </button>
          ))}
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Showing <span className="text-primary">{filtered.length}</span> sessions
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((session, i) => (
            <SessionCard key={session.id} session={session} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 px-6 py-4 text-center">
      <p className="font-display text-2xl text-primary">{value}</p>
      <p className="text-xs text-muted-foreground tracking-wider">{label}</p>
    </div>
  );
}

function SessionCard({ session, index }: { session: SessionHistory; index: number }) {
  return (
    <motion.div
      className="rounded-xl border border-border bg-card p-5 flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {session.status.toUpperCase()}
      </div>

      <h3 className="font-display text-xl tracking-wider mb-1">{session.name}</h3>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{session.host}</span>
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{session.date}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {session.games.map(g => (
          <span key={g} className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs">{g}</span>
        ))}
      </div>

      <div className="mb-4 flex items-center">
        <div className="flex -space-x-2">
          {session.playerAvatars.slice(0, 4).map((emoji, i) => (
            <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-sm">
              {emoji}
            </div>
          ))}
        </div>
        {session.playerCount > 4 && (
          <span className="ml-2 text-xs text-muted-foreground">+{session.playerCount - 4} more</span>
        )}
      </div>

      <div className="mb-4 flex gap-3">
        <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
          <p className="font-display text-lg text-primary">{session.playerCount}</p>
          <p className="text-[10px] text-muted-foreground tracking-wider">PLAYERS</p>
        </div>
        <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
          <p className="font-display text-lg text-primary">{session.rounds}</p>
          <p className="text-[10px] text-muted-foreground tracking-wider">ROUNDS</p>
        </div>
      </div>

      <div className="rounded-lg bg-team-yellow/20 border border-team-yellow/30 p-3">
        <p className="text-xs text-muted-foreground mb-1">Winning Team</p>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-team-yellow" />
          <span className="font-display text-sm tracking-wider">{session.winnerTeam}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {session.winnerMembers.join(' · ')}
        </p>
      </div>

      <button className="mt-4 self-end rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        View Details →
      </button>
    </motion.div>
  );
}
