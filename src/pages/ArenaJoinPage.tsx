import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArena } from '@/lib/arenaContext';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Gamepad2, Wallet, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { connectWallet, isValidAddress } from '@/lib/wallet';

export default function ArenaJoinPage() {
  const { code: paramCode } = useParams();
  const navigate = useNavigate();
  const { joinSession, phase, myPlayer, players, joining } = useArena();
  const [code, setCode] = useState((paramCode ?? '').replace(/\D/g, '').slice(0, 6));
  const [nickname, setNickname] = useState('');
  const [wallet, setWallet] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Once joined, navigate to play
  useEffect(() => {
    if (myPlayer && phase !== 'idle') navigate('/arena/play');
  }, [myPlayer, phase, navigate]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setWallet(addr);
      toast.success('Wallet connected');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Connect failed'); }
    setConnecting(false);
  }

  async function handleJoin() {
    if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    if (!nickname.trim()) { toast.error('Pick a nickname'); return; }
    try {
      await joinSession(code, nickname.trim(), isValidAddress(wallet) ? wallet : null);
      toast.success('Joined ✅');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to join'); }
  }

  const canJoin = code.length === 6 && nickname.trim().length > 0 && !joining;

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="mx-auto max-w-sm px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏟️</div>
          <h1 className="font-display text-2xl tracking-wider">Join Arena</h1>
          <p className="text-xs text-muted-foreground mt-2">Jump in as a guest. Connect a wallet later to claim NFT rewards.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Game Code</label>
            <Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456" className="text-center font-display text-xl tracking-[0.3em]" maxLength={6} inputMode="numeric" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Nickname</label>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Your name" maxLength={20} />
          </div>

          <Button onClick={handleJoin} disabled={!canJoin} className="w-full gap-2 font-display tracking-wider" size="lg">
            <Gamepad2 className="h-4 w-4" /> {joining ? 'Joining…' : 'Join Game'}
          </Button>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Wallet (optional)</label>
            {isValidAddress(wallet) ? (
              <div className="flex items-center justify-between rounded-md border border-[hsl(145_70%_45%/0.4)] bg-[hsl(145_70%_45%/0.1)] px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-[hsl(145_70%_55%)]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-mono text-xs">{wallet.slice(0, 6)}…{wallet.slice(-4)}</span>
                </span>
                <button onClick={() => setWallet('')} className="text-xs text-muted-foreground hover:text-foreground">Change</button>
              </div>
            ) : (
              <Button onClick={handleConnect} disabled={connecting} variant="outline" className="w-full gap-2">
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                {connecting ? 'Connecting…' : 'Connect Wallet (optional)'}
              </Button>
            )}
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Winners can mint an NFT badge on Avalanche Fuji
            </p>
          </div>

          {players.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">{players.length} player{players.length !== 1 && 's'} in lobby</p>
          )}
        </div>
      </div>
    </div>
  );
}
