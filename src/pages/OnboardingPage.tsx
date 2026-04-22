import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { PersonaSelector } from '@/components/avalanche/PersonaSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Persona, EMOJI_OPTIONS } from '@/lib/avalanche-extra';
import { usePlayer } from '@/lib/playerContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = usePlayer();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState(profile?.username || '');
  const [emoji, setEmoji] = useState(profile?.emoji || '🦊');
  const [persona, setPersona] = useState<Persona | null>(profile?.persona ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth?next=/onboarding', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setEmoji(profile.emoji);
      setPersona(profile.persona);
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!user || !persona || !username.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('profiles')
      .update({ username: username.trim(), emoji, persona })
      .eq('user_id', user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success('Identity saved');
    navigate('/events');
  };

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="h-3 w-3" /> 30-second onboarding
          </div>
          <h1 className="mt-4 font-display text-3xl tracking-wider">Create your Avalanche identity</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your identity persists across every event.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl tracking-wider">Pick your name & avatar</h2>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Username</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. AvaBuilder" maxLength={24} />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-colors ${
                        emoji === e ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:border-primary/40'
                      }`}
                    >{e}</button>
                  ))}
                </div>
              </div>

              <Button className="w-full gap-2" disabled={!username.trim()} onClick={() => setStep(2)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl tracking-wider">What brings you here?</h2>
              <PersonaSelector selected={persona} onSelect={setPersona} />
              <Button className="w-full gap-2" disabled={!persona || busy} onClick={handleSubmit}>
                Enter the arena <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
