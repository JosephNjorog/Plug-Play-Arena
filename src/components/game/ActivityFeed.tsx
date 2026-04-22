import { useGame } from '@/lib/gameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

export function ActivityFeed() {
  const { activityFeed } = useGame();
  const recent = activityFeed.slice(0, 8);

  return (
    <div className="rounded-lg bg-card p-3">
      <div className="mb-2 flex items-center gap-2 font-display text-xs tracking-wider text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-primary" />
        LIVE FEED
      </div>
      <div className="space-y-1 max-h-[200px] overflow-hidden">
        <AnimatePresence initial={false}>
          {recent.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 py-1 text-xs text-muted-foreground"
            >
              <span>{item.emoji}</span>
              <span className="truncate">{item.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {recent.length === 0 && (
          <p className="text-xs text-muted-foreground/50 py-2">Waiting for action...</p>
        )}
      </div>
    </div>
  );
}
