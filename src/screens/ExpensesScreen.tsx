import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Tag, Wallet as WalletIcon, Banknote, Smartphone } from 'lucide-react';
import { useStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, NumberInput, TextInput, Select } from '@/components/ui/Input';
import { LinearProgress } from '@/components/ui/Progress';
import { AIAnalysisCard } from '@/components/AIAnalysisCard';
import { SavingsProtectionDialog } from '@/components/SavingsProtectionDialog';
import { formatINR, analyzePlan, savingsUseDelayDays, buildPlan, getTotalSpent, getTotalBudget } from '@/lib/finance';
import { fadeIn, stagger } from '@/lib/motion';
import type { PaymentMethod } from '@/types';
import { PAYMENT_METHODS } from '@/types';

export function ExpensesScreen() {
  const { profile, categories, transactions, addExpense, removeTransaction, spendFromSavings, monthlyContribution } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [showSavingsDialog, setShowSavingsDialog] = useState(false);

  const expenseTx = transactions.filter((t) => t.type === 'expense');
  const analysis = useMemo(
    () => profile ? analyzePlan(profile, categories, monthlyContribution) : null,
    [profile, categories, monthlyContribution],
  );
  const plan = profile ? buildPlan(profile, getTotalSpent(categories), monthlyContribution, getTotalBudget(categories)) : null;

  const handleAdd = () => {
    if (!categoryId) { setError('Pick a category'); return; }
    if (amount <= 0) { setError('Enter an amount'); return; }
    if (!expenseName.trim()) { setError('Enter an expense name'); return; }
    const cat = categories.find((c) => c.id === categoryId)!;
    addExpense({
      expenseName: expenseName.trim(),
      categoryId,
      categoryName: cat.name,
      amount,
      date: new Date(date).toISOString(),
      paymentMethod,
      note: note.trim(),
    });
    setShowForm(false);
    setExpenseName(''); setAmount(0); setNote(''); setError('');
    setPaymentMethod('cash');
    setDate(new Date().toISOString().slice(0, 10));
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } };

  const openForm = () => {
    setCategoryId(categories[0]?.id ?? '');
    setShowForm(true);
  };

  const paymentIcon = (m?: PaymentMethod) => {
    if (m === 'upi') return <Smartphone className="h-3.5 w-3.5" />;
    if (m === 'wallet') return <WalletIcon className="h-3.5 w-3.5" />;
    return <Banknote className="h-3.5 w-3.5" />;
  };
  const paymentLabel = (m?: PaymentMethod) => PAYMENT_METHODS.find((p) => p.value === m)?.label ?? 'Cash';

  // Savings protection: if user wants to spend from savings (budget exceeded)
  const handleSpendFromSavings = () => {
    if (amount <= 0) return;
    setShowSavingsDialog(true);
  };

  const confirmSpendSavings = () => {
    spendFromSavings(amount, note.trim() || expenseName.trim());
    setShowSavingsDialog(false);
    setShowForm(false);
    setExpenseName(''); setAmount(0); setNote(''); setError('');
  };

  const savingsDelay = plan ? savingsUseDelayDays(amount, plan.projectedSaving || monthlyContribution) : 0;

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-display">Expenses</h1>
          <p className="text-sm text-white/50">Track where your money goes</p>
        </div>
        <Button onClick={openForm} leftIcon={<Plus className="h-5 w-5" />} disabled={categories.length === 0}>
          Add Expense
        </Button>
      </motion.div>

      {categories.length === 0 ? (
        <motion.div variants={fadeIn}>
          <Card className="text-center py-12">
            <Tag className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 text-sm text-white/50">No expense categories yet.</p>
            <p className="text-xs text-white/35">Create categories in the Categories setup to start tracking expenses.</p>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* AI Analysis */}
          {analysis && profile && (
            <AIAnalysisCard analysis={analysis} />
          )}

          {/* Category cards */}
          <motion.div variants={fadeIn} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categories.map((c) => {
              const pct = c.budget > 0 ? Math.min(1, c.spent / c.budget) : 0;
              const over = c.spent > c.budget;
              return (
                <Card key={c.id} hover>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                      <p className="font-semibold text-white">{c.name}</p>
                    </div>
                    <p className={`text-sm font-bold ${over ? 'text-rose-400' : 'text-white/70'}`}>
                      {formatINR(c.spent)} <span className="text-white/35">/ {formatINR(c.budget)}</span>
                    </p>
                  </div>
                  <div className="mt-3">
                    <LinearProgress value={pct} color={over ? '#ef4444' : c.color} />
                    <p className="mt-1.5 text-xs text-white/40">
                      {over ? `${formatINR(c.spent - c.budget)} over budget` : `${formatINR(c.budget - c.spent)} left`}
                    </p>
                  </div>
                </Card>
              );
            })}
          </motion.div>

          {/* Transaction list */}
          <motion.div variants={fadeIn}>
            <Card>
              <h3 className="mb-4 font-bold font-display">All Expenses</h3>
              {expenseTx.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/40">No expenses logged yet.</p>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {expenseTx.map((t) => (
                      <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-white">{t.expenseName || t.categoryName}</p>
                          <p className="flex items-center gap-1.5 text-xs text-white/40">
                            <span className="flex items-center gap-0.5 rounded bg-white/8 px-1.5 py-0.5">
                              {paymentIcon(t.paymentMethod)} {paymentLabel(t.paymentMethod)}
                            </span>
                            {t.categoryName} · {new Date(t.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-rose-400">-{formatINR(t.amount)}</p>
                        <button onClick={() => removeTransaction(t.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-error-500/15 hover:text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}

      {/* Add expense modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="w-full max-w-md rounded-t-3xl bg-ink-800 p-6 border border-white/10 sm:rounded-3xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold font-display">Add Expense</h3>
                <button onClick={() => setShowForm(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <Field label="Expense Name">
                  <TextInput placeholder="e.g. Lunch at cafe" value={expenseName}
                    onChange={(e) => { setExpenseName(e.target.value); setError(''); }} onKeyDown={handleKey} autoFocus />
                </Field>
                <Field label="Category">
                  <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setError(''); }}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))} />
                </Field>
                <Field label="Amount">
                  <NumberInput prefix="₹" value={amount || ''} onChange={(n) => { setAmount(n); setError(''); }} onKeyDown={handleKey} />
                </Field>
                <Field label="Date">
                  <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="Payment Method">
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                        className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-semibold transition-all ${
                          paymentMethod === m.value
                            ? 'bg-primary-500 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}>
                        <span className="text-lg">{m.emoji}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Notes (optional)">
                  <TextInput placeholder="Any extra details…" value={note}
                    onChange={(e) => setNote(e.target.value)} onKeyDown={handleKey} />
                </Field>
                {error && <p className="text-xs font-medium text-rose-300">{error}</p>}
                <Button fullWidth size="lg" onClick={handleAdd}>Add Expense</Button>

                {/* Savings protection option */}
                {profile && amount > 0 && (
                  <button
                    onClick={handleSpendFromSavings}
                    className="w-full rounded-xl bg-accent-500/10 py-2.5 text-xs font-medium text-accent-400 hover:bg-accent-500/15"
                  >
                    Or use {formatINR(amount)} from savings instead
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SavingsProtectionDialog
        open={showSavingsDialog}
        amount={amount}
        delayDays={savingsDelay}
        dreamGoal={profile?.dreamGoal ?? 'your dream'}
        onCancel={() => setShowSavingsDialog(false)}
        onConfirm={confirmSpendSavings}
      />
    </motion.div>
  );
}
