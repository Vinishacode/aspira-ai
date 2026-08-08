import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fadeIn, stagger } from '@/lib/motion';

export function MeetAiraScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden"
      initial="hidden" animate="show" exit="exit"
      variants={stagger}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900 to-ink-800" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.25),transparent_60%)]" />

      <motion.div
        variants={fadeIn}
        className="relative z-10 w-full max-w-md rounded-[2rem] glass p-8 text-center elev-3"
      >
        {/* Aira avatar */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mb-6 h-28 w-28"
        >
          <div className="absolute inset-0 rounded-full bg-primary-400/40 blur-2xl animate-glow" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 shadow-2xl shadow-primary-500/40">
            {/* stylized AI face */}
            <div className="flex gap-2">
              <motion.div className="h-3 w-3 rounded-full bg-white" animate={{ scaleY: [1, 0.3, 1] }} transition={{ duration: 3, repeat: Infinity }} />
              <motion.div className="h-3 w-3 rounded-full bg-white" animate={{ scaleY: [1, 0.3, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.15 }} />
            </div>
          </div>
          {/* orbiting dot */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent-400 shadow-lg shadow-accent-400/50" />
          </motion.div>
        </motion.div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-primary-300">
          <Sparkles className="h-3.5 w-3.5" /> Your AI Financial Companion
        </div>

        <h1 className="mt-4 text-3xl font-extrabold font-display">
          Hi! I'm <span className="shimmer-text">Aira</span>
        </h1>

        <motion.div
          variants={fadeIn}
          className="mt-4 rounded-2xl bg-white/5 p-4 text-left text-[15px] leading-relaxed text-white/85"
        >
          <p>
            I'll help you achieve your dream by managing your money smarter.
            I'll build a personalized savings plan, track your spending, and keep you motivated
            every step of the way.
          </p>
          <p className="mt-3 text-white/60 text-sm">Let's turn your dream into a plan.</p>
        </motion.div>

        <div className="mt-7">
          <Button size="lg" fullWidth rightIcon={<ArrowRight className="h-5 w-5" />} onClick={onContinue}>
            Continue
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
