import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, PieChart as PieIcon, BarChart3, Target, Sparkles, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { useStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { CircularProgress, LinearProgress } from '@/components/ui/Progress';
import {
  buildPlan, formatINR, completionLabel, analyzePlan,
  transactionsByDay, transactionsByMonth, getTotalSpent, getTotalBudget,
} from '@/lib/finance';
import { generateRecommendations } from '@/lib/ai';
import { fadeIn, stagger } from '@/lib/motion';

type Tab = 'weekly' | 'monthly';

export function ReportsScreen() {
  const { profile, categories, transactions, monthlyContribution } = useStore();
  const [tab, setTab] = useState<Tab>('weekly');

  const totalBudget = getTotalBudget(categories);
  const totalSpent = getTotalSpent(categories);
  const plan = useMemo(
    () => profile ? buildPlan(profile, totalSpent, monthlyContribution) : null,
    [profile, totalSpent, monthlyContribution],
  );
  const analysis = useMemo(
    () => profile ? analyzePlan(profile, categories, monthlyContribution) : null,
    [profile, categories, monthlyContribution],
  );

  if (!profile || !plan) return null;

  const expenseTx = transactions.filter((t) => t.type === 'expense');
  const incomeTx = transactions.filter((t) => t.type !== 'expense');
  const savingsRate = plan.monthlyIncome > 0 ? monthlyContribution / plan.monthlyIncome : 0;
  const budgetUsed = totalBudget > 0 ? totalSpent / totalBudget : 0;

  const weeklyData = transactionsByDay(transactions, 7);
  const monthlyData = transactionsByMonth(transactions, 6);
  const chartData = tab === 'weekly' ? weeklyData : monthlyData;

  const totalChartExpense = chartData.reduce((s, d) => s + d.expense, 0);
  const totalChartIncome = chartData.reduce((s, d) => s + d.income, 0);
  const maxChartVal = Math.max(...chartData.map((d) => Math.max(d.expense, d.income)), 1);

  // Pie data by category
  const pieData = categories
    .filter((c) => c.spent > 0)
    .map((c) => ({ name: c.name, value: c.spent, color: c.color }))
    .sort((a, b) => b.value - a.value);
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);
  const maxCatSpent = Math.max(...categories.map((c) => c.spent), 1);

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-extrabold font-display">Reports</h1>
        <p className="text-sm text-white/50">Insights into your financial journey</p>
      </motion.div>

      {/* Tab toggle */}
      <motion.div variants={fadeIn}>
        <div className="inline-flex rounded-2xl bg-white/5 p-1">
          {(['weekly', 'monthly'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold capitalize transition-all ${
                tab === t ? 'bg-primary-500 text-white' : 'text-white/55 hover:text-white'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview rings */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <RingCard label="Goal Progress" value={plan.goalProgress} display={`${Math.round(plan.goalProgress * 100)}%`} />
        <RingCard label="Budget Used" value={budgetUsed} display={`${Math.round(budgetUsed * 100)}%`} color={['#fbbf24', '#f97316']} />
        <RingCard label="Savings Rate" value={savingsRate} display={`${Math.round(savingsRate * 100)}%`} color={['#38bdf8', '#0ea5e9']} />
      </motion.div>

      {/* Line chart */}
      <motion.div variants={fadeIn}>
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-300" />
            <h3 className="font-bold font-display">{tab === 'weekly' ? 'Last 7 Days' : 'Last 6 Months'}</h3>
          </div>
          <LineChart data={chartData} maxVal={maxChartVal} />
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary-400" />Income</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" />Expenses</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-white/45">Total Income</p>
              <p className="mt-1 font-bold text-primary-400">{formatINR(totalChartIncome)}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-white/45">Total Expenses</p>
              <p className="mt-1 font-bold text-rose-400">{formatINR(totalChartExpense)}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Pie + Bar */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Pie chart */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-accent-400" />
            <h3 className="font-bold font-display">Category Distribution</h3>
          </div>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No spending yet.</p>
          ) : (
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <PieChart data={pieData} total={pieTotal} />
              <div className="flex-1 space-y-2 w-full">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="flex-1 truncate text-white/70">{d.name}</span>
                    <span className="font-medium text-white/60">{pieTotal > 0 ? Math.round(d.value / pieTotal * 100) : 0}%</span>
                    <span className="text-xs text-white/40">{formatINR(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Bar chart */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-300" />
            <h3 className="font-bold font-display">Spending by Category</h3>
          </div>
          {categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No categories yet.</p>
          ) : (
            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-white/70">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}
                    </span>
                    <span className="text-white/50">{formatINR(c.spent)}</span>
                  </div>
                  <div className="h-6 rounded-lg bg-white/5 overflow-hidden">
                    <motion.div className="h-full rounded-lg"
                      style={{ background: `linear-gradient(90deg, ${c.color}99, ${c.color})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.spent / maxCatSpent) * 100}%` }}
                      transition={{ duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Summary stats */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Summary label="Total Income" value={formatINR(plan.monthlyIncome)} />
        <Summary label="Total Budgeted" value={formatINR(totalBudget)} />
        <Summary label="Total Spent" value={formatINR(totalSpent)} />
        <Summary label="Saved This Month" value={formatINR(monthlyContribution)} />
      </motion.div>

      {/* Goal progress */}
      <motion.div variants={fadeIn}>
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-accent-400" />
            <h3 className="font-bold font-display">Goal Progress</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-center">
              <CircularProgress value={plan.goalProgress} size={120} stroke={10}>
                <span className="text-2xl font-extrabold font-display">{Math.round(plan.goalProgress * 100)}%</span>
              </CircularProgress>
              <p className="mt-2 text-xs text-white/50">toward {profile.dreamGoal}</p>
            </div>
            <div className="space-y-3">
              <Row label="Goal Amount" value={formatINR(profile.goalCost)} />
              <Row label="Current Savings" value={formatINR(profile.currentSavings)} />
              <Row label="Remaining Goal" value={formatINR(plan.remainingGoal)} accent />
              <Row label="Est. Completion" value={completionLabel(plan.estimatedCompletion)} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Health */}
      <motion.div variants={fadeIn}>
        <Card>
          <h3 className="mb-4 font-bold font-display">Financial Health</h3>
          <div className="space-y-4">
            <HealthRow label="Dream Progress" value={plan.goalProgress} text={`${Math.round(plan.goalProgress * 100)}% toward ${profile.dreamGoal}`} />
            <HealthRow label="Budget Adherence" value={1 - budgetUsed} text={budgetUsed < 1 ? 'Within budget' : 'Over budget'} />
            <HealthRow label="Savings Discipline" value={savingsRate} text={savingsRate >= 0.2 ? 'Excellent savings rate' : savingsRate > 0 ? 'Room to save more' : 'No savings yet'} />
          </div>
        </Card>
      </motion.div>

      {/* AI Recommendations */}
      {analysis && (
        <motion.div variants={fadeIn}>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-300" />
              <h3 className="font-bold font-display">AI Recommendations</h3>
            </div>
            <p className="text-sm leading-relaxed text-white/80">{analysis.message}</p>
            {analysis.suggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-white/50">Top spending to review:</p>
                {analysis.suggestions.map((s) => (
                  <div key={s.categoryName} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <span className="text-sm text-white/75">{s.categoryName}</span>
                    <span className="text-sm font-bold text-white/60">{formatINR(s.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

function RingCard({ label, value, display, color = ['#34d399', '#10b981'] }: { label: string; value: number; display: string; color?: [string, string] }) {
  const id = `ring-${label.replace(/\s/g, '')}`;
  return (
    <Card className="flex flex-col items-center">
      <div className="relative">
        <svg width="110" height="110" className="-rotate-90">
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color[0]} />
              <stop offset="100%" stopColor={color[1]} />
            </linearGradient>
          </defs>
          <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
          <motion.circle cx="55" cy="55" r="45" fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - Math.min(1, value)) }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold font-display">{display}</div>
      </div>
      <p className="mt-2 text-xs font-medium text-white/55">{label}</p>
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="!p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 text-lg font-bold font-display">{value}</p>
    </Card>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5">
      <span className="text-xs text-white/50">{label}</span>
      <span className={`text-sm font-bold ${accent ? 'text-accent-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function HealthRow({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium text-white/75">{label}</span>
        <span className="text-white/50">{text}</span>
      </div>
      <LinearProgress value={Math.max(0, Math.min(1, value))} />
    </div>
  );
}

// Line chart component (SVG)
function LineChart({ data, maxVal }: { data: { label: string; expense: number; income: number }[]; maxVal: number }) {
  const W = 100, H = 100;
  const stepX = data.length > 1 ? W / (data.length - 1) : W;
  const toY = (v: number) => H - (v / maxVal) * (H * 0.8) - 10;

  const incomePoints = data.map((d, i) => `${i * stepX},${toY(d.income)}`).join(' ');
  const expensePoints = data.map((d, i) => `${i * stepX},${toY(d.expense)}`).join(' ');
  const incomeArea = `0,${H} ${incomePoints} ${(data.length - 1) * stepX},${H}`;
  const expenseArea = `0,${H} ${expensePoints} ${(data.length - 1) * stepX},${H}`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full">
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1="0" y1={H * p} x2={W} y2={H * p} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
        ))}
        {/* Income area */}
        <polygon points={incomeArea} fill="url(#incomeGrad)" />
        <polyline points={incomePoints} fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Expense area */}
        <polygon points={expenseArea} fill="url(#expenseGrad)" />
        <polyline points={expensePoints} fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={i * stepX} cy={toY(d.income)} r="1" fill="#10b981" />
            <circle cx={i * stepX} cy={toY(d.expense)} r="1" fill="#f43f5e" />
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-white/40">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// Pie chart component (SVG)
function PieChart({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  const R = 50, CX = 55, CY = 55;
  let cumAngle = -90;
  const segments = data.map((d) => {
    const angle = (d.value / total) * 360;
    const start = cumAngle;
    const end = cumAngle + angle;
    cumAngle = end;
    return { ...d, start, end, angle };
  });

  function arc(startDeg: number, endDeg: number, r: number) {
    const start = polarToCartesian(CX, CY, r, endDeg);
    const end = polarToCartesian(CX, CY, r, startDeg);
    const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
    return `M ${CX} ${CY} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const a = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="shrink-0">
      <circle cx={CX} cy={CY} r={R} fill="rgba(255,255,255,0.04)" />
      {segments.map((s, i) => (
        <motion.path
          key={i}
          d={arc(s.start, s.end, R)}
          fill={s.color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}
      <circle cx={CX} cy={CY} r={R * 0.55} fill="#0d1520" />
      <text x={CX} y={CY} textAnchor="middle" dy="0.35em" className="fill-white text-[8px] font-bold">
        {formatINR(total)}
      </text>
    </svg>
  );
}
