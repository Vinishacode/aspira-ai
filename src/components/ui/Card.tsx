import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLMotionProps<'div'> {
  glass?: boolean;
  light?: boolean;
  hover?: boolean;
}

export function Card({ glass = true, light = false, hover = false, className, children, ...props }: CardProps) {
  return (
    <motion.div
      className={cn(
        'rounded-3xl p-5',
        light ? 'glass-light' : glass ? 'glass' : 'bg-white/5 border border-white/10',
        hover && 'transition-transform hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
  sub?: React.ReactNode;
}

export function StatCard({ label, value, icon, accent = '#34d399', sub }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden" whileHover={{ y: -2 }}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-30" style={{ background: accent }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white font-display">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-white/50">{sub}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${accent}22`, color: accent }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
