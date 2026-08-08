import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, Trash2, Sparkles } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, NumberInput, TextInput } from '@/components/ui/Input';
import { SUGGESTED_CATEGORIES, CATEGORY_COLORS } from '@/types';
import { formatINR } from '@/lib/finance';
import { fadeIn, stagger } from '@/lib/motion';

export function CategoriesScreen({ onContinue }: { onContinue: () => void }) {
  const { categories, addCategory, removeCategory } = useStore();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState(0);
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!name.trim()) { setError('Enter a category name'); return; }
    if (budget <= 0) { setError('Enter a monthly budget'); return; }
    if (categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('You already added this category'); return;
    }
    addCategory({
      name: name.trim(),
      budget,
      color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
    });
    setName(''); setBudget(0); setError('');
  };

  const total = categories.reduce((s, c) => s + c.budget, 0);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-ink-900 to-ink-800 px-5 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.15),transparent_55%)]" />
      <motion.div className="relative mx-auto max-w-2xl" initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeIn} className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-semibold text-primary-300">
            <Sparkles className="h-3.5 w-3.5" /> Budget Setup
          </div>
          <h1 className="mt-4 text-3xl font-extrabold font-display">Create your expense categories</h1>
          <p className="mt-2 text-sm text-white/60">
            Build a budget that fits your life. Add your own categories and set a monthly limit for each.
          </p>
        </motion.div>

        {/* Add form */}
        <motion.div variants={fadeIn}>
          <Card className="mt-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field>
                  <TextInput autoFocus placeholder="Category name (e.g. Rent)"
                    value={name} onChange={(e) => { setName(e.target.value); setError(''); }} onKeyDown={handleKey} />
                </Field>
                <Field>
                  <NumberInput prefix="₹" placeholder="Monthly budget" value={budget || ''}
                    onChange={(n) => { setBudget(n); setError(''); }} onKeyDown={handleKey} />
                </Field>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAdd} leftIcon={<Plus className="h-5 w-5" />} className="h-14">
                  Add
                </Button>
              </div>
            </div>
            {error && <p className="mt-2 text-xs font-medium text-rose-300">{error}</p>}

            {/* Suggestions */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-white/40">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_CATEGORIES.filter((s) => !categories.some((c) => c.name.toLowerCase() === s.toLowerCase())).map((s) => (
                  <button key={s} onClick={() => setName(s)}
                    className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10">
                    <Plus className="h-3 w-3" />{s}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* List */}
        <motion.div variants={fadeIn} className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white/70">Your categories ({categories.length})</p>
            <p className="text-sm font-semibold text-accent-400">Total: {formatINR(total)}</p>
          </div>

          <AnimatePresence>
            {categories.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">
                No categories yet. Add your first one above.
              </motion.div>
            ) : (
              <div className="space-y-2.5">
                {categories.map((c) => (
                  <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Card className="!p-4 flex items-center gap-3">
                      <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{c.name}</p>
                        <p className="text-xs text-white/50">{formatINR(c.budget)}/month</p>
                      </div>
                      <button onClick={() => removeCategory(c.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-error-500/15 hover:text-rose-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-8">
          <Button size="lg" fullWidth rightIcon={<ArrowRight className="h-5 w-5" />} onClick={onContinue}
            disabled={categories.length === 0}>
            {categories.length === 0 ? 'Add at least one category' : 'Go to Dashboard'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
