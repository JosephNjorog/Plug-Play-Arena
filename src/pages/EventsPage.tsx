import { useEffect, useMemo, useState } from 'react';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { EventCard } from '@/components/avalanche/EventCard';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EventFormat, EventCategory, AvalancheEvent, dbRowToEvent } from '@/lib/avalanche';
import { usePlayer } from '@/lib/playerContext';
import { supabase } from '@/integrations/supabase/client';
import { Search } from 'lucide-react';

const FORMATS: ('All' | EventFormat)[] = ['All', 'IRL', 'Zoom', 'Hybrid'];
const CATEGORIES: ('All' | EventCategory)[] = ['All', 'Hackathon', 'Campus Event', 'Founder Session', 'Builder Workshop', 'Community Meetup', 'Conference'];

export default function EventsPage() {
  const { user, joinEvent } = usePlayer();
  const [tab, setTab] = useState<'live' | 'upcoming' | 'completed'>('live');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<typeof FORMATS[number]>('All');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('All');
  const [events, setEvents] = useState<AvalancheEvent[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: true })
      .then(({ data }) => {
        if (data) setEvents(data.map(dbRowToEvent));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setJoinedIds(new Set(data.map(r => r.event_id)));
      });
  }, [user]);

  const byTab = useMemo(() => events.filter(e => e.status === (tab === 'live' ? 'live' : tab === 'upcoming' ? 'upcoming' : 'completed')), [events, tab]);

  const filtered = useMemo(() => byTab.filter(e => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    const matchF = format === 'All' || e.format === format;
    const matchC = category === 'All' || e.category === category;
    return matchQ && matchF && matchC;
  }), [byTab, query, format, category]);

  const counts = useMemo(() => ({
    live: events.filter(e => e.status === 'live').length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    completed: events.filter(e => e.status === 'completed').length,
  }), [events]);

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="font-display text-3xl tracking-wider sm:text-4xl">Events</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Live, upcoming, and archived Avalanche experiences. IRL across Africa, Zoom across the world.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="live">● Live ({counts.live})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({counts.upcoming})</TabsTrigger>
              <TabsTrigger value="completed">Archive ({counts.completed})</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events…" className="pl-9" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <FilterPills options={FORMATS} value={format} onChange={(v) => setFormat(v)} />
            <FilterPills options={CATEGORIES} value={category} onChange={(v) => setCategory(v)} />
          </div>

          <TabsContent value={tab} className="mt-6">
            {loading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Loading events…</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                No events match those filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(ev => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    joined={joinedIds.has(ev.id)}
                    onJoin={() => user ? joinEvent(ev.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FilterPills<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
            value === o ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >{o}</button>
      ))}
    </div>
  );
}
