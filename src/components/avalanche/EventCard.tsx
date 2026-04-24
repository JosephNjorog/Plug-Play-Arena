import { AvalancheEvent, PERSONAS } from '@/lib/avalanche';
import { Calendar, MapPin, Users, Trophy, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface EventCardProps {
  event: AvalancheEvent;
  joined?: boolean;
  onJoin?: (event: AvalancheEvent) => void;
}

const formatBadge = {
  IRL: { label: 'IRL', class: 'bg-primary/15 text-primary border-primary/30' },
  Zoom: { label: 'Zoom', class: 'bg-secondary/15 text-secondary border-secondary/30' },
  Hybrid: { label: 'Hybrid', class: 'bg-accent/30 text-foreground border-accent' },
} as const;

const statusBadge = {
  live: { label: '● Live', class: 'bg-primary/15 text-primary' },
  upcoming: { label: 'Upcoming', class: 'bg-secondary/15 text-secondary' },
  completed: { label: 'Completed', class: 'bg-muted text-muted-foreground' },
} as const;

export function EventCard({ event, joined, onJoin }: EventCardProps) {
  const f = formatBadge[event.format as keyof typeof formatBadge] ?? formatBadge['IRL'];
  const s = statusBadge[event.status as keyof typeof statusBadge] ?? statusBadge['upcoming'];
  const fillPct = Math.min(100, Math.round((event.attendees / event.capacity) * 100));

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={f.class}>
            {event.format === 'Zoom' ? <Video className="mr-1 h-3 w-3" /> : null}{f.label}
          </Badge>
          <Badge variant="outline" className={s.class}>{s.label}</Badge>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{event.category}</span>
      </div>

      <h3 className="mt-3 font-display text-lg tracking-wide">{event.title}</h3>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><Calendar className="h-3 w-3" />{event.date}</div>
        <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{event.location}</div>
        <div className="flex items-center gap-2"><Trophy className="h-3 w-3 text-primary" />{event.rewardPool}</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {event.tracks.map(t => {
          const p = PERSONAS.find(x => x.id === t);
          if (!p) return null;
          return <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{p.emoji} {p.label}</span>;
        })}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.attendees}/{event.capacity}</span>
          <span>{fillPct}% full</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      <div className="mt-auto pt-4 flex gap-2">
        <Button asChild size="sm" variant="secondary" className="flex-1">
          <Link to={`/events/${event.id}`}>View agenda</Link>
        </Button>
        {event.status !== 'completed' && (
          <Button size="sm" className="flex-1" disabled={joined} onClick={() => onJoin?.(event)}>
            {joined ? 'Joined' : event.status === 'live' ? 'Check in' : 'RSVP'}
          </Button>
        )}
      </div>
    </div>
  );
}
