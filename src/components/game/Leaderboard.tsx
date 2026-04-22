import { useGame } from '@/lib/gameContext';
import { TEAMS, TEAM_LABELS, TEAM_BG_COLORS } from '@/lib/gameState';
import { Trophy } from 'lucide-react';

export function Leaderboard() {
  const { tileCounts } = useGame();
  const sorted = [...TEAMS].sort((a, b) => tileCounts[b] - tileCounts[a]);

  return (
    <div className="rounded-xl bg-card p-4 neon-border">
      <div className="mb-3 flex items-center gap-2 font-display text-sm tracking-wider text-muted-foreground">
        <Trophy className="h-4 w-4 text-primary" />
        LEADERBOARD
      </div>
      <div className="space-y-2">
        {sorted.map((team, i) => (
          <div key={team} className="flex items-center gap-3">
            <span className="w-5 text-center font-display text-xs text-muted-foreground">#{i + 1}</span>
            <div className={`h-3 w-3 rounded-full ${TEAM_BG_COLORS[team]}`} />
            <span className="flex-1 text-sm">{TEAM_LABELS[team]}</span>
            <span className="font-display text-sm">{tileCounts[team]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
