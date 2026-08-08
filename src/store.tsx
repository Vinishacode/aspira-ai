import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AppState, UserProfile, ExpenseCategory, Transaction, PaymentMethod, BillItem } from '@/types';

const STORAGE_KEY = 'aspira-ai-state-v2';

const DEFAULT_STATE: AppState = {
  onboarded: false,
  profile: null,
  categories: [],
  transactions: [],
  monthlyContribution: 0,
  savingsUsed: 0,
  walletBalance: 0,
};

interface AddExpenseInput {
  expenseName: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  note?: string;
}

interface StoreContextValue extends AppState {
  setProfile: (p: UserProfile) => void;
  completeOnboarding: () => void;
  addCategory: (c: Omit<ExpenseCategory, 'id' | 'spent'>) => void;
  updateCategory: (id: string, patch: Partial<ExpenseCategory>) => void;
  removeCategory: (id: string) => void;
  addExpense: (e: AddExpenseInput) => void;
  addBillExpenses: (items: BillItem[], paymentMethod: PaymentMethod, storeName: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  setMonthlyContribution: (n: number) => void;
  spendFromSavings: (amount: number, note: string) => void;
  addSavings: (amount: number) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // migrate v1 -> v2
      if (parsed && !('savingsUsed' in parsed)) parsed.savingsUsed = 0;
      if (parsed && !('walletBalance' in parsed)) parsed.walletBalance = 0;
      return { ...DEFAULT_STATE, ...parsed };
    }
    // try v1 key
    const v1 = localStorage.getItem('aspira-ai-state-v1');
    if (v1) {
      const parsed = JSON.parse(v1);
      if (parsed && !('savingsUsed' in parsed)) parsed.savingsUsed = 0;
      if (parsed && !('walletBalance' in parsed)) parsed.walletBalance = 0;
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch { /* ignore */ }
  return DEFAULT_STATE;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const setProfile = useCallback((p: UserProfile) =>
    setState((s) => ({ ...s, profile: p })), []);

  const completeOnboarding = useCallback(() =>
    setState((s) => {
      const income = s.profile ? (s.profile.incomeType === 'daily' ? s.profile.incomeAmount * 30 : s.profile.incomeAmount) : 0;
      return { ...s, onboarded: true, walletBalance: s.walletBalance > 0 ? s.walletBalance : income };
    }), []);

  const addCategory = useCallback((c: Omit<ExpenseCategory, 'id' | 'spent'>) =>
    setState((s) => ({ ...s, categories: [...s.categories, { ...c, id: cryptoId(), spent: 0 }] })), []);

  const updateCategory = useCallback((id: string, patch: Partial<ExpenseCategory>) =>
    setState((s) => ({ ...s, categories: s.categories.map((c) => c.id === id ? { ...c, ...patch } : c) })), []);

  const removeCategory = useCallback((id: string) =>
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) })), []);

  const addExpense = useCallback((e: AddExpenseInput) =>
    setState((s) => {
      const tx: Transaction = {
        id: cryptoId(),
        categoryId: e.categoryId,
        categoryName: e.categoryName,
        amount: e.amount,
        note: e.note ?? '',
        date: e.date,
        type: 'expense',
        expenseName: e.expenseName,
        paymentMethod: e.paymentMethod,
      };
      const categories = s.categories.map((c) => c.id === e.categoryId ? { ...c, spent: c.spent + e.amount } : c);
      return { ...s, transactions: [tx, ...s.transactions], categories, walletBalance: s.walletBalance - e.amount };
    }), []);

  const addBillExpenses = useCallback((items: BillItem[], paymentMethod: PaymentMethod, storeName: string) =>
    setState((s) => {
      const newTx: Transaction[] = [];
      const catMap = new Map(s.categories.map((c) => [c.id, c]));
      items.forEach((item) => {
        if (!item.categoryId) return;
        const cat = catMap.get(item.categoryId);
        if (!cat) return;
        newTx.push({
          id: cryptoId(),
          categoryId: item.categoryId,
          categoryName: cat.name,
          amount: item.amount,
          note: `${storeName} · ${item.name}`,
          date: new Date().toISOString(),
          type: 'expense',
          expenseName: item.name,
          paymentMethod,
        });
        catMap.set(item.categoryId, { ...cat, spent: cat.spent + item.amount });
      });
      const totalBillAmount = newTx.reduce((sum, t) => sum + t.amount, 0);
      return {
        ...s,
        transactions: [...newTx, ...s.transactions],
        categories: Array.from(catMap.values()),
        walletBalance: s.walletBalance - totalBillAmount,
      };
    }), []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) =>
    setState((s) => {
      const tx: Transaction = { ...t, id: cryptoId() };
      let categories = s.categories;
      let walletBalance = s.walletBalance;
      if (t.type === 'expense') {
        categories = s.categories.map((c) => c.id === t.categoryId ? { ...c, spent: c.spent + t.amount } : c);
        walletBalance = s.walletBalance - t.amount;
      } else if (t.type === 'income') {
        walletBalance = s.walletBalance + t.amount;
      }
      return { ...s, transactions: [tx, ...s.transactions], categories, walletBalance };
    }), []);

  const removeTransaction = useCallback((id: string) =>
    setState((s) => {
      const tx = s.transactions.find((x) => x.id === id);
      let categories = s.categories;
      let walletBalance = s.walletBalance;
      if (tx && tx.type === 'expense') {
        categories = s.categories.map((c) => c.id === tx.categoryId ? { ...c, spent: Math.max(0, c.spent - tx.amount) } : c);
        walletBalance = s.walletBalance + tx.amount;
      } else if (tx && tx.type === 'income') {
        walletBalance = Math.max(0, s.walletBalance - tx.amount);
      }
      return { ...s, transactions: s.transactions.filter((x) => x.id !== id), categories, walletBalance };
    }), []);

  const setMonthlyContribution = useCallback((n: number) =>
    setState((s) => ({ ...s, monthlyContribution: n })), []);

  const spendFromSavings = useCallback((amount: number, note: string) =>
    setState((s) => {
      if (!s.profile) return s;
      const newSavings = Math.max(0, s.profile.currentSavings - amount);
      const tx: Transaction = {
        id: cryptoId(),
        categoryId: 'savings',
        categoryName: 'Savings Withdrawal',
        amount,
        note: note || 'Used from savings',
        date: new Date().toISOString(),
        type: 'expense',
        expenseName: 'Savings Withdrawal',
        paymentMethod: 'wallet',
      };
      return {
        ...s,
        profile: { ...s.profile, currentSavings: newSavings },
        savingsUsed: s.savingsUsed + amount,
        transactions: [tx, ...s.transactions],
        walletBalance: s.walletBalance + amount,
      };
    }), []);

  const addSavings = useCallback((amount: number) =>
    setState((s) => {
      if (!s.profile || amount <= 0) return s;
      const tx: Transaction = {
        id: cryptoId(),
        categoryId: 'savings',
        categoryName: 'Savings',
        amount,
        note: 'Added to savings',
        date: new Date().toISOString(),
        type: 'saving',
        expenseName: 'Savings',
        paymentMethod: 'wallet',
      };
      return {
        ...s,
        profile: { ...s.profile, currentSavings: s.profile.currentSavings + amount },
        transactions: [tx, ...s.transactions],
        walletBalance: Math.max(0, s.walletBalance - amount),
      };
    }), []);

  const resetAll = useCallback(() =>
    setState(DEFAULT_STATE), []);

  const value: StoreContextValue = {
    ...state,
    setProfile,
    completeOnboarding,
    addCategory,
    updateCategory,
    removeCategory,
    addExpense,
    addBillExpenses,
    addTransaction,
    removeTransaction,
    setMonthlyContribution,
    spendFromSavings,
    addSavings,
    resetAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

function cryptoId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
