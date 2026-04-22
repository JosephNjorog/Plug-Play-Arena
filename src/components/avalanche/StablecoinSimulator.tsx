import { useEffect, useMemo, useState } from 'react';
import {
  StablecoinState, initState, depositCollateral, mintStablecoin, repay,
  adjustRates, simulateMarketShock, liquidate, evaluate, PEG_TARGET, PEG_TOLERANCE, MIN_HEALTH,
} from '@/lib/stablecoinEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Activity, Coins, Banknote, Sliders, Flame, RotateCcw } from 'lucide-react';

interface Props {
  onStateChange?: (s: StablecoinState) => void;
  onCrash?: () => void;
  onPegRestored?: () => void;
}

export function StablecoinSimulator({ onStateChange, onCrash, onPegRestored }: Props) {
  const [state, setState] = useState<StablecoinState>(initState());
  const [depositAmt, setDepositAmt] = useState(100);
  const [mintAmt, setMintAmt] = useState(100);
  const [repayAmt, setRepayAmt] = useState(50);
  const [borrow, setBorrow] = useState(state.borrowRate);
  const [savings, setSavings] = useState(state.savingsRate);
  const [pegEverRestored, setPegEverRestored] = useState(false);

  const verdict = useMemo(() => evaluate(state), [state]);
  const pegOk = Math.abs(state.peg - PEG_TARGET) <= PEG_TOLERANCE;

  useEffect(() => { onStateChange?.(state); }, [state, onStateChange]);
  useEffect(() => { if (state.marketCrashed) onCrash?.(); }, [state.marketCrashed, onCrash]);
  useEffect(() => {
    if (state.marketCrashed && pegOk && state.health >= MIN_HEALTH && !pegEverRestored) {
      setPegEverRestored(true);
      onPegRestored?.();
    }
  }, [state.marketCrashed, pegOk, state.health, pegEverRestored, onPegRestored]);

  const pegPct = Math.min(100, Math.max(0, ((state.peg - 0.7) / 0.6) * 100));
  const healthPct = Math.min(100, isFinite(state.health) ? state.health / 3 : 100);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-secondary/40 bg-card">
      <div className="border-b border-border bg-[hsl(240_8%_8%)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-secondary">Live simulation</div>
            <div className="font-display text-lg uppercase tracking-wider text-foreground">AvaUSD Control Room</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { setState(initState()); setPegEverRestored(false); }}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>
      </div>

      {/* HUD */}
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
        <Stat label="Peg" value={`$${state.peg.toFixed(3)}`} hint={pegOk ? '✓ within ±0.02' : 'off-peg'} ok={pegOk} pct={pegPct} />
        <Stat label="Health" value={isFinite(state.health) ? `${state.health.toFixed(0)}%` : '∞'} hint={state.health >= MIN_HEALTH ? '✓ safe' : 'at risk'} ok={state.health >= MIN_HEALTH} pct={healthPct} />
        <Stat label="Collateral" value={`${state.collateral.toFixed(0)} AVAX`} hint={`@ $${state.collateralPrice}`} />
        <Stat label="Debt" value={`${state.debt.toFixed(0)} AvaUSD`} hint={`borrow ${state.borrowRate}% · save ${state.savingsRate}%`} />
      </div>

      {/* Crash banner */}
      {state.marketCrashed && !pegOk && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" /> Market crash active. Restore the peg by repaying debt, liquidating, or adjusting rates.
        </div>
      )}

      {/* Action panels */}
      <div className="grid grid-cols-1 gap-3 p-4 pt-0 md:grid-cols-2">
        <ActionCard icon={<Coins className="h-3 w-3" />} title="Deposit collateral">
          <Input type="number" min={1} value={depositAmt} onChange={e => setDepositAmt(Number(e.target.value) || 0)} />
          <Button onClick={() => setState(s => depositCollateral(s, depositAmt))}>+ Deposit AVAX</Button>
        </ActionCard>

        <ActionCard icon={<Banknote className="h-3 w-3" />} title="Mint AvaUSD">
          <Input type="number" min={1} value={mintAmt} onChange={e => setMintAmt(Number(e.target.value) || 0)} />
          <Button onClick={() => setState(s => mintStablecoin(s, mintAmt))}>Mint</Button>
        </ActionCard>

        <ActionCard icon={<Activity className="h-3 w-3" />} title="Repay debt">
          <Input type="number" min={1} value={repayAmt} onChange={e => setRepayAmt(Number(e.target.value) || 0)} />
          <div className="flex gap-2">
            <Button onClick={() => setState(s => repay(s, repayAmt))}>Repay</Button>
            <Button variant="outline" onClick={() => setState(s => liquidate(s, repayAmt))}>
              <Flame className="h-3 w-3" /> Liquidate
            </Button>
          </div>
        </ActionCard>

        <ActionCard icon={<Sliders className="h-3 w-3" />} title="Adjust rates">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[10px] uppercase text-muted-foreground">Borrow %</label>
            <Input type="number" min={0} value={borrow} onChange={e => setBorrow(Number(e.target.value) || 0)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[10px] uppercase text-muted-foreground">Savings %</label>
            <Input type="number" min={0} value={savings} onChange={e => setSavings(Number(e.target.value) || 0)} />
          </div>
          <Button onClick={() => setState(s => adjustRates(s, borrow, savings))}>Apply rates</Button>
        </ActionCard>
      </div>

      {/* Crash trigger */}
      <div className="border-t border-border bg-[hsl(240_8%_8%)] p-4">
        <Button
          variant="destructive"
          onClick={() => setState(s => simulateMarketShock(s))}
          disabled={state.marketCrashed || state.debt === 0}
        >
          <AlertTriangle className="h-4 w-4" /> {state.marketCrashed ? 'Market already crashed' : 'Trigger market crash (−30%)'}
        </Button>
        {state.debt === 0 && !state.marketCrashed && (
          <div className="mt-2 text-[11px] text-muted-foreground">Mint some AvaUSD first — a crash with no debt is meaningless.</div>
        )}
      </div>

      {/* Event log */}
      <div className="border-t border-border p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Event log</div>
        <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
          {state.events.map((e, i) => <li key={i} className={i === 0 ? 'text-foreground' : ''}>› {e}</li>)}
        </ul>
      </div>

      {/* Verdict */}
      <div className={`border-t border-border p-4 ${verdict.passed ? 'bg-[hsl(145_70%_45%/0.08)]' : 'bg-[hsl(354_100%_61%/0.05)]'}`}>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <Pill ok={verdict.pegStable}>Peg {verdict.pegStable ? '✓' : '✗'}</Pill>
          <Pill ok={verdict.healthy}>Health {verdict.healthy ? '✓' : '✗'}</Pill>
          <Pill ok={verdict.ratioOk}>Ratio {verdict.ratioOk ? '✓' : '✗'}</Pill>
        </div>
        <div className="mt-2 text-center text-[11px] text-muted-foreground">Strategy: <span className="text-foreground">{verdict.strategy}</span></div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, ok, pct }: { label: string; value: string; hint?: string; ok?: boolean; pct?: number }) {
  return (
    <div className="rounded-lg border border-border bg-[hsl(240_8%_8%)] p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-lg ${ok === false ? 'text-destructive' : ok ? 'text-[hsl(145_70%_60%)]' : 'text-foreground'}`}>{value}</div>
      {pct !== undefined && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full transition-all ${ok === false ? 'bg-destructive' : 'bg-secondary'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {hint && <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ActionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-[hsl(240_8%_8%)] p-3">
      <div className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-secondary">{icon} {title}</div>
      {children}
    </div>
  );
}

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-md border px-2 py-1 ${ok ? 'border-[hsl(145_70%_45%/0.4)] bg-[hsl(145_70%_45%/0.15)] text-[hsl(145_70%_60%)]' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
      {children}
    </span>
  );
}
