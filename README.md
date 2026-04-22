# Plug n' Play Arena

A gamified Web3 learning platform built on Avalanche. Players choose a persona, complete interactive missions, join live events, race through on-chain speedrun challenges, and compete in real-time multiplayer quiz sessions — all while earning XP, NFT badges, and token rewards on the Avalanche Fuji testnet.

---

## Table of Contents

- [Overview](#overview)
- [Feature Breakdown](#feature-breakdown)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Supabase Edge Functions](#supabase-edge-functions)
- [Scoring Engine](#scoring-engine)
- [Admin Dashboard](#admin-dashboard)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Running Migrations](#running-migrations)
- [Deployment to Vercel](#deployment-to-vercel)
- [Blockchain Setup (Avalanche Fuji)](#blockchain-setup-avalanche-fuji)
- [Giving Yourself Admin Access](#giving-yourself-admin-access)

---

## Overview

Plug n' Play Arena is a serverless, SPA (Single-Page Application) deployed to Vercel. The entire backend is powered by **Supabase**: PostgreSQL for persistent data, Row Level Security for access control, Realtime subscriptions for live multiplayer, and Deno Edge Functions for blockchain interactions.

Users progress through a structured learning journey across five personas — **Student**, **Developer**, **Builder**, **Founder**, and **Business** — each with their own set of missions, challenges and recommended events. Progress is stored in the cloud so it follows the user across every device and event.

---

## Feature Breakdown

### Personas & Journey System

When a user signs up via `/onboarding`, they pick one of five personas. Each persona has:

- A curated set of 7–8 missions (games) pulled from the `games` table
- A journey stage that advances as XP accumulates: **Newcomer → Explorer → Builder → Validator → Leader**
- Displayed on `/journey` with NFT badges earned, live stat cards (level, streak, stage) and an "Up next" mission grid fetched from the database

### Missions (Games)

Located at `/library` and playable at `/play/:gameId`.

Each mission is a row in the `games` table with a category (Quiz, Simulation, Puzzle, Build Challenge, Team Challenge, etc.), a difficulty level (Beginner, Intermediate, Advanced) and a reward type: `xp`, `nft`, `merch`, or `token`.

When a mission is completed, `playerContext.submitMission()` calls the `submit_attempt` Supabase RPC which scores the attempt server-side (preventing client manipulation), awards XP to the player's profile, and optionally mints an NFT badge via `mint_badge` or issues a reward via `issue_reward` depending on `reward_type`.

### Speedrun Challenges

Located at `/library` (Challenges tab) and individually at `/challenge/:slug`.

Challenges are multi-step on-chain tasks (e.g. "Deploy a token contract on Fuji", "Bridge USDC via Core"). Each challenge stores its steps, submission shape and verification config as JSONB so the UI can render the correct form dynamically without any hardcoded logic.

On-chain submissions trigger the `verify-submission` Edge Function which calls the Snowtrace API to confirm the transaction exists and belongs to the submitter's wallet. Manual submissions sit in a pending queue until an admin approves them through the Submissions dashboard.

### Events

Located at `/events` and individually at `/events/:id`.

Platform events (hackathons, workshops, IRL summits, Zoom sessions) are stored in the `events` table with format (`irl`/`zoom`/`hybrid`), linked mission IDs, an `agenda` JSONB array, and a `tracks` array matching player personas. Real participant counts come from the `event_participants` join table. Joining an event upserts a row in `event_participants` and the join button updates immediately without a page reload.

### Leaderboard

Located at `/leaderboard`.

Powered entirely by the `get_leaderboard` Supabase RPC which accepts `_limit` and `_persona` parameters to return ranked players with XP, level and mission counts. Persona filter triggers a fresh server query. Podium (top 3 with large rank display) only renders when there are three or more entries.

### Live Arena (Multiplayer Quiz)

Located at `/arena`.

A real-time multiplayer quiz engine built on Supabase Realtime:

1. **Host** (`ArenaHostPage`) calls `createSession()` which inserts a row into `arena_sessions` and returns a 6-character join code displayed as a QR code.
2. **Players** (`ArenaJoinPage`) enter the code or scan the QR, submit a nickname and optional wallet address. They are inserted into `arena_players`.
3. Once started, `ArenaPlayerPage` subscribes via Realtime and receives questions pushed by the `arena-tick` Edge Function.
4. Answers are submitted through the arena context and scored in real-time.
5. The session winner can be minted an NFT via the `mint-badge-fuji` Edge Function.

Quiz questions are stored in `arena_questions` (seeded with 25 questions across 5 Avalanche topics). Admins add more through Admin → Arena.

### Rewards

Located at `/rewards`.

Three reward types live in a player's inventory:
- **NFT badges** — minted on Avalanche Fuji via an ERC-721 contract, stored in `nft_badges` with token ID and tx hash
- **Merch vouchers** — stored in `rewards` with `kind = 'merch'`, redeemable at event booths
- **Token rewards** — stored in `rewards` with `kind = 'token'`, redeemable to a Core wallet

`claimReward()` in `playerContext` marks the reward as claimed with a timestamp and triggers a Realtime sync so the inventory updates on all open tabs.

### Authentication

Located at `/auth`.

Uses Supabase Auth (email/password). On sign-in, `playerContext` sets up Realtime subscriptions on the player's own `profiles` row, `nft_badges` inserts and `rewards` changes so the UI stays live without polling. New users are redirected to `/onboarding` to pick a persona before entering the platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript (Vite) |
| Routing | React Router v6 |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion |
| State management | React Context + custom hooks |
| Server state | TanStack React Query |
| Backend / database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (Postgres changes) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Blockchain network | Avalanche Fuji C-Chain (testnet) |
| NFT standard | ERC-721 (PlugPlayArenaBadge contract) |
| Deployment | Vercel (static SPA with SPA rewrites) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Notifications | Sonner (toast) |
| Charts | Recharts |

---

## Project Structure

```
plug-play-arena/
├── public/                         Static assets
├── src/
│   ├── components/
│   │   ├── avalanche/              Platform-specific UI components
│   │   │   ├── AppNavbar.tsx       Main navigation bar with player XP display
│   │   │   ├── ChallengeCard.tsx   Speedrun challenge listing card
│   │   │   ├── EventCard.tsx       Event card with join status
│   │   │   ├── GameCard.tsx        Mission card with XP reward badge
│   │   │   ├── JourneyMeter.tsx    XP progress bar with stage labels
│   │   │   ├── NFTBadgeCard.tsx    Earned NFT badge with rarity glow
│   │   │   ├── PersonaSelector.tsx Onboarding persona picker grid
│   │   │   ├── RewardCard.tsx      Reward item with claim button
│   │   │   └── StablecoinSimulator.tsx  AvaUSD interactive simulator widget
│   │   ├── game/                   PlugGrid tile-game components (legacy mode)
│   │   └── ui/                     shadcn/ui base components (Button, Dialog, etc.)
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts               Typed Supabase client singleton
│   │   ├── types.ts                Auto-generated types (run: supabase gen types typescript)
│   │   └── extended-types.ts       Hand-written interfaces for GameRow, ChallengeRow,
│   │                               EventRow, AgendaItem and AdminStats
│   │
│   ├── lib/
│   │   ├── avalanche.ts            AvalancheGame / AvalancheEvent interfaces, PERSONAS,
│   │   │                           journey stage helpers, dbRowToGame / dbRowToEvent mappers
│   │   ├── arenaContext.tsx        Supabase Realtime arena multiplayer state machine
│   │   ├── challenges.ts           AvalancheChallenge interface, tier/accent style helpers,
│   │   │                           dbRowToChallenge mapper
│   │   ├── gameContext.tsx         Legacy PlugGrid tile-game state provider
│   │   ├── gameState.ts            PlugGrid types, ELO calculation, mock player helpers
│   │   ├── missionContent.ts       Static quiz question content used during mission play
│   │   ├── playerContext.tsx       Auth state, profile, submitMission, claimReward, joinEvent
│   │   ├── scoring.ts              predictScore() + difficultyMultiplier + rarityFor helpers
│   │   ├── stablecoinEngine.ts     AvaUSD simulation engine
│   │   ├── utils.ts                Tailwind cn() class merging helper
│   │   └── wallet.ts               Core wallet connection helpers
│   │
│   ├── pages/
│   │   ├── admin/                  Protected admin area (requires is_admin = true on profile)
│   │   │   ├── AdminLayout.tsx     Sidebar layout + is_admin auth guard + Outlet
│   │   │   ├── AdminDashboard.tsx  8-metric stats, recent missions, newest players
│   │   │   ├── AdminEvents.tsx     Event CRUD with inline status dropdown
│   │   │   ├── AdminGames.tsx      Game CRUD with search
│   │   │   ├── AdminChallenges.tsx Challenge CRUD with JSON editors for steps/verification
│   │   │   ├── AdminPlayers.tsx    Player list, XP/badge stats, admin role grant/revoke
│   │   │   ├── AdminArena.tsx      Session monitor + force-end, quiz question CRUD
│   │   │   ├── AdminSubmissions.tsx Approve/reject queue + on-chain re-verification
│   │   │   ├── AdminNFTs.tsx       Mint log with Snowtrace explorer links
│   │   │   └── AdminSettings.tsx   app_settings editor, deploy NFT contract, env display
│   │   │
│   │   ├── ArenaHostPage.tsx       Host: create session, show QR code, start game
│   │   ├── ArenaJoinPage.tsx       Player: scan/enter code, set nickname
│   │   ├── ArenaLayout.tsx         Outlet wrapper for arena routes
│   │   ├── ArenaPlayerPage.tsx     Live quiz screen with countdown timer
│   │   ├── AuthPage.tsx            Sign in / sign up
│   │   ├── ChallengePage.tsx       Challenge detail, step-by-step guide, submission form
│   │   ├── EventDetailPage.tsx     Event info, linked missions, participant count, join
│   │   ├── EventsPage.tsx          Events listing with live / upcoming / past tabs
│   │   ├── GameLibraryPage.tsx     All missions + challenges in a tabbed grid
│   │   ├── HomePage.tsx            Landing page with featured games, events and stats
│   │   ├── LeaderboardPage.tsx     Global + persona-filtered XP rankings
│   │   ├── MissionPlayPage.tsx     Mission quiz engine with timer and scoring preview
│   │   ├── MyJourneyPage.tsx       Personal progress, NFT badges, up-next missions
│   │   ├── OnboardingPage.tsx      New user persona selection
│   │   ├── ProfilePage.tsx         Edit username, emoji, wallet address
│   │   └── RewardsPage.tsx         NFTs, merch and token rewards inventory
│   │
│   └── App.tsx                     All route definitions (public + /admin nested routes)
│
├── supabase/
│   ├── config.toml                 Supabase project config and Edge Function settings
│   ├── functions/
│   │   ├── deploy-nft-contract/    Deno: deploys ERC-721 to Avalanche Fuji
│   │   ├── mint-badge-fuji/        Deno: mints an NFT to a player's wallet
│   │   └── verify-submission/      Deno: verifies an on-chain tx via Snowtrace API
│   └── migrations/
│       ├── 20260417…sql (×11)      Original schema: profiles, events, mission_attempts,
│       │                           arena_sessions, nft_mints, rewards, leaderboard RPCs
│       ├── 20260422000001…sql      games + challenges tables, events expansion, admin layer
│       ├── 20260422000002…sql      Seed: 38 games across 5 personas
│       ├── 20260422000003…sql      Seed: 7 speedrun challenges
│       ├── 20260422000004…sql      Seed: 25 arena quiz questions
│       └── 20260422000005…sql      Seed: 7 platform events
│
├── .env.example                    Template documenting required environment variables
├── vercel.json                     SPA rewrites + /assets cache headers
├── vite.config.ts                  Vite build configuration
├── tailwind.config.ts              Tailwind config with custom display font + color tokens
└── tsconfig.json
```

---

## Database Schema

All tables live in the `public` schema with Row Level Security enabled. Players can only read/write their own data. Admin operations go through `SECURITY DEFINER` RPC functions that bypass RLS safely.

### `profiles`
Extends Supabase Auth users. Created automatically on first sign-in via a database trigger.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Matches `auth.users.id` |
| `user_id` | uuid | Same as id, used in foreign key references |
| `username` | text | Display name |
| `emoji` | text | Chosen avatar emoji |
| `persona` | text | student / developer / builder / founder / business |
| `xp` | integer | Cumulative XP earned across all missions |
| `level` | integer | Derived from XP thresholds |
| `stage` | text | newcomer / explorer / builder / validator / leader |
| `streak` | integer | Consecutive daily sessions |
| `wallet_address` | text | Core wallet address (optional) |
| `status_tag` | text | Flair tag shown on profile (optional) |
| `is_admin` | boolean | Grants access to the `/admin` dashboard |

### `games`
The mission catalog. Uses a TEXT primary key (slug) to match the `game_id` used throughout the app.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Slug e.g. `av-explorer-quiz` |
| `title` | text | |
| `persona` | text | Which persona this mission targets |
| `category` | text | Quiz / Simulation / Puzzle / Build Challenge / etc. |
| `difficulty` | text | Beginner / Intermediate / Advanced |
| `themes` | text[] | Topic tags e.g. `{Avalanche Basics, Consensus}` |
| `description` | text | Two-sentence description |
| `learning_outcome` | text | One-sentence outcome statement |
| `emoji` | text | |
| `duration` | text | Human-readable e.g. `5 min` |
| `xp_reward` | integer | Base XP before difficulty multiplier |
| `reward_type` | text | xp / nft / merch / token |
| `event_types` | text[] | Suitable event formats e.g. `{IRL, Zoom, Hybrid}` |
| `status` | text | live / soon |

### `challenges`
Speedrun challenges catalog.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | |
| `slug` | text UNIQUE | Used in URL `/challenge/:slug` |
| `title` | text | |
| `tagline` | text | Short hook line |
| `emoji` | text | |
| `accent` | text | Colour theme: blue / green / purple / orange / pink |
| `tier` | text | beginner / intermediate / advanced |
| `ai_ready` | boolean | Whether AI tutor hints are available |
| `est_minutes` | integer | Estimated completion time |
| `xp_reward` | integer | |
| `badge_title` | text | Name of the badge earned on completion |
| `concept` | text | One-liner for the underlying tech concept |
| `brief` | text | Context paragraph shown before steps |
| `steps` | jsonb | Array of `{title, detail, hint?}` objects |
| `build_prompt` | text | Full build instruction text |
| `ai_prompt` | text | Seed prompt for the AI tutor |
| `submission` | jsonb | `{primary: {key, label, kind, placeholder}, extras: []}` |
| `verification` | jsonb | `{kind: "on_chain" \| "manual", rules: string[]}` |

### `events`
Platform events (hackathons, workshops, Zoom sessions, IRL summits).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `host_user_id` | uuid | Nullable — NULL means platform-owned |
| `title` | text | |
| `description` | text | |
| `format` | text | irl / zoom / hybrid |
| `location` | text | Physical venue for IRL events |
| `zoom_url` | text | Zoom link for remote events |
| `starts_at` | timestamptz | |
| `ends_at` | timestamptz | |
| `status` | text | draft / live / paused / ended |
| `category` | text | community / hackathon / workshop / etc. |
| `difficulty` | text | beginner / intermediate / advanced |
| `tracks` | text[] | Targeted personas |
| `missions` | text[] | Game IDs linked to this event |
| `capacity` | integer | Max participants |
| `reward_pool` | text | Human-readable e.g. `$5,000 + NFTs` |
| `cover_emoji` | text | |
| `agenda` | jsonb | Array of `{time: string, title: string}` |
| `is_platform_event` | boolean | True for seeded platform events |

### `event_participants`
Tracks which users have joined which events.

| Column | Type |
|---|---|
| `id` | uuid PK |
| `event_id` | uuid → events |
| `user_id` | uuid → profiles |
| `team_id` | uuid (optional) |
| `joined_at` | timestamptz |

### `mission_attempts`
Every mission play attempt, completed or not.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `player_id` | uuid → profiles | |
| `game_id` | text → games | |
| `event_id` | uuid → events | Optional |
| `round_id` | uuid | Optional arena round |
| `status` | text | pending / completed / failed / verified |
| `score` | integer | Server-computed |
| `submission_data` | jsonb | Raw submitted fields for challenge attempts |
| `verified` | boolean | On-chain verification passed |
| `tx_hash` | text | For on-chain challenge verification |
| `completed_at` | timestamptz | |

### `nft_mints`
ERC-721 mint records from the Fuji contract.

| Column | Type |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid → profiles |
| `game_id` | text (optional) |
| `token_id` | integer |
| `tx_hash` | text |
| `contract_address` | text |
| `metadata_uri` | text |
| `minted_at` | timestamptz |

### `nft_badges`
In-app badge inventory (may or may not have a corresponding on-chain mint record).

| Column | Type |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid → profiles |
| `title` | text |
| `rarity` | text — common / rare / legendary |
| `emoji` | text |
| `game_id` | text (optional) |
| `event_id` | uuid (optional) |
| `minted_at` | timestamptz |

### `rewards`
Merch vouchers and token reward rows.

| Column | Type |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid → profiles |
| `title` | text |
| `description` | text |
| `kind` | text — merch / token |
| `rarity` | text |
| `value` | text |
| `claimed` | boolean |
| `claimed_at` | timestamptz |
| `event_id` | uuid (optional) |

### `arena_sessions`

| Column | Type |
|---|---|
| `id` | uuid PK |
| `code` | text — 6-char join code shown as QR |
| `host_id` | uuid → profiles |
| `status` | text — waiting / active / ended |
| `topic` | text |
| `round_index` | integer |
| `created_at` | timestamptz |

### `arena_questions`

| Column | Type |
|---|---|
| `id` | uuid PK |
| `topic` | text |
| `question` | text |
| `options` | text[] — four entries [A, B, C, D] |
| `answer` | integer — zero-indexed correct option |
| `explanation` | text (optional, shown after reveal) |

### `app_settings`
Key-value config table for the admin settings page.

| Column | Type |
|---|---|
| `key` | text PK |
| `value` | text |
| `description` | text (optional) |

### Key RPC Functions

| Function | Returns | Description |
|---|---|---|
| `get_leaderboard(_limit, _persona)` | table | Ranked players by XP with mission counts |
| `submit_attempt(...)` | json | Score a mission server-side, award XP, return result |
| `get_admin_stats()` | json | 8 platform-wide metrics for the admin dashboard |
| `is_admin()` | boolean | SECURITY DEFINER — checks caller's is_admin flag without RLS recursion |
| `mint_badge(...)` | uuid | Insert an nft_badges row and return its ID |
| `issue_reward(...)` | uuid | Insert a rewards row and return its ID |
| `get_my_profile()` | table | Full profile row for the calling authenticated user |

---

## Supabase Edge Functions

All Edge Functions live in `supabase/functions/` and are deployed as Deno serverless functions. They run on Supabase's global edge network, close to the database.

### `mint-badge-fuji`

Mints an ERC-721 token on Avalanche Fuji C-Chain.

**Required secret:** `FUJI_MINTER_PRIVATE_KEY` — the private key of the wallet that deployed the NFT contract.

**Flow:**
1. Receives `{ attempt_id, wallet_address, metadata_uri }` in the request body
2. Constructs and signs a mint transaction using the minter wallet
3. Broadcasts to the Fuji RPC endpoint (`https://api.avax-test.network/ext/bc/C/rpc`)
4. On success, inserts a row into `nft_mints` with the token ID and tx hash
5. Returns `{ token_id, tx_hash }`

### `verify-submission`

Verifies an on-chain challenge submission via the Snowtrace API.

**Flow:**
1. Receives `{ attempt_id, tx_hash }`
2. Queries `https://api-testnet.snowtrace.io/api` for the transaction receipt status
3. Checks that the tx exists, succeeded (status = 1) and originated from the player's registered wallet
4. Updates the `mission_attempts` row: `verified = true`, `status = 'verified'`
5. Returns a verification result to the frontend for display

### `deploy-nft-contract`

Deploys the `PlugPlayArenaBadge` ERC-721 contract to Fuji. Called once from Admin → Settings.

**Required secret:** `FUJI_MINTER_PRIVATE_KEY`

Returns the deployed contract address, which should be saved in `app_settings` under `nft_contract_address` so the mint function knows which contract to call.

---

## Scoring Engine

The scoring logic in `src/lib/scoring.ts` runs client-side to show a live score preview as the player completes a mission. However, the **canonical score is always computed server-side** in the `submit_attempt` RPC, preventing any client-side manipulation.

### Formula

```
score = floor((accuracy_pts + speed_bonus) × difficulty_multiplier × retry_penalty)
      + perfect_bonus  (100 pts if accuracy = 100% on first attempt)
      + fast_bonus     (50 pts if completed in under 50% of the time limit)
```

| Variable | Description |
|---|---|
| `accuracy_pts` | `accuracy_pct × 5` — max 500 pts |
| `speed_bonus` | Up to 200 pts, scales linearly with time remaining |
| `difficulty_multiplier` | Beginner = 1.0 × , Intermediate = 1.3×, Advanced = 1.6× |
| `retry_penalty` | Starts at 1.0, drops 15% per extra attempt (floor 0.5) |

### Rarity tiers for badges

| Difficulty | Badge rarity |
|---|---|
| Beginner | Common |
| Intermediate | Rare |
| Advanced | Legendary |

---

## Admin Dashboard

Accessible at `/admin`. Only users with `is_admin = true` in their `profiles` row can view it. `AdminLayout` calls `supabase.rpc('is_admin')` on every mount and redirects non-admins immediately — there is no client-side bypass.

| Route | Page | What it manages |
|---|---|---|
| `/admin` | Dashboard | Platform stats (8 metrics), recent mission feed, newest players |
| `/admin/events` | Events | Full CRUD — create, edit, delete, inline status toggle |
| `/admin/games` | Games | Full CRUD with title/persona/category search |
| `/admin/challenges` | Challenges | Full CRUD with raw JSON editors for steps, submission shape and verification rules |
| `/admin/players` | Players | Player list ordered by XP, per-player stats modal, admin role grant/revoke |
| `/admin/arena` | Arena | Monitor live sessions, force-end sessions, quiz question CRUD by topic |
| `/admin/submissions` | Submissions | Approve / reject mission attempts, view submission data, trigger on-chain re-verification |
| `/admin/nfts` | NFT Mints | Full mint log with Snowtrace links, token IDs and contract addresses |
| `/admin/settings` | Settings | Edit `app_settings` table, deploy NFT contract to Fuji, inspect env variables |

---

## Local Development

### Prerequisites

- Node.js 18+ (or Bun 1.0+)
- Supabase CLI — `npm install -g supabase`
- A Supabase project (free tier is sufficient)

### 1. Clone and install

```bash
git clone https://github.com/Talent-Index/Plug-Play-Arena.git
cd Plug-Play-Arena
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values from your Supabase project dashboard under **Settings → API**:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 3. Apply database migrations

```bash
supabase login
supabase link --project-ref your-project-id
supabase db push
```

This runs all 16 migration files in order, creating the schema and seeding all games, challenges, questions and events.

### 4. Start the dev server

```bash
npm run dev
```

The app runs at `http://localhost:8080`.

### 5. (Optional) Give yourself admin access

Sign up through the app, then run in the Supabase SQL editor:

```sql
UPDATE profiles SET is_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

---

## Environment Variables

| Variable | Where to set | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel dashboard / `.env.local` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel dashboard / `.env.local` | Supabase `anon` public key |
| `VITE_SUPABASE_PROJECT_ID` | Vercel dashboard / `.env.local` | Project ref ID |
| `FUJI_MINTER_PRIVATE_KEY` | Supabase → Edge Function Secrets | Private key of the Fuji minter wallet |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Edge Function Secrets | Service role key for admin DB writes from Edge Functions |

> **Security:** `FUJI_MINTER_PRIVATE_KEY` must only live in Supabase's Edge Function secrets panel (Project Settings → Edge Functions → Secrets). It must never be committed to git, put in `.env`, or added to Vercel environment variables.

---

## Running Migrations

All 16 migration files are in `supabase/migrations/`, ordered by timestamp prefix.

### Using the Supabase CLI (recommended)

```bash
supabase login
supabase link --project-ref your-project-id
supabase db push
```

### Manual via SQL editor

Paste and run each `.sql` file in the Supabase dashboard SQL editor in timestamp order. The four seed migrations (000002–000005) depend on the schema migration (000001) running first.

### Re-seeding from scratch

```sql
TRUNCATE games, challenges, arena_questions, events CASCADE;
```

Then re-run migrations 000002 through 000005.

---

## Deployment to Vercel

### First deploy

1. Push the repository to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Vercel auto-detects Vite — no framework override needed
4. Add the three `VITE_*` environment variables in the Vercel project settings
5. Click Deploy

`vercel.json` in the repo root handles:
- **SPA routing** — all paths rewrite to `/index.html` so React Router handles navigation without 404s on hard refresh or direct URL access
- **Asset caching** — `/assets/*` gets `Cache-Control: public, max-age=31536000, immutable` for content-hashed Vite bundles, enabling long-term browser caching

### Subsequent deploys

Every push to `main` triggers an automatic Vercel deployment. Build time is typically under 30 seconds.

### Push the clean history to remote

If you want the remote to reflect the clean commit history (removing the old Lovable bot commits):

```bash
git push origin main --force
```

> Warning: this rewrites the remote branch. Anyone who has cloned the repo will need to re-clone.

---

## Blockchain Setup (Avalanche Fuji)

### Network details

| Property | Value |
|---|---|
| Network name | Avalanche Fuji Testnet |
| RPC URL | `https://api.avax-test.network/ext/bc/C/rpc` |
| Chain ID | `43113` |
| Currency symbol | AVAX |
| Block explorer | [testnet.snowtrace.io](https://testnet.snowtrace.io) |

### Get testnet AVAX

Go to [faucet.avax.network](https://faucet.avax.network), select **Fuji C-Chain**, enter your wallet address and request 2 AVAX. This covers many mint transactions.

### Deploying the NFT contract

1. Create a new wallet in Core or MetaMask
2. Fund it with testnet AVAX from the faucet
3. Export the private key and store it in Supabase as `FUJI_MINTER_PRIVATE_KEY` (Edge Function Secrets, not Vercel)
4. In the admin dashboard go to **Settings → Deploy NFT Contract** and click the button
5. Copy the returned contract address
6. In **Settings → App Settings**, save it under the key `nft_contract_address`

All subsequent mint calls will use this contract.

---

## Giving Yourself Admin Access

After signing up through the app at `/auth`, run the following in the Supabase dashboard SQL editor, substituting your email:

```sql
UPDATE profiles
SET is_admin = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
);
```

Navigate to `/admin` — you will be granted access immediately on the next page load. The `is_admin()` SECURITY DEFINER function reads your profile row directly and is used in both the frontend auth guard and the database RLS policies.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on `http://localhost:8080` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint check across all source files |
| `supabase db push` | Apply all pending migrations to the linked project |
| `supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts` | Regenerate auto-typed DB client after schema changes |
| `supabase functions deploy mint-badge-fuji` | Deploy a single Edge Function |
| `supabase functions deploy --all` | Deploy all three Edge Functions |

---

## License

MIT — see [LICENSE](LICENSE) for details.
