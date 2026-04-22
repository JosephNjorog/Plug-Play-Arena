import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArena } from '@/lib/arenaContext';
import { usePlayer } from '@/lib/playerContext';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Play, Users, Trophy, ArrowRight, Crown, Sparkles, Wallet, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Confetti } from '@/components/game/Confetti';
import { supabase } from '@/integrations/supabase/client';

const OPTION_COLORS: Record<string, string> = {
  A: 'bg-[hsl(354_100%_61%)]',
  B: 'bg-[hsl(220_56%_45%)]',
  C: 'bg-[hsl(145_70%_45%)]',
  D: 'bg-[hsl(45_100%_55%)]',
};

export default function ArenaHostPage() {
  const navigate = useNavigate();
  const { user } = usePlayer();
  const { session, players, questions, currentQuestion, phase, timeLeft, answerCounts, isHost,
    createSession, startGame, nextQuestion, showLeaderboard, finishGame } = useArena();
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (!user) navigate('/auth?redirect=/arena'); }, [user, navigate]);

  async function handleCreate() {
    setCreating(true);
    try { const code = await createSession(); toast.success(`Session ${code} ready`); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    setCreating(false);
  }

  const joinUrl = session ? `${window.location.origin}/arena/join/${session.join_code}` : '';
  const totalQ = questions.length;
  const qIdx = session?.current_question_index ?? 0;
  const lastQuestion = qIdx + 1 >= totalQ;

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="mx-auto max-w-4xl px-4 py-8">

        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6 py-20">
            <div className="text-6xl">🏟️</div>
            <h1 className="font-display text-3xl tracking-wider">AvaUSD Arena</h1>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              Live multiplayer quiz on Avalanche Fuji. Players join via QR, answer in real time, winner mints an NFT badge.
            </p>
            <Button onClick={handleCreate} disabled={creating} size="lg" className="gap-2 font-display tracking-wider">
              <Sparkles className="h-4 w-4" /> {creating ? 'Creating…' : 'Create Game'}
            </Button>
          </div>
        )}

        {phase === 'lobby' && session && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl tracking-wider">Game Lobby</h1>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="font-display text-4xl tracking-[0.3em] text-primary">{session.join_code}</span>
                <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(session.join_code); toast.success('Copied'); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-center"><div className="rounded-xl bg-white p-4"><QRCodeSVG value={joinUrl} size={180} /></div></div>
            <p className="text-center text-xs text-muted-foreground break-all">{joinUrl}</p>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <Users className="h-4 w-4" /> {players.length} player{players.length !== 1 && 's'} joined
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <AnimatePresence>
                  {players.map(p => (
                    <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.6, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="rounded-lg bg-muted px-3 py-2 text-sm flex items-center gap-2">
                      <span className="truncate flex-1">{p.nickname}</span>
                      {p.wallet_address && <Wallet className="h-3 w-3 text-[hsl(145_70%_55%)]" />}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            {isHost && (
              <div className="flex justify-center">
                <Button onClick={startGame} disabled={players.length < 1} size="lg" className="gap-2 font-display tracking-wider">
                  <Play className="h-4 w-4" /> Start Game ({totalQ} questions)
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === 'question' && currentQuestion && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-display tracking-wider">Q{qIdx + 1}/{totalQ}</span>
              <div className={`font-display text-3xl tabular-nums ${timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>{timeLeft}</div>
            </div>
            <motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-8 text-center">
              <h2 className="font-display text-xl tracking-wider">{currentQuestion.question_text}</h2>
            </motion.div>
            <div className="grid grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map(k => (
                <div key={k} className={`${OPTION_COLORS[k]} rounded-xl p-4 text-white font-semibold text-sm`}>
                  <span className="font-display mr-2">{k}.</span> {(currentQuestion.options as Record<string, string>)[k]}
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {Object.values(answerCounts).reduce((a, b) => a + b, 0)} / {players.length} answered
            </p>
          </div>
        )}

        {phase === 'reveal' && currentQuestion && (
          <div className="space-y-6">
            <h2 className="text-center font-display text-lg tracking-wider">Answer: {currentQuestion.correct_answer}</h2>
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">{currentQuestion.question_text}</p>
              <p className="mt-2 text-lg font-semibold text-primary">{(currentQuestion.options as Record<string, string>)[currentQuestion.correct_answer]}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['A', 'B', 'C', 'D'] as const).map(k => (
                <div key={k} className={`rounded-lg p-3 text-center ${k === currentQuestion.correct_answer ? 'bg-[hsl(145_70%_45%/0.2)] border border-[hsl(145_70%_45%/0.5)]' : 'bg-muted'}`}>
                  <div className="font-display text-xl">{answerCounts[k] || 0}</div>
                  <div className="text-[10px] text-muted-foreground">{k}</div>
                </div>
              ))}
            </div>
            {isHost && (
              <div className="flex justify-center gap-3">
                <Button onClick={showLeaderboard} variant="secondary" className="gap-2 font-display tracking-wider">
                  <Trophy className="h-4 w-4" /> Leaderboard
                </Button>
                <Button onClick={lastQuestion ? finishGame : nextQuestion} className="gap-2 font-display tracking-wider">
                  {lastQuestion ? <><Crown className="h-4 w-4" /> Final Results</> : <><ArrowRight className="h-4 w-4" /> Next Question</>}
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === 'leaderboard' && (
          <div className="space-y-6">
            <h2 className="text-center font-display text-2xl tracking-wider">Leaderboard</h2>
            <Podium players={players} />
            <FullList players={players} />
            {isHost && (
              <div className="flex justify-center">
                <Button onClick={lastQuestion ? finishGame : nextQuestion} className="gap-2 font-display tracking-wider">
                  {lastQuestion ? <><Crown className="h-4 w-4" /> Final Results</> : <><ArrowRight className="h-4 w-4" /> Next Question</>}
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === 'finished' && session && (
          <FinishedView sessionId={session.id} players={players} isHost={isHost} />
        )}
      </div>
    </div>
  );
}

function Podium({ players }: { players: { id: string; nickname: string; score: number; wallet_address: string | null }[] }) {
  const [first, second, third] = players;
  const Card = ({ p, place, scale, badge, glow }: { p?: typeof first; place: string; scale: number; badge: string; glow?: boolean }) => (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ scale }}
      className={`flex flex-col items-center rounded-2xl p-4 text-center min-w-[110px] ${
        glow ? 'border-2 border-[hsl(45_100%_55%)] bg-[hsl(45_100%_55%/0.1)] shadow-[0_0_30px_hsl(45_100%_55%/0.4)]'
             : 'border border-border bg-card'}`}>
      <div className="text-3xl mb-1">{badge}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{place}</div>
      <div className="font-display text-sm truncate max-w-[100px]">{p?.nickname ?? '—'}</div>
      <div className="font-display text-lg tabular-nums text-primary">{p?.score ?? 0}</div>
    </motion.div>
  );
  return (
    <div className="flex items-end justify-center gap-3 py-4">
      <Card p={second} place="2nd" badge="🥈" scale={1.0} />
      <Card p={first} place="1st" badge="🥇" scale={1.2} glow />
      <Card p={third} place="3rd" badge="🥉" scale={0.95} />
    </div>
  );
}

function FullList({ players }: { players: { id: string; nickname: string; score: number }[] }) {
  return (
    <div className="mx-auto max-w-md space-y-2">
      {players.slice(3, 10).map((p, i) => (
        <motion.div key={p.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 rounded-xl p-3 bg-card border border-border">
          <span className="w-8 text-center text-xs text-muted-foreground">#{i + 4}</span>
          <span className="flex-1 text-sm font-semibold truncate">{p.nickname}</span>
          <span className="font-display text-sm tabular-nums">{p.score}</span>
        </motion.div>
      ))}
    </div>
  );
}

function FinishedView({ sessionId, players, isHost }: {
  sessionId: string;
  players: { id: string; nickname: string; score: number; wallet_address: string | null; user_id: string | null }[];
  isHost: boolean;
}) {
  const winner = players[0];
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<{ tx_hash?: string; token_id?: string } | null>(null);

  // Auto-record winner row when host lands here; update wallet if winner attaches it later.
  useEffect(() => {
    if (!isHost || !winner) return;
    (async () => {
      const { data: existing } = await supabase.from('arena_results')
        .select('nft_tx_hash,nft_token_id,wallet_address').eq('session_id', sessionId).maybeSingle();
      if (!existing) {
        await supabase.from('arena_results').insert({
          session_id: sessionId, winner_player_id: winner.id, user_id: winner.user_id,
          wallet_address: winner.wallet_address, nickname: winner.nickname, score: winner.score,
        });
      } else if (winner.wallet_address && existing.wallet_address !== winner.wallet_address) {
        await supabase.from('arena_results').update({ wallet_address: winner.wallet_address }).eq('session_id', sessionId);
      }
      if (existing?.nft_tx_hash) setResult({ tx_hash: existing.nft_tx_hash, token_id: existing.nft_token_id ?? undefined });
    })();
  }, [isHost, winner?.id, winner?.wallet_address, sessionId]);

  async function handleMint() {
    if (!winner?.wallet_address) { toast.error('Winner has no wallet on file'); return; }
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke('mint-badge-fuji', {
        body: {
          challenge_id: 'avausd-arena',
          badge_title: 'AvaUSD Arena Champion',
          recipient_address: winner.wallet_address,
          arena_session_id: sessionId,
          metadata: { rank: 1, score: winner.score, session_id: sessionId },
        },
      });
      if (error) throw error;
      const r = data as { tx_hash: string; token_id: string };
      setResult(r);
      await supabase.from('arena_results').update({ nft_tx_hash: r.tx_hash, nft_token_id: r.token_id }).eq('session_id', sessionId);
      toast.success('Champion NFT minted on Fuji 🏆');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Mint failed'); }
    setClaiming(false);
  }

  return (
    <div className="space-y-6 py-8">
      <Confetti />
      <div className="text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="font-display text-3xl tracking-wider">Game Over</h1>
        {winner && <p className="mt-2 text-lg text-primary font-display tracking-wider">{winner.nickname} wins · {winner.score} pts</p>}
      </div>
      <Podium players={players} />
      <FullList players={players} />

      {isHost && winner && (
        <div className="mx-auto max-w-md rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Winner Prize</p>
          {result?.tx_hash ? (
            <>
              <p className="font-display">NFT Minted ✅</p>
              <a href={`https://testnet.snowtrace.io/tx/${result.tx_hash}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View on Snowtrace <ExternalLink className="h-3 w-3" />
              </a>
            </>
          ) : winner.wallet_address ? (
            <Button onClick={handleMint} disabled={claiming} size="lg" className="w-full gap-2 font-display tracking-wider">
              <Crown className="h-4 w-4" /> {claiming ? 'Minting…' : 'Mint Champion NFT'}
            </Button>
          ) : (
            <p className="text-xs text-destructive">Winner has no wallet address — cannot mint.</p>
          )}
        </div>
      )}
    </div>
  );
}
