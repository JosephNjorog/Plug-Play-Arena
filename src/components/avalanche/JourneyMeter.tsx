import { JOURNEY_STAGES, JourneyStage, getNextJourneyStage } from '@/lib/avalanche';

interface JourneyMeterProps {
  xp: number;
  stage: JourneyStage;
  compact?: boolean;
}

export function JourneyMeter({ xp, stage, compact }: JourneyMeterProps) {
  const current = JOURNEY_STAGES.find(s => s.stage === stage)!;
  const next = getNextJourneyStage(xp);
  const min = current.minXp;
  const max = next ? next.minXp : current.minXp + 1000;
  const pct = Math.min(100, Math.max(2, ((xp - min) / (max - min)) * 100));

  if (compact) {
    return (
      <div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-display tracking-wider">{current.emoji} {stage}</span>
          <span className="text-muted-foreground">{xp} XP</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Current stage</div>
          <div className="mt-1 font-display text-2xl tracking-wider">{current.emoji} {stage}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Total XP</div>
          <div className="mt-1 font-display text-2xl text-primary">{xp.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{stage}</span>
          <span>{next ? next.stage : 'Max'}</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        {next && <p className="mt-2 text-[11px] text-muted-foreground">{next.minXp - xp} XP to {next.stage}</p>}
      </div>

      <div className="mt-4 flex items-center justify-between gap-1">
        {JOURNEY_STAGES.map(s => {
          const reached = xp >= s.minXp;
          return (
            <div key={s.stage} className="flex flex-1 flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${reached ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{s.emoji}</div>
              <div className={`mt-1 text-[9px] uppercase tracking-wider ${reached ? 'text-foreground' : 'text-muted-foreground'}`}>{s.stage}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
