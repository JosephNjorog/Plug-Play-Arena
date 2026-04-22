import { NFTBadge } from '@/lib/avalanche';

const rarityClass = {
  Common:    'border-border',
  Rare:      'border-secondary/60 shadow-[0_0_0_1px_hsl(var(--secondary)/0.3)]',
  Legendary: 'border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]',
} as const;

const rarityText = {
  Common: 'text-muted-foreground',
  Rare: 'text-secondary',
  Legendary: 'text-primary',
} as const;

export function NFTBadgeCard({ nft }: { nft: NFTBadge }) {
  return (
    <div className={`flex flex-col items-center rounded-xl border bg-card p-4 text-center ${rarityClass[nft.rarity]}`}>
      <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-muted to-card text-4xl">
        {nft.emoji}
      </div>
      <h4 className="font-display text-sm tracking-wider">{nft.title}</h4>
      <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{nft.eventName}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{nft.date}</p>
      <span className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${rarityText[nft.rarity]}`}>{nft.rarity}</span>
    </div>
  );
}
