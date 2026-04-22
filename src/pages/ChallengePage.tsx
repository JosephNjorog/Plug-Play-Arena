import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ACCENT_CLASS, AvalancheChallenge, TIER_BADGE, dbRowToChallenge } from '@/lib/challenges';
import { StablecoinSimulator } from '@/components/avalanche/StablecoinSimulator';
import { StablecoinState, evaluate } from '@/lib/stablecoinEngine';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/lib/playerContext';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Loader2, Lock, Rocket, Sparkles, Trophy, Copy, ExternalLink } from 'lucide-react';

type SubStatus = 'idle' | 'submitting' | 'verifying' | 'verified' | 'rejected';
type MintStatus = 'idle' | 'minting' | 'minted' | 'error';

export default function ChallengePage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<AvalancheChallenge | null | undefined>(undefined);
  const { user, profile, refreshNfts, refreshProfile } = usePlayer();

  useEffect(() => {
    if (!slug) { setChallenge(null); return; }
    supabase.from('challenges').select('*').eq('slug', slug).maybeSingle()
      .then(({ data }) => setChallenge(data ? dbRowToChallenge(data) : null));
  }, [slug]);

  const [stepDone, setStepDone] = useState<Record<number, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [subId, setSubId] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus>('idle');
  const [rejection, setRejection] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Record<string, unknown> | null>(null);
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle');
  const [mintTx, setMintTx] = useState<string | null>(null);
  const [mintWallet, setMintWallet] = useState<string>('');
  const [simState, setSimState] = useState<StablecoinState | null>(null);

  const isStablecoin = challenge?.id === 'avausd-peg';

  useEffect(() => {
    if (!challenge) return;
    if (!user) { navigate(`/auth?next=/challenge/${slug}`); return; }
    setMintWallet(profile?.wallet_address ?? values.wallet_address ?? '');
    // Load latest submission
    supabase.from('challenge_submissions')
      .select('id,status,payload,evidence,rejection_reason')
      .eq('user_id', user.id)
      .eq('challenge_id', challenge.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setSubId(data.id);
        setValues((data.payload as Record<string, string>) ?? {});
        setEvidence((data.evidence as Record<string, unknown>) ?? null);
        if (data.status === 'verified') setSubStatus('verified');
        else if (data.status === 'rejected') { setSubStatus('rejected'); setRejection(data.rejection_reason); }
      });
    // Has it already been minted?
    supabase.from('nft_mints').select('tx_hash')
      .eq('user_id', user.id).eq('challenge_id', challenge.id).maybeSingle()
      .then(({ data }) => { if (data?.tx_hash) { setMintStatus('minted'); setMintTx(data.tx_hash); } });
  }, [challenge, user, slug, navigate, profile?.wallet_address]);

  if (challenge === undefined) {
    return <div className="min-h-screen"><AppNavbar /><div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Loading challenge…</div></div>;
  }

  if (!challenge) {
    return <div className="min-h-screen"><AppNavbar /><div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Challenge not found. <Link to="/library" className="text-primary underline">Back to library</Link></div></div>;
  }

  const totalSteps = challenge.steps.length;
  const completedSteps = Object.values(stepDone).filter(Boolean).length;
  const allStepsDone = completedSteps >= totalSteps;
  const allFieldsFilled = [challenge.submission.primary, ...(challenge.submission.extras ?? [])]
    .every(f => (values[f.key] ?? '').trim().length > 0);
  const submissionUnlocked = allStepsDone && allFieldsFilled;

  async function submit() {
    if (!user || !challenge) return;
    setSubStatus('submitting'); setRejection(null);
    try {
      // Build payload: parse any JSON-string fields (e.g. final_state) into real objects.
      const payload: Record<string, unknown> = { ...values };
      for (const f of [challenge.submission.primary, ...(challenge.submission.extras ?? [])]) {
        if ((f.kind === 'custom' || f.kind === 'json') && typeof payload[f.key] === 'string') {
          try { payload[f.key] = JSON.parse(payload[f.key] as string); } catch { /* keep as string */ }
        }
      }
      const { data: subIdReturned, error } = await supabase.rpc('record_submission', {
        _challenge_id: challenge.id,
        _kind: challenge.submission.primary.kind,
        _payload: payload as never,
        _event_id: null,
        _round_id: null,
        _attempt_id: null,
      });
      if (error) throw error;
      const id = subIdReturned as string;
      setSubId(id);
      setSubStatus('verifying');
      const { data, error: vErr } = await supabase.functions.invoke('verify-submission', { body: { submission_id: id } });
      if (vErr) throw vErr;
      const res = data as { status: string; reason?: string; evidence?: Record<string, unknown> };
      setEvidence(res.evidence ?? null);
      if (res.status === 'verified') {
        setSubStatus('verified');
        toast.success('Submission verified ✅');
      } else {
        setSubStatus('rejected');
        setRejection(res.reason ?? 'Submission rejected');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Submission failed';
      setSubStatus('rejected'); setRejection(msg); toast.error(msg);
    }
  }

  async function mint() {
    if (!challenge || !user) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(mintWallet)) { toast.error('Enter a valid 0x… wallet first'); return; }
    setMintStatus('minting');
    try {
      const { data, error } = await supabase.functions.invoke('mint-badge-fuji', {
        body: {
          challenge_id: challenge.id,
          badge_title: challenge.badgeTitle,
          recipient_address: mintWallet,
          event_id: null,
          metadata: { tier: challenge.tier, xp: challenge.xpReward },
        },
      });
      if (error) throw error;
      const res = data as { status: string; tx_hash?: string; error?: string };
      if (res.error) throw new Error(res.error);
      setMintStatus('minted');
      setMintTx(res.tx_hash ?? null);
      toast.success('NFT minted on Fuji 🎉');
      refreshNfts(); refreshProfile();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Mint failed';
      setMintStatus('error'); toast.error(msg);
    }
  }

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/library?tab=speedrun" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Back to challenges</Link>

        {/* Header card */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative flex h-44 items-center justify-center bg-[hsl(240_8%_8%)] border-b border-border">
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(hsl(0_0%_100%)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_100%)_1px,transparent_1px)] [background-size:8px_8px]" />
            <div className="text-8xl drop-shadow-[0_0_24px_hsl(354_100%_61%/0.4)]">{challenge.emoji}</div>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TIER_BADGE[challenge.tier]}`}>{challenge.tier}</span>
              {challenge.aiReady && <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary"><Sparkles className="h-2.5 w-2.5" /> AI-ready</span>}
              <span className="text-[11px] text-muted-foreground">~{challenge.estMinutes} min · +{challenge.xpReward} XP</span>
            </div>
            <h1 className={`mt-2 font-display text-2xl uppercase tracking-wider ${ACCENT_CLASS[challenge.accent]}`}>{challenge.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{challenge.tagline}</p>
          </div>
        </div>

        {/* Concept + Brief */}
        <Section title="Concept">{challenge.concept}</Section>
        <Section title="Mission Brief">{challenge.brief}</Section>

        {/* Stablecoin live simulator */}
        {isStablecoin && (
          <StablecoinSimulator
            onStateChange={(s) => {
              setSimState(s);
              // Auto-tick steps based on sim progress
              setStepDone(prev => {
                const next = { ...prev };
                if (s.collateral > 1000) next[0] = true;
                if (s.debt > 0) next[1] = true;
                if (s.borrowRate !== 5 || s.savingsRate !== 2) next[2] = true;
                if (s.marketCrashed) next[3] = true;
                const v = evaluate(s);
                if (s.marketCrashed && v.passed) next[4] = true;
                return next;
              });
              // Auto-fill submission payload
              const v = evaluate(s);
              const ratio = s.debt > 0 ? (s.collateral * s.collateralPrice / s.debt) * 100 : Infinity;
              setValues(vals => ({
                ...vals,
                final_state: JSON.stringify({
                  peg: s.peg, health: isFinite(s.health) ? s.health : 999999,
                  collateralRatio: isFinite(ratio) ? ratio : 999999,
                  collateral: s.collateral, debt: s.debt,
                  collateralPrice: s.collateralPrice,
                  borrowRate: s.borrowRate, savingsRate: s.savingsRate,
                  marketCrashed: s.marketCrashed, strategy: v.strategy,
                }),
              }));
            }}
          />
        )}

        {/* Steps */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Steps</h2>
            <span className="text-[11px] text-muted-foreground">{completedSteps} / {totalSteps}</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${(completedSteps / totalSteps) * 100}%` }} />
          </div>
          <ol className="mt-3 space-y-2">
            {challenge.steps.map((s, i) => {
              // Stablecoin progress lock: each step requires the previous done
              const locked = isStablecoin && i > 0 && !stepDone[i - 1];
              const lastStep = isStablecoin && i === challenge.steps.length - 1;
              return (
                <li key={i} className={`rounded-lg border bg-card p-3 ${locked ? 'border-border opacity-50' : 'border-border'}`}>
                  <label className={`flex items-start gap-3 ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={!!stepDone[i]}
                      disabled={locked || (isStablecoin && !lastStep)}
                      onChange={e => setStepDone(prev => ({ ...prev, [i]: e.target.checked }))}
                      className="mt-1 h-4 w-4 accent-[hsl(354_100%_61%)]"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{i + 1}. {s.title} {locked && <Lock className="ml-1 inline h-3 w-3 text-muted-foreground" />}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{s.detail}</div>
                      {s.hint && <div className="mt-1 text-[11px] text-secondary">💡 {s.hint}</div>}
                    </div>
                  </label>
                </li>
              );
            })}
          </ol>
        </div>

        {/* AI Prompt helper */}
        {challenge.aiPrompt && (
          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Sparkles className="h-3 w-3" /> AI-ready prompt</div>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(challenge.aiPrompt!); toast.success('Copied'); }}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{challenge.aiPrompt}</p>
          </div>
        )}

        {/* Submission */}
        <div className={`mt-6 rounded-2xl border p-5 transition-colors ${submissionUnlocked || subStatus === 'verified' ? 'border-primary/40 bg-card' : 'border-border bg-card/40'}`}>
          <div className="flex items-center gap-2">
            {!submissionUnlocked && subStatus !== 'verified' ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Rocket className="h-4 w-4 text-primary" />}
            <h2 className="font-display text-sm uppercase tracking-wider">Submission</h2>
            {subStatus === 'verified' && <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-[hsl(145_70%_45%/0.4)] bg-[hsl(145_70%_45%/0.15)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(145_70%_60%)]"><CheckCircle2 className="h-3 w-3" /> Verified</span>}
          </div>
          {!submissionUnlocked && subStatus !== 'verified' && (
            <p className="mt-2 text-xs text-muted-foreground">Tick all steps and fill every field to unlock submission.</p>
          )}
          <div className="mt-4 space-y-3">
            {[challenge.submission.primary, ...(challenge.submission.extras ?? [])].map(f => (
              <div key={f.key}>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{f.label}</label>
                {f.kind === 'custom' ? (
                  <div className="rounded-md border border-border bg-[hsl(240_8%_8%)] p-3 font-mono text-[11px] text-muted-foreground">
                    {values[f.key]
                      ? <pre className="overflow-auto">{(() => { try { return JSON.stringify(JSON.parse(values[f.key]), null, 2); } catch { return values[f.key]; } })()}</pre>
                      : <span>Interact with the simulator above — state will be captured automatically.</span>}
                  </div>
                ) : f.kind === 'json' ? (
                  <Textarea
                    rows={6}
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    disabled={subStatus === 'verified' || subStatus === 'verifying'}
                    className="font-mono text-xs"
                  />
                ) : (
                  <Input
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    disabled={subStatus === 'verified' || subStatus === 'verifying'}
                  />
                )}
                {f.helpText && <div className="mt-1 text-[11px] text-muted-foreground">{f.helpText}</div>}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={submit}
              disabled={!submissionUnlocked || subStatus === 'verifying' || subStatus === 'submitting' || subStatus === 'verified'}
            >
              {subStatus === 'verifying' && <><Loader2 className="h-4 w-4 animate-spin" /> Verifying on Fuji…</>}
              {subStatus === 'submitting' && <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>}
              {subStatus === 'verified' && <><CheckCircle2 className="h-4 w-4" /> Verified</>}
              {(subStatus === 'idle' || subStatus === 'rejected') && 'Submit & verify'}
            </Button>
            {subStatus === 'rejected' && <span className="text-xs text-destructive">{rejection}</span>}
          </div>

          {evidence && subStatus === 'verified' && (
            <div className="mt-3 rounded-md bg-muted/40 p-3">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">On-chain evidence</div>
              <pre className="overflow-auto text-[11px] text-muted-foreground">{JSON.stringify(evidence, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Reward reveal */}
        {subStatus === 'verified' && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-5">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm uppercase tracking-wider">Reward</h2>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-5xl">{challenge.emoji}</div>
              <div>
                <div className="font-display text-lg tracking-wider">{challenge.badgeTitle}</div>
                <div className="text-xs text-muted-foreground">+{challenge.xpReward} XP · NFT minted on Fuji</div>
              </div>
            </div>

            {mintStatus === 'minted' ? (
              <div className="mt-4 rounded-md border border-[hsl(145_70%_45%/0.4)] bg-[hsl(145_70%_45%/0.10)] p-3">
                <div className="text-xs font-semibold text-[hsl(145_70%_65%)]">Badge minted ✓</div>
                {mintTx && (
                  <a href={`https://testnet.snowtrace.io/tx/${mintTx}`} target="_blank" rel="noreferrer"
                     className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                    View on Snowtrace <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <label className="block text-xs uppercase tracking-widest text-muted-foreground">Send NFT to wallet</label>
                <Input
                  placeholder="0x… your Fuji address"
                  value={mintWallet}
                  onChange={e => setMintWallet(e.target.value)}
                  disabled={mintStatus === 'minting'}
                />
                <Button onClick={mint} disabled={mintStatus === 'minting'}>
                  {mintStatus === 'minting' ? <><Loader2 className="h-4 w-4 animate-spin" /> Minting on Fuji…</> : <>Mint badge to my wallet</>}
                </Button>
                {mintStatus === 'error' && <div className="text-xs text-destructive">Mint failed. The contract may not be deployed yet — an admin can run the deploy step.</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed">{children}</p>
    </div>
  );
}
