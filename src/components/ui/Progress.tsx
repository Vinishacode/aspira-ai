import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-1
  size?: number;
  stroke?: number;
  className?: string;
  trackClass?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  size = 160,
  stroke = 12,
  className,
  children,
}: CircularProgressProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = c * (1 - clamped);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="cpGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#cpGrad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

interface LinearProgressProps {
  value: number; // 0-1
  className?: string;
  color?: string;
}

export function LinearProgress({ value, className, color }: LinearProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className={cn('h-2 w-full rounded-full bg-white/10 overflow-hidden', className)}>
      <motion.div
        className={cn('h-full rounded-full', !color && 'bg-gradient-to-r from-primary-400 to-accent-400')}
        style={color ? { background: color } : undefined}
        initial={{ width: 0 }}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
