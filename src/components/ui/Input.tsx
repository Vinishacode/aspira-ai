import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-2 block text-sm font-semibold text-white/80">{label}</span>
      )}
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-1.5 block text-xs font-medium text-rose-300"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
      {hint && !error && <span className="mt-1.5 block text-xs text-white/40">{hint}</span>}
    </label>
  );
}

type InputVariant = 'glass' | 'light';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  prefix?: string;
}

const inputBase =
  'w-full h-14 px-4 text-base font-medium rounded-2xl outline-none transition-all focus:ring-2 placeholder:text-current/40';

const inputVariants: Record<InputVariant, string> = {
  glass: 'glass text-white placeholder:text-white/40 focus:ring-primary-400/50',
  light: 'glass-light text-ink-900 placeholder:text-ink-900/40 focus:ring-primary-500/50',
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ variant = 'glass', prefix, className, ...props }, ref) => (
    <div className={cn('relative flex items-center', className)}>
      {prefix && (
        <span className={cn(
          'absolute left-4 font-semibold pointer-events-none',
          variant === 'glass' ? 'text-white/60' : 'text-ink-900/50',
        )}>{prefix}</span>
      )}
      <input
        ref={ref}
        className={cn(inputBase, inputVariants[variant], prefix && 'pl-9', className)}
        {...props}
      />
    </div>
  ),
);
TextInput.displayName = 'TextInput';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: InputVariant;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ variant = 'glass', options, className, ...props }, ref) => (
    <div className={cn('relative', className)}>
      <select
        ref={ref}
        className={cn(inputBase, inputVariants[variant], 'appearance-none pr-10 cursor-pointer', className)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-800 text-white">
            {o.label}
          </option>
        ))}
      </select>
      <svg className={cn('absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none',
        variant === 'glass' ? 'text-white/60' : 'text-ink-900/50')}
        viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  ),
);
Select.displayName = 'Select';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  variant?: InputVariant;
  prefix?: string;
  onChange?: (n: number) => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ variant = 'glass', prefix, onChange, className, ...props }, ref) => {
    const [val, setVal] = useState<string>(String(props.value ?? ''));
    return (
      <div className={cn('relative flex items-center', className)}>
        {prefix && (
          <span className={cn(
            'absolute left-4 font-semibold pointer-events-none',
            variant === 'glass' ? 'text-white/60' : 'text-ink-900/50',
          )}>{prefix}</span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={val}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9]/g, '');
            setVal(cleaned);
            onChange?.(cleaned === '' ? 0 : Number(cleaned));
          }}
          className={cn(inputBase, inputVariants[variant], prefix && 'pl-9', className)}
          {...props}
        />
      </div>
    );
  },
);
NumberInput.displayName = 'NumberInput';
