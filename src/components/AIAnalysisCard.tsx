import { motion } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, TrendingDown, Sparkles, ArrowRight,
  Calendar, Wallet, PiggyBank, Target, TrendingUp, Lightbulb, ArrowDownRight,
} from 'lucide-react';
import type { AIAnalysis } from '@/lib/finance';
import { formatINR, monthLabel } from '@/lib/finance';
import { fadeIn } from '@/lib/motion';

const TONE_STYLES: Record<AIAnalysis['tone'], { bg: string; border: string; icon: React.ReactNode; iconBg: string; text: string }> = {
  success: {
    bg: 'from-primary-500/15 to-primary-500/5',
    border: 'border-primary-400/30',
    icon: <CheckCircle2 className="h-6 w-6 text-primary-300" />,
    iconBg: 'bg-primary-500/20',
    text: 'text-primary-300',
  },
  warning: {
    bg: 'from-orange-500/15 to-orange-500/5',
    border: 'border-orange-400/30',
    icon: <AlertTriangle className="h-6 w-6 text-orange-400" />,
    iconBg: 'bg-orange-500/20',
    text: 'text-orange-400',
  },
  critical: {
    bg: 'from-rose-500/15 to-rose-500/5',
    border: 'border-rose-400/30',
    icon: <TrendingDown className="h-6 w-6 text-rose-400" />,
    iconBg: 'bg-rose-500/20',
    text: 'text-rose-400',
  },
};

export function AIAnalysisCard({ analysis }: { analysis: AIAnalysis }) {
  const s = TONE_STYLES[analysis.tone];
  const b = analysis.breakdown;
  const completionText = b.estimatedCompletion
    ? `${monthLabel(b.estimatedCompletion.month)} ${b.estimatedCompletion.year}`
    : 'Already reached';
  const recappedText = b.recappedCompletion
    ? `${monthLabel(b.recappedCompletion.month)} ${b.recappedCompletion.year}`
    : null;

  return (
    <motion.div variants={fadeIn}>
      <div className={`rounded-3xl border ${s.border} bg-gradient-to-br ${s.bg} p-5`}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${s.iconBg}`}>
            {s.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary-300" />
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Aira AI Analysis · Case {analysis.case}</p>
            </div>
            <h3 className={`mt-0.5 text-lg font-bold font-display ${s.text}`}>{analysis.title}</h3>
          </div>
        </div>

        {/* Message */}
        <p className="mt-4 text-sm leading-relaxed text-white/85">{analysis.message}</p>

        {/* Structured breakdown — Case 1: surplus */}
        {analysis.case === 1 && (
          <div className="mt-4 space-y-4">
            {/* Remaining balance highlight */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20">
                <Wallet className="h-5 w-5 text-primary-300" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/50">Remaining balance this month</p>
                <p className="text-lg font-bold text-primary-300">{formatINR(b.availableMoney)}</p>
              </div>
            </div>

            {/* Daily / Weekly / Monthly savings */}
            <div className="grid grid-cols-3 gap-2">
              <SaveTile label="Per Day" value={formatINR(b.dailySaving ?? 0)} icon={<PiggyBank className="h-3.5 w-3.5" />} />
              <SaveTile label="Per Week" value={formatINR(b.weeklySaving ?? 0)} icon={<TrendingUp className="h-3.5 w-3.5" />} />
              <SaveTile label="Per Month" value={formatINR(b.monthlySaving ?? 0)} icon={<Target className="h-3.5 w-3.5" />} />
            </div>

            {/* Goal completion prediction */}
            <div className="flex items-center gap-3 rounded-2xl bg-accent-500/10 p-4">
              <Calendar className="h-5 w-5 text-accent-400" />
              <div className="flex-1">
                <p className="text-xs text-white/50">Predicted goal completion</p>
                <p className="text-sm font-bold text-accent-300">{completionText}</p>
              </div>
              {b.monthsToGoal != null && b.monthsToGoal > 0 && (
                <span className="rounded-full bg-accent-500/20 px-2.5 py-1 text-xs font-semibold text-accent-300">
                  {b.monthsToGoal} months
                </span>
              )}
            </div>

            {/* Encouragement */}
            <div className="flex items-center gap-2 rounded-xl bg-primary-500/10 px-3 py-2.5 text-xs text-primary-300">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Keep saving consistently — you're on the path to your dream!
            </div>
          </div>
        )}

        {/* Structured breakdown — Case 2: break-even */}
        {analysis.case === 2 && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
                <Wallet className="h-5 w-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/50">Income equals expenses</p>
                <p className="text-sm font-bold text-orange-400">{formatINR(b.monthlyIncome)} = {formatINR(b.totalExpenses)}</p>
              </div>
            </div>

            {/* Required monthly saving */}
            <div className="flex items-center gap-3 rounded-2xl bg-accent-500/10 p-4">
              <Target className="h-5 w-5 text-accent-400" />
              <div className="flex-1">
                <p className="text-xs text-white/50">You need to save this much per month</p>
                <p className="text-sm font-bold text-accent-300">{formatINR(b.requiredMonthlySaving)}/month</p>
              </div>
            </div>

            {/* Suggestions to reduce */}
            {analysis.suggestions.length > 0 && (
              <SuggestionList suggestions={analysis.suggestions} title="Reduce or increase income" />
            )}
          </div>
        )}

        {/* Structured breakdown — Case 3: overspending */}
        {analysis.case === 3 && (
          <div className="mt-4 space-y-4">
            {/* Deficit highlight */}
            <div className="flex items-center gap-3 rounded-2xl bg-rose-500/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                <ArrowDownRight className="h-5 w-5 text-rose-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/50">Expenses exceed income by</p>
                <p className="text-lg font-bold text-rose-400">{formatINR(b.deficit ?? 0)}</p>
              </div>
            </div>

            {/* Reduction needed */}
            {b.reductionNeeded != null && (
              <div className="flex items-center gap-3 rounded-2xl bg-orange-500/10 p-4">
                <Target className="h-5 w-5 text-orange-400" />
                <div className="flex-1">
                  <p className="text-xs text-white/50">Reduce spending by at least</p>
                  <p className="text-sm font-bold text-orange-400">{formatINR(b.reductionNeeded)}/month to break even</p>
                </div>
              </div>
            )}

            {/* Top 3 categories to cut */}
            {analysis.suggestions.length > 0 && (
              <SuggestionList suggestions={analysis.suggestions} title="Top 3 categories to reduce" />
            )}

            {/* Recalculated completion date */}
            {recappedText && (
              <div className="flex items-center gap-3 rounded-2xl bg-primary-500/10 p-4">
                <Calendar className="h-5 w-5 text-primary-300" />
                <div className="flex-1">
                  <p className="text-xs text-white/50">If you apply the suggested savings, you'll reach your goal by</p>
                  <p className="text-sm font-bold text-primary-300">{recappedText}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SaveTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] text-white/50">{icon}{label}</div>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function SuggestionList({ suggestions, title }: { suggestions: AIAnalysis['suggestions']; title: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-accent-400" />
        <p className="text-xs font-medium text-white/60">{title}</p>
      </div>
      <div className="space-y-2">
        {suggestions.map((sug) => (
          <div key={sug.categoryName} className="rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/80">
                <ArrowRight className="h-3.5 w-3.5 text-white/40" />
                {sug.categoryName}
              </span>
              <span className="text-sm font-bold text-white/70">{formatINR(sug.amount)}</span>
            </div>
            <p className="ml-5.5 mt-0.5 text-[11px] text-white/40">{sug.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
