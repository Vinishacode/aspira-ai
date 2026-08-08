import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, PiggyBank, Target, Calendar, TrendingUp, MapPin, Sparkles, ArrowDownRight, ArrowUpRight, TrendingDown, Lightbulb } from 'lucide-react';
import { useStore } from '@/store';
import { Card, StatCard } from '@/components/ui/Card';
import { CircularProgress, LinearProgress } from '@/components/ui/Progress';
import { JourneyScene } from '@/components/JourneyScene';
import { AgenticWorkflow } from '@/components/AgenticWorkflow';
import { buildPlan, formatINR, completionLabel, monthLabel, getTotalSpent, transactionsByDay, getMonthlyIncome } from '@/lib/finance';
import { generateRecommendations, getLocationTips, buildWorkflow } from '@/lib/ai';
import { fadeIn, stagger } from '@/lib/motion';

export function DashboardScreen() {
  const { profile, categories, transactions, monthlyContribution, setMonthlyContribution } = useStore();

  const totalBudget = categories.reduce((s, c) => s + c.budget, 0);
  const totalSpent = getTotalSpent(categories);
  const plan = useMemo(() => profile ? buildPlan(profile, totalSpent, monthlyContribution, totalBudget) : null, [profile, totalSpent, monthlyContribution, totalBudget]);
  const recommendations = useMemo(() => profile ? generateRecommendations(profile, categories, transactions) : [], [profile, categories, transactions]);
  const locationTips = useMemo(() => profile ? getLocationTips(profile) : [], [profile]);

  if (!profile || !plan) return null;

  const savingThisMonth = monthlyContribution;

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      {/* Greeting */}
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/50">Welcome back,</p>
          <h1 className="text-2xl font-extrabold font-display">{profile.name} 👋</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs text-white/70">
          <MapPin className="h-3.5 w-3.5 text-primary-300" />{profile.city}
        </div>
      </motion.div>

      {/* Journey hero */}
      <motion.div variants={fadeIn}>
        <Card className="!p-0 overflow-hidden">
          <JourneyScene height={260} showCaption showRunButton showDemoMode />
        </Card>
      </motion.div>

      {/* Goal progress ring + dream */}
      <motion.div variants={fadeIn}>
        <Card className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <CircularProgress value={plan.goalProgress} size={150} stroke={12}>
            <span className="text-3xl font-extrabold font-display">{Math.round(plan.goalProgress * 100)}%</span>
            <span className="text-xs text-white/50">to your dream</span>
          </CircularProgress>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-300">Your Dream</p>
            <h2 className="mt-1 text-2xl font-bold font-display">{profile.dreamGoal}</h2>
            <p className="mt-1 text-sm text-white/60">{formatINR(profile.goalCost)} goal · {formatINR(profile.currentSavings + savingThisMonth)} saved</p>
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs text-white/50">
                  <span>Progress</span><span>{formatINR(plan.remainingToSave)} left</span>
                </div>
                <LinearProgress value={plan.goalProgress} />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Monthly Income" value={formatINR(plan.monthlyIncome)} icon={<Wallet className="h-5 w-5" />} accent="#34d399" />
        <StatCard label="Current Savings" value={formatINR(profile.currentSavings + savingThisMonth)} icon={<PiggyBank className="h-5 w-5" />} accent="#fbbf24" />
        <StatCard label="Available Money" value={formatINR(plan.availableMoney)} sub={`of ${formatINR(plan.monthlyIncome)} income`} icon={<TrendingUp className="h-5 w-5" />} accent={plan.availableMoney >= 0 ? '#38bdf8' : '#f43f5e'} />
        <StatCard label="Save / Month" value={formatINR(plan.requiredMonthlySaving)} icon={<Target className="h-5 w-5" />} accent="#a78bfa" />
      </motion.div>

      {/* Goal details + saving slider */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-bold font-display">Dream Timeline</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Detail label="Target Date" value={`${monthLabel(profile.targetMonth - 1)} ${profile.targetYear}`} icon={<Calendar className="h-4 w-4" />} />
            <Detail label="Days Remaining" value={`${plan.daysRemaining} days`} />
            <Detail label="Est. Completion" value={completionLabel(plan.estimatedCompletion)} />
            <Detail label="Months to Goal" value={plan.monthsToGoal == null ? '—' : `${plan.monthsToGoal} mo`} />
          </div>
          <div className="mt-5 rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/70">How much can you save this month?</p>
              <p className="text-lg font-bold text-accent-400">{formatINR(savingThisMonth)}</p>
            </div>
            <input type="range" min={0} max={Math.max(plan.monthlyIncome, 1000)} step={100}
              value={savingThisMonth}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="mt-3 w-full accent-primary-500" />
            <div className="mt-1 flex justify-between text-[10px] text-white/40">
              <span>₹0</span><span>{formatINR(Math.max(plan.monthlyIncome, 1000))}</span>
            </div>
          </div>
        </Card>

        {/* Budget breakdown */}
        <Card>
          <h3 className="mb-4 font-bold font-display">Budget Breakdown</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-white/40">No categories set. Add some in Expenses.</p>
          ) : (
            <div className="space-y-3">
              {categories.slice(0, 5).map((c) => {
                const pct = c.budget > 0 ? c.spent / c.budget : 0;
                return (
                  <div key={c.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-white/70">
                        <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}
                      </span>
                      <span className="text-white/50">{formatINR(c.spent)} / {formatINR(c.budget)}</span>
                    </div>
                    <LinearProgress value={pct} color={c.color} />
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
            <span className="text-white/60">Total spent</span>
            <span className="font-bold text-white">{formatINR(totalSpent)}</span>
          </div>
        </Card>
      </motion.div>

      {/* Agentic AI Workflow banner */}
      <motion.div variants={fadeIn}>
        <AgenticWorkflow steps={buildWorkflow(profile, categories, monthlyContribution)} />
      </motion.div>

      {/* Income vs Expense Analytics */}
      <motion.div variants={fadeIn}>
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-300" />
            <h3 className="font-bold font-display">Income vs Expense Analytics</h3>
          </div>
          <IncomeExpenseChart income={plan.monthlyIncome} expense={totalSpent} />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-primary-500/10 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-white/50"><ArrowUpRight className="h-3 w-3 text-primary-400" />Income</div>
              <p className="mt-1 text-sm font-bold text-primary-400">{formatINR(plan.monthlyIncome)}</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-white/50"><ArrowDownRight className="h-3 w-3 text-rose-400" />Expense</div>
              <p className="mt-1 text-sm font-bold text-rose-400">{formatINR(totalSpent)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${plan.availableMoney >= 0 ? 'bg-accent-400/10' : 'bg-rose-500/10'}`}>
              <div className="text-xs text-white/50">Net Balance</div>
              <p className={`mt-1 text-sm font-bold ${plan.availableMoney >= 0 ? 'text-accent-400' : 'text-rose-400'}`}>{formatINR(plan.availableMoney)}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Smart Recommendations preview + Location tips */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent-400" />
            <h3 className="font-bold font-display">Smart Recommendations</h3>
          </div>
          {recommendations.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">Log expenses to unlock tips.</p>
          ) : (
            <div className="space-y-2.5">
              {recommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} className="flex items-start gap-2.5 rounded-xl bg-white/5 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-400/15 text-accent-400">
                    <TrendingDown className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">{rec.title}</p>
                    <p className="mt-0.5 text-[11px] text-white/50">Save {formatINR(rec.potentialSaving)}/mo</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-300" />
            <h3 className="font-bold font-display">Savings in {profile.city}</h3>
          </div>
          <div className="space-y-2.5">
            {locationTips.slice(0, 3).map((tip) => (
              <div key={tip.id} className="flex items-start gap-2.5 rounded-xl bg-white/5 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-300">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{tip.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/50">+{formatINR(tip.potentialSaving)}/mo</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={fadeIn}>
        <Card>
          <h3 className="mb-4 font-bold font-display">Recent Activity</h3>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Sparkles className="h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">No transactions yet. Add one in Expenses.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {t.type === 'expense' ? '💸' : t.type === 'saving' ? '🐷' : '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">{t.categoryName}</p>
                    <p className="text-xs text-white/40">{t.note || '—'} · {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                  <p className={`text-sm font-bold ${t.type === 'expense' ? 'text-rose-400' : 'text-primary-400'}`}>
                    {t.type === 'expense' ? '-' : '+'}{formatINR(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="flex items-center gap-1.5 text-xs text-white/45">{icon}{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function IncomeExpenseChart({ income, expense }: { income: number; expense: number }) {
  const max = Math.max(income, expense, 1);
  const incomePct = (income / max) * 100;
  const expensePct = (expense / max) * 100;
  return (
    <div className="flex items-end justify-center gap-6 sm:gap-10 h-36">
      {/* Income bar */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold text-primary-400">{formatINR(income)}</span>
        <div className="relative w-16 sm:w-20 rounded-xl bg-white/5 overflow-hidden" style={{ height: '100px' }}>
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-xl bg-gradient-to-t from-primary-600 to-primary-400"
            initial={{ height: 0 }}
            animate={{ height: `${incomePct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span className="text-[10px] text-white/50">Income</span>
      </div>
      {/* Expense bar */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold text-rose-400">{formatINR(expense)}</span>
        <div className="relative w-16 sm:w-20 rounded-xl bg-white/5 overflow-hidden" style={{ height: '100px' }}>
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-xl bg-gradient-to-t from-rose-600 to-rose-400"
            initial={{ height: 0 }}
            animate={{ height: `${expensePct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          />
        </div>
        <span className="text-[10px] text-white/50">Expenses</span>
      </div>
    </div>
  );
}
