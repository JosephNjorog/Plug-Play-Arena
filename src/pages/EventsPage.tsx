import { useMemo, useState } from 'react';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { EventCard } from '@/components/avalanche/EventCard';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EventFormat, EventCategory, eventsByStatus } from '@/lib/avalanche';
import { usePlayer } from '@/lib/playerContext';
import { Search } from 'lucide-react';

const FORMATS: ('All' | EventFormat)[] = ['All', 'IRL', 'Zoom', 'Hybrid'];
const CATEGORIES: ('All' | EventCategory)[] = ['All', 'Hackathon', 'Campus Event', 'Founder Session', 'Builder Workshop', 'Community Meetup', 'Conference'];

export default function EventsPage() {
  const { user, joinEvent } = usePlayer();
  const [tab, setTab] = useState<'live' | 'upcoming' | 'completed'>('live');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<typeof FORMATS[number]>('All');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('All');

  const filtered = useMemo(() => {
    return eventsByStatus(tab).filter(e => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
      const matchF = format === 'All' || e.format === format;
      const matchC = category === 'All' || e.category === category;
      return matchQ && matchF && matchC;
    });
  }, [tab, query, format, category]);

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
              <TabsTrigger value="live">● Live ({eventsByStatus('live').length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({eventsByStatus('upcoming').length})</TabsTrigger>
              <TabsTrigger value="completed">Event Archive ({eventsByStatus('completed').length})</TabsTrigger>
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
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                No events match those filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(ev => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    joined={false}
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
