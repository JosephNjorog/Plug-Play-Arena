// Verify a challenge submission against Fuji RPC, GitHub API, or schema rules.
// Updates the submission row to 'verified' or 'rejected'.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  submission_id: string;
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

  const { submission_id } = (await req.json()) as Body;
  if (!submission_id) return json({ error: "submission_id required" }, 400);

  const { data: sub, error: subErr } = await admin
    .from("challenge_submissions")
    .select("*")
    .eq("id", submission_id)
    .maybeSingle();
  if (subErr || !sub) return json({ error: "Submission not found" }, 404);
  if (sub.user_id !== u.user.id) return json({ error: "Forbidden" }, 403);

  try {
    const evidence = await runVerification(sub.kind, sub.payload as Record<string, unknown>);
    if (evidence.ok) {
      await admin.rpc("mark_submission_verified", {
        _submission_id: submission_id,
        _evidence: evidence.evidence,
      });
      return json({ status: "verified", evidence: evidence.evidence });
    }
    await admin.rpc("mark_submission_rejected", {
      _submission_id: submission_id,
      _reason: evidence.reason,
      _evidence: evidence.evidence,
    });
    return json({ status: "rejected", reason: evidence.reason, evidence: evidence.evidence });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await admin.rpc("mark_submission_rejected", {
      _submission_id: submission_id,
      _reason: msg,
      _evidence: { error: msg },
    });
    return json({ status: "rejected", reason: msg }, 200);
  }
});

type VerifyResult =
  | { ok: true; evidence: Record<string, unknown> }
  | { ok: false; reason: string; evidence: Record<string, unknown> };

async function runVerification(kind: string, payload: Record<string, unknown>): Promise<VerifyResult> {
  switch (kind) {
    case "wallet":     return verifyWallet(payload);
    case "tx_hash":    return verifyTx(payload);
    case "contract":   return verifyContract(payload);
    case "github":     return verifyGithub(payload);
    case "json":       return verifyJson(payload);
    case "custom":     return verifyCustom(payload);
    default:           return { ok: false, reason: `Unknown kind: ${kind}`, evidence: {} };
  }
}

const ADDR_RX = /^0x[a-fA-F0-9]{40}$/;
const HASH_RX = /^0x[a-fA-F0-9]{64}$/;

async function rpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const r = await fetch(FUJI_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message ?? "RPC error");
  return j.result as T;
}

async function verifyWallet(p: Record<string, unknown>): Promise<VerifyResult> {
  const addr = String(p.wallet_address ?? "").trim();
  if (!ADDR_RX.test(addr)) return { ok: false, reason: "Invalid wallet address format", evidence: { addr } };
  const balHex = await rpc<string>("eth_getBalance", [addr, "latest"]);
  const balWei = BigInt(balHex);
  return { ok: true, evidence: { address: addr, balanceWei: balWei.toString(), network: "fuji" } };
}

async function verifyTx(p: Record<string, unknown>): Promise<VerifyResult> {
  const hash = String(p.tx_hash ?? "").trim();
  if (!HASH_RX.test(hash)) return { ok: false, reason: "Invalid tx hash format", evidence: { hash } };
  const receipt = await rpc<{ status: string; from: string; to: string; blockNumber: string } | null>("eth_getTransactionReceipt", [hash]);
  if (!receipt) return { ok: false, reason: "Transaction not found on Fuji", evidence: { hash } };
  if (receipt.status !== "0x1") return { ok: false, reason: "Transaction failed (status != success)", evidence: receipt };
  return { ok: true, evidence: { hash, from: receipt.from, to: receipt.to, blockNumber: receipt.blockNumber, network: "fuji" } };
}

async function verifyContract(p: Record<string, unknown>): Promise<VerifyResult> {
  const addr = String(p.contract_address ?? "").trim();
  if (!ADDR_RX.test(addr)) return { ok: false, reason: "Invalid contract address format", evidence: { addr } };
  const code = await rpc<string>("eth_getCode", [addr, "latest"]);
  if (!code || code === "0x" || code === "0x0") return { ok: false, reason: "No bytecode at this address on Fuji", evidence: { addr } };

  const evidence: Record<string, unknown> = { address: addr, bytecodeBytes: (code.length - 2) / 2, network: "fuji" };

  // Optional secondary: tx hash for the mint
  const mintHash = String(p.mint_tx_hash ?? "").trim();
  if (mintHash) {
    if (!HASH_RX.test(mintHash)) return { ok: false, reason: "Invalid mint tx hash format", evidence };
    const r = await rpc<{ status: string } | null>("eth_getTransactionReceipt", [mintHash]);
    if (!r) return { ok: false, reason: "Mint tx not found on Fuji", evidence };
    if (r.status !== "0x1") return { ok: false, reason: "Mint tx failed", evidence };
    evidence.mint_tx_hash = mintHash;
  }
  return { ok: true, evidence };
}

async function verifyGithub(p: Record<string, unknown>): Promise<VerifyResult> {
  const url = String(p.github_url ?? "").trim();
  const m = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)\/?/.exec(url);
  if (!m) return { ok: false, reason: "Not a valid GitHub repo URL", evidence: { url } };
  const owner = m[1]; const repo = m[2].replace(/\.git$/, "");
  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "lovable-verifier" },
  });
  if (ghRes.status === 404) return { ok: false, reason: "Repo not found or private", evidence: { owner, repo } };
  if (!ghRes.ok) return { ok: false, reason: `GitHub API error ${ghRes.status}`, evidence: { owner, repo } };
  const meta = await ghRes.json();
  const evidence: Record<string, unknown> = {
    owner, repo,
    full_name: meta.full_name,
    stars: meta.stargazers_count,
    private: meta.private,
    default_branch: meta.default_branch,
    pushed_at: meta.pushed_at,
  };
  if (meta.private) return { ok: false, reason: "Repo is private — must be public", evidence };

  // Optional contract check
  const ca = String(p.contract_address ?? "").trim();
  if (ca) {
    if (!ADDR_RX.test(ca)) return { ok: false, reason: "Invalid contract address format", evidence };
    const code = await rpc<string>("eth_getCode", [ca, "latest"]);
    if (!code || code === "0x") return { ok: false, reason: "No bytecode at contract address on Fuji", evidence };
    evidence.contract_address = ca;
  }
  return { ok: true, evidence };
}

function verifyJson(p: Record<string, unknown>): VerifyResult {
  const raw = String(p.spec_json ?? "").trim();
  if (!raw) return { ok: false, reason: "Empty JSON", evidence: {} };
  let obj: Record<string, unknown>;
  try { obj = JSON.parse(raw); } catch { return { ok: false, reason: "Not valid JSON", evidence: { raw: raw.slice(0, 200) } }; }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return { ok: false, reason: "JSON root must be an object", evidence: {} };
  const required = ["name", "chainId", "gasToken", "validators", "governance"];
  const missing = required.filter(k => !(k in obj));
  if (missing.length) return { ok: false, reason: `Missing keys: ${missing.join(", ")}`, evidence: { missing } };
  if (typeof obj.chainId !== "number" || !Number.isInteger(obj.chainId) || (obj.chainId as number) <= 0) {
    return { ok: false, reason: "chainId must be a positive integer", evidence: { chainId: obj.chainId } };
  }
  return { ok: true, evidence: { name: obj.name, chainId: obj.chainId, governance: obj.governance } };
}

function verifyCustom(p: Record<string, unknown>): VerifyResult {
  // Stablecoin / AvaUSD-style rule check.
  const fs = (p.final_state ?? {}) as Record<string, unknown>;
  const peg = Number(fs.peg);
  const health = Number(fs.health);
  const ratio = Number(fs.collateralRatio);
  const crashed = Boolean(fs.marketCrashed);
  const strategy = String(fs.strategy ?? "Balanced");

  if (!isFinite(peg)) return { ok: false, reason: "Missing peg in final_state", evidence: { fs } };
  if (!isFinite(health)) return { ok: false, reason: "Missing health in final_state", evidence: { fs } };
  if (!crashed) return { ok: false, reason: "Market crash was not triggered — challenge requires surviving the shock", evidence: { fs } };
  if (peg < 0.98 || peg > 1.02) return { ok: false, reason: `Peg unstable: ${peg.toFixed(3)} (need 0.98–1.02)`, evidence: { peg, health } };
  if (health < 120) return { ok: false, reason: `System undercollateralized: health ${health.toFixed(0)}% (need ≥ 120)`, evidence: { peg, health } };
  if (isFinite(ratio) && ratio < 150) return { ok: false, reason: `Collateral ratio ${ratio.toFixed(0)}% < 150`, evidence: { peg, health, ratio } };

  return { ok: true, evidence: { peg, health, ratio: isFinite(ratio) ? ratio : null, strategy, crashed } };
}

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
