import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type TabKey = 'dashboard' | 'expenses' | 'wallet' | 'aira' | 'reports' | 'future' | 'billscan' | 'pay' | 'settings';

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
  { key: 'expenses', label: 'Expenses', icon: <ReceiptIcon /> },
  { key: 'wallet', label: 'Wallet', icon: <WalletIcon /> },
  { key: 'aira', label: 'Aira AI', icon: <SparkIcon /> },
  { key: 'future', label: 'Future', icon: <FlagIcon /> },
  { key: 'reports', label: 'Reports', icon: <ChartIcon /> },
  { key: 'billscan', label: 'Bill Scan', icon: <ScanIcon /> },
  { key: 'pay', label: 'Demo Pay', icon: <PhoneIcon /> },
  { key: 'settings', label: 'Settings', icon: <GearIcon /> },
];

const MOBILE_PRIMARY: TabKey[] = ['dashboard', 'expenses', 'aira', 'future', 'reports'];

export function AppShell({
  active, onChange, children,
}: { active: TabKey; onChange: (k: TabKey) => void; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-900 to-ink-800">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-white/10 bg-ink-900/60 backdrop-blur-xl lg:flex">
        <BrandHeader />
        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <DesktopNavItem key={item.key} item={item} active={active === item.key} onClick={() => onChange(item.key)} />
          ))}
        </nav>
        <SidebarFooter />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-ink-900/70 px-5 py-3 backdrop-blur-xl lg:hidden">
        <BrandHeader compact />
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-ink-900/85 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around px-1 py-1.5">
          {NAV_ITEMS.filter((item) => MOBILE_PRIMARY.includes(item.key)).map((item) => (
            <MobileNavItem key={item.key} item={item} active={active === item.key} onClick={() => onChange(item.key)} />
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}

function BrandHeader({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', compact ? 'px-0' : 'px-5 pt-6')}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21c5-3 7-7 7-12V5l-7-2-7 2v4c0 5 2 9 7 12z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-extrabold leading-none font-display">Aspira AI</p>
        <p className="mt-0.5 text-[10px] text-white/40">Small Savings. Big Dreams.</p>
      </div>
    </div>
  );
}

function DesktopNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
        active ? 'bg-gradient-to-r from-primary-500/20 to-transparent text-white' : 'text-white/55 hover:bg-white/5 hover:text-white',
      )}>
      {active && <motion.div layoutId="navactive" className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary-400" />}
      <span className={cn('flex h-5 w-5 items-center justify-center', active && 'text-primary-300')}>{item.icon}</span>
      {item.label}
    </button>
  );
}

function MobileNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn('flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors', active ? 'text-primary-300' : 'text-white/45')}>
      <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
      <span className="text-[10px] font-medium">{item.label}</span>
    </button>
  );
}

function SidebarFooter() {
  return (
    <div className="px-5 pb-5">
      <div className="rounded-2xl bg-gradient-to-br from-primary-500/15 to-accent-500/10 p-3 text-xs text-white/60">
        <p className="font-semibold text-white/80">Aira is watching your dream</p>
        <p className="mt-1">Keep saving consistently.</p>
      </div>
    </div>
  );
}

/* Icons */
function HomeIcon() { return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2z"/></svg>; }
function ReceiptIcon() { return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>; }
function WalletIcon() { return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M16 11h2v2h-2a1 1 0 0 1 0-2z"/></svg>; }
function SparkIcon() { return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z"/><path d="M19 14l.9 2.2L22 17l-2.1.8L19 20l-.9-2.2L16 17l2.1-.8z"/></svg>; }
function ChartIcon() { return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>; }
function GearIcon() { return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2.2-1.3L14 3h-4l-.3 2.2a7 7 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2.2 1.3L10 21h4l.3-2.2a7 7 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/></svg>; }
function FlagIcon() { return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4s1-2 4-2 5 2 8 2 4-1 4-1v8s-1 1-4 1-5-2-8-2-4 1-4 1"/></svg>; }
function ScanIcon() { return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M3 12h18"/></svg>; }
function PhoneIcon() { return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>; }
