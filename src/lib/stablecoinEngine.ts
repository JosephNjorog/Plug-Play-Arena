// ═══════════════════════════════════════════════════════════════════
// AvaUSD: Keep the Peg — client-side stablecoin simulation engine
// Pure functions, immutable updates. No external deps.
// ═══════════════════════════════════════════════════════════════════

export type Strategy = 'Conservative' | 'Balanced' | 'Aggressive';

export interface StablecoinState {
  collateral: number;        // units of AVAX collateral deposited
  debt: number;              // AvaUSD minted
  collateralPrice: number;   // USD per AVAX (starts at 1 for sim simplicity)
  collateralRatio: number;   // required min ratio (%)
  peg: number;               // current AvaUSD price target (1 = $1)
  borrowRate: number;        // % APR
  savingsRate: number;       // % APR
  health: number;            // collateral value / debt * 100, ∞ if no debt
  marketCrashed: boolean;    // step 4 trigger
  events: string[];          // log
}

export const PEG_TARGET = 1;
export const PEG_TOLERANCE = 0.02;     // ±0.02 acceptable
export const MIN_HEALTH = 120;
export const MIN_RATIO = 150;

export function initState(): StablecoinState {
  return {
    collateral: 1000,
    debt: 0,
    collateralPrice: 1,
    collateralRatio: 150,
    peg: 1,
    borrowRate: 5,
    savingsRate: 2,
    health: Infinity,
    marketCrashed: false,
    events: ['System initialized · 1000 AVAX available'],
  };
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function recompute(s: StablecoinState) {
  const collateralValue = s.collateral * s.collateralPrice;
  s.health = s.debt > 0 ? (collateralValue / s.debt) * 100 : Infinity;

  if (s.debt <= 0) {
    s.peg = 1;
    return;
  }
  // Pressure model:
  //  - High debt vs collateral = supply pressure → peg < 1
  //  - High savings rate vs borrow rate sucks supply → peg ↑
  //  - Borrow rate too low encourages minting → peg ↓
  const utilization = s.debt / collateralValue;                  // 0..>1
  const ratePressure = (s.savingsRate - s.borrowRate) * 0.01;    // negative if borrow > savings
  const raw = 1 - utilization * 0.1 + ratePressure;
  s.peg = clamp(Number(raw.toFixed(4)), 0.5, 1.5);
}

function log(s: StablecoinState, msg: string) {
  s.events = [msg, ...s.events].slice(0, 12);
}

export function depositCollateral(state: StablecoinState, amount: number): StablecoinState {
  const s = { ...state, events: [...state.events] };
  s.collateral += amount;
  log(s, `+${amount} AVAX collateral deposited`);
  recompute(s);
  return s;
}

export function mintStablecoin(state: StablecoinState, amount: number): StablecoinState {
  const s = { ...state, events: [...state.events] };
  const collateralValue = s.collateral * s.collateralPrice;
  const newDebt = s.debt + amount;
  const ratio = (collateralValue / newDebt) * 100;
  if (ratio < s.collateralRatio) {
    log(s, `❌ Mint blocked · would breach ${s.collateralRatio}% ratio`);
    return s;
  }
  s.debt = newDebt;
  log(s, `+${amount} AvaUSD minted`);
  recompute(s);
  return s;
}

export function repay(state: StablecoinState, amount: number): StablecoinState {
  const s = { ...state, events: [...state.events] };
  const repaid = Math.min(amount, s.debt);
  s.debt -= repaid;
  log(s, `−${repaid} AvaUSD repaid`);
  recompute(s);
  return s;
}

export function adjustRates(state: StablecoinState, borrowRate: number, savingsRate: number): StablecoinState {
  const s = { ...state, events: [...state.events] };
  s.borrowRate = clamp(borrowRate, 0, 50);
  s.savingsRate = clamp(savingsRate, 0, 50);
  log(s, `Rates adjusted · borrow ${s.borrowRate}% · savings ${s.savingsRate}%`);
  recompute(s);
  return s;
}

export function simulateMarketShock(state: StablecoinState): StablecoinState {
  const s = { ...state, events: [...state.events] };
  s.collateralPrice = Number((s.collateralPrice * 0.7).toFixed(4));
  s.marketCrashed = true;
  log(s, `💥 Market crash · AVAX −30% to $${s.collateralPrice}`);
  recompute(s);
  return s;
}

export function liquidate(state: StablecoinState, amount: number): StablecoinState {
  // Burn debt by selling collateral at current price
  const s = { ...state, events: [...state.events] };
  const debtBurned = Math.min(amount, s.debt);
  const collateralSold = debtBurned / s.collateralPrice;
  if (collateralSold > s.collateral) {
    log(s, '❌ Not enough collateral to liquidate');
    return s;
  }
  s.collateral -= collateralSold;
  s.debt -= debtBurned;
  log(s, `🔥 Liquidated · ${collateralSold.toFixed(2)} AVAX → ${debtBurned} AvaUSD burned`);
  recompute(s);
  return s;
}

export interface Verdict {
  pegStable: boolean;
  healthy: boolean;
  ratioOk: boolean;
  passed: boolean;
  strategy: Strategy;
}

export function evaluate(state: StablecoinState): Verdict {
  const pegStable = Math.abs(state.peg - PEG_TARGET) <= PEG_TOLERANCE;
  const healthy = state.health >= MIN_HEALTH;
  const ratio = state.debt > 0 ? (state.collateral * state.collateralPrice / state.debt) * 100 : Infinity;
  const ratioOk = ratio >= MIN_RATIO;
  const passed = pegStable && healthy && ratioOk;

  // Strategy classification
  let strategy: Strategy = 'Balanced';
  if (state.debt === 0 || state.health > 300) strategy = 'Conservative';
  else if (state.health < 180) strategy = 'Aggressive';

  return { pegStable, healthy, ratioOk, passed, strategy };
}
