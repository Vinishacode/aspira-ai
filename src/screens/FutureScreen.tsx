import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, TrendingUp, AlertTriangle, Flag, Clock } from 'lucide-react';
import { useStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { JourneyScene } from '@/components/JourneyScene';
import { buildPlan, formatINR, completionLabel, monthLabel, getTotalSpent, getTotalBudget, monthsUntilTarget } from '@/lib/finance';
import { fadeIn, stagger } from '@/lib/motion';

export function FutureScreen() {
  const { profile, categories, monthlyContribution } = useStore();
  const plan = useMemo(
    () => profile ? buildPlan(profile, getTotalSpent(categories), monthlyContribution, getTotalBudget(categories)) : null,
    [profile, categories, monthlyContribution],
  );

  if (!profile || !plan) return null;

  const monthsLeft = monthsUntilTarget(profile);
  const milestones = generateMilestones(profile, plan, monthsLeft);
  const delayed = plan.delayDays > 0;
  const ahead = plan.delayDays < 0;
  const onTrack = plan.delayDays === 0;

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-extrabold font-display">Future Simulation</h1>
        <p className="text-sm text-white/50">Your journey to {profile.dreamGoal}</p>
      </motion.div>

      {/* Journey animation hero */}
      <motion.div variants={fadeIn}>
        <Card className="!p-0 overflow-hidden">
          <JourneyScene height={300} showCaption showRunButton showDemoMode />
        </Card>
      </motion.div>

      {/* AI status banner */}
      <motion.div variants={fadeIn}>
        {plan.availableMoney < 0 ? (
          <StatusBanner
            icon={<AlertTriangle className="h-6 w-6 text-rose-400" />}
            bg="from-rose-500/15 to-rose-500/5"
            border="border-rose-400/30"
            title="Your spending has delayed your dream"
            text={`Your current spending exceeds your income. Your ${profile.dreamGoal} is delayed by approximately ${Math.abs(plan.delayDays)} days.`}
          />
        ) : ahead ? (
          <StatusBanner
            icon={<TrendingUp className="h-6 w-6 text-primary-300" />}
            bg="from-primary-500/15 to-primary-500/5"
            border="border-primary-400/30"
            title="You are ahead of schedule"
            text={`You'll achieve your ${profile.dreamGoal} ${Math.abs(plan.delayDays)} days earlier than planned. Keep going!`}
          />
        ) : onTrack ? (
          <StatusBanner
            icon={<Sparkles className="h-6 w-6 text-accent-400" />}
            bg="from-accent-500/15 to-accent-500/5"
            border="border-accent-400/30"
            title="Right on track"
            text={`You're projected to reach your ${profile.dreamGoal} exactly on your target date.`}
          />
        ) : (
          <StatusBanner
            icon={<Clock className="h-6 w-6 text-orange-400" />}
            bg="from-orange-500/15 to-orange-500/5"
            border="border-orange-400/30"
            title="Slightly behind schedule"
            text={`At your current pace, your ${profile.dreamGoal} will be delayed by about ${plan.delayDays} days. Try saving a bit more.`}
          />
        )}
      </motion.div>

      {/* Key projection stats */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ProjStat label="Months to Goal" value={plan.monthsToGoal == null ? '—' : `${plan.monthsToGoal}`} sub="months" />
        <ProjStat label="Est. Completion" value={completionLabel(plan.estimatedCompletion).split(' ')[0]} sub={completionLabel(plan.estimatedCompletion).split(' ')[1] ?? ''} />
        <ProjStat label="Saving Pace" value={formatINR(plan.projectedSaving || monthlyContribution)} sub="/ month" />
        <ProjStat label="Remaining" value={formatINR(plan.remainingToSave)} sub="to save" />
      </motion.div>

      {/* Timeline */}
      <motion.div variants={fadeIn}>
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-300" />
            <h3 className="font-bold font-display">Your Timeline</h3>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-white/10" />
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Dot */}
                  <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                    m.reached ? 'border-primary-400 bg-primary-500/20' : 'border-white/15 bg-ink-800'
                  }`}>
                    {m.reached ? (
                      <Flag className="h-4 w-4 text-primary-300" />
                    ) : (
                      <span className="text-xs font-bold text-white/40">{i + 1}</span>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <p className={`font-semibold ${m.reached ? 'text-primary-300' : 'text-white/80'}`}>{m.label}</p>
                    <p className="text-xs text-white/45">{m.sublabel}</p>
                    {m.note && <p className="mt-1 text-xs text-white/55">{m.note}</p>}
                    {m.amount && (
                      <p className="mt-1 text-sm font-bold text-accent-400">{formatINR(m.amount)}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Projection comparison */}
      <motion.div variants={fadeIn}>
        <Card>
          <h3 className="mb-4 font-bold font-display">Target vs Projection</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-white/45">Your Target Date</p>
              <p className="mt-1 text-lg font-bold text-white font-display">
                {monthLabel(profile.targetMonth - 1)} {profile.targetYear}
              </p>
              <p className="mt-1 text-xs text-white/40">{plan.daysRemaining} days from now</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-white/45">Projected Completion</p>
              <p className={`mt-1 text-lg font-bold font-display ${delayed ? 'text-rose-400' : ahead ? 'text-primary-300' : 'text-white'}`}>
                {completionLabel(plan.estimatedCompletion)}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {delayed ? `${plan.delayDays} days late` : ahead ? `${Math.abs(plan.delayDays)} days early` : 'on time'}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function StatusBanner({ icon, bg, border, title, text }: {
  icon: React.ReactNode; bg: string; border: string; title: string; text: string;
}) {
  return (
    <div className={`rounded-3xl border ${border} bg-gradient-to-br ${bg} p-5`}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">{icon}</div>
        <div>
          <h3 className="font-bold font-display text-white">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-white/75">{text}</p>
        </div>
      </div>
    </div>
  );
}

function ProjStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="!p-4 text-center">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 text-lg font-bold text-white font-display">{value}</p>
      <p className="text-[10px] text-white/40">{sub}</p>
    </Card>
  );
}

interface Milestone { label: string; sublabel: string; note?: string; amount?: number; reached: boolean; }

function generateMilestones(profile: { dreamGoal: string; goalCost: number; currentSavings: number; targetMonth: number; targetYear: number }, plan: { goalProgress: number; remainingToSave: number; estimatedCompletion: { month: number; year: number } | null; delayDays: number }, monthsLeft: number): Milestone[] {
  const saved = profile.currentSavings;
  const goal = profile.goalCost;
  const progress = plan.goalProgress;

  const today: Milestone = {
    label: 'Today',
    sublabel: `${Math.round(progress * 100)}% saved`,
    note: `You've saved ${formatINR(saved)} of ${formatINR(goal)}`,
    amount: saved,
    reached: true,
  };

  const half: Milestone = {
    label: '50% Milestone',
    sublabel: 'Halfway to your dream',
    note: progress >= 0.5 ? 'Already passed!' : `${formatINR(goal * 0.5 - saved)} more to reach 50%`,
    amount: Math.round(goal * 0.5),
    reached: progress >= 0.5,
  };

  const target: Milestone = {
    label: 'Goal Month',
    sublabel: `${monthLabel(profile.targetMonth - 1)} ${profile.targetYear}`,
    note: `Your target for ${profile.dreamGoal}`,
    amount: goal,
    reached: progress >= 1,
  };

  // If projected earlier than target, add an "early" milestone before target
  if (plan.delayDays < 0 && plan.estimatedCompletion) {
    return [
      today,
      half,
      {
        label: 'Projected Achievement',
        sublabel: completionLabel(plan.estimatedCompletion),
        note: `You'll reach your ${profile.dreamGoal} early!`,
        amount: goal,
        reached: false,
      },
      target,
    ];
  }

  return [today, half, target];
}
