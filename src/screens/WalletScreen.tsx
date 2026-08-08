import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowDownLeft, ArrowUpRight, X, Wallet as WalletIcon, PiggyBank } from 'lucide-react';
import { useStore } from '@/store';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, NumberInput, TextInput, Select } from '@/components/ui/Input';
import { formatINR } from '@/lib/finance';
import { fadeIn, stagger } from '@/lib/motion';

export function WalletScreen() {
  const { profile, categories, transactions, addTransaction, removeTransaction, monthlyContribution, walletBalance } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'income' | 'saving'>('income');
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const incomeTotal = profile ? (profile.incomeType === 'daily' ? profile.incomeAmount * 30 : profile.incomeAmount) : 0;
  const incomeTx = transactions.filter((t) => t.type === 'income');
  const savingTx = transactions.filter((t) => t.type === 'saving');
  const totalSaved = (profile?.currentSavings ?? 0) + monthlyContribution + savingTx.reduce((s, t) => s + t.amount, 0);

  const handleAdd = () => {
    if (amount <= 0) { setError('Enter an amount'); return; }
    addTransaction({
      categoryId: type, categoryName: type === 'income' ? 'Income' : 'Savings',
      amount, note: note.trim(), date: new Date().toISOString(), type,
    });
    setShowForm(false); setAmount(0); setNote(''); setError('');
  };
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-display">Wallet</h1>
          <p className="text-sm text-white/50">Income & savings</p>
        </div>
        <Button onClick={() => { setType('income'); setShowForm(true); }} leftIcon={<Plus className="h-5 w-5" />}>Add Money</Button>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Available Balance" value={formatINR(walletBalance)} icon={<WalletIcon className="h-5 w-5" />} accent="#38bdf8" />
        <StatCard label="Monthly Income" value={formatINR(incomeTotal)} icon={<WalletIcon className="h-5 w-5" />} accent="#34d399" />
        <StatCard label="Total Saved" value={formatINR(totalSaved)} icon={<PiggyBank className="h-5 w-5" />} accent="#fbbf24" />
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card>
          <h3 className="mb-4 font-bold font-display">All Money Moves</h3>
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {transactions.map((t) => (
                  <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.type === 'expense' ? 'bg-rose-500/15 text-rose-400' : t.type === 'saving' ? 'bg-accent-500/15 text-accent-400' : 'bg-primary-500/15 text-primary-400'}`}>
                      {t.type === 'expense' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">{t.categoryName}</p>
                      <p className="text-xs text-white/40">{t.note || '—'} · {new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <p className={`text-sm font-bold ${t.type === 'expense' ? 'text-rose-400' : 'text-primary-400'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatINR(t.amount)}
                    </p>
                    <button onClick={() => removeTransaction(t.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 hover:text-rose-400">
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="w-full max-w-md rounded-t-3xl bg-ink-800 p-6 border border-white/10 sm:rounded-3xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold font-display">Add Money</h3>
                <button onClick={() => setShowForm(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(['income', 'saving'] as const).map((t) => (
                    <button key={t} onClick={() => setType(t)}
                      className={`rounded-xl py-2.5 text-sm font-semibold capitalize ${type === t ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/60'}`}>
                      {t === 'saving' ? 'Add Savings' : 'Add Income'}
                    </button>
                  ))}
                </div>
                <Field label="Amount">
                  <NumberInput prefix="₹" autoFocus value={amount || ''} onChange={(n) => { setAmount(n); setError(''); }} onKeyDown={handleKey} />
                </Field>
                <Field label="Note (optional)">
                  <TextInput placeholder="e.g. Salary / Bonus" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={handleKey} />
                </Field>
                {error && <p className="text-xs font-medium text-rose-300">{error}</p>}
                <Button fullWidth size="lg" onClick={handleAdd}>Add</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
