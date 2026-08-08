import type { UserProfile, ExpenseCategory, Transaction } from '@/types';
import { MONTHS } from '@/types';

export interface FinancialPlan {
  status: 'surplus' | 'break_even' | 'deficit' | 'critical';
  monthlyIncome: number;
  totalExpenses: number;
  totalBudget: number;
  availableMoney: number; // income - expenses
  requiredMonthlySaving: number;
  requiredDailySaving: number;
  requiredWeeklySaving: number;
  monthsToGoal: number | null;
  estimatedCompletion: { month: number; year: number } | null;
  daysRemaining: number;
  goalProgress: number; // strictly currentSavings / goalCost — never includes monthly contribution
  goalComplete: boolean; // true ONLY when currentSavings >= goalCost
  remainingGoal: number; // goalCost - currentSavings (NOT including monthly contribution)
  remainingToSave: number; // remaining after current savings + contribution
  projectedSaving: number; // what user can actually save based on available money
  delayDays: number; // positive = delayed, negative = ahead
  savingsAmount: number; // actual savings amount (availableMoney if positive, else monthlyContribution)
  savingsPercentage: number; // savingsAmount / monthlyIncome * 100
  expenseToIncomeRatio: number; // totalExpenses / monthlyIncome * 100
  budgetHealth: 'excellent' | 'good' | 'fair' | 'poor';
  budgetRemaining: number; // totalBudget - totalSpent
}

export interface AISuggestion {
  categoryName: string;
  amount: number;
  reason: string;
}

export interface AIAnalysis {
  case: 1 | 2 | 3;
  title: string;
  message: string;
  tone: 'success' | 'warning' | 'critical';
  suggestions: AISuggestion[];
  // structured breakdown for rich UI
  breakdown: {
    monthlyIncome: number;
    totalExpenses: number;
    availableMoney: number;
    deficit?: number;
    dailySaving?: number;
    weeklySaving?: number;
    monthlySaving?: number;
    requiredMonthlySaving: number;
    estimatedCompletion?: { month: number; year: number } | null;
    recappedCompletion?: { month: number; year: number } | null;
    reductionNeeded?: number;
    monthsToGoal?: number | null;
  };
}

const now = new Date();

export function monthsUntilTarget(profile: UserProfile): number {
  const target = new Date(profile.targetYear, profile.targetMonth - 1, 1);
  let m = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  if (m < 1) m = 1;
  return m;
}

export function daysUntilTarget(profile: UserProfile): number {
  const target = new Date(profile.targetYear, profile.targetMonth - 1, 1);
  const diff = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  return Math.max(1, diff);
}

export function getMonthlyIncome(profile: UserProfile): number {
  return profile.incomeType === 'daily' ? profile.incomeAmount * 30 : profile.incomeAmount;
}

export function getTotalSpent(categories: ExpenseCategory[]): number {
  return categories.reduce((s, c) => s + c.spent, 0);
}

export function getTotalBudget(categories: ExpenseCategory[]): number {
  return categories.reduce((s, c) => s + c.budget, 0);
}

/**
 * Core plan calculation.
 * CRITICAL RULE: Current Savings is NEVER used in monthly saving math.
 * It's only used for progress. Required saving = remainingGoal / remainingMonths.
 */
export function buildPlan(
  profile: UserProfile,
  totalExpenses: number,
  monthlyContribution: number,
  totalBudget = 0,
): FinancialPlan {
  const monthlyIncome = getMonthlyIncome(profile);
  const availableMoney = monthlyIncome - totalExpenses;

  const remainingGoal = Math.max(0, profile.goalCost - profile.currentSavings);
  const monthsLeft = monthsUntilTarget(profile);
  const requiredMonthlySaving = remainingGoal > 0 ? remainingGoal / monthsLeft : 0;
  const requiredDailySaving = remainingGoal > 0 ? remainingGoal / Math.max(1, daysUntilTarget(profile)) : 0;
  const requiredWeeklySaving = requiredDailySaving * 7;

  const projectedSaving = Math.max(0, availableMoney);

  const savedWithContribution = profile.currentSavings + monthlyContribution;
  const remainingToSave = Math.max(0, profile.goalCost - savedWithContribution);

  let status: FinancialPlan['status'];
  if (availableMoney < 0) status = 'critical';
  else if (availableMoney > requiredMonthlySaving) status = 'surplus';
  else if (Math.abs(availableMoney - requiredMonthlySaving) < 1) status = 'break_even';
  else status = 'deficit';

  let monthsToGoal: number | null = null;
  let estimatedCompletion: { month: number; year: number } | null = null;
  const effectiveSaving = projectedSaving > 0 ? projectedSaving : monthlyContribution;
  if (effectiveSaving > 0 && remainingToSave > 0) {
    monthsToGoal = Math.ceil(remainingToSave / effectiveSaving);
    const d = new Date(now.getFullYear(), now.getMonth() + monthsToGoal, 1);
    estimatedCompletion = { month: d.getMonth(), year: d.getFullYear() };
  } else if (remainingToSave <= 0) {
    monthsToGoal = 0;
    estimatedCompletion = { month: now.getMonth(), year: now.getFullYear() };
  }

  const target = new Date(profile.targetYear, profile.targetMonth - 1, 1);
  const daysRemaining = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));

  // STRICT goal progress: only currentSavings / goalCost — never includes monthly contribution
  const goalProgress = profile.goalCost > 0
    ? Math.min(1, profile.currentSavings / profile.goalCost)
    : 0;
  const goalComplete = profile.goalCost > 0 && profile.currentSavings >= profile.goalCost;

  let delayDays = 0;
  if (estimatedCompletion && effectiveSaving > 0 && remainingToSave > 0) {
    const projectedDate = new Date(estimatedCompletion.year, estimatedCompletion.month, 1);
    delayDays = Math.round((projectedDate.getTime() - target.getTime()) / 86400000);
  }

  const savingsAmount = availableMoney > 0 ? availableMoney : monthlyContribution;
  const savingsPercentage = monthlyIncome > 0 ? (savingsAmount / monthlyIncome) * 100 : 0;
  const expenseToIncomeRatio = monthlyIncome > 0 ? (totalExpenses / monthlyIncome) * 100 : 0;

  let budgetHealth: FinancialPlan['budgetHealth'];
  if (totalBudget > 0) {
    const usedPct = totalExpenses / totalBudget;
    if (usedPct < 0.7) budgetHealth = 'excellent';
    else if (usedPct < 0.9) budgetHealth = 'good';
    else if (usedPct <= 1) budgetHealth = 'fair';
    else budgetHealth = 'poor';
  } else {
    budgetHealth = 'good';
  }

  return {
    status,
    monthlyIncome,
    totalExpenses,
    totalBudget,
    availableMoney,
    requiredMonthlySaving,
    requiredDailySaving,
    requiredWeeklySaving,
    monthsToGoal,
    estimatedCompletion,
    daysRemaining,
    goalProgress,
    goalComplete,
    remainingGoal,
    remainingToSave,
    projectedSaving,
    delayDays,
    savingsAmount,
    savingsPercentage,
    expenseToIncomeRatio,
    budgetHealth,
    budgetRemaining: Math.max(0, totalBudget - totalExpenses),
  };
}

/**
 * Smart AI analysis with 3 cases based on income vs expenses.
 */
export function analyzePlan(
  profile: UserProfile,
  categories: ExpenseCategory[],
  monthlyContribution: number,
): AIAnalysis {
  const monthlyIncome = getMonthlyIncome(profile);
  const totalExpenses = getTotalSpent(categories);
  const totalBudget = getTotalBudget(categories);
  const availableMoney = monthlyIncome - totalExpenses;
  const remainingGoal = Math.max(0, profile.goalCost - profile.currentSavings);
  const monthsLeft = monthsUntilTarget(profile);
  const requiredSaving = remainingGoal > 0 ? remainingGoal / Math.max(1, monthsLeft) : 0;
  const plan = buildPlan(profile, totalExpenses, monthlyContribution, totalBudget);

  const NON_ESSENTIAL = ['Entertainment', 'Shopping', 'Food', 'Dining', 'Movie', 'Others', 'Snacks', 'Cafe'];
  const isNonEssential = (name: string) => NON_ESSENTIAL.some((n) => name.toLowerCase().includes(n.toLowerCase()));

  const topCategories = [...categories]
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const toSuggestion = (c: ExpenseCategory): AISuggestion => ({
    categoryName: c.name,
    amount: c.spent,
    reason: isNonEssential(c.name)
      ? 'Non-essential — consider cutting this first'
      : 'High spend — look for ways to reduce',
  });

  // ── Case 3: Expenses > Income ──
  if (availableMoney < -1) {
    const deficit = Math.abs(availableMoney);
    const unnecessary = topCategories.filter((c) => isNonEssential(c.name));
    const picked = (unnecessary.length > 0 ? unnecessary : topCategories).slice(0, 3);
    const suggestions = picked.map(toSuggestion);

    const topName = picked[0]?.name ?? 'spending';
    const topAmount = picked[0]?.spent ?? 0;
    const reductionNeeded = Math.round(deficit);

    // Recalculate completion if user reduces expenses by deficit + a buffer to start saving
    const recoverableMonthly = monthlyIncome - (totalExpenses - deficit) - Math.max(0, deficit);
    const recappedSaving = Math.max(0, monthlyIncome - (totalExpenses - Math.round(deficit * 1.5)));
    const recappedMonths = recappedSaving > 0 && remainingGoal > 0 ? Math.ceil(remainingGoal / recappedSaving) : null;
    const recappedCompletion = recappedMonths != null ? addMonths(recappedMonths) : null;

    return {
      case: 3,
      title: 'You are overspending',
      tone: 'critical',
      message: `Warning, ${profile.name}: your expenses (${formatINR(totalExpenses)}) exceed your income (${formatINR(monthlyIncome)}) by ${formatINR(deficit)} this month. You cannot save anything toward your ${profile.dreamGoal} until you fix this. Your top 3 spending categories are listed below — start by reducing ${topName} (${formatINR(topAmount)}). You need to cut at least ${formatINR(reductionNeeded)}/month just to break even. If you reduce spending by ${formatINR(Math.round(deficit * 1.5))}/month, you could start saving again and reach your goal by ${recappedCompletion ? `${monthLabel(recappedCompletion.month)} ${recappedCompletion.year}` : 'your target date'}.`,
      suggestions,
      breakdown: {
        monthlyIncome,
        totalExpenses,
        availableMoney,
        deficit,
        requiredMonthlySaving: Math.round(requiredSaving),
        reductionNeeded,
        recappedCompletion,
        monthsToGoal: plan.monthsToGoal,
      },
    };
  }

  // ── Case 2: Expenses = Income (within ±1%) ──
  if (Math.abs(availableMoney) <= Math.max(1, monthlyIncome * 0.01)) {
    const unnecessary = topCategories.filter((c) => isNonEssential(c.name));
    const picked = (unnecessary.length > 0 ? unnecessary : topCategories).slice(0, 3);
    const suggestions = picked.map(toSuggestion);

    const topName = picked[0]?.name ?? 'non-essential spending';
    const tenPercentIncome = Math.round(monthlyIncome * 0.1);

    return {
      case: 2,
      title: 'No savings possible right now',
      tone: 'warning',
      message: `${profile.name}, your expenses (${formatINR(totalExpenses)}) exactly match your income (${formatINR(monthlyIncome)}). There's nothing left to save. To reach your ${profile.dreamGoal} (${formatINR(profile.goalCost)}), you need to reduce your highest expenses — especially ${topName} — or increase your income through additional earnings. Even saving just 10% of your income (${formatINR(tenPercentIncome)}/month) would put you on track. You need ${formatINR(Math.round(requiredSaving))}/month to reach your goal on time.`,
      suggestions,
      breakdown: {
        monthlyIncome,
        totalExpenses,
        availableMoney,
        requiredMonthlySaving: Math.round(requiredSaving),
        estimatedCompletion: plan.estimatedCompletion,
        monthsToGoal: plan.monthsToGoal,
      },
    };
  }

  // ── Case 1: Expenses < Income (surplus) ──
  const dailySave = availableMoney / 30;
  const weeklySave = availableMoney / 4.33;
  const monthlySave = availableMoney;
  const surplus = availableMoney;
  const willReachGoal = surplus >= requiredSaving && requiredSaving > 0;
  const monthsToGoal = surplus > 0 && remainingGoal > 0 ? Math.ceil(remainingGoal / surplus) : 0;
  const completion = plan.estimatedCompletion;
  const completionStr = completion ? `${monthLabel(completion.month)} ${completion.year}` : 'already reached';

  const topNonEssential = topCategories.filter((c) => isNonEssential(c.name)).slice(0, 2);
  const picked = topNonEssential.length > 0 ? topNonEssential : topCategories.slice(0, 3);
  const suggestions = picked.map(toSuggestion);

  return {
    case: 1,
    title: 'Great news — you have a surplus!',
    tone: 'success',
    message: `Congratulations, ${profile.name}! Your expenses (${formatINR(totalExpenses)}) are lower than your income (${formatINR(monthlyIncome)}). You have ${formatINR(surplus)} remaining this month. To reach your ${profile.dreamGoal} (${formatINR(profile.goalCost)}), you can save ${formatINR(Math.round(dailySave))}/day, ${formatINR(Math.round(weeklySave))}/week, or ${formatINR(Math.round(monthlySave))}/month. ${requiredSaving > 0 ? (willReachGoal ? `At this rate, you'll achieve your goal by ${completionStr}. Keep saving consistently!` : `You need ${formatINR(Math.round(requiredSaving))}/month to reach it on time — you're ${formatINR(Math.round(requiredSaving - surplus))} short. Try to save a bit more.`) : `You've already saved enough for your goal!`}`,
    suggestions,
    breakdown: {
      monthlyIncome,
      totalExpenses,
      availableMoney,
      dailySaving: Math.round(dailySave),
      weeklySaving: Math.round(weeklySave),
      monthlySaving: Math.round(monthlySave),
      requiredMonthlySaving: Math.round(requiredSaving),
      estimatedCompletion: completion,
      monthsToGoal,
    },
  };
}

function addMonths(n: number): { month: number; year: number } {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return { month: d.getMonth(), year: d.getFullYear() };
}

/**
 * Savings protection: calculate how many days using savings delays the dream.
 * delayDays = (amount / monthlySavingRate) * 30
 */
export function savingsUseDelayDays(amount: number, monthlySavingRate: number): number {
  if (monthlySavingRate <= 0) return Math.round(amount / 100); // fallback
  return Math.ceil((amount / monthlySavingRate) * 30);
}

export function formatINR(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  let last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest) {
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${sign}₹${rest},${last3}`;
  }
  return `${sign}₹${last3}`;
}

export function monthLabel(m: number): string {
  return MONTHS[m] ?? '';
}

export function completionLabel(c: { month: number; year: number } | null): string {
  if (!c) return '—';
  return `${monthLabel(c.month)} ${c.year}`;
}

// Group transactions by day for charts
export function transactionsByDay(transactions: Transaction[], days: number) {
  const out: { label: string; date: Date; expense: number; income: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    out.push({ label, date: d, expense: 0, income: 0 });
  }
  for (const t of transactions) {
    const td = new Date(t.date);
    for (const bucket of out) {
      if (td.toDateString() === bucket.date.toDateString()) {
        if (t.type === 'expense') bucket.expense += t.amount;
        else bucket.income += t.amount;
      }
    }
  }
  return out;
}

// Group transactions by month
export function transactionsByMonth(transactions: Transaction[], months: number) {
  const out: { label: string; month: number; year: number; expense: number; income: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ label: monthLabel(d.getMonth()).slice(0, 3), month: d.getMonth(), year: d.getFullYear(), expense: 0, income: 0 });
  }
  for (const t of transactions) {
    const td = new Date(t.date);
    for (const bucket of out) {
      if (td.getMonth() === bucket.month && td.getFullYear() === bucket.year) {
        if (t.type === 'expense') bucket.expense += t.amount;
        else bucket.income += t.amount;
      }
    }
  }
  return out;
}
