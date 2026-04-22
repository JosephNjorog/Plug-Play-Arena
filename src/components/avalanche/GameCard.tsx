import { AvalancheGame, PERSONAS } from '@/lib/avalanche';
import { Clock, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GameCardProps {
  game: AvalancheGame;
  onPlay?: (game: AvalancheGame) => void;
}

const rewardLabel = {
  xp: 'XP', nft: 'NFT Badge', merch: 'Merch', token: 'AVAX',
};

export function GameCard({ game, onPlay }: GameCardProps) {
  const persona = PERSONAS.find(p => p.id === game.persona)!;
  const soon = game.status === 'soon';

  return (
    <div className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">{game.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-sm tracking-wider">{game.title}</h3>
            {soon && <Badge variant="outline" className="border-secondary/40 text-[10px] text-secondary">SOON</Badge>}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{persona.emoji} {persona.label}</span>
            <span>·</span>
            <span>{game.category}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{game.description}</p>

      <div className="mt-3 rounded-md bg-muted/40 p-2 text-[11px]">
        <div className="text-muted-foreground"><span className="text-foreground">Outcome:</span> {game.learningOutcome}</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {game.themes.slice(0, 3).map(t => (
          <span key={t} className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] text-secondary">{t}</span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{game.duration}</span>
        <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" />+{game.xpReward} XP · {rewardLabel[game.rewardType]}</span>
      </div>

      <Button
        size="sm"
        className="mt-4 w-full"
        disabled={soon}
        onClick={() => onPlay?.(game)}
      >
        {soon ? <><Lock className="h-3 w-3" /> Coming soon</> : 'Start mission'}
      </Button>
    </div>
  );
}
