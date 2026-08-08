import { motion } from 'framer-motion';
import { Target, ScanLine, TrendingUp, Sparkles, Check } from 'lucide-react';
import type { WorkflowStep } from '@/lib/ai';
import { cn } from '@/lib/utils';

const ICONS: Record<string, typeof Target> = {
  target: Target,
  scan: ScanLine,
  'trending-up': TrendingUp,
  sparkles: Sparkles,
};

const STATUS_STYLES = {
  complete: { ring: 'border-primary-500/50 bg-primary-500/15', glow: 'shadow-primary-500/20', text: 'text-primary-300' },
  active: { ring: 'border-accent-400/60 bg-accent-400/15', glow: 'shadow-accent-400/30', text: 'text-accent-400' },
  pending: { ring: 'border-white/15 bg-white/5', glow: '', text: 'text-white/40' },
} as const;

export function AgenticWorkflow({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800/80 to-ink-900/80 p-5">
      {/* Decorative grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-500/20">
            <Sparkles className="h-4 w-4 text-primary-300" />
          </div>
          <div>
            <p className="text-sm font-bold font-display text-white">Agentic AI Workflow</p>
            <p className="text-[10px] text-white/40">Aira's 4-step reasoning pipeline</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = ICONS[step.icon] ?? Target;
            const style = STATUS_STYLES[step.status];
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute -right-1.5 top-7 z-0 hidden h-px w-3 bg-gradient-to-r from-white/20 to-transparent lg:block" />
                )}

                <div className={cn(
                  'relative z-10 rounded-xl border p-3.5 transition-all',
                  style.ring,
                  step.status !== 'pending' && `shadow-lg ${style.glow}`,
                )}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      step.status === 'complete' ? 'bg-primary-500/25' : step.status === 'active' ? 'bg-accent-400/25' : 'bg-white/5',
                    )}>
                      {step.status === 'complete'
                        ? <Check className={cn('h-4 w-4', style.text)} />
                        : <Icon className={cn('h-4 w-4', style.text)} />}
                    </div>
                    <span className={cn('text-[10px] font-bold', style.text)}>
                      {step.status === 'complete' ? 'DONE' : step.status === 'active' ? 'LIVE' : 'WAIT'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{step.title}</p>
                  <p className="mt-0.5 text-[10px] text-white/40">{step.subtitle}</p>
                  <p className="mt-2 text-[11px] leading-snug text-white/55">{step.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
