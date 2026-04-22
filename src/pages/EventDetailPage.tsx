import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameCard } from '@/components/avalanche/GameCard';
import { AVALANCHE_EVENTS, AVALANCHE_GAMES, PERSONAS } from '@/lib/avalanche';
import { usePlayer } from '@/lib/playerContext';
import { ArrowLeft, Calendar, MapPin, Trophy, Users, Video } from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = AVALANCHE_EVENTS.find(e => e.id === id);
  const { user, joinEvent } = usePlayer();
  const player = null as null | { events: string[] };

  if (!event) {
    return (
      <div className="min-h-screen">
        <AppNavbar />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-muted-foreground">Event not found.</p>
          <Button asChild className="mt-4"><Link to="/events">Back to events</Link></Button>
        </div>
      </div>
    );
  }

  const missions = AVALANCHE_GAMES.filter(g => event.missions.includes(g.id));
  const joined = false;
  void player;
  void user;

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 gap-1">
            <Link to="/events"><ArrowLeft className="h-3 w-3" /> All events</Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={event.format === 'Zoom' ? 'border-secondary/30 bg-secondary/10 text-secondary' : 'border-primary/30 bg-primary/10 text-primary'}>
              {event.format === 'Zoom' && <Video className="mr-1 h-3 w-3" />}{event.format}
            </Badge>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{event.category}</span>
            {event.status === 'live' && <span className="text-[11px] text-primary">● Live now</span>}
          </div>

          <h1 className="mt-3 font-display text-3xl tracking-wider sm:text-4xl">{event.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{event.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<Calendar className="h-4 w-4" />} label="Date" value={event.date} />
            <Stat icon={<MapPin className="h-4 w-4" />} label="Location" value={event.location} />
            <Stat icon={<Users className="h-4 w-4" />} label="Attendees" value={`${event.attendees}/${event.capacity}`} />
            <Stat icon={<Trophy className="h-4 w-4 text-primary" />} label="Reward pool" value={event.rewardPool} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1">
              {event.tracks.map(t => {
                const p = PERSONAS.find(x => x.id === t)!;
                return <span key={t} className="rounded-full bg-muted px-2 py-1 text-[11px]">{p.emoji} {p.label}</span>;
              })}
            </div>
            {event.status !== 'completed' && (
              <Button className="ml-auto" disabled={joined} onClick={() => user && joinEvent(event.id)}>
                {joined ? '✓ Joined' : event.status === 'live' ? 'Check in' : 'RSVP'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl tracking-wider">Event missions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Complete to earn XP, NFTs, and rewards.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {missions.map(g => (
              <GameCard key={g.id} game={g} onPlay={() => navigate(`/play/${g.id}?event=${event.id}`)} />
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-sm tracking-wider">Agenda</h3>
          <ul className="mt-4 space-y-3">
            {event.agenda.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">{a.time}</span>
                <span className="text-sm">{a.title}</span>
              </li>
            ))}
          </ul>
          {event.zoomUrl && event.status !== 'completed' && (
            <Button asChild variant="secondary" className="mt-5 w-full">
              <a href={event.zoomUrl} target="_blank" rel="noreferrer"><Video className="h-3 w-3" /> Open Zoom</a>
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
