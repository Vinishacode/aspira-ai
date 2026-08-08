import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Check, Tag, Sparkles, Zap, Store } from 'lucide-react';
import { useStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/finance';
import { categorizeExpense, generateBillInsights } from '@/lib/ai';
import type { BillInsight } from '@/lib/ai';
import { fadeIn, stagger } from '@/lib/motion';
import type { PaymentMethod, BillItem } from '@/types';
import { SAMPLE_BILLS, PAYMENT_METHODS } from '@/types';

interface ScannedItem extends BillItem {
  categoryName: string;
  confidence: number;
  merchant: string | null;
}

export function BillScanScreen() {
  const { categories, transactions, addBillExpenses } = useStore();
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'preview' | 'done'>('idle');
  const [selectedBill, setSelectedBill] = useState(0);
  const [matchedItems, setMatchedItems] = useState<ScannedItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [detectedMerchant, setDetectedMerchant] = useState<string | null>(null);
  const [detectedDate, setDetectedDate] = useState<string>('');
  const [insights, setInsights] = useState<BillInsight[]>([]);

  const handleScan = () => {
    setPhase('scanning');
    setTimeout(() => {
      const bill = SAMPLE_BILLS[selectedBill];
      const items: ScannedItem[] = bill.items.map((item, i) => {
        const result = categorizeExpense(`${item.name} ${item.hint}`, categories);
        return {
          id: `${bill.id}-item-${i}`,
          name: item.name,
          amount: item.amount,
          categoryId: result.categoryId,
          categoryName: result.categoryName,
          confidence: result.confidence,
          merchant: result.merchant,
        };
      });
      const merchantResult = categorizeExpense(bill.store, categories);
      setDetectedMerchant(merchantResult.merchant ?? bill.store);
      setDetectedDate(bill.date);
      setMatchedItems(items);
      setPhase('preview');
    }, 1800);
  };

  const handleConfirm = () => {
    const bill = SAMPLE_BILLS[selectedBill];
    const primaryCategory = matchedItems[0]?.categoryName ?? 'Groceries';
    const newInsights = generateBillInsights(categories, transactions, primaryCategory, total);
    setInsights(newInsights);
    addBillExpenses(matchedItems, paymentMethod, bill.store);
    setPhase('done');
  };

  const total = matchedItems.reduce((s, i) => s + i.amount, 0);
  const bill = SAMPLE_BILLS[selectedBill];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-extrabold font-display">Bill Scan</h1>
        <p className="text-sm text-white/50">Scan a receipt and auto-categorize items</p>
      </motion.div>

      {/* Bill selector */}
      <motion.div variants={fadeIn} className="flex flex-wrap gap-2">
        {SAMPLE_BILLS.map((b, i) => (
          <button key={b.id} onClick={() => setSelectedBill(i)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedBill === i ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}>
            {b.store}
          </button>
        ))}
      </motion.div>

      {phase === 'idle' && (
        <motion.div variants={fadeIn}>
          <Card className="flex flex-col items-center py-10">
            <div className="relative">
              <motion.div
                className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-500/15"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ScanLine className="h-10 w-10 text-primary-300" />
              </motion.div>
              <motion.div
                className="absolute inset-x-0 h-0.5 bg-primary-400"
                animate={{ top: ['10%', '85%', '10%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p className="mt-5 text-sm text-white/60">Ready to scan a demo receipt</p>
            <p className="mt-1 text-xs text-white/40">Select a bill above, then tap scan</p>
            <Button className="mt-5" size="lg" onClick={handleScan} leftIcon={<ScanLine className="h-5 w-5" />}>
              Scan Bill
            </Button>
          </Card>
        </motion.div>
      )}

      {phase === 'scanning' && (
        <motion.div variants={fadeIn}>
          <Card className="flex flex-col items-center py-12">
            <div className="relative h-24 w-24 overflow-hidden rounded-3xl bg-primary-500/10">
              <motion.div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <ScanLine className="absolute inset-0 m-auto h-10 w-10 text-primary-400/50" />
            </div>
            <p className="mt-5 text-sm font-medium text-primary-300">Scanning receipt…</p>
            <p className="mt-1 text-xs text-white/40">Detecting items and matching categories</p>
          </Card>
        </motion.div>
      )}

      {phase === 'preview' && (
        <motion.div variants={fadeIn} className="space-y-4">
          {/* AI Detection summary */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary-300" />
              <h3 className="font-bold font-display text-sm">AI Detection Results</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/5 p-2.5">
                <Store className="mx-auto h-4 w-4 text-accent-400 mb-1" />
                <p className="text-[10px] text-white/45">Merchant</p>
                <p className="text-xs font-semibold text-white truncate">{detectedMerchant ?? '—'}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-2.5">
                <Zap className="mx-auto h-4 w-4 text-primary-300 mb-1" />
                <p className="text-[10px] text-white/45">Items Detected</p>
                <p className="text-xs font-semibold text-white">{matchedItems.length}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-2.5">
                <Tag className="mx-auto h-4 w-4 text-primary-300 mb-1" />
                <p className="text-[10px] text-white/45">Avg Confidence</p>
                <p className="text-xs font-semibold text-primary-400">{matchedItems.length > 0 ? Math.round(matchedItems.reduce((s, i) => s + i.confidence, 0) / matchedItems.length * 100) : 0}%</p>
              </div>
            </div>
          </Card>

          {/* Receipt preview */}
          <Card className="!p-0 overflow-hidden">
            <div className="border-b border-white/10 bg-white/5 px-5 py-3">
              <p className="font-bold font-display">{detectedMerchant ?? bill.store}</p>
              <p className="text-xs text-white/40">{detectedDate ? new Date(detectedDate).toLocaleDateString() : new Date(bill.date).toLocaleDateString()}</p>
            </div>
            <div className="divide-y divide-white/5">
              {matchedItems.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-white/40">
                        <Tag className="h-3 w-3" />
                        {cat ? (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                            {item.categoryName}
                            <span className="ml-1 rounded bg-primary-500/15 px-1 text-[9px] font-bold text-primary-300">{Math.round(item.confidence * 100)}%</span>
                          </span>
                        ) : (
                          <span className="text-rose-400">No category</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-white">{formatINR(item.amount)}</p>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-5 py-3">
              <span className="font-bold text-white/80">Total</span>
              <span className="text-lg font-bold text-primary-400">{formatINR(total)}</span>
            </div>
          </Card>

          {/* Payment method */}
          <Card>
            <p className="mb-3 text-sm font-semibold text-white/70">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-semibold transition-all ${
                    paymentMethod === m.value ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}>
                  <span className="text-lg">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="ghost" fullWidth size="lg" onClick={() => setPhase('idle')}>Cancel</Button>
            <Button fullWidth size="lg" onClick={handleConfirm} rightIcon={<Check className="h-5 w-5" />}>
              Confirm & Add
            </Button>
          </div>
        </motion.div>
      )}

      {phase === 'done' && (
        <motion.div variants={fadeIn} className="space-y-4">
          <Card className="flex flex-col items-center py-8">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-500/20"
            >
              <Check className="h-10 w-10 text-primary-400" />
            </motion.div>
            <p className="mt-5 text-lg font-bold font-display text-primary-300">Expenses Added!</p>
            <p className="mt-1 text-sm text-white/50">Wallet, dashboard, charts & goal progress updated</p>
          </Card>

          {insights.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-accent-400" />
                <h3 className="font-bold font-display text-sm">AI Spending Insights</h3>
              </div>
              <div className="space-y-3">
                {insights.map((ins, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                    className="rounded-xl bg-white/5 p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white/80">{ins.category}</span>
                      <span className="text-[10px] font-bold text-rose-400">+{ins.changePct}% vs last month</span>
                    </div>
                    <p className="text-xs leading-relaxed text-white/60">{ins.message}</p>
                    {ins.potentialSaving > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-accent-500/10 px-2 py-1.5">
                        <Zap className="h-3 w-3 text-accent-400" />
                        <span className="text-[11px] font-semibold text-accent-300">Potential saving: {formatINR(ins.potentialSaving)}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          <Button fullWidth size="lg" variant="ghost" onClick={() => {
            setPhase('idle'); setMatchedItems([]); setInsights([]);
          }}>
            Scan Another Bill
          </Button>
        </motion.div>
      )}

      <AnimatePresence />
    </motion.div>
  );
}
