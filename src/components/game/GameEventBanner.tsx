import { useGame } from '@/lib/gameContext';
import { motion, AnimatePresence } from 'framer-motion';

export function GameEventBanner() {
  const { activeEvent } = useGame();

  return (
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.15 }}
          className="mx-auto mb-3 flex max-w-[600px] items-center gap-3 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2"
        >
          <span className="text-lg">{activeEvent.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-display text-xs tracking-wider text-primary">{activeEvent.name}</p>
            <p className="text-xs text-muted-foreground truncate">{activeEvent.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
