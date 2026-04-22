import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AppNavbar } from '@/components/avalanche/AppNavbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvalancheGame, AvalancheEvent, dbRowToGame, dbRowToEvent } from '@/lib/avalanche';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/lib/playerContext';
import { ArrowLeft, Sparkles, Trophy, Clock, Zap, RefreshCw, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLAGSHIP_MISSIONS, isFlagship, Question } from '@/lib/missionContent';
import { toast } from 'sonner';

const STEPS_BY_CATEGORY: Record<string, string[]> = {
  Quiz: ['Read the prompt', 'Pick the best answer', 'See the explanation'],
  Trivia: ['Read the question', 'Lock in your guess', 'Check the result'],
  Puzzle: ['Inspect the puzzle', 'Apply your move', 'Confirm the solution'],
  Simulation: ['Set your strategy', 'Run the simulation', 'Review outcomes'],
  'Build Challenge': ['Plan the build', 'Ship the change', 'Validate on Fuji'],
  'Team Challenge': ['Form your team', 'Run the round', 'Compare scores'],
  'Mission Quest': ['Accept the mission', 'Complete the steps', 'Submit proof'],
  'Case Study': ['Study the case', 'Choose your call', 'Compare to reality'],
  'Decision Game': ['Read the scenario', 'Make the call', 'See the consequence'],
  'Leaderboard Challenge': ['Warm up', 'Compete', 'Submit score'],
};

export default function MissionPlayPage() {
  const { gameId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const eventId = params.get('event') || undefined;

  const { user, submitMission } = usePlayer();
  const [game, setGame] = useState<AvalancheGame | null | undefined>(undefined);
  const [event, setEvent] = useState<AvalancheEvent | null>(null);

  useEffect(() => {
    if (!gameId) { setGame(null); return; }
    supabase.from('games').select('*').eq('id', gameId).maybeSingle()
      .then(({ data }) => setGame(data ? dbRowToGame(data) : null));
  }, [gameId]);

  useEffect(() => {
    if (!eventId) return;
    supabase.from('events').select('*').eq('id', eventId).maybeSingle()
      .then(({ data }) => { if (data) setEvent(dbRowToEvent(data)); });
  }, [eventId]);

  const flagship = game && isFlagship(game.id) ? FLAGSHIP_MISSIONS[game.id] : null;
  const genericSteps = useMemo(
    () => game ? (STEPS_BY_CATEGORY[game.category] || ['Step 1', 'Step 2', 'Step 3']) : [],
    [game]
  );

  // Timer
  const totalSeconds = useMemo(() => game ? parseDurationMin(game.duration) * 60 : 60, [game]);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<number>(0);

  // Generic step progression
  const [step, setStep] = useState(0);

  // Flagship state
  const [answers, setAnswers] = useState<Record<number, number | number[] | string[]>>({});
  const [feedback, setFeedback] = useState<Record<number, 'correct' | 'wrong'>>({});

  // End state
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ score: number; perfect: boolean; fast: boolean; xp: number; nft?: boolean; merch?: boolean; token?: boolean } | null>(null);
  const [attempts, setAttempts] = useState(1);

  useEffect(() => {
    if (!game) return;
    setSecondsLeft(totalSeconds);
    setStep(0);
    setAnswers({});
    setFeedback({});
    setDone(false);
    setResult(null);
    setRunning(true);
    startedAtRef.current = Date.now();
  }, [gameId, game, totalSeconds]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(t);
          handleTimeout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  if (game === undefined) {
    return (
      <div className="min-h-screen">
        <AppNavbar />
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">Loading mission…</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen">
        <AppNavbar />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-muted-foreground">Mission not found.</p>
          <Button asChild className="mt-4"><Link to="/library">Back to library</Link></Button>
        </div>
      </div>
    );
  }

  const totalSteps = flagship ? flagship.questions.length : genericSteps.length;
  const progress = Math.min(100, ((step + (done ? 1 : 0)) / totalSteps) * 100);

  function handleTimeout() {
    setRunning(false);
    if (!done) finish(0);
  }

  async function finish(accuracyPct: number) {
    setRunning(false);
    setDone(true);
    setBusy(true);
    const duration = Date.now() - startedAtRef.current;

    if (!user) {
      // not signed in — show local-only feedback, no Cloud write
      setResult({ score: Math.round(accuracyPct * 5), perfect: accuracyPct === 100, fast: duration < (totalSeconds * 1000 * 0.5), xp: game!.xpReward });
      setBusy(false);
      return;
    }

    try {
      const out = await submitMission({
        game: game!,
        accuracyPct,
        durationMs: duration,
        attemptsUsed: attempts,
        eventId,
      });
      setResult({
        score: out.score, perfect: out.perfect, fast: out.fast, xp: game!.xpReward,
        nft: !!out.nft, merch: out.reward?.kind === 'merch', token: out.reward?.kind === 'token',
      });
      if (out.perfect) toast.success('PERFECT RUN · +100');
      else if (out.fast) toast.success('FAST FINISH · +50');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Submit failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function handleRetry() {
    setAttempts(a => a + 1);
    setSecondsLeft(totalSeconds);
    setStep(0);
    setAnswers({});
    setFeedback({});
    setDone(false);
    setResult(null);
    setRunning(true);
    startedAtRef.current = Date.now();
  }

  // Flagship answer handler
  function answerQuestion(q: Question, idx: number, picked: number | number[]) {
    setAnswers(prev => ({ ...prev, [idx]: picked }));
    const correct = isCorrect(q, picked);
    setFeedback(prev => ({ ...prev, [idx]: correct ? 'correct' : 'wrong' }));
    setTimeout(() => {
      if (idx < (flagship?.questions.length ?? 0) - 1) {
        setStep(idx + 1);
      } else {
        // compute accuracy
        const total = flagship!.questions.length;
        const got = flagship!.questions.reduce((acc, qq, i) => acc + (isCorrect(qq, i === idx ? picked : (answers[i] as number | number[])) ? 1 : 0), 0);
        const accuracy = Math.round((got / total) * 100);
        finish(accuracy);
      }
    }, 600);
  }

  function handleGenericNext() {
    if (step < genericSteps.length - 1) setStep(s => s + 1);
    else finish(100); // generic engine: full credit on completion
  }

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 gap-1">
          <Link to={event ? `/events/${event.id}` : '/library'}>
            <ArrowLeft className="h-3 w-3" /> {event ? event.title : 'Library'}
          </Link>
        </Button>

        {/* Top bar: timer + progress */}
        <div className="sticky top-16 z-10 mb-4 rounded-xl border border-border bg-card/95 p-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-display tracking-wider">
              <span className="text-2xl">{game.emoji}</span>
              <span>{game.title}</span>
            </div>
            <div className={`flex items-center gap-1.5 font-display text-lg tracking-wider ${secondsLeft <= 10 ? 'text-primary animate-pulse' : ''}`}>
              <Clock className="h-4 w-4" /> {formatTime(secondsLeft)}
            </div>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Attempt {attempts}{attempts > 1 ? ` · -${(attempts - 1) * 15}% penalty` : ''}</span>
            <span>+{game.xpReward} XP · {game.difficulty}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <AnimatePresence mode="wait">
            {!done ? (
              flagship ? (
                <FlagshipQuestion
                  key={`q-${step}`}
                  q={flagship.questions[step]}
                  idx={step}
                  feedback={feedback[step]}
                  onAnswer={(picked) => answerQuestion(flagship.questions[step], step, picked)}
                />
              ) : (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="rounded-xl border border-border bg-muted/20 p-6">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Step {step + 1} of {genericSteps.length}</div>
                    <h2 className="mt-2 font-display text-xl tracking-wider">{genericSteps[step]}</h2>
                    <p className="mt-3 text-sm text-muted-foreground">{game.description}</p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={handleGenericNext}>{step < genericSteps.length - 1 ? 'Next' : 'Complete mission'}</Button>
                  </div>
                </motion.div>
              )
            ) : (
              <ResultScreen
                game={game}
                result={result}
                busy={busy}
                onRetry={handleRetry}
                onJourney={() => navigate('/journey')}
                onLibrary={() => navigate('/library')}
                signedIn={!!user}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function FlagshipQuestion({ q, idx, feedback, onAnswer }: { q: Question; idx: number; feedback?: 'correct' | 'wrong'; onAnswer: (picked: number | number[]) => void }) {
  const [multi, setMulti] = useState<number[]>([]);

  const lockedColor = (i: number) => {
    if (!feedback) return '';
    if (q.kind === 'mcq' && i === q.answer) return 'border-primary bg-primary/10 text-primary';
    if (q.kind === 'pick-many' && q.correct.includes(i)) return 'border-primary bg-primary/10 text-primary';
    return 'border-destructive/40 bg-destructive/5 text-muted-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Question {idx + 1}</div>
      <h2 className="mt-1 font-display text-xl tracking-wider">{q.prompt}</h2>

      {q.kind === 'mcq' && (
        <div className="mt-4 grid gap-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              disabled={!!feedback}
              onClick={() => onAnswer(i)}
              className={`flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 text-left text-sm transition-colors hover:border-primary/40 disabled:cursor-not-allowed ${feedback ? lockedColor(i) : ''}`}
            >
              <span>{opt}</span>
              {feedback && q.kind === 'mcq' && i === q.answer && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}

      {q.kind === 'pick-many' && (
        <div className="mt-4 grid gap-2">
          {q.options.map((opt, i) => {
            const picked = multi.includes(i);
            return (
              <button
                key={i}
                disabled={!!feedback}
                onClick={() => setMulti(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                  feedback ? lockedColor(i) : picked ? 'border-primary bg-primary/10' : 'border-border bg-muted/20 hover:border-primary/40'
                }`}
              >
                <span>{opt}</span>
                {picked && !feedback && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
          {!feedback && (
            <Button className="mt-2" disabled={multi.length === 0} onClick={() => onAnswer(multi)}>Submit answer</Button>
          )}
        </div>
      )}

      {q.kind === 'order' && (
        <OrderQuestion steps={q.steps} disabled={!!feedback} onSubmit={(picked) => onAnswer(picked.map(s => q.steps.indexOf(s)))} />
      )}

      {feedback && q.explain && (
        <div className={`mt-4 rounded-md border p-3 text-xs ${feedback === 'correct' ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border bg-muted/20 text-muted-foreground'}`}>
          {feedback === 'correct' ? <Check className="mr-1 inline h-3 w-3" /> : <X className="mr-1 inline h-3 w-3" />}
          {q.explain}
        </div>
      )}
    </motion.div>
  );
}

function OrderQuestion({ steps, disabled, onSubmit }: { steps: string[]; disabled: boolean; onSubmit: (ordered: string[]) => void }) {
  const [order, setOrder] = useState<string[]>(() => [...steps].sort(() => Math.random() - 0.5));

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const copy = [...order];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setOrder(copy);
  }

  return (
    <div className="mt-4 space-y-2">
      {order.map((s, i) => (
        <div key={s} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
          <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
          <span className="flex-1">{s}</span>
          <button disabled={disabled || i === 0} onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
          <button disabled={disabled || i === order.length - 1} onClick={() => move(i, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
        </div>
      ))}
      {!disabled && (
        <Button className="mt-2 w-full" onClick={() => onSubmit(order)}>Submit order</Button>
      )}
    </div>
  );
}

function ResultScreen({ game, result, busy, onRetry, onJourney, onLibrary, signedIn }: {
  game: { title: string; learningOutcome: string };
  result: { score: number; perfect: boolean; fast: boolean; xp: number; nft?: boolean; merch?: boolean; token?: boolean } | null;
  busy: boolean;
  onRetry: () => void;
  onJourney: () => void;
  onLibrary: () => void;
  signedIn: boolean;
}) {
  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="text-center"
    >
      <Trophy className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-3 font-display text-2xl tracking-wider">Mission complete</h2>
      <p className="mt-1 text-xs text-muted-foreground">{game.learningOutcome}</p>

      {result && (
        <>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2 font-display text-3xl tracking-wider text-primary">
            {result.score} pts
          </div>
          {(result.perfect || result.fast) && (
            <div className="mt-3 flex justify-center gap-2 text-[10px] uppercase tracking-widest">
              {result.perfect && <span className="rounded-full bg-primary/15 px-2 py-1 text-primary">PERFECT RUN +100</span>}
              {result.fast && <span className="rounded-full bg-secondary/15 px-2 py-1 text-secondary"><Zap className="mr-1 inline h-3 w-3" />FAST FINISH +50</span>}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Earn label="XP" value={`+${result.xp}`} />
            {result.nft && <Earn label="NFT" value="Minted" highlight />}
            {result.merch && <Earn label="Merch" value="Voucher" />}
            {result.token && <Earn label="AVAX" value="0.1" />}
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={onRetry} disabled={busy} className="gap-1">
          <RefreshCw className="h-3 w-3" /> Retry (-15%)
        </Button>
        <Button variant="secondary" onClick={onJourney} disabled={busy}>My journey</Button>
        <Button onClick={onLibrary} disabled={busy}>More missions</Button>
      </div>
      {!signedIn && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          <Link to="/auth" className="text-primary underline">Sign in</Link> to save score, earn XP, and mint badges.
        </p>
      )}
    </motion.div>
  );
}

function Earn({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-2 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-sm ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}

function isCorrect(q: Question, picked: number | number[] | string[] | undefined): boolean {
  if (picked === undefined) return false;
  if (q.kind === 'mcq') return picked === q.answer;
  if (q.kind === 'pick-many') {
    const arr = Array.isArray(picked) ? (picked as number[]) : [];
    return arr.length === q.correct.length && q.correct.every(c => arr.includes(c));
  }
  if (q.kind === 'order') {
    // picked is an array of indexes mapping back to original order
    const arr = Array.isArray(picked) ? (picked as number[]) : [];
    return arr.every((v, i) => v === i);
  }
  return false;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function parseDurationMin(s: string): number {
  const m = /(\d+)\s*min/.exec(s);
  return m ? parseInt(m[1], 10) : 5;
}
