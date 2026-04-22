import { useGame } from '@/lib/gameContext';
import { Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WalletConnect() {
  const { walletConnected, walletAddress, connectWallet, disconnectWallet } = useGame();

  if (walletConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-muted-foreground">{walletAddress}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={disconnectWallet}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connectWallet} className="gap-2 neon-border font-display text-sm tracking-wider">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
