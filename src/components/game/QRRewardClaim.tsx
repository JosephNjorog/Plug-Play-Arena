import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '@/lib/gameContext';
import { Reward } from '@/lib/gameState';
import { Button } from '@/components/ui/button';
import { Wallet, QrCode, Check, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function QRRewardClaim() {
  const { currentPlayer, matchRewards } = useGame();
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [qrRewardId, setQrRewardId] = useState<string | null>(null);

  if (!currentPlayer || matchRewards.length === 0) return null;

  const claimReward = (id: string) => {
    setClaimedIds(prev => new Set(prev).add(id));
  };

  return (
    <div className="rounded-lg bg-card p-4 border border-border">
      <div className="mb-3 flex items-center gap-2 font-display text-xs tracking-wider text-muted-foreground">
        <Gift className="h-3.5 w-3.5 text-primary" />
        REWARDS EARNED
      </div>
      <div className="space-y-2">
        {matchRewards.map(reward => {
          const claimed = claimedIds.has(reward.id);
          return (
            <div key={reward.id}>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <span className="text-lg">{reward.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{reward.name}</p>
                  <p className="text-xs text-muted-foreground">{reward.value}</p>
                </div>
                {claimed ? (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                ) : reward.type === 'merch' ? (
                  <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setQrRewardId(qrRewardId === reward.id ? null : reward.id)}>
                    <QrCode className="h-3 w-3" /> QR
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => claimReward(reward.id)}>
                    <Wallet className="h-3 w-3" /> Claim
                  </Button>
                )}
              </div>
              <AnimatePresence>
                {qrRewardId === reward.id && !claimed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center py-3"
                  >
                    <div className="rounded-lg bg-white p-3">
                      <QRCodeSVG
                        value={JSON.stringify({ rewardId: reward.id, playerId: currentPlayer.id, type: reward.type, value: reward.value })}
                        size={120}
                        level="M"
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Show to event staff</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 text-xs"
                      onClick={() => {
                        claimReward(reward.id);
                        setQrRewardId(null);
                      }}
                    >
                      Mark as Redeemed
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
