import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  current: number; // 0-indexed
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex items-center w-full gap-1.5">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex-1 flex items-center gap-1.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: done || active ? '#10b981' : 'rgba(255,255,255,0.12)',
                  scale: active ? 1.15 : 1,
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </motion.div>
            </div>
            <div className="h-1 flex-1 rounded-full overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-500"
                initial={{ width: 0 }}
                animate={{ width: done ? '100%' : active ? '50%' : '0%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
