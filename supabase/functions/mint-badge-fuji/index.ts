// Mint a badge NFT to the user's wallet on Fuji.
// Requires: verified submission for the challenge + recipient wallet address.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Wallet, JsonRpcProvider, Contract } from "https://esm.sh/ethers@6.13.4";

const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ABI = [
  "function safeMint(address to, string uri) returns (uint256)",
  "function totalMinted() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

interface Body {
  challenge_id: string;
  badge_title: string;
  recipient_address: string;
  event_id?: string | null;
  arena_session_id?: string | null;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userJwt = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supaUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: userJwt } },
  });
  const admin = createClient(supaUrl, serviceKey);

  const { data: u } = await userClient.auth.getUser();
  if (!u.user) return json({ error: "Not authenticated" }, 401);

  const body = (await req.json()) as Body;
  if (!body.challenge_id || !body.recipient_address || !body.badge_title) {
    return json({ error: "challenge_id, badge_title, recipient_address required" }, 400);
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(body.recipient_address)) {
    return json({ error: "Invalid recipient address" }, 400);
  }

  // Auth path 1: Arena session winner (host-attested)
  // Auth path 2: Verified challenge submission for this user
  let authorized = false;
  if (body.arena_session_id) {
    const { data: sess } = await admin
      .from("game_sessions")
      .select("id,host_user_id,status")
      .eq("id", body.arena_session_id)
      .maybeSingle();
    if (sess && sess.host_user_id === u.user.id && sess.status === "finished") {
      const { data: top } = await admin
        .from("arena_players")
        .select("wallet_address,score")
        .eq("session_id", body.arena_session_id)
        .order("score", { ascending: false })
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (top?.wallet_address?.toLowerCase() === body.recipient_address.toLowerCase()) {
        authorized = true;
      }
    }
    if (!authorized) return json({ error: "Not authorized to mint for this arena session" }, 403);
  } else {
    const { data: sub } = await admin
      .from("challenge_submissions")
      .select("id,status")
      .eq("user_id", u.user.id)
      .eq("challenge_id", body.challenge_id)
      .eq("status", "verified")
      .maybeSingle();
    if (!sub) return json({ error: "No verified submission for this challenge" }, 403);
    authorized = true;
  }

  // Dedupe: per-challenge for normal flow, per-arena-session for arena flow
  if (body.arena_session_id) {
    const { data: prior } = await admin
      .from("arena_results")
      .select("nft_tx_hash,nft_token_id")
      .eq("session_id", body.arena_session_id)
      .maybeSingle();
    if (prior?.nft_tx_hash) return json({ status: "already_minted", tx_hash: prior.nft_tx_hash, token_id: prior.nft_token_id });
  } else {
    const { data: prior } = await admin
      .from("nft_mints")
      .select("tx_hash,token_id,contract_address")
      .eq("user_id", u.user.id)
      .eq("challenge_id", body.challenge_id)
      .maybeSingle();
    if (prior) return json({ status: "already_minted", ...prior });
  }

  // Resolve contract
  const { data: contractAddr } = await admin.rpc("get_app_setting", { _key: "fuji_nft_contract" });
  if (!contractAddr) return json({ error: "NFT contract not deployed yet. Run deploy-nft-contract first." }, 400);

  const pk = Deno.env.get("FUJI_MINTER_PRIVATE_KEY");
  if (!pk) return json({ error: "FUJI_MINTER_PRIVATE_KEY not set" }, 500);

  try {
    const provider = new JsonRpcProvider(FUJI_RPC);
    const wallet = new Wallet(pk.startsWith("0x") ? pk : "0x" + pk, provider);
    const contract = new Contract(contractAddr, ABI, wallet);

    // Build a tiny on-chain-friendly tokenURI (data URL JSON).
    const meta = {
      name: body.badge_title,
      description: `Avalanche Speedrun badge for ${body.challenge_id}`,
      attributes: [
        { trait_type: "Challenge", value: body.challenge_id },
        { trait_type: "Network", value: "Fuji" },
      ],
      ...(body.metadata ?? {}),
    };
    const uri = "data:application/json;base64," + btoa(JSON.stringify(meta));

    const tx = await contract.safeMint(body.recipient_address, uri);
    const receipt = await tx.wait();

    // Best-effort token id from Transfer event
    let tokenId = "0";
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === "Transfer") {
          tokenId = parsed.args[2].toString();
          break;
        }
      } catch { /* ignore */ }
    }

    await admin.rpc("record_nft_mint", {
      _user_id: u.user.id,
      _challenge_id: body.challenge_id,
      _event_id: body.event_id ?? null,
      _contract_address: contractAddr,
      _token_id: tokenId,
      _recipient_address: body.recipient_address,
      _tx_hash: tx.hash,
      _metadata: meta,
    });

    return json({
      status: "minted",
      tx_hash: tx.hash,
      token_id: tokenId,
      contract_address: contractAddr,
      explorer: `https://testnet.snowtrace.io/tx/${tx.hash}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
