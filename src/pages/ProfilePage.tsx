import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { PersonaSelector } from '@/components/avalanche/PersonaSelector';
import { JourneyMeter } from '@/components/avalanche/JourneyMeter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePlayer } from '@/lib/playerContext';
import { Link } from 'react-router-dom';
import { LogOut, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { JourneyStage } from '@/lib/avalanche';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, profile, signOut, updatePersona, updateProfileMeta, nfts } = usePlayer();
  const [walletAddr, setWalletAddr] = useState('');

  useEffect(() => {
    if (profile?.wallet_address) setWalletAddr(profile.wallet_address);
  }, [profile]);

  if (!user || !profile) {
    return (
      <div className="min-h-screen">
        <AppNavbar />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-2xl tracking-wider">Sign in to view profile</h1>
          <Button asChild className="mt-6"><Link to="/auth">Sign in</Link></Button>
        </div>
      </div>
    );
  }

  const stage = (profile.stage.charAt(0).toUpperCase() + profile.stage.slice(1)) as JourneyStage;

  const saveWallet = async () => {
    await updateProfileMeta({ wallet_address: walletAddr.trim() || null });
    toast.success('Wallet updated');
  };

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted text-4xl">{profile.emoji}</div>
            <div className="flex-1">
              <h1 className="font-display text-2xl tracking-wider">{profile.username}</h1>
              <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-2 py-0.5">{stage}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{profile.xp} XP</span>
                <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-secondary">Lv {profile.level}</span>
              </div>
            </div>
          </div>
          <div className="mt-6"><JourneyMeter xp={profile.xp} stage={stage} compact /></div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg tracking-wider">Wallet</h2>
          <p className="mt-1 text-xs text-muted-foreground">Optional — used to deliver AVAX rewards.</p>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Wallet className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input value={walletAddr} onChange={e => setWalletAddr(e.target.value)} placeholder="0x…" className="pl-8 font-mono text-xs" />
            </div>
            <Button onClick={saveWallet}>Save</Button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg tracking-wider">Persona</h2>
          <p className="mt-1 text-xs text-muted-foreground">Switch any time — your library updates instantly.</p>
          <div className="mt-4"><PersonaSelector selected={profile.persona} onSelect={updatePersona} /></div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg tracking-wider">Stats</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="NFT badges" value={nfts.length} />
            <Stat label="Streak" value={profile.streak} />
            <Stat label="Level" value={profile.level} />
            <Stat label="XP" value={profile.xp} />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" className="gap-1 text-muted-foreground" onClick={() => signOut()}>
            <LogOut className="h-3 w-3" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl">{value}</div>
    </div>
  );
}
