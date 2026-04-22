// Minimal EIP-1193 helpers for Core / MetaMask
export interface EthProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isAvalanche?: boolean;
}
declare global {
  interface Window { avalanche?: EthProvider; ethereum?: EthProvider; }
}
export function getEthProvider(): EthProvider | null {
  if (typeof window === 'undefined') return null;
  return window.avalanche ?? window.ethereum ?? null;
}
export const FUJI_PARAMS = {
  chainId: '0xa869',
  chainName: 'Avalanche Fuji C-Chain',
  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io'],
};
export async function connectWallet(): Promise<string> {
  const p = getEthProvider();
  if (!p) throw new Error('No wallet detected. Install Core or MetaMask.');
  const accounts = await p.request({ method: 'eth_requestAccounts' }) as string[];
  if (!accounts?.[0]) throw new Error('No account returned');
  try { await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: FUJI_PARAMS.chainId }] }); }
  catch { try { await p.request({ method: 'wallet_addEthereumChain', params: [FUJI_PARAMS] }); } catch { /* user dismissed */ } }
  return accounts[0];
}
export function isValidAddress(a: string | null | undefined): a is string {
  return !!a && /^0x[a-fA-F0-9]{40}$/.test(a);
}
