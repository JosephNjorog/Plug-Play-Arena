import { RewardItem } from '@/lib/avalanche';
import { Button } from '@/components/ui/button';
import { Check, Wallet, QrCode } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

interface RewardCardProps {
  reward: RewardItem;
  onClaim: (id: string) => void;
}

export function RewardCard({ reward, onClaim }: RewardCardProps) {
  const [showQR, setShowQR] = useState(false);
  const isPhysical = reward.type === 'merch';
  const isDigital = !isPhysical;
  const qrPayload = JSON.stringify({ rewardId: reward.id, title: reward.title, value: reward.value });

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">{reward.emoji}</div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-display text-sm tracking-wider">{reward.title}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{reward.description}</p>
        </div>
        <span className="text-xs font-semibold text-primary">{reward.value}</span>
      </div>

      <div className="mt-4">
        {reward.claimed ? (
          <div className="flex items-center justify-center gap-2 rounded-md bg-muted/50 py-2 text-xs text-muted-foreground">
            <Check className="h-3 w-3 text-primary" /> Claimed
          </div>
        ) : isPhysical ? (
          <Button size="sm" variant="secondary" className="w-full" onClick={() => setShowQR(true)}>
            <QrCode className="h-3 w-3" /> Generate QR
          </Button>
        ) : isDigital ? (
          <Button size="sm" className="w-full" onClick={() => onClaim(reward.id)}>
            <Wallet className="h-3 w-3" /> Claim to wallet
          </Button>
        ) : null}
      </div>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Show this at the booth</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-lg bg-white p-4">
              <QRCodeSVG value={qrPayload} size={200} level="M" />
            </div>
            <div className="text-center">
              <div className="font-display text-sm tracking-wider">{reward.title}</div>
              <div className="text-xs text-muted-foreground">{reward.value}</div>
            </div>
            <Button className="w-full" onClick={() => { onClaim(reward.id); setShowQR(false); }}>
              Mark as redeemed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
