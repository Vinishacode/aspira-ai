import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/finance';

interface SavingsProtectionDialogProps {
  open: boolean;
  amount: number;
  delayDays: number;
  dreamGoal: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SavingsProtectionDialog({
  open, amount, delayDays, dreamGoal, onCancel, onConfirm,
}: SavingsProtectionDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-accent-400/20 bg-ink-800 sm:rounded-3xl"
          >
            {/* Emotional gradient backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-rose-500/8 to-primary-500/10" />
            <div className="relative p-6">
              <button
                onClick={onCancel}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Lock icon */}
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/15"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              >
                <Lock className="h-8 w-8 text-accent-400" />
              </motion.div>

              <h3 className="mt-5 text-xl font-bold font-display text-white">
                This money represents your dream
              </h3>

              <div className="mt-4 space-y-3">
                <p className="text-sm leading-relaxed text-white/80">
                  Using <span className="font-bold text-accent-400">{formatINR(amount)}</span> today
                  will delay your <span className="font-semibold text-primary-300">{dreamGoal}</span> by
                  approximately <span className="font-bold text-rose-400">{delayDays} days</span>.
                </p>

                <div className="flex items-start gap-2.5 rounded-2xl bg-white/5 p-4">
                  <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <p className="text-xs leading-relaxed text-white/70">
                    Every rupee saved brings your dream closer. Every rupee spent pushes it further away.
                    Think about what matters most today.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <p className="text-xs text-white/70">
                    Your estimated completion date will move forward by {delayDays} days.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <Button variant="primary" fullWidth size="lg" onClick={onCancel}>
                  Keep Saving
                </Button>
                <Button variant="danger" fullWidth size="lg" onClick={onConfirm}>
                  Use Savings Anyway
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
