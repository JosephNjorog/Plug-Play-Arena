import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, ExternalLink, Gem } from 'lucide-react';

type NFTMint = {
  id: string;
  user_id: string;
  game_id: string | null;
  token_id: number | null;
  tx_hash: string | null;
  contract_address: string | null;
  metadata_uri: string | null;
  minted_at: string;
  profiles: { username: string; emoji: string } | null;
};

export default function AdminNFTs() {
  const [mints, setMints] = useState<NFTMint[]>([]);
  const [filtered, setFiltered] = useState<NFTMint[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('nft_mints')
      .select('*, profiles!inner(username, emoji)')
      .order('minted_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const rows = (data as unknown as NFTMint[]);
          setMints(rows);
          setFiltered(rows);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(q
      ? mints.filter(m => m.profiles?.username.toLowerCase().includes(q) || (m.game_id ?? '').toLowerCase().includes(q) || (m.tx_hash ?? '').toLowerCase().includes(q))
      : mints
    );
  }, [query, mints]);

  const snowtraceUrl = (hash: string) => `https://testnet.snowtrace.io/tx/${hash}`;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wider flex items-center gap-2">
            <Gem className="h-6 w-6 text-purple-400" /> NFT Mints
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{mints.length} total mints on Avalanche Fuji</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Player or game…" className="pl-9 w-56" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Total Minted', value: mints.length, color: 'text-purple-400' },
          { label: 'Unique Players', value: new Set(mints.map(m => m.user_id)).size, color: 'text-blue-400' },
          { label: 'Unique Games', value: new Set(mints.map(m => m.game_id).filter(Boolean)).size, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`mt-1 font-display text-3xl ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Game</th>
                <th className="px-4 py-3 text-left">Token ID</th>
                <th className="px-4 py-3 text-left">Contract</th>
                <th className="px-4 py-3 text-left">Tx Hash</th>
                <th className="px-4 py-3 text-left">Minted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">No NFT mints yet.</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{m.profiles?.emoji}</span>
                      <span className="font-medium">{m.profiles?.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{m.game_id ?? '—'}</td>
                  <td className="px-4 py-3 text-xs font-display text-purple-400">#{m.token_id ?? '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {m.contract_address ? (
                      <span title={m.contract_address}>{m.contract_address.slice(0, 8)}…{m.contract_address.slice(-4)}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {m.tx_hash ? (
                      <a
                        href={snowtraceUrl(m.tx_hash)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                      >
                        {m.tx_hash.slice(0, 8)}…{m.tx_hash.slice(-4)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(m.minted_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
