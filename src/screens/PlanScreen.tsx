import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, TrendingUp, Scale, Sparkles, Check } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { buildPlan, formatINR, completionLabel } from '@/lib/finance';
import { fadeIn, stagger } from '@/lib/motion';

export function PlanScreen({ onContinue }: { onContinue: () => void }) {
  const { profile, completeOnboarding } = useStore();
  // default plan: assume zero budgets initially (user hasn't set categories yet)
  const plan = useMemo(() => profile ? buildPlan(profile, 0, 0) : null, [profile]);

  if (!profile || !plan) return null;

  const handle = () => { completeOnboarding(); onContinue(); };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-ink-900 to-ink-800 px-5 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.18),transparent_55%)]" />
      <motion.div className="relative mx-auto max-w-2xl" initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeIn} className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-semibold text-primary-300">
            <Sparkles className="h-3.5 w-3.5" /> Aira's Financial Plan
          </div>
          <h1 className="mt-4 text-3xl font-extrabold font-display">
            Here's your roadmap, {profile.name}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Based on your income and your dream of a {profile.dreamGoal}.
          </p>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-8">
          <PlanCard plan={plan} dream={profile.dreamGoal} />
        </motion.div>

        {/* Key numbers */}
        <motion.div variants={fadeIn} className="mt-5 grid grid-cols-2 gap-3">
          <MiniStat label="Monthly Income" value={formatINR(plan.monthlyIncome)} />
          <MiniStat label="Recommended Saving" value={formatINR(plan.requiredMonthlySaving)} accent />
          <MiniStat label="Goal Cost" value={formatINR(profile.goalCost)} />
          <MiniStat label="Est. Completion" value={completionLabel(plan.estimatedCompletion)} />
        </motion.div>

        <motion.div variants={fadeIn} className="mt-8">
          <Button size="lg" fullWidth rightIcon={<ArrowRight className="h-5 w-5" />} onClick={handle}>
            Set Up My Budget
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function PlanCard({ plan, dream }: { plan: ReturnType<typeof buildPlan>; dream: string }) {
  if (plan.status === 'surplus') {
    return (
      <Card className="relative overflow-hidden border-primary-400/30">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/20 text-primary-300">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-300">You're on track</p>
              <h2 className="text-xl font-bold font-display">Great news!</h2>
            </div>
          </div>
          <p className="mt-4 text-lg leading-relaxed text-white/90">
            You need to save <span className="font-bold text-accent-400">{formatINR(plan.requiredMonthlySaving)}</span> every month
            to achieve your <span className="font-semibold text-primary-300">{dream}</span>.
          </p>
          <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/70">
            <p className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
              If you save more than the recommended amount, you can achieve your dream earlier.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (plan.status === 'break_even') {
    return (
      <Card className="relative overflow-hidden border-accent-400/30">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/20 text-accent-400">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-400">Break-even</p>
              <h2 className="text-xl font-bold font-display">Spending it all</h2>
            </div>
          </div>
          <p className="mt-4 text-lg leading-relaxed text-white/90">
            You are currently spending your entire income. You won't be able to save this month.
          </p>
          <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/70">
            Try reducing unnecessary expenses so you can start saving toward your {dream}.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-error-500/30">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-error-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-500/20 text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Overspending</p>
            <h2 className="text-xl font-bold font-display">Expenses exceed income</h2>
          </div>
        </div>
        <p className="mt-4 text-lg leading-relaxed text-white/90">
          Your planned expenses are higher than your income. You're <span className="font-bold text-rose-400">{formatINR(-plan.availableMoney)}</span> over budget.
        </p>
        <div className="mt-4 space-y-3 rounded-2xl bg-white/5 p-4 text-sm text-white/70">
          <p>Aira suggests:</p>
          <ul className="space-y-2">
            {['Cut down on non-essential spending first', 'Review subscriptions and recurring bills', 'Set a stricter monthly budget'].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />{s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="!p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
      <p className={`mt-1 text-lg font-bold font-display ${accent ? 'text-accent-400' : 'text-white'}`}>{value}</p>
    </Card>
  );
}
