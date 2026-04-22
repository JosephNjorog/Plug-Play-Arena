-- =====================================================
-- SEED: AVALANCHE SPEEDRUN CHALLENGES (7 challenges)
-- =====================================================
INSERT INTO public.challenges (id, slug, title, tagline, emoji, accent, tier, ai_ready, est_minutes, xp_reward, badge_title, concept, brief, steps, build_prompt, ai_prompt, submission, verification) VALUES

('fuji-wallet', 'fuji-wallet', 'Fuji Wallet Quest',
 'Spin up a Core wallet, fund it from the faucet, and prove you own it.',
 '🦊', 'cyan', 'Beginner', false, 10, 250, 'Fuji Initiate',
 'Self-custody on Avalanche: how a wallet, the Fuji testnet, and the faucet fit together.',
 'You''ve just been hired as the on-chain ops lead at a small DAO. Before you touch real money, the team needs you to prove you can operate a wallet on Avalanche''s Fuji testnet — fund it, hold it, sign with it.',
 '[{"title":"Install Core or use MetaMask","detail":"Install Core wallet (core.app) or add Avalanche Fuji to MetaMask.","hint":"Fuji RPC: https://api.avax-test.network/ext/bc/C/rpc · Chain ID 43113"},{"title":"Switch to Fuji Testnet","detail":"Select the Fuji C-Chain network inside your wallet."},{"title":"Claim AVAX from the faucet","detail":"Visit faucet.avax.network and request testnet AVAX to your address."},{"title":"Confirm balance > 0","detail":"Open snowtrace.io/?chainid=43113 and paste your address — you should see incoming AVAX."},{"title":"Submit your address","detail":"Paste your full 0x… address below to claim your Fuji Initiate badge."}]',
 'Get a working Fuji wallet with non-zero AVAX balance.',
 NULL,
 '{"primary":{"key":"wallet_address","label":"Your Fuji wallet address","kind":"wallet","placeholder":"0x…","helpText":"Must be a valid EVM address (0x + 40 hex chars)."}}',
 '{"kind":"wallet","rules":["EVM address format (0x + 40 hex)","Address has Fuji balance ≥ 0 AVAX (proves it exists on chain)"]}'
),

('first-tx', 'first-tx', 'Your First Fuji Transaction',
 'Send AVAX, get the tx hash, and watch the network confirm it live.',
 '⚡', 'lime', 'Beginner', false, 8, 300, 'First Mover',
 'How an EVM transaction works: from, to, value, gas, hash, confirmation.',
 'Your DAO is moving stipend payments to Avalanche. Prove the basics: you can construct, sign, and broadcast a Fuji transaction — and verify it landed.',
 '[{"title":"Open your funded Fuji wallet","detail":"Use the address you registered in the Fuji Wallet Quest."},{"title":"Send 0.01 AVAX to any Fuji address","detail":"You can send back to yourself — the goal is producing a real tx.","hint":"Try a burn address like 0x000000000000000000000000000000000000dEaD"},{"title":"Copy the transaction hash","detail":"After confirmation, your wallet shows a 0x… tx hash. Copy it."},{"title":"Verify on Snowtrace","detail":"Paste the hash into testnet.snowtrace.io to confirm \"Success\"."},{"title":"Submit the tx hash","detail":"Paste the hash below — we re-check it directly against Fuji RPC."}]',
 'Broadcast one successful Fuji transaction and submit its hash.',
 NULL,
 '{"primary":{"key":"tx_hash","label":"Fuji transaction hash","kind":"tx_hash","placeholder":"0x…","helpText":"64 hex chars after 0x."}}',
 '{"kind":"tx_hash","rules":["Hash format (0x + 64 hex)","Transaction exists on Fuji","Receipt status = success"]}'
),

('erc20-launch', 'erc20-launch', 'Launch Your Token',
 'Deploy an ERC-20 to Fuji and submit the contract address.',
 '🪙', 'gold', 'Intermediate', true, 25, 700, 'Token Launcher',
 'ERC-20 anatomy: name, symbol, totalSupply, transfer, balanceOf — and how to deploy one to Fuji.',
 'Your community wants a meme-coin reward token for event participation. Ship a real ERC-20 on Fuji that the team can later mint, distribute, and audit.',
 '[{"title":"Open Remix IDE","detail":"remix.ethereum.org — no install required."},{"title":"Drop in an ERC-20","detail":"Use the OpenZeppelin ERC20 template. Pick a name, symbol, and initial supply."},{"title":"Compile with Solidity 0.8.x","detail":"Make sure compilation passes with no errors."},{"title":"Connect wallet → Fuji","detail":"In Remix \"Deploy & Run\", choose Injected Provider (MetaMask/Core) on chain 43113."},{"title":"Deploy","detail":"Confirm the tx. Copy the deployed contract address."},{"title":"Submit the contract address","detail":"Paste below — we check Fuji RPC for deployed bytecode."}]',
 'Deploy a working ERC-20 to Fuji and submit its contract address.',
 'Generate a minimal OpenZeppelin-based ERC-20 in Solidity 0.8.20 with constructor params (name, symbol, initialSupply) that mints initialSupply to msg.sender. Include SPDX license and pragma.',
 '{"primary":{"key":"contract_address","label":"Deployed ERC-20 contract address","kind":"contract","placeholder":"0x…","helpText":"Address must have deployed bytecode on Fuji."}}',
 '{"kind":"contract","rules":["Address format (0x + 40 hex)","eth_getCode returns non-empty bytecode on Fuji"]}'
),

('nft-mint', 'nft-mint', 'Mint Your First NFT',
 'Deploy an ERC-721 on Fuji and mint token #1 to your wallet.',
 '🖼️', 'magenta', 'Intermediate', true, 30, 800, 'NFT Architect',
 'ERC-721: tokenURI, ownerOf, mint — and how off-chain metadata maps to on-chain ownership.',
 'An artist friend wants to drop a 1-of-1 on Avalanche before her gallery show. You''re shipping the contract, minting #1 to her wallet, and proving it on Snowtrace.',
 '[{"title":"Write or scaffold an ERC-721","detail":"Use OpenZeppelin ERC721 + Ownable in Remix or Hardhat."},{"title":"Deploy to Fuji","detail":"Same flow as the ERC-20 challenge — Injected Provider, chain 43113."},{"title":"Mint token #1 to your wallet","detail":"Call safeMint(yourAddress, \"ipfs://…\") or your own tokenURI."},{"title":"Grab the mint tx hash","detail":"From your wallet activity or Snowtrace."},{"title":"Submit contract + tx hash","detail":"Both get verified against Fuji RPC."}]',
 'Deploy an ERC-721 on Fuji and mint at least one token.',
 'Write a minimal OpenZeppelin-based ERC-721 in Solidity 0.8.20 with: name "AvaArt", symbol "AVART", a public safeMint(address to, string tokenURI) restricted to the owner, and a counter for tokenIds. Include SPDX + pragma.',
 '{"primary":{"key":"contract_address","label":"NFT contract address","kind":"contract","placeholder":"0x…"},"extras":[{"key":"mint_tx_hash","label":"Mint transaction hash","kind":"tx_hash","placeholder":"0x…"}]}',
 '{"kind":"contract","rules":["Contract has bytecode on Fuji","Mint tx hash exists on Fuji","Tx status = success"]}'
),

('subnet-blueprint', 'subnet-blueprint', 'Subnet Blueprint',
 'Design a custom Avalanche L1 in JSON — validators, gas token, governance.',
 '🧩', 'sky', 'Advanced', true, 20, 900, 'Subnet Architect',
 'Why teams launch Avalanche L1s: sovereign gas tokens, validator sets, custom rules.',
 'A gaming studio wants their own Avalanche L1 so in-game gas is paid in their token, not AVAX. Draft the configuration that an ops team could hand to avalanche-cli.',
 '[{"title":"Pick a name and chain ID","detail":"Choose something memorable. Chain ID must not collide with mainnet ranges."},{"title":"Pick a gas token","detail":"Symbol, decimals, and an initial allocation map."},{"title":"Define validator set","detail":"How many validators at launch? Stake requirements?"},{"title":"Choose governance model","detail":"Foundation-led, multisig, or DAO?"},{"title":"Submit your spec as JSON","detail":"Single JSON object with: name, chainId, gasToken, validators, governance."}]',
 'Submit a JSON spec for a custom Avalanche L1.',
 'Draft a JSON config for a custom Avalanche L1 for a gaming project. Required keys: name (string), chainId (int), gasToken { symbol, decimals, initialAllocation: { address: amount } }, validators { count, minStake }, governance ("foundation"|"multisig"|"dao"). Output JSON only — no commentary.',
 '{"primary":{"key":"spec_json","label":"Subnet config JSON","kind":"json","placeholder":"{ \"name\": \"MyChain\", \"chainId\": 4242, … }","helpText":"Must be valid JSON with required keys."}}',
 '{"kind":"json","rules":["Parses as JSON object","Has keys: name, chainId, gasToken, validators, governance","chainId is a positive integer"]}'
),

('avausd-peg', 'avausd-peg', 'AvaUSD: Keep the Peg',
 'Design, defend, and stabilize a decentralized stablecoin on Avalanche.',
 '🏦', 'cyan', 'Advanced', true, 45, 1500, 'Peg Defender',
 'Stablecoins rely on collateral, interest rates, and liquidation mechanics to maintain a $1 peg. You''ll experience the trilemma firsthand.',
 'You are launching AvaUSD on Avalanche. Your mission: maintain a stable $1 peg under volatile market conditions. Mint, manage rates, survive a 30% crash, and prove your system holds.',
 '[{"title":"Deposit collateral","detail":"Add AVAX-backed collateral to secure your system."},{"title":"Mint AvaUSD","detail":"Generate stablecoins while keeping a safe collateral ratio (≥ 150%)."},{"title":"Adjust interest rates","detail":"Balance supply and demand using borrow/savings rates."},{"title":"Survive a market crash","detail":"Trigger the −30% AVAX shock and watch your peg slip."},{"title":"Restore the peg","detail":"Bring AvaUSD back to $1 ± 0.02 with health ≥ 120%.","hint":"Repay debt, liquidate, or hike the savings rate."},{"title":"Submit final state","detail":"Click \"Capture state\" below to lock in your defended system."}]',
 'Operate the AvaUSD simulator and prove the peg survives a market crash.',
 'Explain three concrete actions a stablecoin protocol can take to defend its peg after a 30% collateral price drop. Output as a numbered list, max 60 words total.',
 '{"primary":{"key":"final_state","label":"Final stablecoin state","kind":"custom","placeholder":"Auto-filled when you capture state","helpText":"Captured automatically from the simulator above."}}',
 '{"kind":"custom","rules":["peg between 0.98 and 1.02","health ≥ 120","collateral ratio ≥ 150","market crash was triggered"]}'
),

('dapp-github', 'dapp-github', 'Ship a Fuji dApp',
 'Build a frontend that reads from your Fuji contract and ship the repo.',
 '🚀', 'pink', 'Advanced', true, 60, 1200, 'Avalanche Builder',
 'End-to-end Web3: contract on Fuji, ethers/viem in the browser, wallet connection, live reads.',
 'A founder wants a public demo page for her token before she pitches investors. Ship a one-page dApp that connects a wallet, reads totalSupply from her Fuji ERC-20, and renders it.',
 '[{"title":"Pick a contract","detail":"Use the ERC-20 you deployed in the Token Launch challenge — or any Fuji contract."},{"title":"Scaffold a frontend","detail":"Vite + React + ethers (or viem). Lovable can scaffold this."},{"title":"Wire wallet connect","detail":"Use window.ethereum / wagmi to connect to Fuji."},{"title":"Read on-chain data","detail":"Call totalSupply() or balanceOf() and render it on the page."},{"title":"Push to a public GitHub repo","detail":"Make sure the repo is public and the README mentions Fuji."},{"title":"Submit the repo URL + contract","detail":"We check the repo exists via GitHub API and the contract has bytecode on Fuji."}]',
 'Ship a Fuji-connected dApp on GitHub.',
 'Generate a minimal Vite + React + ethers v6 single-page app that: 1) shows a Connect Wallet button, 2) requests Avalanche Fuji (chainId 43113) network switch, 3) reads totalSupply() from an ERC-20 contract address (env var), 4) renders the formatted supply. One file App.jsx + main.jsx.',
 '{"primary":{"key":"github_url","label":"Public GitHub repo URL","kind":"github","placeholder":"https://github.com/you/your-repo"},"extras":[{"key":"contract_address","label":"Contract the dApp reads from","kind":"contract","placeholder":"0x…"}]}',
 '{"kind":"github","rules":["URL matches https://github.com/{owner}/{repo}","Repo is public (GitHub API responds 200)","Contract has bytecode on Fuji"]}'
)

ON CONFLICT (id) DO NOTHING;
