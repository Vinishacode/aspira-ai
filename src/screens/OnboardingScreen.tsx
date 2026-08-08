import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, User, MapPin, Wallet, Users, Target, Calendar, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, TextInput, NumberInput, Select } from '@/components/ui/Input';
import { Stepper } from '@/components/ui/Stepper';
import { useStore } from '@/store';
import { DREAM_OPTIONS, MONTHS, type IncomeType, type UserProfile } from '@/types';
import { fadeIn } from '@/lib/motion';

const STEP_LABELS = ['Name', 'Age', 'City', 'Income', 'Amount', 'Family', 'Dream', 'Cost', 'Target', 'Savings'];
const YEARS = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + i);

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [form, setForm] = useState<Partial<UserProfile>>({
    incomeType: 'monthly',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = STEP_LABELS.length;

  const update = useCallback(<K extends keyof UserProfile>(k: K, v: UserProfile[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  }, []);

  const validate = useCallback((i: number): boolean => {
    const e: Record<string, string> = {};
    const f = form;
    switch (i) {
      case 0: if (!f.name?.trim()) e.name = 'Please enter your name'; break;
      case 1: if (!f.age || Number(f.age) < 1 || Number(f.age) > 120) e.age = 'Enter a valid age'; break;
      case 2: if (!f.city?.trim()) e.city = 'Please enter your city'; break;
      case 3: if (!f.incomeType) e.incomeType = 'Select income type'; break;
      case 4: if (!f.incomeAmount || f.incomeAmount <= 0) e.incomeAmount = 'Enter your income'; break;
      case 6: if (!f.dreamGoal?.trim()) e.dreamGoal = 'Choose your dream'; break;
      case 7: if (!f.goalCost || f.goalCost <= 0) e.goalCost = 'Enter the goal cost'; break;
      case 8: if (!f.targetMonth || !f.targetYear) e.target = 'Select a target date'; break;
      case 9: if (f.currentSavings == null || f.currentSavings < 0) e.currentSavings = 'Enter current savings'; break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const next = useCallback(() => {
    if (!validate(step)) return;
    if (step < total - 1) { setDir(1); setStep((s) => s + 1); }
    else {
      // finalize
      const profile: UserProfile = {
        name: form.name!.trim(),
        age: form.age!,
        city: form.city!.trim(),
        incomeType: form.incomeType as IncomeType,
        incomeAmount: Number(form.incomeAmount),
        dependents: form.dependents ?? '',
        dreamGoal: form.dreamGoal!.trim(),
        goalCost: Number(form.goalCost),
        targetMonth: Number(form.targetMonth),
        targetYear: Number(form.targetYear),
        currentSavings: Number(form.currentSavings ?? 0),
      };
      setProfile(profile);
      onComplete();
    }
  }, [step, total, validate, form, setProfile, onComplete]);

  const back = useCallback(() => {
    if (step > 0) { setDir(-1); setStep((s) => s - 1); }
  }, [step]);

  // Enter key support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next]);

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-ink-900 to-ink-800 px-5 py-8">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          {step > 0 ? (
            <button onClick={back} className="flex h-10 w-10 items-center justify-center rounded-xl glass text-white/80 hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : <div className="h-10 w-10" />}
          <div className="flex-1">
            <p className="text-xs font-medium text-white/50">Step {step + 1} of {total}</p>
          </div>
        </div>

        <Stepper steps={STEP_LABELS} current={step} />

        <div className="mt-10 flex-1">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepContent step={step} form={form} update={update} errors={errors} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="ghost" onClick={back} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          )}
          <Button fullWidth size="lg" onClick={next}
            rightIcon={step === total - 1 ? <Check className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}>
            {step === total - 1 ? 'See My Plan' : 'Continue'}
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-white/40">Tip: press Enter to continue</p>
      </div>
    </div>
  );
}

interface StepProps {
  step: number;
  form: Partial<UserProfile>;
  update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void;
  errors: Record<string, string>;
}

function StepContent({ step, form, update, errors }: StepProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div variants={fadeIn} initial="hidden" animate="show" exit="exit" key={step}>
        {step === 0 && (
          <Q icon={<User />} title="What should Aira call you?" subtitle="Let's start with your name.">
            <Field error={errors.name}>
              <TextInput autoFocus placeholder="e.g. Arjun" value={form.name ?? ''}
                onChange={(e) => update('name', e.target.value)} />
            </Field>
          </Q>
        )}
        {step === 1 && (
          <Q icon={<User />} title="How old are you?" subtitle="This helps Aira tailor your plan.">
            <Field error={errors.age}>
              <NumberInput autoFocus placeholder="e.g. 24" value={form.age ?? ''}
                onChange={(n) => update('age', String(n))} />
            </Field>
          </Q>
        )}
        {step === 2 && (
          <Q icon={<MapPin />} title="Where do you live?" subtitle="Your city or area — type it in.">
            <Field error={errors.city}>
              <TextInput autoFocus placeholder="e.g. Pune, Maharashtra" value={form.city ?? ''}
                onChange={(e) => update('city', e.target.value)} />
            </Field>
          </Q>
        )}
        {step === 3 && (
          <Q icon={<Wallet />} title="How do you earn?" subtitle="Daily or monthly — pick what fits you.">
            <div className="grid grid-cols-2 gap-3">
              {(['daily', 'monthly'] as IncomeType[]).map((t) => (
                <button key={t} onClick={() => update('incomeType', t)}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-5 transition-all ${
                    form.incomeType === t ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white elev-2' : 'glass text-white/70 hover:bg-white/10'
                  }`}>
                  <span className="text-2xl">{t === 'daily' ? '☀️' : '📅'}</span>
                  <span className="font-semibold capitalize">{t} Income</span>
                </button>
              ))}
            </div>
          </Q>
        )}
        {step === 4 && (
          <Q icon={<Wallet />} title={`What's your ${form.incomeType} income?`}
             subtitle={form.incomeType === 'daily' ? 'Your average daily earnings.' : 'Your monthly income.'}>
            <Field error={errors.incomeAmount}>
              <NumberInput autoFocus prefix="₹" placeholder={form.incomeType === 'daily' ? 'e.g. 800' : 'e.g. 25000'}
                value={form.incomeAmount ?? ''} onChange={(n) => update('incomeAmount', n)} />
            </Field>
          </Q>
        )}
        {step === 5 && (
          <Q icon={<Users />} title="How many people depend on you?" subtitle="Optional — helps plan your budget better.">
            <Field hint="Leave blank if it's just you">
              <NumberInput autoFocus placeholder="e.g. 2" value={form.dependents ?? ''}
                onChange={(n) => update('dependents', n === 0 ? '' : String(n))} />
            </Field>
          </Q>
        )}
        {step === 6 && (
          <Q icon={<Target />} title="What's your dream?" subtitle="Pick one or type your own.">
            <Field error={errors.dreamGoal}>
              <TextInput autoFocus placeholder="Type your dream goal…" value={form.dreamGoal ?? ''}
                onChange={(e) => update('dreamGoal', e.target.value)} />
            </Field>
            <div className="mt-4 flex flex-wrap gap-2">
              {DREAM_OPTIONS.map((d) => (
                <button key={d.label} onClick={() => update('dreamGoal', d.label)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                    form.dreamGoal === d.label ? 'bg-accent-500 text-ink-900' : 'glass text-white/70 hover:bg-white/10'
                  }`}>
                  <span>{d.emoji}</span>{d.label}
                </button>
              ))}
            </div>
          </Q>
        )}
        {step === 7 && (
          <Q icon={<Target />} title="How much does it cost?" subtitle="Your best estimate of the dream's cost.">
            <Field error={errors.goalCost}>
              <NumberInput autoFocus prefix="₹" placeholder="e.g. 150000" value={form.goalCost ?? ''}
                onChange={(n) => update('goalCost', n)} />
            </Field>
          </Q>
        )}
        {step === 8 && (
          <Q icon={<Calendar />} title="When do you want to achieve it?" subtitle="Set your target month and year.">
            <Field error={errors.target}>
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.targetMonth ?? ''} onChange={(e) => update('targetMonth', Number(e.target.value))}
                  options={[{ value: '', label: 'Month' }, ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))]} />
                <Select value={form.targetYear ?? ''} onChange={(e) => update('targetYear', Number(e.target.value))}
                  options={[{ value: '', label: 'Year' }, ...YEARS.map((y) => ({ value: String(y), label: String(y) }))]} />
              </div>
            </Field>
          </Q>
        )}
        {step === 9 && (
          <Q icon={<PiggyBank />} title="What have you saved so far?" subtitle="Your current savings toward this dream.">
            <Field error={errors.currentSavings} hint="Enter 0 if you haven't started yet">
              <NumberInput autoFocus prefix="₹" placeholder="e.g. 10000" value={form.currentSavings ?? ''}
                onChange={(n) => update('currentSavings', n)} />
            </Field>
          </Q>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Q({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold leading-tight font-display">{title}</h2>
          <p className="mt-1 text-sm text-white/55">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
