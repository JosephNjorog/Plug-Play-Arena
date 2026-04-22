import { useMemo, useState } from 'react';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { PersonaSelector } from '@/components/avalanche/PersonaSelector';
import { generateMockLeaderboard, PERSONAS, Persona, JOURNEY_STAGES } from '@/lib/avalanche';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LeaderboardPage() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all');
  const data = useMemo(() => generateMockLeaderboard(), []);
  const filtered = useMemo(() => persona ? data.filter(e => e.persona === persona) : data, [data, persona]);

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="font-display text-3xl tracking-wider sm:text-4xl">Leaderboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Top players across the Avalanche ecosystem.</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'all')}>
            <TabsList>
              <TabsTrigger value="week">This week</TabsTrigger>
              <TabsTrigger value="month">This month</TabsTrigger>
              <TabsTrigger value="all">All time</TabsTrigger>
            </TabsList>
          </Tabs>
          <PersonaSelector selected={persona} onSelect={(p) => setPersona(p === persona ? null : p)} layout="pills" showAll />
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {filtered.slice(0, 3).map((entry, idx) => {
            const rank = idx + 1;
            const heights = ['h-32','h-40','h-28'];
            const order = [1, 0, 2];
            return (
              <div key={entry.id} className="flex flex-col items-center justify-end" style={{ order: order[idx] }}>
                <div className="text-3xl">{entry.emoji}</div>
                <div className="mt-2 font-display text-sm tracking-wider">{entry.username}</div>
                <div className="text-[11px] text-muted-foreground">{entry.xp.toLocaleString()} XP</div>
                <div className={`mt-2 w-full rounded-t-lg ${heights[idx]} flex items-start justify-center pt-2 ${
                  rank === 1 ? 'bg-primary/30 border border-primary/40' : rank === 2 ? 'bg-secondary/30 border border-secondary/40' : 'bg-muted'
                }`}>
                  <span className="font-display text-xl">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/30 px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2">Persona</div>
            <div className="col-span-2">Stage</div>
            <div className="col-span-1 text-right">Wins</div>
            <div className="col-span-2 text-right">XP</div>
          </div>
          {filtered.map(e => {
            const p = PERSONAS.find(x => x.id === e.persona)!;
            const stage = JOURNEY_STAGES.find(s => s.stage === e.stage)!;
            return (
              <div key={e.id} className="grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/20">
                <div className="col-span-1 font-display text-sm text-muted-foreground">{e.rank}</div>
                <div className="col-span-4 flex items-center gap-2">
                  <span className="text-lg">{e.emoji}</span>
                  <span className="font-medium">{e.username}</span>
                </div>
                <div className="col-span-2 text-xs">{p.emoji} {p.label}</div>
                <div className="col-span-2 text-xs">{stage.emoji} {e.stage}</div>
                <div className="col-span-1 text-right text-xs">{e.wins}</div>
                <div className="col-span-2 text-right font-display text-sm text-primary">{e.xp.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
