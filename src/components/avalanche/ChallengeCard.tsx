import { AvalancheChallenge, ACCENT_CLASS, TIER_BADGE } from '@/lib/challenges';
import { Sparkles, Clock, Trophy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  challenge: AvalancheChallenge;
  completed?: boolean;
  onOpen?: (c: AvalancheChallenge) => void;
}

export function ChallengeCard({ challenge: c, completed, onOpen }: Props) {
  return (
    <button
      onClick={() => onOpen?.(c)}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_0_24px_hsl(354_100%_61%/0.15)]"
    >
      {/* Pixel-card hero */}
      <div className="relative flex h-40 items-center justify-center bg-[hsl(240_8%_8%)] border-b border-border">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(hsl(0_0%_100%)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_100%)_1px,transparent_1px)] [background-size:8px_8px]" />
        <div className="text-7xl drop-shadow-[0_0_18px_hsl(354_100%_61%/0.35)]">{c.emoji}</div>
        <div className="absolute left-3 top-3 flex gap-1">
          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TIER_BADGE[c.tier]}`}>{c.tier}</span>
          {c.aiReady && (
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-2.5 w-2.5" /> AI-ready
            </span>
          )}
        </div>
        {completed && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-[hsl(145_70%_45%/0.4)] bg-[hsl(145_70%_45%/0.15)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(145_70%_60%)]">
            <CheckCircle2 className="h-2.5 w-2.5" /> Cleared
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className={`font-display text-lg uppercase tracking-wider ${ACCENT_CLASS[c.accent]}`}>{c.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.tagline}</p>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />~{c.estMinutes} min</span>
          <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3 text-primary" />+{c.xpReward} XP · NFT</span>
        </div>

        <div className="mt-4">
          <Button size="sm" variant="secondary" className="w-full pointer-events-none">
            {completed ? 'Replay' : 'Open challenge'}
          </Button>
        </div>
      </div>
    </button>
  );
}
