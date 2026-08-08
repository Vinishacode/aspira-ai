import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Check, ArrowRight, Shield, Loader2, Wallet as WalletIcon } from 'lucide-react';
import { useStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, TextInput, NumberInput } from '@/components/ui/Input';
import { formatINR } from '@/lib/finance';
import { fadeIn, stagger } from '@/lib/motion';
import type { PaymentMethod } from '@/types';
import { PAYMENT_METHODS } from '@/types';

export function DemoPaymentScreen() {
  const { profile, categories, addExpense, walletBalance } = useStore();
  const [phase, setPhase] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState(0);
  const [pin, setPin] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const [insufficientFunds, setInsufficientFunds] = useState(false);

  const handlePay = () => {
    if (amount <= 0) { setError('Enter an amount'); return; }
    if (amount > walletBalance) { setError(`Insufficient balance. Available: ${formatINR(walletBalance)}`); setInsufficientFunds(true); return; }
    if (paymentMethod === 'upi' && !upiId.trim()) { setError('Enter UPI ID or mobile number'); return; }
    if (paymentMethod === 'upi' && pin.length !== 4) { setError('Enter any 4-digit PIN'); return; }
    if (!categoryId) { setError('Pick a category'); return; }
    setError('');
    setPhase('processing');
    setTimeout(() => {
      const cat = categories.find((c) => c.id === categoryId)!;
      addExpense({
        expenseName: `Demo ${paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'wallet' ? 'Wallet' : 'Cash'} Payment`,
        categoryId,
        categoryName: cat.name,
        amount,
        date: new Date().toISOString(),
        paymentMethod,
        note: note.trim() || (paymentMethod === 'upi' ? `To ${upiId}` : ''),
      });
      setPhase('success');
      setTimeout(() => {
        setPhase('form');
        setUpiId(''); setAmount(0); setPin(''); setNote(''); setCategoryId(''); setInsufficientFunds(false);
      }, 2500);
    }, 2200);
  };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-extrabold font-display">Demo Payment</h1>
        <p className="text-sm text-white/50">Simulate a payment — it updates everything</p>
      </motion.div>

      {/* Wallet balance banner */}
      {phase === 'form' && (
        <motion.div variants={fadeIn}>
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15">
                <WalletIcon className="h-5 w-5 text-primary-300" />
              </div>
              <div>
                <p className="text-[11px] text-white/45">Available Balance</p>
                <p className="text-lg font-bold font-display text-white">{formatINR(walletBalance)}</p>
              </div>
            </div>
            {amount > 0 && (
              <div className="text-right">
                <p className="text-[11px] text-white/45">After Payment</p>
                <p className={`text-sm font-bold ${amount > walletBalance ? 'text-rose-400' : 'text-primary-400'}`}>{formatINR(walletBalance - amount)}</p>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {phase === 'form' && (
        <motion.div variants={fadeIn} className="space-y-4">
          {/* Payment method selector */}
          <Card>
            <p className="mb-3 text-sm font-semibold text-white/70">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl py-4 text-xs font-semibold transition-all ${
                    paymentMethod === m.value
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}>
                  <span className="text-xl">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </Card>

          {/* UPI-specific fields */}
          {paymentMethod === 'upi' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <Card className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-primary-300">
                  <Smartphone className="h-4 w-4" /> Demo UPI Payment
                </div>
                <Field label="UPI ID or Mobile Number">
                  <TextInput placeholder="e.g. 9876543210 or name@upi" value={upiId}
                    onChange={(e) => { setUpiId(e.target.value); setError(''); }} />
                </Field>
                <Field label="4-Digit PIN" hint="Enter any 4 digits — this is a demo">
                  <TextInput type="password" inputMode="numeric" placeholder="••••" maxLength={4} value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); setError(''); }} />
                </Field>
              </Card>
            </motion.div>
          )}

          {/* Common fields */}
          <Card className="space-y-3">
            <Field label="Amount">
              <NumberInput prefix="₹" value={amount || ''} onChange={(n) => { setAmount(n); setError(''); }} autoFocus />
            </Field>
            <Field label="Category">
              <SelectInput value={categoryId} onChange={(v) => { setCategoryId(v); setError(''); }}
                options={categories.map((c) => ({ value: c.id, label: c.name }))} />
            </Field>
            <Field label="Note (optional)">
              <TextInput placeholder="What's this for?" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </Card>

          {error && <p className="text-xs font-medium text-rose-300">{error}</p>}

          <Button fullWidth size="lg" onClick={handlePay} rightIcon={<ArrowRight className="h-5 w-5" />}>
            {paymentMethod === 'upi' ? 'Pay Now' : paymentMethod === 'wallet' ? 'Pay from Wallet' : 'Record Cash Payment'}
          </Button>
        </motion.div>
      )}

      {phase === 'processing' && (
        <motion.div variants={fadeIn}>
          <Card className="flex flex-col items-center py-14">
            <Loader2 className="h-12 w-12 animate-spin text-primary-400" />
            <p className="mt-5 text-sm font-medium text-primary-300">
              {paymentMethod === 'upi' ? 'Processing UPI payment…' : 'Recording payment…'}
            </p>
            <p className="mt-1 text-xs text-white/40">{formatINR(amount)}</p>
          </Card>
        </motion.div>
      )}

      {phase === 'success' && (
        <motion.div variants={fadeIn}>
          <Card className="flex flex-col items-center py-12">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-500/20"
            >
              <Check className="h-10 w-10 text-primary-400" />
            </motion.div>
            <p className="mt-5 text-lg font-bold font-display text-primary-300">Payment Successful</p>
            <p className="mt-1 text-xs text-white/40">Demo · {formatINR(amount)} paid</p>
            <div className="mt-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/50">
              Remaining balance: {formatINR(walletBalance)}
            </div>
            <div className="mt-4 flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/50">
              <Shield className="h-3 w-3" /> Wallet, budget, reports & goal progress updated
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-14 px-4 text-base font-medium rounded-2xl glass text-white outline-none focus:ring-2 focus:ring-primary-400/50 appearance-none pr-10 cursor-pointer"
      >
        <option value="" className="bg-ink-800">Select category…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-800">{o.label}</option>
        ))}
      </select>
      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white/60"
        viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
