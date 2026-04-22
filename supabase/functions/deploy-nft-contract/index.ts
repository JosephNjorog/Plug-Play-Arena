// Idempotent deploy of a minimal mintable ERC-721 to Fuji.
// Compiles Solidity at runtime with solc-js (WASM) so the bytecode is always correct.
// Stores the resulting contract address in app_settings under "fuji_nft_contract".
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Wallet, JsonRpcProvider, ContractFactory } from "https://esm.sh/ethers@6.13.4";
// solc 0.8.20 via esm.sh (loads soljson WASM internally)
// deno-lint-ignore no-explicit-any
const solc: any = (await import("https://esm.sh/solc@0.8.20")).default;

const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Self-contained minimal ERC-721 with safeMint(to, uri). No external imports.
const SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AvalancheBadge {
    string public name;
    string public symbol;
    address public owner;
    uint256 public totalMinted;

    mapping(uint256 => address) private _owners;
    mapping(uint256 => string) private _tokenURIs;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed _owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed _owner, address indexed operator, bool approved);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor(string memory n, string memory s) {
        name = n; symbol = s; owner = msg.sender;
    }

    function balanceOf(address a) external view returns (uint256) { return _balances[a]; }
    function ownerOf(uint256 id) public view returns (address) {
        address o = _owners[id]; require(o != address(0), "no token"); return o;
    }
    function tokenURI(uint256 id) external view returns (string memory) {
        require(_owners[id] != address(0), "no token"); return _tokenURIs[id];
    }

    function safeMint(address to, string calldata uri) external onlyOwner returns (uint256) {
        require(to != address(0), "zero addr");
        totalMinted += 1;
        uint256 id = totalMinted;
        _owners[id] = to;
        _balances[to] += 1;
        _tokenURIs[id] = uri;
        emit Transfer(address(0), to, id);
        return id;
    }

    function approve(address to, uint256 id) external {
        address o = ownerOf(id);
        require(msg.sender == o || _operatorApprovals[o][msg.sender], "not auth");
        _tokenApprovals[id] = to;
        emit Approval(o, to, id);
    }
    function getApproved(uint256 id) external view returns (address) { return _tokenApprovals[id]; }
    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    function isApprovedForAll(address o, address op) external view returns (bool) { return _operatorApprovals[o][op]; }

    function transferFrom(address from, address to, uint256 id) public {
        require(_owners[id] == from, "wrong owner");
        require(to != address(0), "zero addr");
        require(
            msg.sender == from ||
            _tokenApprovals[id] == msg.sender ||
            _operatorApprovals[from][msg.sender], "not auth");
        _balances[from] -= 1; _balances[to] += 1; _owners[id] = to;
        delete _tokenApprovals[id];
        emit Transfer(from, to, id);
    }
    function safeTransferFrom(address from, address to, uint256 id) external { transferFrom(from, to, id); }
    function safeTransferFrom(address from, address to, uint256 id, bytes calldata) external { transferFrom(from, to, id); }

    function supportsInterface(bytes4 i) external pure returns (bool) {
        return i == 0x80ac58cd /* ERC721 */ || i == 0x5b5e139f /* Metadata */ || i == 0x01ffc9a7 /* ERC165 */;
    }
}
`;

const ABI = [
  "constructor(string name_, string symbol_)",
  "function safeMint(address to, string uri) returns (uint256)",
  "function totalMinted() view returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
  "function tokenURI(uint256) view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supaUrl, serviceKey);

  // Idempotency
  const { data: existing } = await admin.rpc("get_app_setting", { _key: "fuji_nft_contract" });
  if (existing) return json({ status: "exists", contract_address: existing });

  const pk = Deno.env.get("FUJI_MINTER_PRIVATE_KEY");
  if (!pk) return json({ error: "FUJI_MINTER_PRIVATE_KEY not set" }, 500);

  try {
    // Compile
    const input = {
      language: "Solidity",
      sources: { "AvalancheBadge.sol": { content: SOURCE } },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: { "*": { "*": ["evm.bytecode.object", "abi"] } },
      },
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors?.some((e: { severity: string }) => e.severity === "error")) {
      return json({ error: "Compile failed", details: output.errors }, 500);
    }
    const bytecode = "0x" + output.contracts["AvalancheBadge.sol"].AvalancheBadge.evm.bytecode.object;

    const provider = new JsonRpcProvider(FUJI_RPC);
    const wallet = new Wallet(pk.startsWith("0x") ? pk : "0x" + pk, provider);
    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) {
      return json({
        error: "Minter wallet has 0 AVAX on Fuji. Fund it from faucet.avax.network.",
        wallet: wallet.address,
      }, 400);
    }
    const factory = new ContractFactory(ABI, bytecode, wallet);
    const contract = await factory.deploy("Avalanche Speedrun Badge", "AVABADGE");
    const receipt = await contract.deploymentTransaction()?.wait();
    const address = await contract.getAddress();
    await admin.rpc("set_app_setting", { _key: "fuji_nft_contract", _value: address });
    await admin.rpc("set_app_setting", { _key: "fuji_minter_address", _value: wallet.address });
    return json({
      status: "deployed",
      contract_address: address,
      minter: wallet.address,
      tx_hash: receipt?.hash ?? null,
      explorer: receipt?.hash ? `https://testnet.snowtrace.io/tx/${receipt.hash}` : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
