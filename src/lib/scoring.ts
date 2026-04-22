// Pure helpers + shared types for the timed mission engine.
// Server function `submit_attempt` is the source of truth — these
// helpers are used to predict / display feedback during play.

export interface ScoreInput {
  accuracyPct: number;       // 0..100
  durationMs: number;
  timeLimitSeconds: number;
  difficultyMultiplier: number;
  attemptsUsed: number;       // 1+
}

export interface ScoreResult {
  base: number;
  speedBonus: number;
  retryPenalty: number;
  multiplier: number;
  perfect: boolean;
  fast: boolean;
  total: number;
}

export function predictScore(i: ScoreInput): ScoreResult {
  const accuracy = clamp(i.accuracyPct, 0, 100);
  const multiplier = clamp(i.difficultyMultiplier, 0.5, 3);
  const retryPenalty = clamp(1 - (Math.max(i.attemptsUsed, 1) - 1) * 0.15, 0.5, 1);
  const speedRatio = i.timeLimitSeconds > 0
    ? Math.max(0, 1 - Math.min(1, (i.durationMs / 1000) / i.timeLimitSeconds))
    : 0;
  const speedBonus = Math.floor(speedRatio * 200);
  const base = Math.floor(accuracy * 5 + speedBonus);
  const perfect = accuracy === 100 && i.attemptsUsed === 1;
  const fast = speedRatio >= 0.5;
  let total = Math.floor(base * multiplier * retryPenalty);
  if (perfect) total += 100;
  if (fast) total += 50;
  return { base, speedBonus, retryPenalty, multiplier, perfect, fast, total };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function difficultyMultiplier(d: 'Beginner' | 'Intermediate' | 'Advanced') {
  return d === 'Advanced' ? 1.6 : d === 'Intermediate' ? 1.3 : 1.0;
}

export function rarityFor(d: 'Beginner' | 'Intermediate' | 'Advanced'): 'common' | 'rare' | 'legendary' {
  return d === 'Advanced' ? 'legendary' : d === 'Intermediate' ? 'rare' : 'common';
}
