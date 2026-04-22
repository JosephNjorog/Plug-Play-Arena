// ═══════════════════════════════════════════════════════════════════
// Speedrun-style Avalanche Build Challenges
// Each challenge: Concept → Brief → Steps → Build → Submission → Reward
// Submissions are verified server-side (Fuji RPC + GitHub API).
// ═══════════════════════════════════════════════════════════════════

export type SubmissionKind = 'wallet' | 'tx_hash' | 'contract' | 'github' | 'json' | 'custom';
export type ChallengeTier = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ChallengeStep {
  title: string;
  detail: string;
  hint?: string;
}

export interface ChallengeSubmissionField {
  key: string;                 // e.g. "wallet_address"
  label: string;
  kind: SubmissionKind;
  placeholder: string;
  helpText?: string;
}

export interface AvalancheChallenge {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  emoji: string;
  /** Big readable card title color (semantic token name). */
  accent: 'cyan' | 'magenta' | 'gold' | 'lime' | 'pink' | 'sky';
  tier: ChallengeTier;
  aiReady: boolean;
  estMinutes: number;
  xpReward: number;
  badgeTitle: string;

  concept: string;             // What user learns
  brief: string;               // Real-world scenario
  steps: ChallengeStep[];      // 3–6 guided tasks
  buildPrompt: string;         // What they actually do
  aiPrompt?: string;           // Optional copy-paste prompt for Lovable / ChatGPT
  submission: {
    primary: ChallengeSubmissionField;
    extras?: ChallengeSubmissionField[];
  };
  /** What the verifier checks. */
  verification: {
    kind: SubmissionKind;
    rules: string[];
  };
}

export const AVALANCHE_CHALLENGES: AvalancheChallenge[] = [
  // 1 ────────────────────────────────────────────────────────────────
  {
    id: 'fuji-wallet',
    slug: 'fuji-wallet',
    title: 'Fuji Wallet Quest',
    tagline: 'Spin up a Core wallet, fund it from the faucet, and prove you own it.',
    emoji: '🦊',
    accent: 'cyan',
    tier: 'Beginner',
    aiReady: false,
    estMinutes: 10,
    xpReward: 250,
    badgeTitle: 'Fuji Initiate',
    concept: 'Self-custody on Avalanche: how a wallet, the Fuji testnet, and the faucet fit together.',
    brief: `You've just been hired as the on-chain ops lead at a small DAO. Before you touch real money, the team needs you to prove you can operate a wallet on Avalanche's Fuji testnet — fund it, hold it, sign with it.`,
    steps: [
      { title: 'Install Core or use MetaMask', detail: 'Install Core wallet (core.app) or add Avalanche Fuji to MetaMask.', hint: 'Fuji RPC: https://api.avax-test.network/ext/bc/C/rpc · Chain ID 43113' },
      { title: 'Switch to Fuji Testnet', detail: 'Select the Fuji C-Chain network inside your wallet.' },
      { title: 'Claim AVAX from the faucet', detail: 'Visit faucet.avax.network and request testnet AVAX to your address.' },
      { title: 'Confirm balance > 0', detail: 'Open snowtrace.io/?chainid=43113 and paste your address — you should see incoming AVAX.' },
      { title: 'Submit your address', detail: 'Paste your full 0x… address below to claim your Fuji Initiate badge.' },
    ],
    buildPrompt: 'Get a working Fuji wallet with non-zero AVAX balance.',
    submission: {
      primary: { key: 'wallet_address', label: 'Your Fuji wallet address', kind: 'wallet', placeholder: '0x…', helpText: 'Must be a valid EVM address (0x + 40 hex chars).' },
    },
    verification: {
      kind: 'wallet',
      rules: ['EVM address format (0x + 40 hex)', 'Address has Fuji balance ≥ 0 AVAX (proves it exists on chain)'],
    },
  },

  // 2 ────────────────────────────────────────────────────────────────
  {
    id: 'first-tx',
    slug: 'first-tx',
    title: 'Your First Fuji Transaction',
    tagline: 'Send AVAX, get the tx hash, and watch the network confirm it live.',
    emoji: '⚡',
    accent: 'lime',
    tier: 'Beginner',
    aiReady: false,
    estMinutes: 8,
    xpReward: 300,
    badgeTitle: 'First Mover',
    concept: 'How an EVM transaction works: from, to, value, gas, hash, confirmation.',
    brief: `Your DAO is moving stipend payments to Avalanche. Prove the basics: you can construct, sign, and broadcast a Fuji transaction — and verify it landed.`,
    steps: [
      { title: 'Open your funded Fuji wallet', detail: 'Use the address you registered in the Fuji Wallet Quest.' },
      { title: 'Send 0.01 AVAX to any Fuji address', detail: 'You can send back to yourself — the goal is producing a real tx.', hint: 'Try a burn address like 0x000000000000000000000000000000000000dEaD' },
      { title: 'Copy the transaction hash', detail: 'After confirmation, your wallet shows a 0x… tx hash. Copy it.' },
      { title: 'Verify on Snowtrace', detail: 'Paste the hash into testnet.snowtrace.io to confirm “Success”.' },
      { title: 'Submit the tx hash', detail: 'Paste the hash below — we re-check it directly against Fuji RPC.' },
    ],
    buildPrompt: 'Broadcast one successful Fuji transaction and submit its hash.',
    submission: {
      primary: { key: 'tx_hash', label: 'Fuji transaction hash', kind: 'tx_hash', placeholder: '0x…', helpText: '64 hex chars after 0x.' },
    },
    verification: {
      kind: 'tx_hash',
      rules: ['Hash format (0x + 64 hex)', 'Transaction exists on Fuji', 'Receipt status = success'],
    },
  },

  // 3 ────────────────────────────────────────────────────────────────
  {
    id: 'erc20-launch',
    slug: 'erc20-launch',
    title: 'Launch Your Token',
    tagline: 'Deploy an ERC-20 to Fuji and submit the contract address.',
    emoji: '🪙',
    accent: 'gold',
    tier: 'Intermediate',
    aiReady: true,
    estMinutes: 25,
    xpReward: 700,
    badgeTitle: 'Token Launcher',
    concept: 'ERC-20 anatomy: name, symbol, totalSupply, transfer, balanceOf — and how to deploy one to Fuji.',
    brief: `Your community wants a meme-coin reward token for event participation. Ship a real ERC-20 on Fuji that the team can later mint, distribute, and audit.`,
    steps: [
      { title: 'Open Remix IDE', detail: 'remix.ethereum.org — no install required.' },
      { title: 'Drop in an ERC-20', detail: 'Use the OpenZeppelin ERC20 template. Pick a name, symbol, and initial supply.' },
      { title: 'Compile with Solidity 0.8.x', detail: 'Make sure compilation passes with no errors.' },
      { title: 'Connect wallet → Fuji', detail: 'In Remix “Deploy & Run”, choose Injected Provider (MetaMask/Core) on chain 43113.' },
      { title: 'Deploy', detail: 'Confirm the tx. Copy the deployed contract address.' },
      { title: 'Submit the contract address', detail: 'Paste below — we check Fuji RPC for deployed bytecode.' },
    ],
    buildPrompt: 'Deploy a working ERC-20 to Fuji and submit its contract address.',
    aiPrompt: `Generate a minimal OpenZeppelin-based ERC-20 in Solidity 0.8.20 with constructor params (name, symbol, initialSupply) that mints initialSupply to msg.sender. Include SPDX license and pragma.`,
    submission: {
      primary: { key: 'contract_address', label: 'Deployed ERC-20 contract address', kind: 'contract', placeholder: '0x…', helpText: 'Address must have deployed bytecode on Fuji.' },
    },
    verification: {
      kind: 'contract',
      rules: ['Address format (0x + 40 hex)', 'eth_getCode returns non-empty bytecode on Fuji'],
    },
  },

  // 4 ────────────────────────────────────────────────────────────────
  {
    id: 'nft-mint',
    slug: 'nft-mint',
    title: 'Mint Your First NFT',
    tagline: 'Deploy an ERC-721 on Fuji and mint token #1 to your wallet.',
    emoji: '🖼️',
    accent: 'magenta',
    tier: 'Intermediate',
    aiReady: true,
    estMinutes: 30,
    xpReward: 800,
    badgeTitle: 'NFT Architect',
    concept: 'ERC-721: tokenURI, ownerOf, mint — and how off-chain metadata maps to on-chain ownership.',
    brief: `An artist friend wants to drop a 1-of-1 on Avalanche before her gallery show. You're shipping the contract, minting #1 to her wallet, and proving it on Snowtrace.`,
    steps: [
      { title: 'Write or scaffold an ERC-721', detail: 'Use OpenZeppelin ERC721 + Ownable in Remix or Hardhat.' },
      { title: 'Deploy to Fuji', detail: 'Same flow as the ERC-20 challenge — Injected Provider, chain 43113.' },
      { title: 'Mint token #1 to your wallet', detail: 'Call safeMint(yourAddress, "ipfs://…") or your own tokenURI.' },
      { title: 'Grab the mint tx hash', detail: 'From your wallet activity or Snowtrace.' },
      { title: 'Submit contract + tx hash', detail: 'Both get verified against Fuji RPC.' },
    ],
    buildPrompt: 'Deploy an ERC-721 on Fuji and mint at least one token.',
    aiPrompt: `Write a minimal OpenZeppelin-based ERC-721 in Solidity 0.8.20 with: name "AvaArt", symbol "AVART", a public safeMint(address to, string tokenURI) restricted to the owner, and a counter for tokenIds. Include SPDX + pragma.`,
    submission: {
      primary: { key: 'contract_address', label: 'NFT contract address', kind: 'contract', placeholder: '0x…' },
      extras: [
        { key: 'mint_tx_hash', label: 'Mint transaction hash', kind: 'tx_hash', placeholder: '0x…' },
      ],
    },
    verification: {
      kind: 'contract',
      rules: ['Contract has bytecode on Fuji', 'Mint tx hash exists on Fuji', 'Tx status = success'],
    },
  },

  // 5 ────────────────────────────────────────────────────────────────
  {
    id: 'subnet-blueprint',
    slug: 'subnet-blueprint',
    title: 'Subnet Blueprint',
    tagline: 'Design a custom Avalanche L1 in JSON — validators, gas token, governance.',
    emoji: '🧩',
    accent: 'sky',
    tier: 'Advanced',
    aiReady: true,
    estMinutes: 20,
    xpReward: 900,
    badgeTitle: 'Subnet Architect',
    concept: 'Why teams launch Avalanche L1s: sovereign gas tokens, validator sets, custom rules.',
    brief: `A gaming studio wants their own Avalanche L1 so in-game gas is paid in their token, not AVAX. Draft the configuration that an ops team could hand to avalanche-cli.`,
    steps: [
      { title: 'Pick a name and chain ID', detail: 'Choose something memorable. Chain ID must not collide with mainnet ranges.' },
      { title: 'Pick a gas token', detail: 'Symbol, decimals, and an initial allocation map.' },
      { title: 'Define validator set', detail: 'How many validators at launch? Stake requirements?' },
      { title: 'Choose governance model', detail: 'Foundation-led, multisig, or DAO?' },
      { title: 'Submit your spec as JSON', detail: 'Single JSON object with: name, chainId, gasToken, validators, governance.' },
    ],
    buildPrompt: 'Submit a JSON spec for a custom Avalanche L1.',
    aiPrompt: `Draft a JSON config for a custom Avalanche L1 for a gaming project. Required keys: name (string), chainId (int), gasToken { symbol, decimals, initialAllocation: { address: amount } }, validators { count, minStake }, governance ("foundation"|"multisig"|"dao"). Output JSON only — no commentary.`,
    submission: {
      primary: { key: 'spec_json', label: 'Subnet config JSON', kind: 'json', placeholder: '{ "name": "MyChain", "chainId": 4242, … }', helpText: 'Must be valid JSON with required keys.' },
    },
    verification: {
      kind: 'json',
      rules: ['Parses as JSON object', 'Has keys: name, chainId, gasToken, validators, governance', 'chainId is a positive integer'],
    },
  },

  // 7 ────────────────────────────────────────────────────────────────
  {
    id: 'avausd-peg',
    slug: 'avausd-peg',
    title: 'AvaUSD: Keep the Peg',
    tagline: 'Design, defend, and stabilize a decentralized stablecoin on Avalanche.',
    emoji: '🏦',
    accent: 'cyan',
    tier: 'Advanced',
    aiReady: true,
    estMinutes: 45,
    xpReward: 1500,
    badgeTitle: 'Peg Defender',
    concept: 'Stablecoins rely on collateral, interest rates, and liquidation mechanics to maintain a $1 peg. You\'ll experience the trilemma firsthand.',
    brief: 'You are launching AvaUSD on Avalanche. Your mission: maintain a stable $1 peg under volatile market conditions. Mint, manage rates, survive a 30% crash, and prove your system holds.',
    steps: [
      { title: 'Deposit collateral', detail: 'Add AVAX-backed collateral to secure your system.' },
      { title: 'Mint AvaUSD', detail: 'Generate stablecoins while keeping a safe collateral ratio (≥ 150%).' },
      { title: 'Adjust interest rates', detail: 'Balance supply and demand using borrow/savings rates.' },
      { title: 'Survive a market crash', detail: 'Trigger the −30% AVAX shock and watch your peg slip.' },
      { title: 'Restore the peg', detail: 'Bring AvaUSD back to $1 ± 0.02 with health ≥ 120%.', hint: 'Repay debt, liquidate, or hike the savings rate.' },
      { title: 'Submit final state', detail: 'Click "Capture state" below to lock in your defended system.' },
    ],
    buildPrompt: 'Operate the AvaUSD simulator and prove the peg survives a market crash.',
    aiPrompt: 'Explain three concrete actions a stablecoin protocol can take to defend its peg after a 30% collateral price drop. Output as a numbered list, max 60 words total.',
    submission: {
      primary: { key: 'final_state', label: 'Final stablecoin state', kind: 'custom', placeholder: 'Auto-filled when you capture state', helpText: 'Captured automatically from the simulator above.' },
    },
    verification: {
      kind: 'custom',
      rules: ['peg between 0.98 and 1.02', 'health ≥ 120', 'collateral ratio ≥ 150', 'market crash was triggered'],
    },
  },

  // 6 ────────────────────────────────────────────────────────────────
  {
    id: 'dapp-github',
    slug: 'dapp-github',
    title: 'Ship a Fuji dApp',
    tagline: 'Build a frontend that reads from your Fuji contract and ship the repo.',
    emoji: '🚀',
    accent: 'pink',
    tier: 'Advanced',
    aiReady: true,
    estMinutes: 60,
    xpReward: 1200,
    badgeTitle: 'Avalanche Builder',
    concept: 'End-to-end Web3: contract on Fuji, ethers/viem in the browser, wallet connection, live reads.',
    brief: `A founder wants a public demo page for her token before she pitches investors. Ship a one-page dApp that connects a wallet, reads totalSupply from her Fuji ERC-20, and renders it.`,
    steps: [
      { title: 'Pick a contract', detail: 'Use the ERC-20 you deployed in the Token Launch challenge — or any Fuji contract.' },
      { title: 'Scaffold a frontend', detail: 'Vite + React + ethers (or viem). Lovable can scaffold this.' },
      { title: 'Wire wallet connect', detail: 'Use window.ethereum / wagmi to connect to Fuji.' },
      { title: 'Read on-chain data', detail: 'Call totalSupply() or balanceOf() and render it on the page.' },
      { title: 'Push to a public GitHub repo', detail: 'Make sure the repo is public and the README mentions Fuji.' },
      { title: 'Submit the repo URL + contract', detail: 'We check the repo exists via GitHub API and the contract has bytecode on Fuji.' },
    ],
    buildPrompt: 'Ship a Fuji-connected dApp on GitHub.',
    aiPrompt: `Generate a minimal Vite + React + ethers v6 single-page app that: 1) shows a Connect Wallet button, 2) requests Avalanche Fuji (chainId 43113) network switch, 3) reads totalSupply() from an ERC-20 contract address (env var), 4) renders the formatted supply. One file App.jsx + main.jsx.`,
    submission: {
      primary: { key: 'github_url', label: 'Public GitHub repo URL', kind: 'github', placeholder: 'https://github.com/you/your-repo' },
      extras: [
        { key: 'contract_address', label: 'Contract the dApp reads from', kind: 'contract', placeholder: '0x…' },
      ],
    },
    verification: {
      kind: 'github',
      rules: ['URL matches https://github.com/{owner}/{repo}', 'Repo is public (GitHub API responds 200)', 'Contract has bytecode on Fuji'],
    },
  },
];

export function challengeBySlug(slug: string) {
  return AVALANCHE_CHALLENGES.find(c => c.slug === slug || c.id === slug);
}

export const ACCENT_CLASS: Record<AvalancheChallenge['accent'], string> = {
  cyan:    'text-[hsl(180_85%_70%)]',
  magenta: 'text-[hsl(310_85%_72%)]',
  gold:    'text-[hsl(42_95%_65%)]',
  lime:    'text-[hsl(85_75%_65%)]',
  pink:    'text-[hsl(340_90%_72%)]',
  sky:     'text-[hsl(200_90%_72%)]',
};

export const TIER_BADGE: Record<ChallengeTier, string> = {
  Beginner:     'bg-[hsl(145_70%_45%/0.15)] text-[hsl(145_70%_60%)] border-[hsl(145_70%_45%/0.4)]',
  Intermediate: 'bg-[hsl(45_100%_55%/0.12)] text-[hsl(45_100%_65%)] border-[hsl(45_100%_55%/0.4)]',
  Advanced:     'bg-[hsl(354_100%_61%/0.12)] text-[hsl(354_100%_70%)] border-[hsl(354_100%_61%/0.4)]',
};
