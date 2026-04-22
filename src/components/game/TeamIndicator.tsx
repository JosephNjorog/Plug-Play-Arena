import { Team, TEAM_LABELS, TEAM_BG_COLORS } from '@/lib/gameState';

interface Props {
  team: Team;
  score?: number;
  active?: boolean;
}

export function TeamIndicator({ team, score, active }: Props) {
  return (
    <div className={`flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 ${active ? 'neon-border ring-1 ring-primary/30' : ''}`}>
      <div className={`h-3 w-3 rounded-full ${TEAM_BG_COLORS[team]}`} />
      <span className="text-sm font-medium">{TEAM_LABELS[team]}</span>
      {score !== undefined && (
        <span className="ml-auto font-display text-sm text-muted-foreground">{score}</span>
      )}
    </div>
  );
}
