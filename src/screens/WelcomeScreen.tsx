import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DREAM_OPTIONS } from '@/types';

export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-12"
      initial="hidden" animate="show" exit="exit"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } }, exit: { opacity: 0, transition: { duration: 0.3 } } }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900 via-ink-800 to-primary-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(251,191,36,0.18),transparent_55%)]" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        {/* Hero illustration: child looking at dreams */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
          className="relative mb-10 h-44 w-full max-w-2xl"
        >
          {/* dream chips floating */}
          {DREAM_OPTIONS.slice(0, 6).map((d, i) => {
            const pos = [
              { left: '8%', top: '10%' }, { left: '28%', top: '0%' }, { left: '50%', top: '6%' },
              { left: '70%', top: '2%' }, { left: '86%', top: '12%' }, { left: '60%', top: '40%' },
            ][i];
            return (
              <motion.div
                key={d.label}
                className="absolute flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-semibold text-white"
                style={pos}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
              >
                <span className="text-base">{d.emoji}</span>
                {d.label}
              </motion.div>
            );
          })}
          {/* child silhouette */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <div className="relative h-24 w-16">
              <div className="absolute left-1/2 top-2 h-5 w-5 -translate-x-1/2 rounded-full bg-amber-200/90" />
              <div className="absolute left-1/2 top-8 h-9 w-7 -translate-x-1/2 rounded-lg bg-primary-500/80" />
              <div className="absolute left-1/2 top-16 h-6 w-1.5 -translate-x-1/2 rounded-full bg-ink-700" />
            </div>
          </motion.div>
          {/* dashed path toward dreams */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 44" preserveAspectRatio="none">
            <path d="M50 42 Q 60 30 80 8" fill="none" stroke="rgba(251,191,36,0.5)" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold text-primary-300">
          <Sparkles className="h-3.5 w-3.5" /> Your dreams, within reach
        </motion.div>

        <motion.h1
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="mt-6 max-w-2xl text-balance text-4xl font-extrabold leading-tight tracking-tight font-display sm:text-5xl"
        >
          Every small saving brings you closer to your{' '}
          <span className="shimmer-text">dream.</span>
        </motion.h1>

        <motion.p
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="mt-5 max-w-xl text-base text-white/70"
        >
          Aspira AI turns your everyday spending into stepping stones toward what you truly want.
          Save smart, spend mindfully, and watch your dreams get closer — one rupee at a time.
        </motion.p>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="mt-10">
          <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />} onClick={onContinue}>
            Start My Journey
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
