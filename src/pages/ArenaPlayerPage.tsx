import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArena } from '@/lib/arenaContext';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Clock, Trophy, Wallet, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { connectWallet, isValidAddress } from '@/lib/wallet';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Confetti } from '@/components/game/Confetti';

const OPTION_COLORS: Record<string, string> = {
  A: 'bg-[hsl(354_100%_61%)] hover:bg-[hsl(354_100%_55%)]',
  B: 'bg-[hsl(220_56%_45%)] hover:bg-[hsl(220_56%_40%)]',
  C: 'bg-[hsl(145_70%_45%)] hover:bg-[hsl(145_70%_40%)]',
  D: 'bg-[hsl(45_100%_55%)] hover:bg-[hsl(45_100%_50%)]',
};

export default function ArenaPlayerPage() {
  const navigate = useNavigate();
  const { session, players, currentQuestion, phase, timeLeft, myAnswer, myPlayer, submitAnswer, questions, attachWallet } = useArena();
  const questionStart = useRef<number>(Date.now());
  const lastQ = useRef<string | null>(null);
  const totalQ = questions.length;
  const qIdx = session?.current_question_index ?? 0;

  // No session → bounce back to join
  useEffect(() => {
    if (!session) navigate('/arena/join');
  }, [session, navigate]);

  // Reset response timer per new question
  useEffect(() => {
    if (currentQuestion && lastQ.current !== currentQuestion.id) {
      lastQ.current = currentQuestion.id;
      questionStart.current = Date.now();
    }
  }, [currentQuestion]);

  async function handleAnswer(key: string) {
    if (myAnswer || !currentQuestion) return;
    const elapsed = Date.now() - questionStart.current;
    await submitAnswer(key, elapsed);
  }

  const myRank = myPlayer ? players.findIndex(p => p.id === myPlayer.id) + 1 : 0;

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="mx-auto max-w-md px-4 py-8">

        {/* LOBBY */}
        {phase === 'lobby' && (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="text-5xl">⏳</motion.div>
            <h1 className="font-display text-2xl tracking-wider">Waiting for host…</h1>
            {myPlayer && (
              <div className="rounded-xl border border-[hsl(145_70%_45%/0.4)] bg-[hsl(145_70%_45%/0.1)] px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-[hsl(145_70%_55%)]">Joined as</p>
                <p className="font-display text-lg">{myPlayer.nickname}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{players.length} player{players.length !== 1 && 's'} in lobby</p>
          </div>
        )}

        {/* QUESTION */}
        {phase === 'question' && currentQuestion && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Q{qIdx + 1}/{totalQ}</span>
              <div className={`flex items-center gap-1 font-display text-2xl tabular-nums ${timeLeft <= 5 ? 'text-destructive animate-pulse' : ''}`}>
                <Clock className="h-4 w-4" /> {timeLeft}
              </div>
            </div>
            <motion.div key={currentQuestion.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card p-6 text-center">
              <h2 className="font-display text-lg">{currentQuestion.question_text}</h2>
            </motion.div>
            {myAnswer ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
                <div className="text-5xl mb-2">✋</div>
                <p className="font-display text-lg">Locked in: {myAnswer}</p>
                <p className="text-xs text-muted-foreground mt-1">Wait for reveal…</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map(k => (
                  <motion.button key={k} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}
                    onClick={() => handleAnswer(k)}
                    className={`${OPTION_COLORS[k]} rounded-xl p-4 text-white font-semibold text-left text-sm transition-transform`}>
                    <span className="font-display mr-2 text-base">{k}.</span>
                    {(currentQuestion.options as Record<string, string>)[k]}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVEAL */}
        {phase === 'reveal' && currentQuestion && (
          <AnimatePresence mode="wait">
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`flex flex-col items-center gap-6 py-12 text-center rounded-2xl ${
                myAnswer === currentQuestion.correct_answer
                  ? 'bg-[hsl(145_70%_45%/0.15)]' : 'bg-destructive/10'
              }`}>
              {myAnswer === currentQuestion.correct_answer ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 className="h-16 w-16 text-[hsl(145_70%_45%)]" /></motion.div>
                  <h2 className="font-display text-2xl tracking-wider text-[hsl(145_70%_55%)]">Correct!</h2>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><X className="h-16 w-16 text-destructive" /></motion.div>
                  <h2 className="font-display text-2xl tracking-wider text-destructive">{myAnswer ? 'Wrong' : 'Time up'}</h2>
                  <p className="text-sm text-muted-foreground px-4">
                    Answer: <strong>{currentQuestion.correct_answer}</strong> · {(currentQuestion.options as Record<string, string>)[currentQuestion.correct_answer]}
                  </p>
                </>
              )}
              {myPlayer && <p className="text-sm text-muted-foreground">Score: <span className="font-display text-lg text-foreground">{myPlayer.score}</span></p>}
            </motion.div>
          </AnimatePresence>
        )}

        {/* LEADERBOARD */}
        {phase === 'leaderboard' && (
          <div className="space-y-4 py-8">
            <h2 className="text-center font-display text-xl tracking-wider">Standings</h2>
            <div className="space-y-2">
              {players.slice(0, 10).map((p, i) => (
                <motion.div key={p.id} layout
                  className={`flex items-center gap-3 rounded-xl p-3 ${p.id === myPlayer?.id ? 'border-2 border-primary bg-primary/10' : 'bg-card border border-border'}`}>
                  <span className="w-6 text-center font-display text-xs">#{i + 1}</span>
                  <span className="flex-1 text-sm truncate">{p.nickname}</span>
                  <span className="font-display text-sm tabular-nums">{p.score}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* FINISHED */}
        {phase === 'finished' && session && (
          <PlayerFinished
            sessionId={session.id}
            players={players}
            myPlayer={myPlayer}
            myRank={myRank}
            attachWallet={attachWallet}
          />
        )}
      </div>
    </div>
  );
}

function PlayerFinished({ sessionId, players, myPlayer, myRank, attachWallet }: {
  sessionId: string;
  players: { id: string; nickname: string; score: number; wallet_address: string | null; user_id: string | null }[];
  myPlayer: { id: string; nickname: string; score: number; wallet_address: string | null } | null;
  myRank: number;
  attachWallet: (wallet: string) => Promise<void>;
}) {
  const winner = players[0];
  const isWinner = !!myPlayer && !!winner && myPlayer.id === winner.id;
  const [connecting, setConnecting] = useState(false);
  const [tx, setTx] = useState<string | null>(null);

  // Poll for mint result (host triggers the actual mint)
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      const { data } = await supabase.from('arena_results').select('nft_tx_hash').eq('session_id', sessionId).maybeSingle();
      if (!cancelled && data?.nft_tx_hash) setTx(data.nft_tx_hash);
    };
    fetch();
    const iv = setInterval(fetch, 4000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [sessionId]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      await attachWallet(addr);
      toast.success('Wallet linked ✅');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Connect failed'); }
    setConnecting(false);
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      {isWinner && <Confetti />}
      <Trophy className="h-16 w-16 text-primary" />
      <h1 className="font-display text-2xl tracking-wider">Game Over</h1>
      {winner && <p className="text-lg font-display text-primary">🥇 {winner.nickname} — {winner.score} pts</p>}

      {myPlayer && (
        <div className="rounded-xl border border-border bg-card px-6 py-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Your finish</p>
          <p className="font-display text-xl">#{myRank} · {myPlayer.score} pts</p>
        </div>
      )}

      {isWinner && (
        <div className="w-full mt-2 rounded-2xl border border-primary/40 bg-primary/5 p-5 space-y-3">
          <p className="text-xs uppercase tracking-widest text-primary">Champion Reward</p>
          {tx ? (
            <>
              <p className="font-display">NFT Minted ✅</p>
              <a href={`https://testnet.snowtrace.io/tx/${tx}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View on Snowtrace <ExternalLink className="h-3 w-3" />
              </a>
            </>
          ) : isValidAddress(myPlayer?.wallet_address) ? (
            <>
              <p className="text-sm text-muted-foreground">Wallet linked ✅ · Host will mint your NFT shortly.</p>
              <p className="font-mono text-xs text-foreground/70">{myPlayer!.wallet_address!.slice(0,6)}…{myPlayer!.wallet_address!.slice(-4)}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Connect your wallet to claim your NFT badge on Avalanche Fuji.</p>
              <Button onClick={handleConnect} disabled={connecting} size="lg" className="w-full gap-2 font-display tracking-wider">
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                {connecting ? 'Connecting…' : 'Connect Wallet to Claim NFT'}
              </Button>
            </>
          )}
        </div>
      )}

      {!isWinner && myPlayer && !myPlayer.wallet_address && (
        <p className="text-xs text-muted-foreground max-w-xs">
          Tip: connect a wallet next time to be eligible for on-chain rewards.
        </p>
      )}
    </div>
  );
}
