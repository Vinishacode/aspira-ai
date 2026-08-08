import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50',
  secondary: 'bg-gradient-to-br from-accent-500 to-accent-600 text-ink-900 shadow-lg shadow-accent-500/30',
  ghost: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
  outline: 'bg-transparent text-primary-300 border border-primary-400/40 hover:bg-primary-500/10',
  danger: 'bg-gradient-to-br from-error-500 to-rose-600 text-white shadow-lg shadow-error-500/30',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-xl',
  md: 'h-12 px-6 text-sm rounded-2xl',
  lg: 'h-14 px-8 text-base rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold font-sans transition-shadow select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300/60 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children as React.ReactNode}
      {rightIcon}
    </motion.button>
  );
}
