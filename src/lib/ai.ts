import type { UserProfile, ExpenseCategory, Transaction, PaymentMethod } from '@/types';
import { formatINR, getMonthlyIncome, getTotalSpent, monthsUntilTarget, daysUntilTarget, getTotalBudget, buildPlan } from './finance';

// ─── Smart Expense Detection ──────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Rent: ['rent', 'landlord', 'lease', 'apartment', 'flat', 'housing', 'room', 'pg', 'hostel', 'accommodation'],
  Groceries: ['grocery', 'groceries', 'milk', 'bread', 'rice', 'vegetable', 'fruit', 'flour', 'dal', 'onion', 'tomato', 'egg', 'meat', 'fish', 'supermarket', 'kirana', 'ration', 'atta', 'spice', 'cooking oil', 'snack item'],
  Food: ['pizza', 'burger', 'food', 'lunch', 'dinner', 'breakfast', 'snack', 'restaurant', 'cafe', 'coffee', 'tea', 'swiggy', 'zomato', 'dominos', 'mcdonald', 'kfc', 'starbucks', 'eat', 'meal', 'biriyani', 'biryani', 'dosa', 'idli', 'paratha', 'noodles', 'pasta', 'sandwich', 'roll', 'wrap', 'tiffin', 'chaat', 'samosa'],
  Shopping: ['shirt', 'jeans', 'clothes', 'shoe', 'fashion', 'mall', 'apparel', 'dress', 'jacket', 'saree', 'kurta', 'accessory', 'bag', 'watch', 'electronics', 'phone', 'laptop', 'gadget', 'amazon', 'flipkart', 'myntra', 'ajio', 'purchase', 'buy'],
  Fuel: ['petrol', 'diesel', 'fuel', 'gas', 'tank', 'engine', 'oil', 'bike refill', 'filling', 'hp', 'bharat petroleum', 'indian oil', 'shell'],
  Medical: ['medicine', 'doctor', 'hospital', 'pharmacy', 'clinic', 'health', 'tablet', 'syrup', 'checkup', 'medical', 'lab', 'test', 'covid', 'fever', 'pharmeasy', '1mg', 'apollo pharmacy'],
  Healthcare: ['medicine', 'doctor', 'hospital', 'pharmacy', 'clinic', 'health', 'tablet', 'syrup', 'checkup', 'medical', 'lab', 'test', 'health checkup', 'dental', 'eye', 'glasses', 'lens', 'physio', 'insurance health'],
  Bills: ['electric', 'electricity', 'water bill', 'gas bill', 'internet', 'wifi', 'broadband', 'phone bill', 'recharge', 'utility', 'cleaning', 'dth', 'landline', 'maintenance', 'society charge'],
  Entertainment: ['movie', 'cinema', 'concert', 'game', 'pub', 'bar', 'ticket', 'netflix', 'spotify', 'amazon prime', 'hotstar', 'disney', 'bookmyshow', 'pvr', 'inox', 'party', 'event', 'festival ticket', 'show'],
  Transport: ['bus', 'train', 'metro', 'ticket', 'pass', 'fare', 'parking', 'toll', 'uber', 'ola', 'cab', 'auto', 'rickshaw', 'rapido', 'irctc', 'travel', 'commute'],
  Education: ['college', 'fee', 'fees', 'tuition', 'course', 'school', 'exam', 'book', 'uniform', 'stationery', 'coaching', 'class', 'udemy', 'coursera', 'byju', 'unacademy', 'study', 'semester', 'admission'],
};

export interface CategorizeResult {
  categoryId: string | null;
  categoryName: string;
  confidence: number;
  merchant: string | null;
  paymentType: PaymentMethod;
  date: string;
}

// Merchant detection patterns
const MERCHANT_PATTERNS: { pattern: RegExp; merchant: string }[] = [
  { pattern: /swiggy/i, merchant: 'Swiggy' },
  { pattern: /zomato/i, merchant: 'Zomato' },
  { pattern: /amazon/i, merchant: 'Amazon' },
  { pattern: /flipkart/i, merchant: 'Flipkart' },
  { pattern: /uber/i, merchant: 'Uber' },
  { pattern: /ola(\s|$)/i, merchant: 'Ola' },
  { pattern: /netflix/i, merchant: 'Netflix' },
  { pattern: /spotify/i, merchant: 'Spotify' },
  { pattern: /dominos/i, merchant: "Domino's" },
  { pattern: /mcdonald/i, merchant: "McDonald's" },
  { pattern: /kfc/i, merchant: 'KFC' },
  { pattern: /pvr/i, merchant: 'PVR Cinemas' },
  { pattern: /bookmyshow/i, merchant: 'BookMyShow' },
  { pattern: /bigbasket/i, merchant: 'BigBasket' },
  { pattern: /grofers|blinkit/i, merchant: 'Blinkit' },
  { pattern: /zepto/i, merchant: 'Zepto' },
  { pattern: /hp|bharat petroleum|indian oil|shell/i, merchant: 'Fuel Station' },
];

// Payment type inference
function inferPaymentType(text: string): PaymentMethod {
  const lower = text.toLowerCase();
  if (/upi|gpay|phonepe|paytm|bhim|google pay/i.test(lower)) return 'upi';
  if (/wallet|paytm wallet|amazon pay/i.test(lower)) return 'wallet';
  return 'cash';
}

// Date detection
function inferDate(text: string): string {
  const lower = text.toLowerCase();
  if (/yesterday/i.test(lower)) {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString();
  }
  if (/today|now/i.test(lower)) return new Date().toISOString();
  // Match "on 15th" or "on 15/08" etc
  const dateMatch = lower.match(/(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1;
    const year = dateMatch[3] ? parseInt(dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]) : new Date().getFullYear();
    return new Date(year, month, day).toISOString();
  }
  return new Date().toISOString();
}

export function categorizeExpense(
  text: string,
  categories: ExpenseCategory[],
): CategorizeResult {
  const lower = text.toLowerCase();
  let bestMatch: { categoryId: string; categoryName: string; score: number } | null = null;

  for (const cat of categories) {
    const keywords = CATEGORY_KEYWORDS[cat.name] ?? [];
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.length > 4 ? 2 : 1;
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { categoryId: cat.id, categoryName: cat.name, score };
    }
  }

  // Merchant detection
  let merchant: string | null = null;
  for (const m of MERCHANT_PATTERNS) {
    if (m.pattern.test(text)) { merchant = m.merchant; break; }
  }

  const paymentType = inferPaymentType(text);
  const date = inferDate(text);

  if (!bestMatch) {
    const others = categories.find((c) => c.name.toLowerCase() === 'others');
    if (others) return { categoryId: others.id, categoryName: others.name, confidence: 0.2, merchant, paymentType, date };
    return { categoryId: null, categoryName: 'Uncategorized', confidence: 0, merchant, paymentType, date };
  }

  const confidence = Math.min(1, bestMatch.score / 4);
  return { categoryId: bestMatch.categoryId, categoryName: bestMatch.categoryName, confidence, merchant, paymentType, date };
}

// ─── Natural Language Expense Parsing ──────────────────────────────────────

export interface ParsedExpense {
  amount: number | null;
  description: string;
  raw: string;
}

export function parseExpenseText(text: string): ParsedExpense {
  const lower = text.toLowerCase();
  const amountMatch = lower.match(/(?:₹|rs\.?|rupees?)?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null;

  let description = text
    .replace(/(?:₹|rs\.?|rupees?)?\s*\d+(?:,\d{3})*(?:\.\d{1,2})?/gi, '')
    .replace(/\b(i|spent|spend|paid|pay|for|on|bought|buy|at|from|today|yesterday|via|using|through|upi|cash|wallet|gpay|phonepe|paytm)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!description) description = text.replace(/(?:₹|rs\.?|rupees?)?\s*\d+(?:,\d{3})*(?:\.\d{1,2})?/gi, '').trim() || 'Expense';
  if (!description) description = 'Expense';

  return { amount, description, raw: text };
}

// ─── Saving Recommendations ────────────────────────────────────────────────

export interface SavingRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSaving: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

// ─── Spending Pattern Analysis ──────────────────────────────────────────────

interface CategorySpendingTrend {
  categoryId: string;
  name: string;
  thisMonth: number;
  lastMonth: number;
  changePct: number; // positive = increasing
  incomePct: number; // % of income this month
  budget: number;
  isOverBudget: boolean;
}

function analyzeCategoryTrends(
  categories: ExpenseCategory[],
  transactions: Transaction[],
  monthlyIncome: number,
): CategorySpendingTrend[] {
  const now = new Date();
  const thisM = now.getMonth();
  const lastM = now.getMonth() - 1;
  const thisY = now.getFullYear();
  const lastY = thisM === 0 ? thisY - 1 : thisY;

  return categories.map((cat) => {
    const thisMonthTx = transactions.filter((t) =>
      t.type === 'expense' && t.categoryId === cat.id &&
      new Date(t.date).getMonth() === thisM && new Date(t.date).getFullYear() === thisY,
    );
    const lastMonthTx = transactions.filter((t) =>
      t.type === 'expense' && t.categoryId === cat.id &&
      new Date(t.date).getMonth() === lastM && new Date(t.date).getFullYear() === lastY,
    );
    const thisMonth = thisMonthTx.reduce((s, t) => s + t.amount, 0);
    const lastMonth = lastMonthTx.reduce((s, t) => s + t.amount, 0);
    const changePct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : 0;
    return {
      categoryId: cat.id,
      name: cat.name,
      thisMonth: thisMonth || cat.spent,
      lastMonth,
      changePct,
      incomePct: monthlyIncome > 0 ? (thisMonth / monthlyIncome) * 100 : 0,
      budget: cat.budget,
      isOverBudget: cat.budget > 0 && cat.spent > cat.budget,
    };
  }).filter((t) => t.thisMonth > 0);
}

// Thresholds: categories that are considered "non-essential" / discretionary
const NON_ESSENTIAL_CATEGORIES = ['Entertainment', 'Shopping', 'Food', 'Dining', 'Movie'];

export function generateRecommendations(
  profile: UserProfile,
  categories: ExpenseCategory[],
  transactions: Transaction[],
): SavingRecommendation[] {
  const recs: SavingRecommendation[] = [];
  const monthlyIncome = getMonthlyIncome(profile);
  const totalSpent = getTotalSpent(categories);
  const availableMoney = monthlyIncome - totalSpent;
  const trends = analyzeCategoryTrends(categories, transactions, monthlyIncome);

  // ── Phase 1: Overspending alerts (budget breaches) ──
  for (const t of trends.filter((t) => t.isOverBudget)) {
    const overspent = t.thisMonth - t.budget;
    recs.push({
      id: `over-${t.categoryId}`,
      title: `${t.name} over budget by ${formatINR(overspent)}`,
      description: `You've spent ${formatINR(t.thisMonth)} on ${t.name} against a budget of ${formatINR(t.budget)}. Reducing to your budget limit frees ${formatINR(overspent)} for your ${profile.dreamGoal}.`,
      potentialSaving: overspent,
      category: t.name,
      priority: overspent > monthlyIncome * 0.1 ? 'high' : 'medium',
      icon: 'trending-down',
    });
  }

  // ── Phase 2: Month-over-month spending spikes (≥25% increase) ──
  for (const t of trends.filter((t) => t.lastMonth > 0 && t.changePct >= 25)) {
    const increase = t.thisMonth - t.lastMonth;
    const cutAmount = Math.round(increase * 0.5);
    if (cutAmount > 50) {
      recs.push({
        id: `spike-${t.categoryId}`,
        title: `${t.name} increased ${Math.round(t.changePct)}% vs last month`,
        description: `Your ${t.name} spending went from ${formatINR(t.lastMonth)} to ${formatINR(t.thisMonth)} — up ${formatINR(increase)}. Cutting half of that increase saves ${formatINR(cutAmount)} this month.`,
        potentialSaving: cutAmount,
        category: t.name,
        priority: t.changePct >= 50 ? 'high' : 'medium',
        icon: 'trending-down',
      });
    }
  }

  // ── Phase 3: Highest expense category (only if it's disproportionately high) ──
  const sortedBySpend = [...trends].sort((a, b) => b.thisMonth - a.thisMonth);
  if (sortedBySpend.length > 0) {
    const top = sortedBySpend[0];
    const isEssential = !NON_ESSENTIAL_CATEGORIES.some((n) => top.name.toLowerCase().includes(n.toLowerCase()));
    // Only recommend cutting the top category if it's >25% of income OR non-essential and >15%
    const shouldRecommend = top.incomePct > 25 || (!isEssential && top.incomePct > 15);
    if (shouldRecommend && !recs.some((r) => r.category === top.name)) {
      const cutPct = top.incomePct > 35 ? 0.2 : 0.1;
      const cut = Math.round(top.thisMonth * cutPct);
      if (cut > 50) {
        recs.push({
          id: `top-${top.categoryId}`,
          title: `${top.name} is your highest expense (${formatINR(top.thisMonth)})`,
          description: `You spent ${Math.round(top.incomePct)}% of your income on ${top.name}. Reducing by ${Math.round(cutPct * 100)}% could save ${formatINR(cut)} this month.`,
          potentialSaving: cut,
          category: top.name,
          priority: 'high',
          icon: 'scissors',
        });
      }
    }
  }

  // ── Phase 4: Subscription detection (from transaction history) ──
  const subKeywords = /subscription|netflix|spotify|prime|hotstar|disney|coursera|udemy|monthly plan/i;
  const subTx = transactions.filter((t) => t.type === 'expense' && subKeywords.test(t.note + (t.expenseName ?? '')));
  if (subTx.length >= 2) {
    const total = subTx.reduce((s, t) => s + t.amount, 0);
    recs.push({
      id: 'subs',
      title: `Subscriptions costing ${formatINR(total)}/month`,
      description: `You have ${subTx.length} subscription payments totaling ${formatINR(total)}. Cancel the ones you rarely use to boost savings.`,
      potentialSaving: Math.round(total * 0.6),
      category: 'Bills',
      priority: 'medium',
      icon: 'tv',
    });
  }

  // ── Phase 5: Situation-based advice ──
  if (availableMoney < 0) {
    // Expenses exceed income: highlight biggest non-essential expenses
    const nonEssential = sortedBySpend.filter((t) =>
      NON_ESSENTIAL_CATEGORIES.some((n) => t.name.toLowerCase().includes(n.toLowerCase())),
    );
    if (nonEssential.length > 0) {
      const top = nonEssential[0];
      if (!recs.some((r) => r.category === top.name)) {
        recs.push({
          id: `deficit-${top.categoryId}`,
          title: `Cut ${top.name} to close your ${formatINR(-availableMoney)} deficit`,
          description: `Your expenses exceed income by ${formatINR(-availableMoney)}. ${top.name} (${formatINR(top.thisMonth)}) is your top non-essential expense. Reducing it by 30% saves ${formatINR(Math.round(top.thisMonth * 0.3))}.`,
          potentialSaving: Math.round(top.thisMonth * 0.3),
          category: top.name,
          priority: 'high',
          icon: 'trending-down',
        });
      }
    }
  } else if (availableMoney > 0 && availableMoney < monthlyIncome * 0.1) {
    // Expenses ≈ income: low savings rate
    recs.push({
      id: 'savings-rate',
      title: `Boost savings from ${Math.round((availableMoney / monthlyIncome) * 100)}% to 20%`,
      description: `You're only saving ${formatINR(availableMoney)} (${Math.round((availableMoney / monthlyIncome) * 100)}% of income). Reaching 20% means saving ${formatINR(Math.round(monthlyIncome * 0.2))} — just ${formatINR(Math.round(monthlyIncome * 0.2 - availableMoney))} more per month.`,
      potentialSaving: Math.round(monthlyIncome * 0.2) - availableMoney,
      category: 'General',
      priority: 'high',
      icon: 'piggy-bank',
    });
  } else if (availableMoney >= monthlyIncome * 0.2) {
    // Strong surplus: suggest investment
    recs.push({
      id: 'invest-surplus',
      title: `You have ${formatINR(availableMoney)} surplus — invest it`,
      description: `You're saving ${Math.round((availableMoney / monthlyIncome) * 100)}% of income. Consider investing ${formatINR(Math.round(availableMoney * 0.5))}/month in a mutual fund SIP to grow wealth beyond your ${profile.dreamGoal} goal.`,
      potentialSaving: Math.round(availableMoney * 0.5),
      category: 'General',
      priority: 'low',
      icon: 'piggy-bank',
    });
  }

  // ── Phase 6: Eating-out frequency analysis (only if high) ──
  const diningTx = transactions.filter((t) =>
    t.type === 'expense' &&
    /restaurant|cafe|dinner|lunch|food|swiggy|zomato|eat|pizza|burger/i.test(t.note + (t.expenseName ?? '')),
  );
  if (diningTx.length >= 5) {
    const total = diningTx.reduce((s, t) => s + t.amount, 0);
    const foodTrend = trends.find((t) => /food|dining/i.test(t.name));
    if (foodTrend && foodTrend.incomePct > 15 && !recs.some((r) => r.category === foodTrend.name && r.id === 'dining')) {
      recs.push({
        id: 'dining',
        title: `You ate out ${diningTx.length} times — ${formatINR(total)} on dining`,
        description: `Food is ${Math.round(foodTrend.incomePct)}% of your income. Cooking 2 more meals per week could save ${formatINR(Math.round(total * 0.35))}/month.`,
        potentialSaving: Math.round(total * 0.35),
        category: 'Food',
        priority: 'medium',
        icon: 'utensils',
      });
    }
  }

  // Deduplicate by category, keeping highest potential saving
  const byCategory = new Map<string, SavingRecommendation>();
  for (const r of recs) {
    const existing = byCategory.get(r.category);
    if (!existing || r.potentialSaving > existing.potentialSaving) byCategory.set(r.category, r);
  }

  return Array.from(byCategory.values())
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      return b.potentialSaving - a.potentialSaving;
    })
    .slice(0, 6);
}

// ─── Location Intelligence ──────────────────────────────────────────────────

export interface LocationTip {
  id: string;
  title: string;
  description: string;
  potentialSaving: number;
  category: string;
}

export function getLocationTips(profile: UserProfile): LocationTip[] {
  const city = profile.city.toLowerCase();
  const tips: LocationTip[] = [];

  const metros = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'chennai', 'kolkata', 'ahmedabad'];
  const isMetro = metros.some((m) => city.includes(m));

  if (isMetro) {
    tips.push({ id: 'metro-transport', title: 'Use metro instead of cabs', description: `In ${profile.city}, daily metro rides cost ₹60-80 vs ₹300+ for cabs. Switching your daily commute saves significantly.`, potentialSaving: 4500, category: 'Transport' });
    tips.push({ id: 'metro-rent', title: 'Consider shared housing', description: `Rent in ${profile.city} is high. Sharing a 2BHK with a roommate can cut your rent by 40-50%.`, potentialSaving: 8000, category: 'Rent' });
    tips.push({ id: 'metro-food', title: 'Buy groceries from local markets', description: `Local mandis in ${profile.city} offer fresh produce at 30-40% less than supermarkets. Visit weekly for bulk savings.`, potentialSaving: 2000, category: 'Groceries' });
    tips.push({ id: 'metro-offers', title: 'Use city-specific discount apps', description: `Apps like Magicpin and Nearbuy offer ${profile.city}-specific deals on dining and shopping. Check before you pay.`, potentialSaving: 1500, category: 'Shopping' });
  } else {
    tips.push({ id: 'town-transport', title: 'Use a two-wheeler for commutes', description: `In ${profile.city}, a two-wheeler costs far less per km than auto-rickshaws or cabs for daily commuting.`, potentialSaving: 2500, category: 'Transport' });
    tips.push({ id: 'town-bulk', title: 'Buy staples in bulk', description: `Local wholesale stores in ${profile.city} offer better rates on rice, dal, and oil when bought monthly.`, potentialSaving: 1200, category: 'Groceries' });
    tips.push({ id: 'town-utilities', title: 'Monitor electricity usage', description: `Switch to LED bulbs and turn off unused appliances to reduce monthly bills.`, potentialSaving: 800, category: 'Bills' });
  }

  tips.push({ id: 'upi-cashback', title: 'Use UPI cashback offers', description: 'Many UPI apps offer cashback on bill payments and recharges. Check offers before paying.', potentialSaving: 300, category: 'Bills' });
  tips.push({ id: 'off-season', title: 'Shop during seasonal sales', description: 'Buy clothes and electronics during festive sales (Diwali, year-end) for 30-50% discounts.', potentialSaving: 3000, category: 'Shopping' });
  tips.push({ id: 'fuel-night', title: 'Fill fuel at night or early morning', description: 'Fuel is denser at cooler temperatures, so you get slightly more for the same price. Small savings add up.', potentialSaving: 400, category: 'Fuel' });

  return tips;
}

// ─── Agentic Workflow ───────────────────────────────────────────────────────

export interface WorkflowStep {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  status: 'complete' | 'active' | 'pending';
  detail: string;
}

export function buildWorkflow(
  profile: UserProfile,
  categories: ExpenseCategory[],
  monthlyContribution: number,
): WorkflowStep[] {
  const totalSpent = getTotalSpent(categories);
  const totalBudget = getTotalBudget(categories);
  const monthlyIncome = getMonthlyIncome(profile);
  const availableMoney = monthlyIncome - totalSpent;
  const monthsLeft = monthsUntilTarget(profile);
  const remainingGoal = Math.max(0, profile.goalCost - profile.currentSavings);
  const requiredSaving = remainingGoal > 0 ? remainingGoal / monthsLeft : 0;
  const topCat = [...categories].sort((a, b) => b.spent - a.spent)[0];

  return [
    { id: 1, title: 'Understand Goals', subtitle: 'Profile & dream captured', icon: 'target', status: 'complete', detail: `${profile.dreamGoal} · ${formatINR(profile.goalCost)} · target ${monthsLeft} months away` },
    { id: 2, title: 'Analyze Expenses', subtitle: 'Spending patterns mapped', icon: 'scan', status: categories.length > 0 ? 'complete' : 'pending', detail: `${categories.length} categories · ${formatINR(totalSpent)} spent · top: ${topCat?.name ?? '—'}` },
    { id: 3, title: 'Predict Savings', subtitle: 'Goal timeline projected', icon: 'trending-up', status: monthlyContribution > 0 || availableMoney > 0 ? 'complete' : 'active', detail: `Need ${formatINR(requiredSaving)}/mo · can save ${formatINR(Math.max(0, availableMoney))} · gap ${formatINR(Math.max(0, requiredSaving - Math.max(0, availableMoney)))}` },
    { id: 4, title: 'Recommend Actions', subtitle: 'Smart suggestions ready', icon: 'sparkles', status: 'active', detail: availableMoney < 0 ? `Reduce spending by ${formatINR(-availableMoney)} to break even` : availableMoney > requiredSaving ? `Surplus of ${formatINR(availableMoney - requiredSaving)} — ahead of target!` : `On track — maintain pace to reach your ${profile.dreamGoal}` },
  ];
}

// ─── AI Financial Insights Engine ───────────────────────────────────────────

export interface AIInsights {
  financialHealthScore: number; // 0-100
  savingsScore: number; // 0-100
  budgetScore: number; // 0-100
  goalAchievementProbability: number; // 0-100
  healthLabel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  topUnnecessaryExpenses: { name: string; amount: number; reason: string }[];
  overspendingAlerts: { category: string; amount: number; budget: number }[];
  monthlySpendingTrend: 'increasing' | 'decreasing' | 'stable';
  bestSavingOpportunities: { title: string; amount: number }[];
  emergencyFundRecommendation: { target: number; current: number; months: number };
  investmentSuggestions: { title: string; description: string; amount: number }[];
  summary: string;
}

export function computeAIInsights(
  profile: UserProfile,
  categories: ExpenseCategory[],
  transactions: Transaction[],
  monthlyContribution: number,
): AIInsights {
  const monthlyIncome = getMonthlyIncome(profile);
  const totalSpent = getTotalSpent(categories);
  const totalBudget = getTotalBudget(categories);
  const plan = buildPlan(profile, totalSpent, monthlyContribution, totalBudget);
  const savingsAmount = plan.savingsAmount;
  const savingsRate = monthlyIncome > 0 ? savingsAmount / monthlyIncome : 0;
  const expenseRatio = monthlyIncome > 0 ? totalSpent / monthlyIncome : 0;

  // Savings Score (0-100): based on savings rate vs 20% ideal
  const savingsScore = Math.min(100, Math.round(savingsRate * 500));

  // Budget Score (0-100): based on budget adherence
  let budgetScore = 70;
  if (totalBudget > 0) {
    const usedPct = totalSpent / totalBudget;
    if (usedPct < 0.7) budgetScore = 95;
    else if (usedPct < 0.9) budgetScore = 80;
    else if (usedPct <= 1) budgetScore = 60;
    else budgetScore = Math.max(20, 60 - Math.round((usedPct - 1) * 100));
  }

  // Goal Achievement Probability: based on savings pace vs required
  let goalProb = 50;
  if (plan.goalComplete) goalProb = 100;
  else if (plan.requiredMonthlySaving <= 0) goalProb = 90;
  else if (savingsAmount >= plan.requiredMonthlySaving) goalProb = 85;
  else if (savingsAmount > 0) goalProb = Math.round(40 + (savingsAmount / plan.requiredMonthlySaving) * 40);
  else goalProb = 20;

  // Financial Health Score: weighted blend
  const financialHealthScore = Math.round(savingsScore * 0.35 + budgetScore * 0.3 + goalProb * 0.35);

  const healthLabel = financialHealthScore >= 80 ? 'Excellent' : financialHealthScore >= 60 ? 'Good' : financialHealthScore >= 40 ? 'Fair' : 'Poor';

  // Top unnecessary expenses (entertainment, dining, shopping)
  const unnecessaryCats = ['Entertainment', 'Food', 'Shopping'];
  const topUnnecessaryExpenses = categories
    .filter((c) => unnecessaryCats.some((n) => c.name.toLowerCase().includes(n.toLowerCase())) && c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3)
    .map((c) => ({
      name: c.name,
      amount: c.spent,
      reason: c.spent > monthlyIncome * 0.15 ? 'Above 15% of income' : 'Non-essential category',
    }));

  // Overspending alerts
  const overspendingAlerts = categories
    .filter((c) => c.budget > 0 && c.spent > c.budget)
    .map((c) => ({ category: c.name, amount: c.spent, budget: c.budget }))
    .sort((a, b) => (b.amount - b.budget) - (a.amount - a.budget))
    .slice(0, 4);

  // Monthly spending trend (compare last 2 months)
  const now = new Date();
  const thisMonth = transactions.filter((t) => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth());
  const lastMonth = transactions.filter((t) => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth() - 1);
  const thisTotal = thisMonth.reduce((s, t) => s + t.amount, 0);
  const lastTotal = lastMonth.reduce((s, t) => s + t.amount, 0);
  const monthlySpendingTrend: AIInsights['monthlySpendingTrend'] =
    lastTotal === 0 ? 'stable' : thisTotal > lastTotal * 1.1 ? 'increasing' : thisTotal < lastTotal * 0.9 ? 'decreasing' : 'stable';

  // Best saving opportunities from recommendations
  const recs = generateRecommendations(profile, categories, transactions);
  const bestSavingOpportunities = recs.slice(0, 4).map((r) => ({ title: r.title, amount: r.potentialSaving }));

  // Emergency fund recommendation: 3-6 months of expenses
  const emergencyTarget = totalSpent * 3;
  const emergencyCurrent = profile.currentSavings;
  const emergencyMonths = totalSpent > 0 ? Math.round(emergencyCurrent / totalSpent) : 0;

  // Investment suggestions
  const investmentSuggestions: AIInsights['investmentSuggestions'] = [];
  if (savingsAmount > 2000) {
    investmentSuggestions.push({
      title: 'Start a SIP in Mutual Funds',
      description: `Invest ${formatINR(Math.round(savingsAmount * 0.5))}/month in an index fund SIP. At 12% annual returns, it could grow to ${formatINR(Math.round(savingsAmount * 0.5 * 12 * 5 * 1.8))} in 5 years.`,
      amount: Math.round(savingsAmount * 0.5),
    });
  }
  if (savingsAmount > 5000) {
    investmentSuggestions.push({
      title: 'Diversify with Gold Bonds',
      description: `Sovereign Gold Bonds offer 2.5% annual interest plus gold price appreciation. Invest ${formatINR(Math.round(savingsAmount * 0.2))} as a hedge against inflation.`,
      amount: Math.round(savingsAmount * 0.2),
    });
  }
  if (savingsAmount > 10000) {
    investmentSuggestions.push({
      title: 'Build a Stock Portfolio',
      description: `With ${formatINR(savingsAmount)} available, consider allocating ${formatINR(Math.round(savingsAmount * 0.3))} to blue-chip stocks for long-term growth.`,
      amount: Math.round(savingsAmount * 0.3),
    });
  }
  if (investmentSuggestions.length === 0 && savingsAmount > 0) {
    investmentSuggestions.push({
      title: 'Build an Emergency Fund First',
      description: `Before investing, save ${formatINR(emergencyTarget)} (3 months of expenses) in a high-interest savings account or liquid fund.`,
      amount: emergencyTarget,
    });
  }

  // Summary
  const summary = `${profile.name}, your financial health is ${healthLabel.toLowerCase()} (${financialHealthScore}/100). You're saving ${Math.round(savingsRate * 100)}% of your income. ${goalProb >= 70 ? `You have a strong chance of reaching your ${profile.dreamGoal}.` : goalProb >= 40 ? `Reaching your ${profile.dreamGoal} requires boosting your savings rate.` : `Your ${profile.dreamGoal} goal is at risk — increase savings or reduce spending.`} ${overspendingAlerts.length > 0 ? `You're overspending in ${overspendingAlerts.length} categor${overspendingAlerts.length === 1 ? 'y' : 'ies'}.` : 'Your budget adherence is excellent.'}`;

  return {
    financialHealthScore,
    savingsScore,
    budgetScore,
    goalAchievementProbability: goalProb,
    healthLabel,
    topUnnecessaryExpenses,
    overspendingAlerts,
    monthlySpendingTrend,
    bestSavingOpportunities,
    emergencyFundRecommendation: { target: emergencyTarget, current: emergencyCurrent, months: emergencyMonths },
    investmentSuggestions,
    summary,
  };
}

// ─── Bill Scan Insights ─────────────────────────────────────────────────────

export interface BillInsight {
  category: string;
  amount: number;
  changePct: number; // vs last month, positive = higher
  potentialSaving: number;
  message: string;
}

export function generateBillInsights(
  categories: ExpenseCategory[],
  transactions: Transaction[],
  scannedCategoryName: string,
  scannedAmount: number,
): BillInsight[] {
  const now = new Date();
  const thisM = now.getMonth();
  const lastM = thisM === 0 ? 11 : thisM - 1;
  const thisY = now.getFullYear();
  const lastY = thisM === 0 ? thisY - 1 : thisY;

  const insights: BillInsight[] = [];

  const trends = categories.map((cat) => {
    const thisMonthTx = transactions.filter((t) =>
      t.type === 'expense' && t.categoryId === cat.id &&
      new Date(t.date).getMonth() === thisM && new Date(t.date).getFullYear() === thisY,
    );
    const lastMonthTx = transactions.filter((t) =>
      t.type === 'expense' && t.categoryId === cat.id &&
      new Date(t.date).getMonth() === lastM && new Date(t.date).getFullYear() === lastY,
    );
    const thisMonth = thisMonthTx.reduce((s, t) => s + t.amount, 0);
    const lastMonth = lastMonthTx.reduce((s, t) => s + t.amount, 0);
    return { name: cat.name, thisMonth, lastMonth, budget: cat.budget };
  });

  for (const t of trends) {
    if (t.thisMonth <= 0 && t.name !== scannedCategoryName) continue;

    const totalThisMonth = t.name === scannedCategoryName ? t.thisMonth + scannedAmount : t.thisMonth;
    const changePct = t.lastMonth > 0 ? ((totalThisMonth - t.lastMonth) / t.lastMonth) * 100 : totalThisMonth > 0 ? 100 : 0;

    if (totalThisMonth < 100) continue;

    const isScannedCategory = t.name === scannedCategoryName;
    const prefix = isScannedCategory ? `You spent ${formatINR(totalThisMonth)} on ${t.name}.` : `${t.name}: ${formatINR(totalThisMonth)} this month.`;

    if (changePct > 15) {
      const cutPct = changePct > 50 ? 0.2 : 0.1;
      const potentialSaving = Math.round(totalThisMonth * cutPct);
      insights.push({
        category: t.name,
        amount: totalThisMonth,
        changePct: Math.round(changePct),
        potentialSaving,
        message: `${prefix} This is ${Math.round(changePct)}% higher than last month (${formatINR(t.lastMonth)}). Reducing it by ${Math.round(cutPct * 100)}% can save ${formatINR(potentialSaving)}.`,
      });
    } else if (t.budget > 0 && totalThisMonth > t.budget) {
      const overspent = totalThisMonth - t.budget;
      insights.push({
        category: t.name,
        amount: totalThisMonth,
        changePct: Math.round(changePct),
        potentialSaving: overspent,
        message: `${prefix} You've exceeded your budget of ${formatINR(t.budget)} by ${formatINR(overspent)}. Staying within budget saves ${formatINR(overspent)}.`,
      });
    }
  }

  return insights.sort((a, b) => b.potentialSaving - a.potentialSaving).slice(0, 3);
}

// ─── AI Financial Coach Response Engine ─────────────────────────────────────

export interface CoachContext {
  profile: UserProfile;
  categories: ExpenseCategory[];
  transactions: Transaction[];
  monthlyContribution: number;
}

export function generateCoachResponse(question: string, ctx: CoachContext): { text: string; action?: { type: 'expense_added'; amount: number; category: string } | { type: 'saving_added'; amount: number } } {
  const { profile, categories, transactions, monthlyContribution } = ctx;
  const lower = question.toLowerCase();
  const totalSpent = getTotalSpent(categories);
  const totalBudget = getTotalBudget(categories);
  const monthlyIncome = getMonthlyIncome(profile);
  const plan = buildPlan(profile, totalSpent, monthlyContribution, totalBudget);
  const insights = computeAIInsights(profile, categories, transactions, monthlyContribution);

  // Expense logging
  const parsed = parseExpenseText(question);
  if (parsed.amount && parsed.amount > 0 && /spent|paid|bought|pay|spend|for|on|₹|rs|cost|charge/i.test(question)) {
    const result = categorizeExpense(parsed.description, categories);
    if (result.categoryId) {
      return {
        text: `Logged ${formatINR(parsed.amount)} for "${parsed.description}" under ${result.categoryName} (${Math.round(result.confidence * 100)}% confidence${result.merchant ? `, merchant: ${result.merchant}` : ''}). 

After this expense: You've spent ${formatINR(totalSpent + parsed.amount)} this month (${Math.round(((totalSpent + parsed.amount) / monthlyIncome) * 100)}% of income). ${plan.availableMoney - parsed.amount > 0 ? `You still have ${formatINR(plan.availableMoney - parsed.amount)} available.` : `You're now over budget by ${formatINR(parsed.amount - plan.availableMoney)}.`}`,
        action: { type: 'expense_added', amount: parsed.amount, category: result.categoryName },
      };
    }
  }

  // Savings logging
  if (/saved|saving|deposited|set aside/i.test(lower) && parsed.amount && parsed.amount > 0) {
    return {
      text: `Great job saving ${formatINR(parsed.amount)}! Your total savings are now ${formatINR(profile.currentSavings + parsed.amount)} (${Math.round(((profile.currentSavings + parsed.amount) / profile.goalCost) * 100)}% of your ${profile.dreamGoal} goal). At this pace, you'll reach your goal in ${plan.monthsToGoal ?? '—'} months.`,
      action: { type: 'saving_added', amount: parsed.amount },
    };
  }

  // Comprehensive financial overview
  if (/overview|summary|how am i|financial|status|health|report/i.test(lower)) {
    return {
      text: `Here's your financial overview:

Income: ${formatINR(monthlyIncome)}/month
Expenses: ${formatINR(totalSpent)} (${Math.round(plan.expenseToIncomeRatio)}% of income)
Available Balance: ${formatINR(plan.availableMoney)}
Savings: ${formatINR(plan.savingsAmount)} (${Math.round(plan.savingsPercentage)}% of income)
Goal Progress: ${Math.round(plan.goalProgress * 100)}% toward your ${profile.dreamGoal}
Financial Health Score: ${insights.financialHealthScore}/100 (${insights.healthLabel})
Goal Achievement Probability: ${insights.goalAchievementProbability}%

${insights.summary}`,
    };
  }

  // How much to save
  if (/how much.*save|save.*how much|saving.*target|need.*save/i.test(lower)) {
    return {
      text: `To reach your ${profile.dreamGoal} (${formatINR(profile.goalCost)}) by your target date:

Monthly: ${formatINR(plan.requiredMonthlySaving)}/month
Weekly: ${formatINR(plan.requiredWeeklySaving)}/week
Daily: ${formatINR(plan.requiredDailySaving)}/day

You currently have ${formatINR(profile.currentSavings)} saved (${Math.round(plan.goalProgress * 100)}% complete). ${plan.savingsAmount >= plan.requiredMonthlySaving ? `You're saving ${formatINR(plan.savingsAmount)}/month — ahead of target!` : `You need to save ${formatINR(plan.requiredMonthlySaving - plan.savingsAmount)} more per month to stay on track.`}

If you save ${formatINR(Math.ceil(plan.requiredDailySaving * 1.2))} every day, you can reach your ${profile.dreamGoal} ${Math.max(1, Math.round((plan.monthsToGoal ?? 1) * 0.15 * 30))} days earlier.`,
    };
  }

  // On track check
  if (/track|ahead|behind|will i|can i|achieve|complete|reach/i.test(lower)) {
    const prob = insights.goalAchievementProbability;
    return {
      text: `${prob >= 70 ? `You're on track to achieve your ${profile.dreamGoal}!` : prob >= 40 ? `You're making progress but need to increase your savings.` : `Your ${profile.dreamGoal} goal is at risk.`}

Goal Achievement Probability: ${prob}%
Current Progress: ${Math.round(plan.goalProgress * 100)}% (${formatINR(profile.currentSavings)} of ${formatINR(profile.goalCost)})
Estimated Completion: ${plan.estimatedCompletion ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][plan.estimatedCompletion.month]} ${plan.estimatedCompletion.year}` : '—'}
${plan.delayDays > 0 ? `You're projected to be ${plan.delayDays} days late. Increase savings by ${formatINR(Math.ceil(plan.requiredMonthlySaving * 0.15))}/month to catch up.` : plan.delayDays < 0 ? `You're ${Math.abs(plan.delayDays)} days ahead of schedule!` : `You're right on target.`}`,
    };
  }

  // Cut costs / reduce spending
  if (/cut|reduce|save.*money|where.*save|spend.*less|cheaper/i.test(lower)) {
    if (categories.length === 0) return { text: "Add expense categories first, then I can spot where to cut." };
    const top = [...categories].sort((a, b) => b.spent - a.spent)[0];
    if (!top || top.spent === 0) return { text: "You haven't logged any expenses yet. Start tracking to get personalized cut recommendations." };

    const topPct = monthlyIncome > 0 ? Math.round((top.spent / monthlyIncome) * 100) : 0;
    const recs = insights.bestSavingOpportunities;
    return {
      text: `Your biggest spending is ${top.name} at ${formatINR(top.spent)} (${topPct}% of income). ${topPct > 30 ? `That's above the recommended 30% threshold.` : ``}

Top saving opportunities:
${recs.map((r, i) => `${i + 1}. ${r.title} — save ${formatINR(r.amount)}/mo`).join('\n')}

${insights.overspendingAlerts.length > 0 ? `Overspending alerts: ${insights.overspendingAlerts.map((a) => `${a.category} (${formatINR(a.amount - a.budget)} over budget)`).join(', ')}.` : `You're within all budgets — great control!`}`,
    };
  }

  // Budget health
  if (/budget|spending.*habit|am i overspend/i.test(lower)) {
    return {
      text: `Your budget health is ${plan.budgetHealth}.

Budget Used: ${formatINR(totalSpent)} of ${formatINR(totalBudget)} (${Math.round(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}%)
Budget Remaining: ${formatINR(plan.budgetRemaining)}
Expense-to-Income Ratio: ${Math.round(plan.expenseToIncomeRatio)}%

${insights.overspendingAlerts.length > 0 ? `You're overspending in these categories:\n${insights.overspendingAlerts.map((a) => `• ${a.category}: ${formatINR(a.amount)} spent vs ${formatINR(a.budget)} budget (${formatINR(a.amount - a.budget)} over)`).join('\n')}` : `You're within budget across all categories. Excellent discipline!`}`,
    };
  }

  // Investment advice
  if (/invest|investment|mutual fund|sip|stock|gold|grow.*money/i.test(lower)) {
    return {
      text: `Based on your available savings of ${formatINR(plan.savingsAmount)}/month:

${insights.investmentSuggestions.map((s, i) => `${i + 1}. ${s.title}\n   ${s.description}`).join('\n\n')}

Emergency Fund: You should have ${formatINR(insights.emergencyFundRecommendation.target)} (3 months of expenses) saved. You currently have ${formatINR(insights.emergencyFundRecommendation.current)} — that's ${insights.emergencyFundRecommendation.months} months of coverage.`,
    };
  }

  // Food / specific category spending
  if (/food|eat|dining|restaurant/i.test(lower)) {
    const foodCats = categories.filter((c) => /food|dining|entertainment|grocer/i.test(c.name));
    const foodTotal = foodCats.reduce((s, c) => s + c.spent, 0);
    const foodPct = monthlyIncome > 0 ? Math.round((foodTotal / monthlyIncome) * 100) : 0;
    return {
      text: `You've spent ${formatINR(foodTotal)} on food-related categories (${foodPct}% of income). ${foodPct > 30 ? `That's above the recommended 30%. Reducing to 25% can save ${formatINR(Math.round(monthlyIncome * 0.05))} every month.` : foodPct > 15 ? `That's a moderate amount. You could save ${formatINR(Math.round(foodTotal * 0.15))} by cooking more at home.` : `Your food spending is well controlled!`}`,
    };
  }

  // Available money / what can I spend
  if (/available|how much.*left|what.*spend|balance|remaining/i.test(lower)) {
    return {
      text: `You currently have ${formatINR(plan.availableMoney)} available after expenses.

Recommended allocation:
• Save ${formatINR(Math.round(plan.availableMoney * 0.6))} for your ${profile.dreamGoal} (60%)
• Keep ${formatINR(Math.round(plan.availableMoney * 0.3))} for emergencies (30%)
• Discretionary spending: ${formatINR(Math.round(plan.availableMoney * 0.1))} (10%)

${plan.availableMoney < 0 ? `You're spending more than you earn. Cut ${formatINR(-plan.availableMoney)} from your expenses urgently.` : plan.availableMoney < plan.requiredMonthlySaving ? `You need ${formatINR(plan.requiredMonthlySaving - plan.availableMoney)} more per month to reach your goal on time.` : `You have a surplus of ${formatINR(plan.availableMoney - plan.requiredMonthlySaving)} above your required savings!`}`,
    };
  }

  // Default: comprehensive personalized response
  return {
    text: `Here's what I see right now:

You have ${formatINR(monthlyIncome)} income and ${formatINR(totalSpent)} expenses, leaving ${formatINR(plan.availableMoney)} available. Your savings rate is ${Math.round(plan.savingsPercentage)}%, and you're ${Math.round(plan.goalProgress * 100)}% toward your ${profile.dreamGoal}.

I can help with:
• "How much should I save?" — daily/weekly/monthly targets
• "Am I on track?" — goal timeline & probability
• "Where can I cut costs?" — spending reduction tips
• "How is my budget?" — budget health & alerts
• "What should I invest in?" — investment suggestions
• "I spent ₹250 on pizza" — auto-logs the expense

Your financial health score is ${insights.financialHealthScore}/100 (${insights.healthLabel}).`,
  };
}
