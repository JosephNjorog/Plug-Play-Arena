import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'sign-in' | 'sign-up'>(params.get('mode') === 'signup' ? 'sign-up' : 'sign-in');
  const next = params.get('next') || '/onboarding';

  // Auto-redirect if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
  }, [navigate, next]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Welcome back');
    navigate(next, { replace: true });
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const redirectUrl = `${window.location.origin}/onboarding`;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username: username || email.split('@')[0], emoji: '🔺' },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Account created');
    navigate('/onboarding', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-12">
        <Link to="/" className="mb-10 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary text-sm font-black">▲</div>
          <span className="font-display text-lg tracking-wider">plug<span className="text-primary">n</span>play</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="font-display text-2xl tracking-wider">Enter the arena</h1>
          <p className="mt-1 text-xs text-muted-foreground">Sign in to compete, earn, and build your Avalanche identity.</p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'sign-in' | 'sign-up')} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign-in">Sign in</TabsTrigger>
              <TabsTrigger value="sign-up">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="sign-in" className="mt-4">
              <form onSubmit={onSignIn} className="space-y-3">
                <Field id="si-email" label="Email" type="email" value={email} onChange={setEmail} icon={<Mail className="h-3 w-3" />} />
                <Field id="si-pw" label="Password" type="password" value={password} onChange={setPassword} />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-3 w-3 animate-spin" />} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sign-up" className="mt-4">
              <form onSubmit={onSignUp} className="space-y-3">
                <Field id="su-name" label="Username" value={username} onChange={setUsername} placeholder="cryptoking" />
                <Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} icon={<Mail className="h-3 w-3" />} />
                <Field id="su-pw" label="Password" type="password" value={password} onChange={setPassword} placeholder="8+ chars" />
                <Button type="submit" className="w-full" disabled={busy || password.length < 6}>
                  {busy && <Loader2 className="h-3 w-3 animate-spin" />} Create account
                </Button>
                <p className="text-center text-[10px] text-muted-foreground">By creating an account you agree to fair play during live events.</p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Built for the Avalanche ecosystem · <Link to="/" className="text-primary hover:underline">back to home</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, type = 'text', placeholder, icon }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative mt-1">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
        <Input id={id} type={type} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          required
          className={icon ? 'pl-8' : ''}
        />
      </div>
    </div>
  );
}
