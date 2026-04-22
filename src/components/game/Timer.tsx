import { useGame } from '@/lib/gameContext';
import { Clock } from 'lucide-react';

export function Timer() {
  const { currentSession } = useGame();
  const timeLeft = currentSession?.timeLeft ?? 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft <= 30;

  return (
    <div className={`flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 font-display text-xl tracking-wider ${isLow ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
      <Clock className="h-5 w-5" />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
