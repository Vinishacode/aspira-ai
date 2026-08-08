import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, FlaskConical, Activity } from 'lucide-react';
import { useStore } from '@/store';
import { buildPlan, formatINR, getTotalSpent, getTotalBudget } from '@/lib/finance';

interface JourneySceneProps {
  progress?: number; // 0-1 override; defaults to plan progress
  dreamEmoji?: string;
  dreamLabel?: string;
  height?: number;
  showCaption?: boolean;
  variant?: 'full' | 'minimal';
  showRunButton?: boolean;
  showDemoMode?: boolean;
}

export function JourneyScene({
  progress,
  dreamEmoji,
  dreamLabel,
  height = 280,
  showCaption = false,
  variant = 'full',
  showRunButton = false,
  showDemoMode = false,
}: JourneySceneProps) {
  const { profile, categories, monthlyContribution, addSavings } = useStore();
  const plan = profile ? buildPlan(profile, getTotalSpent(categories), monthlyContribution, getTotalBudget(categories)) : null;
  const realProgress = progress ?? plan?.goalProgress ?? 0;

  // ── Demo / Real mode ──
  const [mode, setMode] = useState<'real' | 'demo'>('real');
  const [demoProgress, setDemoProgress] = useState<number | null>(null);

  const isDemo = mode === 'demo' && demoProgress !== null;
  const effectiveProgress = isDemo ? demoProgress! : realProgress;

  const [displayProgress, setDisplayProgress] = useState(effectiveProgress);
  const [running, setRunning] = useState(false);

  useEffect(() => { setDisplayProgress(effectiveProgress); }, [effectiveProgress]);

  const emoji = dreamEmoji ?? dreamEmojiFor(profile?.dreamGoal);
  const label = dreamLabel ?? profile?.dreamGoal ?? 'Your Dream';
  const isComplete = effectiveProgress >= 1;

  // When the boy runs, animate progress forward then add real savings
  const handleRun = () => {
    if (running || isComplete || !profile || isDemo) return;
    setRunning(true);
    const stepAmount = Math.max(100, Math.round(profile.goalCost * 0.05));
    const targetProgress = Math.min(1, realProgress + 0.05);
    setDisplayProgress(targetProgress);
    setTimeout(() => {
      addSavings(stepAmount);
      setRunning(false);
    }, 1200);
  };

  const handleDemoSelect = (pct: number) => {
    if (running) return;
    setDemoProgress(pct);
  };

  const p = isComplete ? 1 : displayProgress;

  // Path is a gentle S-curve from bottom-left to upper-right
  const W = 100, H = 100;
  const path = `M 8 88 C 30 78, 28 60, 50 55 C 72 50, 70 30, 92 14`;
  const charPos = pointOnPath(p);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl" style={{ height }}>
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-800 via-ink-900 to-[#06121a]" />
      {/* Stars */}
      {variant === 'full' && [...Array(24)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-0.5 w-0.5 rounded-full bg-white/70"
          style={{ left: `${(i * 37) % 100}%`, top: `${(i * 13) % 55}%` }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      {/* Moon glow */}
      <div className="absolute right-8 top-6 h-16 w-16 rounded-full bg-accent-400/30 blur-2xl animate-glow" />

      <svg viewBox={`${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="pathGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset={`${p * 100}%`} stopColor="#34d399" stopOpacity="0.9" />
            <stop offset={`${Math.min(100, p * 100 + 2)}%`} stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>
          <radialGradient id="dreamGlow" cx="0.5" cy="0.5">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Hills */}
        <path d="M 0 95 Q 25 82 50 92 T 100 90 L 100 100 L 0 100 Z" fill="#0a2a22" opacity="0.7" />
        <path d="M 0 98 Q 30 88 60 95 T 100 94 L 100 100 L 0 100 Z" fill="#0d3329" opacity="0.5" />

        {/* Path track */}
        <path d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.4" strokeLinecap="round" />
        {/* Path progress */}
        <motion.path
          d={path}
          fill="none"
          stroke="url(#pathGrad)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="200"
          initial={{ strokeDashoffset: 200 }}
          animate={{ strokeDashoffset: 200 - (p * 200) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Dream glow at end */}
        <circle cx="92" cy="14" r="14" fill="url(#dreamGlow)" />

        {/* Milestone dots */}
        {[0.25, 0.5, 0.75].map((m) => (
          <circle
            key={m}
            cx={pointOnPath(m).x} cy={pointOnPath(m).y}
            r="1.1" fill={p >= m ? '#fbbf24' : 'rgba(255,255,255,0.25)'}
          />
        ))}
      </svg>

      {/* Dream flag (top right) */}
      <motion.div
        className="absolute"
        style={{ right: '4%', top: '6%' }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="flex flex-col items-center">
          <div className="text-3xl drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">{emoji}</div>
          {variant === 'full' && (
            <div className="mt-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur">
              {label}
            </div>
          )}
        </div>
      </motion.div>

      {/* Character */}
      <motion.div
        className="absolute z-10"
        style={{ left: `${charPos.x}%`, top: `${charPos.y}%`, transform: 'translate(-50%, -50%)' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          left: `${charPos.x}%`,
          top: `${charPos.y}%`,
        }}
        transition={{
          scale: { duration: 0.5 },
          opacity: { duration: 0.5 },
          left: { duration: running ? 1.1 : 1.4, ease: running ? 'easeIn' : [0.22, 1, 0.36, 1] },
          top: { duration: running ? 1.1 : 1.4, ease: running ? 'easeIn' : [0.22, 1, 0.36, 1] },
        }}
      >
        <CharacterWalking running={running} />
      </motion.div>

      {showCaption && plan && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
          {isDemo ? `Demo: ${Math.round(p * 100)}%` : `${Math.round(p * 100)}% to ${label}`} · {formatINR(plan.remainingToSave)} to go
        </div>
      )}

      {/* Mode toggle: Real vs Demo */}
      {showDemoMode && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
          <button
            onClick={() => { setMode('real'); setDemoProgress(null); }}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
              mode === 'real' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Activity className="h-3 w-3" />
            Real
          </button>
          <button
            onClick={() => { setMode('demo'); if (demoProgress === null) setDemoProgress(0); }}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
              mode === 'demo' ? 'bg-accent-500 text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <FlaskConical className="h-3 w-3" />
            Demo
          </button>
        </div>
      )}

      {/* Demo progress controls */}
      <AnimatePresence>
        {isDemo && mode === 'demo' && (
          <motion.div
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/40 p-1.5 backdrop-blur"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                onClick={() => handleDemoSelect(pct)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                  demoProgress === pct
                    ? 'bg-accent-500 text-white'
                    : 'text-white/50 hover:bg-white/10 hover:text-white/80'
                }`}
              >
                {Math.round(pct * 100)}%
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run to Dream button (only in Real mode) */}
      {showRunButton && !isComplete && !isDemo && (
        <motion.button
          onClick={handleRun}
          disabled={running}
          className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap className={`h-3.5 w-3.5 ${running ? 'animate-pulse' : ''}`} />
          {running ? 'Running…' : 'Run to Dream'}
        </motion.button>
      )}

      {/* Demo mode hint */}
      {isDemo && (
        <div className="absolute bottom-3 right-3 z-20 rounded-full bg-black/40 px-3 py-1.5 text-[10px] font-medium text-accent-300 backdrop-blur">
          Demo preview — no real savings changed
        </div>
      )}

      {/* Celebration when goal is complete */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {/* Confetti particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-sm"
                style={{ background: ['#fbbf24', '#34d399', '#38bdf8', '#f472b6'][i % 4] }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.cos((i / 20) * Math.PI * 2)) * (80 + (i % 3) * 20),
                  y: (Math.sin((i / 20) * Math.PI * 2)) * (80 + (i % 3) * 20) - 20,
                  opacity: [1, 1, 0],
                  scale: [0, 1, 0.5],
                  rotate: (i % 2 === 0 ? 360 : -360),
                }}
                transition={{ duration: 2.5, delay: i * 0.05, ease: 'easeOut', repeat: Infinity, repeatDelay: 1 }}
              />
            ))}
            {/* Success badge */}
            <motion.div
              className="z-10 flex flex-col items-center rounded-2xl bg-black/50 px-6 py-4 backdrop-blur-md"
              initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.3 }}
            >
              <div className="text-4xl">🎉</div>
              <p className="mt-2 text-sm font-bold font-display text-accent-300">Goal Achieved!</p>
              <p className="text-xs text-white/60">{isDemo ? 'Demo complete!' : `You reached ${label}!`}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function dreamEmojiFor(goal?: string): string {
  const map: Record<string, string> = {
    Bike: '🏍️', House: '🏠', Laptop: '💻', Car: '🚗', Vacation: '✈️',
    'Higher Studies': '🎓', Wedding: '💍', Business: '🏪',
  };
  if (!goal) return '🏁';
  return map[goal] ?? '🏁';
}

// Approximate point along the S-curve path at param t in [0,1]
function pointOnPath(t: number): { x: number; y: number } {
  const P0 = [8, 88], P1 = [30, 70], P2 = [70, 30], P3 = [92, 14];
  const u = 1 - t;
  const x = u*u*u*P0[0] + 3*u*u*t*P1[0] + 3*u*t*t*P2[0] + t*t*t*P3[0];
  const y = u*u*u*P0[1] + 3*u*u*t*P1[1] + 3*u*t*t*P2[1] + t*t*t*P3[1];
  return { x, y };
}

function CharacterWalking({ running = false }: { running?: boolean }) {
  return (
    <div className="relative h-10 w-7">
      {/* head */}
      <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-amber-200" />
      {/* body */}
      <div className="absolute left-1/2 top-3 h-4 w-3.5 -translate-x-1/2 rounded-md bg-primary-500" />
      {/* legs (animated) */}
      <motion.div
        className="absolute left-1/2 top-7 h-2.5 w-1 -translate-x-1/2 origin-top rounded-full bg-ink-700"
        animate={{ rotate: running ? [45, -45, 45] : [20, -20, 20] }}
        transition={{ duration: running ? 0.25 : 0.6, repeat: Infinity }}
      />
      <motion.div
        className="absolute left-[60%] top-7 h-2.5 w-1 origin-top rounded-full bg-ink-700"
        animate={{ rotate: running ? [-45, 45, -45] : [-20, 20, -20] }}
        transition={{ duration: running ? 0.25 : 0.6, repeat: Infinity }}
      />
      {/* speed lines when running */}
      {running && (
        <motion.div
          className="absolute -left-3 top-4 h-0.5 w-3 rounded-full bg-accent-400"
          animate={{ opacity: [0, 1, 0], x: [-2, -8] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}
    </div>
  );
}
