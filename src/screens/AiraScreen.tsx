import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Check, TrendingDown, Scissors, Tv, Utensils, PiggyBank,
  MapPin, Target, Shield, AlertTriangle, TrendingUp, Lightbulb, Activity, Wallet,
  PieChart as PieIcon, BarChart3, ArrowUpRight, ArrowDownRight, Award, Zap,
} from 'lucide-react';
import { useStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { LinearProgress } from '@/components/ui/Progress';
import { AgenticWorkflow } from '@/components/AgenticWorkflow';
import { buildPlan, formatINR, completionLabel, getTotalSpent, getTotalBudget } from '@/lib/finance';
import {
  categorizeExpense, parseExpenseText, generateRecommendations,
  getLocationTips, buildWorkflow, computeAIInsights, generateCoachResponse,
  type SavingRecommendation, type AIInsights,
} from '@/lib/ai';
import { fadeIn, stagger } from '@/lib/motion';
import type { PaymentMethod } from '@/types';

interface Msg {
  role: 'aira' | 'user';
  text: string;
  action?: { type: 'expense_added'; amount: number; category: string } | { type: 'saving_added'; amount: number };
}

const REC_ICONS: Record<string, typeof TrendingDown> = {
  'trending-down': TrendingDown,
  scissors: Scissors,
  tv: Tv,
  utensils: Utensils,
  'piggy-bank': PiggyBank,
};

export function AiraScreen() {
  const { profile, categories, transactions, monthlyContribution, addExpense, addTransaction, spendFromSavings } = useStore();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [view, setView] = useState<'chat' | 'insights'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalSpent = getTotalSpent(categories);
  const totalBudget = getTotalBudget(categories);
  const plan = useMemo(
    () => profile ? buildPlan(profile, totalSpent, monthlyContribution, totalBudget) : null,
    [profile, totalSpent, monthlyContribution, totalBudget],
  );
  const recommendations = useMemo(
    () => profile ? generateRecommendations(profile, categories, transactions) : [],
    [profile, categories, transactions],
  );
  const locationTips = useMemo(() => profile ? getLocationTips(profile) : [], [profile]);
  const workflow = useMemo(
    () => profile ? buildWorkflow(profile, categories, monthlyContribution) : [],
    [profile, categories, monthlyContribution],
  );
  const insights = useMemo(
    () => profile ? computeAIInsights(profile, categories, transactions, monthlyContribution) : null,
    [profile, categories, transactions, monthlyContribution],
  );

  useEffect(() => {
    if (profile && messages.length === 0 && insights) {
      setMessages([{
        role: 'aira',
        text: `Hi ${profile.name}! I'm Aira, your AI Financial Coach. Here's your current snapshot:

• Financial Health: ${insights.financialHealthScore}/100 (${insights.healthLabel})
• Savings Rate: ${Math.round(plan?.savingsPercentage ?? 0)}%
• Goal Progress: ${Math.round((plan?.goalProgress ?? 0) * 100)}% toward your ${profile.dreamGoal}
• Available Balance: ${formatINR(plan?.availableMoney ?? 0)}

I can auto-detect and log expenses, analyze your spending, and give personalized recommendations. Try saying: "I spent ₹250 on pizza" or ask "How much should I save?"`,
      }]);
    }
  }, [profile, insights, plan]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const suggestions = [
    'How much should I save?',
    'Am I on track?',
    'Where can I cut costs?',
    'I spent ₹320 on petrol',
    'Give me my financial overview',
  ];

  const handleExpenseLog = (question: string): Msg | null => {
    if (!profile || !plan) return null;
    const parsed = parseExpenseText(question);
    if (parsed.amount && parsed.amount > 0 && /spent|paid|bought|pay|spend|for|on|₹|rs|cost|charge/i.test(question)) {
      const result = categorizeExpense(parsed.description, categories);
      if (result.categoryId) {
        addExpense({
          expenseName: parsed.description,
          categoryId: result.categoryId,
          categoryName: result.categoryName,
          amount: parsed.amount,
          date: result.date,
          paymentMethod: result.paymentType,
          note: result.merchant ? `${result.merchant} · Added via Aira AI` : 'Added via Aira AI',
        });
        return {
          role: 'aira',
          text: `Logged ${formatINR(parsed.amount)} for "${parsed.description}" under ${result.categoryName} (${Math.round(result.confidence * 100)}% confidence${result.merchant ? `, merchant: ${result.merchant}` : ''}).

After this expense: You've spent ${formatINR(totalSpent + parsed.amount)} this month (${Math.round(((totalSpent + parsed.amount) / plan.monthlyIncome) * 100)}% of income). ${plan.availableMoney - parsed.amount > 0 ? `You still have ${formatINR(plan.availableMoney - parsed.amount)} available.` : `You're now over budget by ${formatINR(parsed.amount - plan.availableMoney)}.`}`,
          action: { type: 'expense_added', amount: parsed.amount, category: result.categoryName },
        };
      }
    }
    return null;
  };

  const handleSavingLog = (question: string): Msg | null => {
    if (!profile || !plan) return null;
    const parsed = parseExpenseText(question);
    if (/saved|saving|deposited|set aside/i.test(question.toLowerCase()) && parsed.amount && parsed.amount > 0) {
      return {
        role: 'aira',
        text: `Great job saving ${formatINR(parsed.amount)}! Your total savings are now ${formatINR(profile.currentSavings + parsed.amount)} (${Math.round(((profile.currentSavings + parsed.amount) / profile.goalCost) * 100)}% of your ${profile.dreamGoal} goal). At this pace, you'll reach your goal in ${plan.monthsToGoal ?? '—'} months.`,
        action: { type: 'saving_added', amount: parsed.amount },
      };
    }
    return null;
  };

  const respond = (q: string): Msg => {
    if (!profile || !plan || !insights) return { role: 'aira', text: "Let's set up your profile first!" };

    // Try expense logging first
    const expenseMsg = handleExpenseLog(q);
    if (expenseMsg) return expenseMsg;

    // Try saving logging
    const savingMsg = handleSavingLog(q);
    if (savingMsg) return savingMsg;

    // Use the coach response engine
    const coach = generateCoachResponse(q, { profile, categories, transactions, monthlyContribution });
    return { role: 'aira', text: coach.text, action: coach.action };
  };

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setMessages((m) => [...m, { role: 'user', text: content }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, respond(content)]);
    }, 700);
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); send(); } };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-4">
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold font-display">Aira AI Coach</h1>
            <p className="text-xs text-primary-300">Online · AI Financial Advisor</p>
          </div>
        </div>
        <div className="inline-flex rounded-2xl bg-white/5 p-1">
          {(['chat', 'insights'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${view === v ? 'bg-primary-500 text-white' : 'text-white/55 hover:text-white'}`}>
              {v === 'chat' ? 'Chat' : 'AI Insights'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Agentic Workflow banner */}
      {profile && (
        <motion.div variants={fadeIn}>
          <AgenticWorkflow steps={workflow} />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {view === 'chat' ? (
          <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <Card className="!p-0 flex flex-col" style={{ height: 'calc(100vh - 380px)', minHeight: '380px' }}>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 no-scrollbar">
                {messages.map((m, i) => (
                  <Bubble key={i} role={m.role} text={m.text} action={m.action} />
                ))}
                {typing && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20">
                      <Sparkles className="h-4 w-4 text-primary-300" />
                    </div>
                    <div className="flex gap-1 rounded-2xl bg-white/5 px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white/60"
                          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-primary-200 hover:bg-white/10">{s}</button>
                  ))}
                </div>
              )}

              <div className="border-t border-white/10 p-3">
                <div className="flex items-center gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
                    placeholder={'Type: "I spent 250 on pizza"…'}
                    className="flex-1 h-12 rounded-2xl bg-white/5 px-4 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-primary-400/40" />
                  <button onClick={() => send()} disabled={!input.trim()}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white disabled:opacity-40">
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
            {insights && plan && profile && (
              <>
                {/* AI Insights Hero — Financial Health Score */}
                <Card>
                  <div className="mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary-300" />
                    <h3 className="font-bold font-display">AI Financial Insights</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <ScoreCard label="Health Score" value={insights.financialHealthScore} max={100} icon={<Activity className="h-4 w-4" />} color="#34d399" label2={insights.healthLabel} />
                    <ScoreCard label="Savings Score" value={insights.savingsScore} max={100} icon={<PiggyBank className="h-4 w-4" />} color="#fbbf24" />
                    <ScoreCard label="Budget Score" value={insights.budgetScore} max={100} icon={<Wallet className="h-4 w-4" />} color="#38bdf8" />
                    <ScoreCard label="Goal Probability" value={insights.goalAchievementProbability} max={100} icon={<Target className="h-4 w-4" />} color="#a78bfa" />
                  </div>
                  <div className="mt-4 rounded-xl bg-primary-500/10 p-4">
                    <p className="text-sm leading-relaxed text-white/80">{insights.summary}</p>
                  </div>
                </Card>

                {/* Overspending Alerts + Top Unnecessary Expenses */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <Card>
                    <div className="mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-rose-400" />
                      <h3 className="font-bold font-display">Overspending Alerts</h3>
                    </div>
                    {insights.overspendingAlerts.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-xl bg-primary-500/10 p-4">
                        <Check className="h-5 w-5 text-primary-400" />
                        <p className="text-sm text-primary-300">All categories within budget. Great discipline!</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {insights.overspendingAlerts.map((a, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                            className="flex items-center justify-between rounded-xl bg-rose-500/10 p-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{a.category}</p>
                              <p className="text-xs text-rose-400">{formatINR(a.amount)} / {formatINR(a.budget)} budget</p>
                            </div>
                            <span className="text-sm font-bold text-rose-400">+{formatINR(a.amount - a.budget)}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card>
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-accent-400" />
                      <h3 className="font-bold font-display">Top Unnecessary Expenses</h3>
                    </div>
                    {insights.topUnnecessaryExpenses.length === 0 ? (
                      <p className="py-6 text-center text-sm text-white/40">No unnecessary spending detected.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {insights.topUnnecessaryExpenses.map((e, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                            className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{e.name}</p>
                              <p className="text-xs text-white/45">{e.reason}</p>
                            </div>
                            <span className="text-sm font-bold text-accent-400">{formatINR(e.amount)}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* Monthly Trend + Best Saving Opportunities */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <Card>
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary-300" />
                      <h3 className="font-bold font-display">Monthly Spending Trend</h3>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
                      {insights.monthlySpendingTrend === 'increasing' ? (
                        <><ArrowUpRight className="h-8 w-8 text-rose-400" /><div><p className="text-sm font-semibold text-rose-400">Increasing</p><p className="text-xs text-white/50">Your spending is higher than last month</p></div></>
                      ) : insights.monthlySpendingTrend === 'decreasing' ? (
                        <><ArrowDownRight className="h-8 w-8 text-primary-400" /><div><p className="text-sm font-semibold text-primary-400">Decreasing</p><p className="text-xs text-white/50">You're spending less than last month. Keep it up!</p></div></>
                      ) : (
                        <><Activity className="h-8 w-8 text-white/50" /><div><p className="text-sm font-semibold text-white/70">Stable</p><p className="text-xs text-white/50">Your spending is consistent month over month</p></div></>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <div className="mb-3 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-accent-400" />
                      <h3 className="font-bold font-display">Best Saving Opportunities</h3>
                    </div>
                    <div className="space-y-2.5">
                      {insights.bestSavingOpportunities.map((o, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                          className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                          <p className="flex-1 text-sm font-medium text-white/80">{o.title}</p>
                          <span className="text-sm font-bold text-primary-400">+{formatINR(o.amount)}/mo</span>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Emergency Fund + Investment Suggestions */}
                <Card>
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary-300" />
                    <h3 className="font-bold font-display">Emergency Fund & Investment Advice</h3>
                  </div>
                  <div className="mb-4 rounded-xl bg-primary-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/50">Emergency Fund Target (3 months)</p>
                        <p className="text-lg font-bold text-primary-400 font-display">{formatINR(insights.emergencyFundRecommendation.target)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/50">Current Coverage</p>
                        <p className="text-lg font-bold text-white font-display">{insights.emergencyFundRecommendation.months} months</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <LinearProgress value={Math.min(1, insights.emergencyFundRecommendation.current / Math.max(1, insights.emergencyFundRecommendation.target))} color="#34d399" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-white/50">Investment Suggestions:</p>
                    {insights.investmentSuggestions.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="rounded-xl bg-white/5 p-3.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{s.title}</p>
                          <span className="text-xs font-bold text-accent-400">{formatINR(s.amount)}/mo</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-white/55">{s.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </Card>

                {/* Smart Recommendations */}
                <Card>
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary-300" />
                    <h3 className="font-bold font-display">Smart Saving Recommendations</h3>
                  </div>
                  {recommendations.length === 0 ? (
                    <p className="py-6 text-center text-sm text-white/40">Log some expenses to get personalized recommendations.</p>
                  ) : (
                    <div className="space-y-3">
                      {recommendations.map((rec, i) => (
                        <RecommendationRow key={rec.id} rec={rec} index={i} />
                      ))}
                    </div>
                  )}
                </Card>

                {/* Location tips */}
                <Card>
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-accent-400" />
                    <h3 className="font-bold font-display">Location-Based Savings in {profile.city}</h3>
                  </div>
                  <div className="space-y-3">
                    {locationTips.map((tip, i) => (
                      <motion.div key={tip.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-3 rounded-xl bg-white/5 p-3.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-400/15 text-accent-400">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{tip.title}</p>
                            <span className="text-xs font-bold text-primary-400">+{formatINR(tip.potentialSaving)}/mo</span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-white/55">{tip.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScoreCard({ label, value, max, icon, color, label2 }: { label: string; value: number; max: number; icon: React.ReactNode; color: string; label2?: string }) {
  const pct = Math.min(1, value / max);
  return (
    <div className="rounded-xl bg-white/5 p-3.5 text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}22`, color }}>
        {icon}
      </div>
      <p className="text-2xl font-bold font-display" style={{ color }}>{value}<span className="text-sm text-white/40">/{max}</span></p>
      <p className="mt-0.5 text-[10px] text-white/50">{label}</p>
      {label2 && <p className="text-[10px] font-semibold" style={{ color }}>{label2}</p>}
    </div>
  );
}

function RecommendationRow({ rec, index }: { rec: SavingRecommendation; index: number }) {
  const Icon = REC_ICONS[rec.icon] ?? TrendingDown;
  const priorityColor = rec.priority === 'high' ? 'text-rose-400 bg-rose-500/15' : rec.priority === 'medium' ? 'text-accent-400 bg-accent-400/15' : 'text-primary-300 bg-primary-500/15';
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }}
      className="flex items-start gap-3 rounded-xl bg-white/5 p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">{rec.title}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${priorityColor}`}>{rec.priority}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-white/55">{rec.description}</p>
        <p className="mt-2 text-xs font-bold text-primary-400">Potential saving: {formatINR(rec.potentialSaving)}/month</p>
      </div>
    </motion.div>
  );
}

function Bubble({ role, text, action }: { role: 'aira' | 'user'; text: string; action?: Msg['action'] }) {
  const isUser = role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-accent-500/20 text-accent-400' : 'bg-primary-500/20 text-primary-300'}`}>
        {isUser ? '🧑' : <Sparkles className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-sm' : 'bg-white/8 text-white/90 rounded-bl-sm'}`}>
        <p className="whitespace-pre-wrap">{text}</p>
        {action?.type === 'expense_added' && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1 text-xs">
            <Check className="h-3.5 w-3.5 text-primary-200" />
            <span className="font-medium">{formatINR(action.amount)} → {action.category}</span>
          </div>
        )}
        {action?.type === 'saving_added' && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1 text-xs">
            <PiggyBank className="h-3.5 w-3.5 text-primary-200" />
            <span className="font-medium">+{formatINR(action.amount)} saved</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
