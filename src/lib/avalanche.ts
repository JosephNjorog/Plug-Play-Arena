// ═══════════════════════════════════════════════════════════════════
// Avalanche Plug n' Play — Data Model
// Event-first onboarding & upskilling platform for the Avalanche ecosystem.
// ═══════════════════════════════════════════════════════════════════

// ── Personas ───────────────────────────────────────────────────────
export type Persona = 'student' | 'developer' | 'builder' | 'founder' | 'business';

export const PERSONAS: { id: Persona; label: string; emoji: string; tagline: string; color: string }[] = [
  { id: 'student',   label: 'Student',    emoji: '🎓', tagline: 'Learn the basics, on-chain.',          color: 'persona-student' },
  { id: 'developer', label: 'Developer',  emoji: '💻', tagline: 'Ship subnets, contracts, dApps.',      color: 'persona-developer' },
  { id: 'builder',   label: 'Builder',    emoji: '🛠️', tagline: 'Design systems & ecosystems.',         color: 'persona-builder' },
  { id: 'founder',   label: 'Founder',    emoji: '🚀', tagline: 'Launch, fundraise, grow.',             color: 'persona-founder' },
  { id: 'business',  label: 'Business',   emoji: '🏢', tagline: 'Integrate Avalanche at scale.',        color: 'persona-business' },
];

// ── Journey Stages ─────────────────────────────────────────────────
export type JourneyStage = 'Explorer' | 'Learner' | 'Builder' | 'Architect' | 'Founder' | 'Champion';

export const JOURNEY_STAGES: { stage: JourneyStage; minXp: number; emoji: string }[] = [
  { stage: 'Explorer',  minXp: 0,    emoji: '🧭' },
  { stage: 'Learner',   minXp: 200,  emoji: '📘' },
  { stage: 'Builder',   minXp: 600,  emoji: '🔨' },
  { stage: 'Architect', minXp: 1200, emoji: '🏛️' },
  { stage: 'Founder',   minXp: 2200, emoji: '🚀' },
  { stage: 'Champion',  minXp: 4000, emoji: '👑' },
];

export function getJourneyStage(xp: number): JourneyStage {
  let stage: JourneyStage = 'Explorer';
  for (const s of JOURNEY_STAGES) if (xp >= s.minXp) stage = s.stage;
  return stage;
}

export function getNextJourneyStage(xp: number) {
  const idx = JOURNEY_STAGES.findIndex(s => xp < s.minXp);
  return idx === -1 ? null : JOURNEY_STAGES[idx];
}

// ── Game Categories ───────────────────────────────────────────────
export type GameCategory =
  | 'Quiz' | 'Simulation' | 'Puzzle' | 'Build Challenge'
  | 'Team Challenge' | 'Trivia' | 'Mission Quest' | 'Case Study'
  | 'Decision Game' | 'Leaderboard Challenge';

export type LearningTheme =
  | 'Avalanche Basics' | 'Consensus' | 'Subnets' | 'Wallets' | 'Testnet'
  | 'Smart Contracts' | 'Bridges' | 'NFTs' | 'DeFi' | 'Tokenomics'
  | 'Community' | 'Ecosystem Growth' | 'Business Use Cases' | 'Launch & Adoption';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

// ── Avalanche Game Library ────────────────────────────────────────
export interface AvalancheGame {
  id: string;
  title: string;
  persona: Persona;
  category: GameCategory;
  difficulty: Difficulty;
  themes: LearningTheme[];
  description: string;
  learningOutcome: string;
  emoji: string;
  duration: string;        // e.g. "5 min"
  xpReward: number;
  rewardType: 'xp' | 'nft' | 'merch' | 'token';
  eventTypes: ('IRL' | 'Zoom' | 'Hybrid')[];
  status: 'live' | 'soon';
}

export const AVALANCHE_GAMES: AvalancheGame[] = [
  // ─── Students ───────────────────────────────────────────────────
  { id: 'av-explorer-quiz',   persona: 'student', title: 'Avalanche Explorer Quiz',   category: 'Quiz',           difficulty: 'Beginner',     themes: ['Avalanche Basics'],            description: 'Speed-quiz on Avalanche fundamentals: history, mission, and architecture at a glance.', learningOutcome: 'Understand what makes Avalanche unique.', emoji: '🏔️', duration: '4 min', xpReward: 80,  rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'consensus-quest',    persona: 'student', title: 'Consensus Quest',           category: 'Mission Quest',  difficulty: 'Beginner',     themes: ['Consensus'],                   description: 'Travel through the Snowman protocol — vote, sample, and reach finality.',                  learningOutcome: 'Grasp Avalanche consensus visually.',     emoji: '❄️', duration: '6 min', xpReward: 120, rewardType: 'nft',  eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'wallet-setup',       persona: 'student', title: 'Wallet Setup Challenge',    category: 'Mission Quest',  difficulty: 'Beginner',     themes: ['Wallets','Testnet'],           description: 'Create a Core wallet, fund it on Fuji, and complete your first transaction.',              learningOutcome: 'Onboard onto Avalanche in <5 min.',       emoji: '👛', duration: '5 min', xpReward: 100, rewardType: 'nft',  eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'avax-basics-rush',   persona: 'student', title: 'AVAX Basics Rush',          category: 'Trivia',         difficulty: 'Beginner',     themes: ['Avalanche Basics','Tokenomics'],description: 'Rapid-fire trivia on AVAX, gas, validators, and staking.',                                  learningOutcome: 'Know the AVAX token economy.',            emoji: '⚡', duration: '3 min', xpReward: 70,  rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'subnet-discovery',   persona: 'student', title: 'Subnet Discovery Game',     category: 'Puzzle',         difficulty: 'Beginner',     themes: ['Subnets'],                     description: 'Match real Avalanche subnets to their use cases.',                                          learningOutcome: 'Recognise the subnet landscape.',         emoji: '🧩', duration: '5 min', xpReward: 90,  rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'blockchain-bingo',   persona: 'student', title: 'Blockchain Bingo',          category: 'Team Challenge', difficulty: 'Beginner',     themes: ['Avalanche Basics'],            description: 'Live bingo with Avalanche terms — first to call out a row wins.',                          learningOutcome: 'Build vocabulary through play.',          emoji: '🎱', duration: '8 min', xpReward: 100, rewardType: 'merch',eventTypes: ['IRL','Hybrid'],        status: 'live' },
  { id: 'eco-scavenger',      persona: 'student', title: 'Ecosystem Scavenger Hunt',  category: 'Mission Quest',  difficulty: 'Beginner',     themes: ['Ecosystem Growth'],            description: 'Find QR clues across the venue tied to Avalanche projects.',                               learningOutcome: 'Map the live ecosystem.',                 emoji: '🗺️', duration: '20 min',xpReward: 200, rewardType: 'merch',eventTypes: ['IRL'],                 status: 'live' },

  // ─── Developers ─────────────────────────────────────────────────
  { id: 'smart-contract-sprint', persona: 'developer', title: 'Smart Contract Sprint',  category: 'Build Challenge', difficulty: 'Intermediate', themes: ['Smart Contracts','Testnet'],   description: 'Write, compile, and deploy a Solidity contract on Fuji in record time.',                  learningOutcome: 'Ship your first contract live.',          emoji: '🏁', duration: '15 min',xpReward: 250, rewardType: 'nft',  eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'av-fundamentals',       persona: 'developer', title: 'Avalanche Fundamentals Challenge', category: 'Quiz', difficulty: 'Intermediate',themes: ['Avalanche Basics','Consensus'],description: 'Deep-dive quiz: X-Chain vs C-Chain vs P-Chain, Snowman++, gas dynamics.',                  learningOutcome: 'Master Avalanche architecture.',          emoji: '📐', duration: '8 min', xpReward: 180, rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'subnet-builder-sim',    persona: 'developer', title: 'Subnet Builder Simulator', category: 'Simulation', difficulty: 'Advanced',     themes: ['Subnets'],                     description: 'Configure a custom subnet — validators, VM, gas token — and launch in sandbox.',          learningOutcome: 'Design production-ready subnets.',        emoji: '🧪', duration: '20 min',xpReward: 320, rewardType: 'nft',  eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'bridge-the-chain',      persona: 'developer', title: 'Bridge the Chain Puzzle',  category: 'Puzzle',     difficulty: 'Intermediate', themes: ['Bridges'],                     description: 'Route assets across chains using Avalanche Warp Messaging primitives.',                    learningOutcome: 'Understand cross-chain messaging.',       emoji: '🌉', duration: '10 min',xpReward: 200, rewardType: 'xp',   eventTypes: ['Zoom','Hybrid'],       status: 'live' },
  { id: 'debug-the-contract',    persona: 'developer', title: 'Debug the Contract',       category: 'Puzzle',     difficulty: 'Intermediate', themes: ['Smart Contracts'],             description: 'Find the bug in a Solidity contract before the timer ends.',                              learningOutcome: 'Sharpen contract review skills.',         emoji: '🐛', duration: '7 min', xpReward: 160, rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'deploy-on-fuji',        persona: 'developer', title: 'Deploy on Fuji',           category: 'Mission Quest',difficulty: 'Beginner',   themes: ['Testnet','Smart Contracts'],   description: 'Guided mission to deploy your first contract on the Fuji testnet.',                       learningOutcome: 'Learn the Fuji deploy pipeline.',         emoji: '🚧', duration: '10 min',xpReward: 180, rewardType: 'nft',  eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'testnet-mission',       persona: 'developer', title: 'Testnet Mission Mode',     category: 'Build Challenge',difficulty: 'Advanced', themes: ['Testnet','Smart Contracts'],   description: 'Complete 5 progressive mission stages on testnet.',                                       learningOutcome: 'End-to-end dApp shipping.',               emoji: '🎯', duration: '30 min',xpReward: 400, rewardType: 'nft',  eventTypes: ['IRL','Hybrid'],        status: 'soon' },
  { id: 'vm-architect',          persona: 'developer', title: 'VM Architect Challenge',   category: 'Decision Game',difficulty: 'Advanced', themes: ['Subnets'],                     description: 'Design choices for a custom VM — pick consensus, fee model, finality.',                  learningOutcome: 'Reason about VM trade-offs.',             emoji: '🧠', duration: '12 min',xpReward: 260, rewardType: 'xp',   eventTypes: ['Zoom','Hybrid'],       status: 'soon' },

  // ─── Builders ───────────────────────────────────────────────────
  { id: 'eco-builder-sim',     persona: 'builder', title: 'Ecosystem Builder Sim',  category: 'Simulation',     difficulty: 'Intermediate', themes: ['Ecosystem Growth'],            description: 'Run a 4-quarter simulation of growing a subnet ecosystem.',                                learningOutcome: 'Strategic ecosystem thinking.',           emoji: '🌐', duration: '15 min',xpReward: 280, rewardType: 'nft',  eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'tokenomics-tycoon',   persona: 'builder', title: 'Tokenomics Tycoon',       category: 'Simulation',     difficulty: 'Advanced',     themes: ['Tokenomics'],                  description: 'Design and stress-test a token economy under live market events.',                          learningOutcome: 'Ship sustainable tokenomics.',            emoji: '💱', duration: '18 min',xpReward: 320, rewardType: 'xp',   eventTypes: ['Zoom','Hybrid'],       status: 'live' },
  { id: 'launch-strategy',     persona: 'builder', title: 'Launch Strategy Challenge',category: 'Decision Game', difficulty: 'Intermediate', themes: ['Launch & Adoption'],           description: 'Sequence the right launch moves — testnet, audit, marketing, liquidity.',                  learningOutcome: 'Plan a credible launch.',                 emoji: '🚦', duration: '10 min',xpReward: 200, rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'subnet-design-lab',   persona: 'builder', title: 'Subnet Design Lab',       category: 'Build Challenge', difficulty: 'Advanced',     themes: ['Subnets'],                     description: 'Architect a domain-specific subnet for gaming, RWA, or DeFi.',                              learningOutcome: 'Translate use case to architecture.',     emoji: '🧬', duration: '20 min',xpReward: 340, rewardType: 'nft',  eventTypes: ['IRL','Hybrid'],        status: 'soon' },
  { id: 'pmf-quest',           persona: 'builder', title: 'Product-Market Fit Quest', category: 'Mission Quest', difficulty: 'Intermediate', themes: ['Launch & Adoption'],           description: 'Run discovery sprints with simulated user segments.',                                       learningOutcome: 'Diagnose PMF signals.',                   emoji: '🎯', duration: '12 min',xpReward: 220, rewardType: 'xp',   eventTypes: ['Zoom','Hybrid'],       status: 'live' },
  { id: 'scale-the-stack',     persona: 'builder', title: 'Scale the Stack Simulation', category: 'Simulation',  difficulty: 'Advanced',     themes: ['Ecosystem Growth'],            description: 'Solve scaling bottlenecks across infra, app, and community layers.',                       learningOutcome: 'Think in systems.',                       emoji: '📈', duration: '18 min',xpReward: 300, rewardType: 'xp',   eventTypes: ['Zoom','Hybrid'],       status: 'soon' },
  { id: 'community-growth',    persona: 'builder', title: 'Community Growth Builder', category: 'Decision Game', difficulty: 'Beginner',     themes: ['Community'],                   description: 'Choose tactics to grow an authentic Avalanche community.',                                 learningOutcome: 'Avoid mercenary growth.',                 emoji: '👥', duration: '8 min', xpReward: 160, rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'build-for-adoption',  persona: 'builder', title: 'Build for Adoption',      category: 'Case Study',     difficulty: 'Intermediate', themes: ['Launch & Adoption','Community'],description: 'Study real Avalanche launches and replay key decisions.',                                  learningOutcome: 'Pattern-match real adoption stories.',    emoji: '📚', duration: '15 min',xpReward: 240, rewardType: 'nft',  eventTypes: ['Zoom','Hybrid'],       status: 'soon' },

  // ─── Founders ───────────────────────────────────────────────────
  { id: 'founder-fit',         persona: 'founder', title: 'Founder Fit Challenge',   category: 'Quiz',           difficulty: 'Beginner',     themes: ['Launch & Adoption'],           description: 'Assess your founder–market–chain fit on Avalanche.',                                       learningOutcome: 'Know where you stand.',                   emoji: '🧭', duration: '6 min', xpReward: 140, rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'gtm-arena',           persona: 'founder', title: 'Go-To-Market Arena',      category: 'Decision Game',  difficulty: 'Intermediate', themes: ['Launch & Adoption'],           description: 'Pick your wedge, channels, and partners under time pressure.',                             learningOutcome: 'Build a defensible GTM.',                 emoji: '⚔️', duration: '12 min',xpReward: 240, rewardType: 'nft',  eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'pitch-deck-boss',     persona: 'founder', title: 'Pitch Deck Boss Fight',   category: 'Mission Quest',  difficulty: 'Intermediate', themes: ['Launch & Adoption'],           description: 'Refine 8 deck slides under live investor critique.',                                       learningOutcome: 'A deck that closes meetings.',            emoji: '🎤', duration: '15 min',xpReward: 280, rewardType: 'merch',eventTypes: ['IRL','Hybrid'],        status: 'live' },
  { id: 'community-flywheel',  persona: 'founder', title: 'Community Flywheel Quest',category: 'Simulation',     difficulty: 'Intermediate', themes: ['Community'],                   description: 'Design loops that compound community value.',                                              learningOutcome: 'Engineer retention loops.',               emoji: '🔁', duration: '10 min',xpReward: 200, rewardType: 'xp',   eventTypes: ['Zoom','Hybrid'],       status: 'live' },
  { id: 'fundraising-sim',     persona: 'founder', title: 'Fundraising Simulation',  category: 'Simulation',     difficulty: 'Advanced',     themes: ['Tokenomics','Launch & Adoption'],description: 'Run a fundraise — terms, dilution, runway, follow-ons.',                                  learningOutcome: 'Negotiate from strength.',                emoji: '💼', duration: '20 min',xpReward: 360, rewardType: 'nft',  eventTypes: ['Zoom','Hybrid'],       status: 'soon' },
  { id: 'eco-partnership',     persona: 'founder', title: 'Ecosystem Partnership Game', category: 'Team Challenge',difficulty: 'Intermediate',themes: ['Ecosystem Growth'],            description: 'Negotiate a partnership across two Avalanche subnets.',                                    learningOutcome: 'Structure value-aligned deals.',          emoji: '🤝', duration: '12 min',xpReward: 240, rewardType: 'xp',   eventTypes: ['IRL','Hybrid'],        status: 'live' },
  { id: 'startup-decision',    persona: 'founder', title: 'Startup Decision Lab',    category: 'Decision Game',  difficulty: 'Beginner',     themes: ['Launch & Adoption'],           description: 'Navigate a year of founder decisions with real consequences.',                              learningOutcome: 'Reason under uncertainty.',               emoji: '🧪', duration: '10 min',xpReward: 200, rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'av-founder-path',     persona: 'founder', title: 'Avalanche Founder Path',  category: 'Mission Quest',  difficulty: 'Intermediate', themes: ['Ecosystem Growth','Launch & Adoption'],description: 'Multi-stage journey from idea → grant → launch on Avalanche.',                            learningOutcome: 'See the full founder pathway.',           emoji: '🛤️', duration: '25 min',xpReward: 400, rewardType: 'nft',  eventTypes: ['Hybrid'],              status: 'soon' },

  // ─── Businesses ─────────────────────────────────────────────────
  { id: 'enterprise-integration', persona: 'business', title: 'Enterprise Integration Challenge', category: 'Build Challenge', difficulty: 'Advanced', themes: ['Business Use Cases'],          description: 'Connect a legacy system to an Avalanche subnet with audit-ready flows.',                  learningOutcome: 'Integrate with confidence.',              emoji: '🏗️', duration: '20 min',xpReward: 320, rewardType: 'nft',  eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'web3-business-sim',      persona: 'business', title: 'Web3 Business Simulation',         category: 'Simulation',      difficulty: 'Intermediate', themes: ['Business Use Cases'],      description: 'Operate a Web3 business across 4 quarters with shifting market events.',                  learningOutcome: 'Run a sustainable Web3 business.',        emoji: '🏢', duration: '18 min',xpReward: 300, rewardType: 'xp',   eventTypes: ['Zoom','Hybrid'],       status: 'live' },
  { id: 'loyalty-system',         persona: 'business', title: 'Loyalty System Builder',           category: 'Build Challenge', difficulty: 'Intermediate', themes: ['Business Use Cases','NFTs'],description: 'Design an on-chain loyalty program with tiered NFT rewards.',                              learningOutcome: 'Translate loyalty to chain.',             emoji: '🎁', duration: '15 min',xpReward: 260, rewardType: 'nft',  eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'treasury-rewards',       persona: 'business', title: 'Treasury & Rewards Strategy',      category: 'Decision Game',   difficulty: 'Advanced',     themes: ['Tokenomics','Business Use Cases'],description: 'Allocate treasury to liquidity, ops, and rewards under risk constraints.',          learningOutcome: 'Allocate with discipline.',               emoji: '🏦', duration: '12 min',xpReward: 240, rewardType: 'xp',   eventTypes: ['Zoom','Hybrid'],       status: 'live' },
  { id: 'customer-activation',    persona: 'business', title: 'Customer Activation Game',         category: 'Mission Quest',   difficulty: 'Intermediate', themes: ['Community','Business Use Cases'],description: 'Design a customer onboarding flow that turns visitors into wallets.',                  learningOutcome: 'Ship Web3 onboarding that converts.',     emoji: '🎯', duration: '12 min',xpReward: 240, rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'onchain-ops-lab',        persona: 'business', title: 'Onchain Operations Lab',           category: 'Simulation',      difficulty: 'Advanced',     themes: ['Business Use Cases'],      description: 'Run finance, payroll, and reporting on-chain with simulated audits.',                     learningOutcome: 'Operate transparently on-chain.',         emoji: '⚙️', duration: '20 min',xpReward: 320, rewardType: 'nft',  eventTypes: ['Zoom','Hybrid'],       status: 'soon' },
  { id: 'business-explorer',      persona: 'business', title: 'Business Model Explorer',          category: 'Decision Game',   difficulty: 'Beginner',     themes: ['Business Use Cases'],      description: 'Match real Avalanche use cases to revenue models.',                                       learningOutcome: 'Spot fitting use cases.',                 emoji: '🔭', duration: '8 min', xpReward: 160, rewardType: 'xp',   eventTypes: ['IRL','Zoom','Hybrid'], status: 'live' },
  { id: 'av-use-case-sprint',     persona: 'business', title: 'Avalanche Use Case Sprint',        category: 'Team Challenge',  difficulty: 'Intermediate', themes: ['Business Use Cases','Launch & Adoption'],description: 'Team sprint to design a working Avalanche pilot for your industry.',          learningOutcome: 'Walk away with a real plan.',             emoji: '🏃', duration: '25 min',xpReward: 360, rewardType: 'merch',eventTypes: ['IRL','Hybrid'],        status: 'live' },
];

// ── Events ────────────────────────────────────────────────────────
export type EventFormat = 'IRL' | 'Zoom' | 'Hybrid';
export type EventCategory =
  | 'Hackathon' | 'Campus Event' | 'Founder Session'
  | 'Builder Workshop' | 'Community Meetup' | 'Conference';
export type EventStatus = 'upcoming' | 'live' | 'completed';

export interface AvalancheEvent {
  id: string;
  title: string;
  date: string;          // human-readable
  startTime: number;     // ms
  endTime: number;       // ms
  format: EventFormat;
  category: EventCategory;
  location: string;
  zoomUrl?: string;
  tracks: Persona[];
  difficulty: Difficulty;
  rewardPool: string;
  description: string;
  agenda: { time: string; title: string }[];
  missions: string[];          // game ids
  attendees: number;
  capacity: number;
  status: EventStatus;
  ecosystem: 'Avalanche';
}

const day = 86_400_000;
const now = Date.now();

export const AVALANCHE_EVENTS: AvalancheEvent[] = [
  {
    id: 'nbw-2026', title: 'Nairobi Blockchain Week — Avalanche Day',
    date: 'Wed, 18 Jun 2026', startTime: now - day, endTime: now + 2 * day,
    format: 'IRL', category: 'Conference', location: 'Sarit Expo, Nairobi',
    tracks: ['student','developer','founder','business'],
    difficulty: 'Intermediate', rewardPool: '$5,000 + Merch + NFTs',
    description: 'A full day inside the Avalanche ecosystem at NBW — workshops, missions, and a live leaderboard.',
    agenda: [
      { time: '09:00', title: 'Check-in & Wallet Setup Mission' },
      { time: '10:00', title: 'Avalanche Fundamentals Live Quiz' },
      { time: '12:00', title: 'Subnet Builder Hands-on' },
      { time: '15:00', title: 'Founder Pitch Boss Fight' },
      { time: '17:00', title: 'NFT Mint & Awards' },
    ],
    missions: ['wallet-setup','av-explorer-quiz','subnet-builder-sim','pitch-deck-boss'],
    attendees: 412, capacity: 600, status: 'live', ecosystem: 'Avalanche',
  },
  {
    id: 'av-zoom-devsession-7', title: 'Avalanche Dev Session #7 — Subnets in 60',
    date: 'Thu, 26 Jun 2026', startTime: now + 5 * day, endTime: now + 5 * day + 3 * 3_600_000,
    format: 'Zoom', category: 'Builder Workshop', location: 'Virtual',
    zoomUrl: 'https://zoom.us/j/avalanche',
    tracks: ['developer','builder'], difficulty: 'Advanced',
    rewardPool: 'NFT Badge + 0.5 AVAX top performer',
    description: 'Live Zoom session: spin up a subnet, deploy a precompile, and ship to Fuji.',
    agenda: [
      { time: '17:00', title: 'Welcome & Check-in' },
      { time: '17:10', title: 'Subnet Builder Sim (live)' },
      { time: '18:00', title: 'Deploy on Fuji mission' },
      { time: '18:45', title: 'Q&A + NFT mint' },
    ],
    missions: ['subnet-builder-sim','deploy-on-fuji','smart-contract-sprint'],
    attendees: 87, capacity: 200, status: 'upcoming', ecosystem: 'Avalanche',
  },
  {
    id: 'campus-strathmore', title: 'Strathmore Campus Activation',
    date: 'Sat, 5 Jul 2026', startTime: now + 12 * day, endTime: now + 12 * day + 5 * 3_600_000,
    format: 'Hybrid', category: 'Campus Event', location: 'Strathmore University, Nairobi',
    zoomUrl: 'https://zoom.us/j/campus',
    tracks: ['student','developer'], difficulty: 'Beginner',
    rewardPool: 'Merch packs + Genesis NFT for top 25',
    description: 'Hands-on Avalanche onboarding for students — wallet setup, scavenger hunt, dev sprint.',
    agenda: [
      { time: '10:00', title: 'Wallet Setup + Bingo' },
      { time: '11:30', title: 'Ecosystem Scavenger Hunt' },
      { time: '14:00', title: 'Smart Contract Sprint' },
      { time: '16:00', title: 'NFT mint + photos' },
    ],
    missions: ['wallet-setup','blockchain-bingo','eco-scavenger','smart-contract-sprint'],
    attendees: 0, capacity: 250, status: 'upcoming', ecosystem: 'Avalanche',
  },
  {
    id: 'founder-roundtable-lagos', title: 'Founder Roundtable — Lagos',
    date: 'Tue, 22 Jul 2026', startTime: now + 25 * day, endTime: now + 25 * day + 4 * 3_600_000,
    format: 'IRL', category: 'Founder Session', location: 'Lekki, Lagos',
    tracks: ['founder','business'], difficulty: 'Intermediate',
    rewardPool: 'Mentor intros + Pitch slot + NFT',
    description: 'Closed-door session with Avalanche founders. Pitch, fundraise, partner.',
    agenda: [
      { time: '14:00', title: 'Founder Fit Challenge' },
      { time: '15:00', title: 'GTM Arena (live)' },
      { time: '16:30', title: 'Pitch Deck Boss Fight' },
    ],
    missions: ['founder-fit','gtm-arena','pitch-deck-boss','eco-partnership'],
    attendees: 0, capacity: 40, status: 'upcoming', ecosystem: 'Avalanche',
  },
  {
    id: 'kigali-hack-2026', title: 'Kigali Avalanche Hackathon',
    date: 'Sat, 9 Aug 2026', startTime: now + 40 * day, endTime: now + 42 * day,
    format: 'IRL', category: 'Hackathon', location: 'Norrsken House, Kigali',
    tracks: ['developer','builder','founder'], difficulty: 'Advanced',
    rewardPool: '$15,000 + Subnet credits + NFTs',
    description: '48-hour hackathon to ship subnets, dApps, and AI×Avalanche experiences.',
    agenda: [
      { time: 'Day 1 09:00', title: 'Opening + Team Formation' },
      { time: 'Day 1 12:00', title: 'Subnet Builder Workshop' },
      { time: 'Day 2 09:00', title: 'Build Sprint' },
      { time: 'Day 3 14:00', title: 'Demos + NFT mint' },
    ],
    missions: ['subnet-builder-sim','smart-contract-sprint','launch-strategy','pitch-deck-boss'],
    attendees: 0, capacity: 300, status: 'upcoming', ecosystem: 'Avalanche',
  },
  {
    id: 'biz-zoom-q2', title: 'Avalanche for Business — Q2 Briefing',
    date: 'Thu, 14 May 2026', startTime: now - 30 * day, endTime: now - 30 * day + 2 * 3_600_000,
    format: 'Zoom', category: 'Conference', location: 'Virtual',
    zoomUrl: 'https://zoom.us/j/business',
    tracks: ['business','founder'], difficulty: 'Beginner',
    rewardPool: 'Briefing NFT + Pilot intro',
    description: 'Executive briefing for enterprises evaluating Avalanche subnets and tokenisation.',
    agenda: [
      { time: '15:00', title: 'Avalanche for Enterprise' },
      { time: '15:45', title: 'Use Case Sprint' },
    ],
    missions: ['enterprise-integration','av-use-case-sprint','business-explorer'],
    attendees: 220, capacity: 500, status: 'completed', ecosystem: 'Avalanche',
  },
  {
    id: 'community-meetup-dar', title: 'Avalanche Community Meetup — Dar',
    date: 'Fri, 25 Apr 2026', startTime: now - 60 * day, endTime: now - 60 * day + 4 * 3_600_000,
    format: 'IRL', category: 'Community Meetup', location: 'Mlimani City, Dar es Salaam',
    tracks: ['student','developer','builder'], difficulty: 'Beginner',
    rewardPool: 'Merch + Participation NFT',
    description: 'Casual meetup, lightning talks, and live missions.',
    agenda: [
      { time: '18:00', title: 'Lightning talks' },
      { time: '19:00', title: 'Live missions + Bingo' },
    ],
    missions: ['av-explorer-quiz','blockchain-bingo','community-growth'],
    attendees: 145, capacity: 150, status: 'completed', ecosystem: 'Avalanche',
  },
];

// ── Player ────────────────────────────────────────────────────────
export interface NFTBadge {
  id: string;
  title: string;
  eventId: string;
  eventName: string;
  date: string;
  achievement: string;        // "Top 10", "Mission Complete"
  emoji: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
  mintedAt: number;
}

export interface RewardItem {
  id: string;
  type: 'token' | 'merch' | 'nft' | 'perk' | 'mentorship';
  title: string;
  description: string;
  value: string;
  emoji: string;
  eventId?: string;
  claimed: boolean;
  claimedAt?: number;
}

export interface MissionRecord {
  gameId: string;
  completedAt: number;
  score: number;
  xpEarned: number;
  eventId?: string;
}

export interface AvalanchePlayer {
  id: string;
  walletAddress: string;
  username: string;
  emoji: string;
  persona: Persona;

  xp: number;
  elo: number;
  stage: JourneyStage;
  streak: number;

  wins: number;
  gamesPlayed: number;

  events: string[];                   // attended event ids
  missions: MissionRecord[];
  rewards: RewardItem[];
  nfts: NFTBadge[];

  twitter?: string;
  email?: string;

  createdAt: number;
  lastPlayed: number;
}

const PLAYER_KEY = 'plugnplay_av_player';

export function loadPlayer(): AvalanchePlayer | null {
  try { const raw = localStorage.getItem(PLAYER_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

export function savePlayer(p: AvalanchePlayer) {
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch {}
}

export function clearPlayer() {
  try { localStorage.removeItem(PLAYER_KEY); } catch {}
}

export function newPlayer(args: { walletAddress: string; username: string; emoji: string; persona: Persona }): AvalanchePlayer {
  const now = Date.now();
  return {
    id: `p-${now}`, ...args,
    xp: 0, elo: 1000, stage: 'Explorer', streak: 0,
    wins: 0, gamesPlayed: 0,
    events: [], missions: [], rewards: [], nfts: [],
    createdAt: now, lastPlayed: now,
  };
}

// ── Mission completion + reward issuance ─────────────────────────
export function completeMission(player: AvalanchePlayer, game: AvalancheGame, eventId?: string): {
  player: AvalanchePlayer; reward: RewardItem | null; nft: NFTBadge | null;
} {
  const now = Date.now();
  const xpEarned = game.xpReward;
  const newXp = player.xp + xpEarned;
  const newStage = getJourneyStage(newXp);

  const updated: AvalanchePlayer = {
    ...player,
    xp: newXp, stage: newStage,
    gamesPlayed: player.gamesPlayed + 1,
    lastPlayed: now,
    missions: [...player.missions, { gameId: game.id, completedAt: now, score: 100, xpEarned, eventId }],
    events: eventId && !player.events.includes(eventId) ? [...player.events, eventId] : player.events,
  };

  let reward: RewardItem | null = null;
  let nft: NFTBadge | null = null;

  if (game.rewardType === 'nft') {
    nft = {
      id: `nft-${now}`,
      title: `${game.title} Badge`,
      eventId: eventId || 'no-event',
      eventName: AVALANCHE_EVENTS.find(e => e.id === eventId)?.title || 'Self-paced',
      date: new Date(now).toLocaleDateString(),
      achievement: 'Mission Complete',
      emoji: game.emoji,
      rarity: game.difficulty === 'Advanced' ? 'Legendary' : game.difficulty === 'Intermediate' ? 'Rare' : 'Common',
      mintedAt: now,
    };
    updated.nfts = [...player.nfts, nft];
  }

  if (game.rewardType === 'merch') {
    reward = {
      id: `r-${now}`, type: 'merch',
      title: `${game.title} Merch Voucher`,
      description: 'Redeem at the event booth.',
      value: 'Merch Pack', emoji: '🎁', eventId, claimed: false,
    };
    updated.rewards = [...player.rewards, reward];
  }

  if (game.rewardType === 'token') {
    reward = {
      id: `r-${now}`, type: 'token',
      title: 'AVAX Reward', description: 'Claim to your Core wallet.',
      value: '0.1 AVAX', emoji: '💰', eventId, claimed: false,
    };
    updated.rewards = [...player.rewards, reward];
  }

  return { player: updated, reward, nft };
}

// ── Helpers ───────────────────────────────────────────────────────
export function gamesByPersona(persona: Persona) {
  return AVALANCHE_GAMES.filter(g => g.persona === persona);
}

export function eventsByStatus(status: EventStatus) {
  return AVALANCHE_EVENTS.filter(e => e.status === status);
}

export function generateMockLeaderboard(): { id: string; rank: number; username: string; emoji: string; persona: Persona; xp: number; elo: number; stage: JourneyStage; wins: number; events: number }[] {
  const names = ['Lavender','Sonnie','Castro','Abeisgay','Gee','Marsh','Lola','Babu','Rambo','Tata','Nyaks','Potato','Superman','Kibo','Zola','Imani','Tendai','Adaeze','Kojo','Femi','Amani','Zuri','Jamil','Nia','Ade','Kweku','Sade','Tariq','Bilal','Asha'];
  const personas: Persona[] = ['student','developer','builder','founder','business'];
  return names.map((n, i) => {
    const xp = 4200 - i * 110 + Math.floor(Math.random() * 80);
    const elo = 2000 - i * 25 + Math.floor(Math.random() * 30);
    return {
      id: `lb-${i}`, rank: i + 1, username: n,
      emoji: ['🦊','🐼','🐧','🦄','🐙','🐱','🐸','🤖','👾','🐵'][i % 10],
      persona: personas[i % personas.length],
      xp, elo, stage: getJourneyStage(xp),
      wins: Math.floor((30 - i) * 0.7), events: Math.min(7, Math.floor((30 - i) / 4) + 1),
    };
  });
}
