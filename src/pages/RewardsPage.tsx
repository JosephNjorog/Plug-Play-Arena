import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { NFTBadgeCard } from '@/components/avalanche/NFTBadgeCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePlayer } from '@/lib/playerContext';
import { Link } from 'react-router-dom';
import { Gift, Check, Wallet, QrCode } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

export default function RewardsPage() {
  const { user, profile, rewards, nfts, claimReward } = usePlayer();

  if (!user || !profile) {
    return (
      <div className="min-h-screen">
        <AppNavbar />
        <EmptyState
          title="Sign in to view your rewards"
          sub="Your AVAX, merch, NFTs, and perks will appear here."
          ctaLabel="Sign in"
          ctaHref="/auth"
        />
      </div>
    );
  }

  const unclaimed = rewards.filter(r => !r.claimed);
  const claimed = rewards.filter(r => r.claimed);

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="font-display text-3xl tracking-wider sm:text-4xl">Rewards</h1>
          <p className="mt-2 text-sm text-muted-foreground">AVAX, merch, NFTs, perks — claim what you've earned.</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Unclaimed" value={`${unclaimed.length}`} accent />
            <Stat label="Claimed" value={`${claimed.length}`} />
            <Stat label="NFT badges" value={`${nfts.length}`} />
            <Stat label="Total XP" value={profile.xp.toLocaleString()} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="rewards">
          <TabsList>
            <TabsTrigger value="rewards">Rewards ({rewards.length})</TabsTrigger>
            <TabsTrigger value="nfts">NFT Badges ({nfts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="mt-6">
            {rewards.length === 0 ? (
              <EmptyInline icon={<Gift className="h-8 w-8" />} text="No rewards yet — complete missions to earn." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rewards.map(r => <CloudRewardCard key={r.id} reward={r} onClaim={claimReward} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="nfts" className="mt-6">
            {nfts.length === 0 ? (
              <EmptyInline icon={<span className="text-3xl">🪪</span>} text="No NFT badges yet — finish missions tagged 'NFT'." />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {nfts.map(n => (
                  <NFTBadgeCard
                    key={n.id}
                    nft={{
                      id: n.id, title: n.title, eventId: n.event_id || '',
                      eventName: '—', date: new Date(n.minted_at).toLocaleDateString(),
                      achievement: 'Mission complete', emoji: n.emoji,
                      rarity: (n.rarity.charAt(0).toUpperCase() + n.rarity.slice(1)) as 'Common' | 'Rare' | 'Legendary',
                      mintedAt: new Date(n.minted_at).getTime(),
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CloudRewardCard({ reward, onClaim }: {
  reward: { id: string; title: string; description: string | null; kind: string; rarity: string; value: string | null; claimed: boolean };
  onClaim: (id: string) => void | Promise<void>;
}) {
  const [showQR, setShowQR] = useState(false);
  const isPhysical = reward.kind === 'merch';
  const emoji = reward.kind === 'token' ? '💰' : reward.kind === 'merch' ? '🎁' : '🎟️';
  const qrPayload = JSON.stringify({ rewardId: reward.id, title: reward.title, value: reward.value });

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">{emoji}</div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-display text-sm tracking-wider">{reward.title}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{reward.description}</p>
        </div>
        {reward.value && <span className="text-xs font-semibold text-primary">{reward.value}</span>}
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
        ) : (
          <Button size="sm" className="w-full" onClick={() => onClaim(reward.id)}>
            <Wallet className="h-3 w-3" /> Claim to wallet
          </Button>
        )}
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
              {reward.value && <div className="text-xs text-muted-foreground">{reward.value}</div>}
            </div>
            <Button className="w-full" onClick={async () => { await onClaim(reward.id); setShowQR(false); }}>
              Mark as redeemed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl ${accent ? 'text-primary' : ''}`}>{value}</div>
    </div>
  );
}

function EmptyInline({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
      <div>{icon}</div>{text}
    </div>
  );
}

function EmptyState({ title, sub, ctaLabel, ctaHref }: { title: string; sub: string; ctaLabel: string; ctaHref: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl tracking-wider">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
      <Button asChild className="mt-6"><Link to={ctaHref}>{ctaLabel}</Link></Button>
    </div>
  );
}
