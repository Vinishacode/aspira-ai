import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StoreProvider, useStore } from '@/store';
import { SplashScreen } from '@/screens/SplashScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { MeetAiraScreen } from '@/screens/MeetAiraScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PlanScreen } from '@/screens/PlanScreen';
import { CategoriesScreen } from '@/screens/CategoriesScreen';
import { AppShell, type TabKey } from '@/components/AppShell';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { ExpensesScreen } from '@/screens/ExpensesScreen';
import { WalletScreen } from '@/screens/WalletScreen';
import { AiraScreen } from '@/screens/AiraScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { BillScanScreen } from '@/screens/BillScanScreen';
import { DemoPaymentScreen } from '@/screens/DemoPaymentScreen';
import { FutureScreen } from '@/screens/FutureScreen';

type Flow = 'splash' | 'welcome' | 'aira' | 'onboarding' | 'plan' | 'categories' | 'app';

function AppInner() {
  const { onboarded, profile, categories } = useStore();
  const [flow, setFlow] = useState<Flow>('splash');
  const [tab, setTab] = useState<TabKey>('dashboard');

  // After splash, route based on persisted state
  useEffect(() => {
    if (flow !== 'splash') return;
    // splash auto-advances via onDone
  }, [flow]);

  const handleSplashDone = () => {
    if (onboarded && profile && categories.length > 0) setFlow('app');
    else if (onboarded && profile) setFlow('app'); // already onboarded but maybe no categories
    else setFlow('welcome');
  };

  const handleReset = () => { setFlow('welcome'); setTab('dashboard'); };

  // If user already onboarded but lands on categories step missing, ensure app
  useEffect(() => {
    if (flow === 'app' && !onboarded) setFlow('welcome');
  }, [flow, onboarded]);

  return (
    <AnimatePresence mode="wait">
      {flow === 'splash' && <SplashScreen key="splash" onDone={handleSplashDone} />}
      {flow === 'welcome' && <WelcomeScreen key="welcome" onContinue={() => setFlow('aira')} />}
      {flow === 'aira' && <MeetAiraScreen key="aira" onContinue={() => setFlow('onboarding')} />}
      {flow === 'onboarding' && <OnboardingScreen key="onboarding" onComplete={() => setFlow('plan')} />}
      {flow === 'plan' && <PlanScreen key="plan" onContinue={() => setFlow('categories')} />}
      {flow === 'categories' && <CategoriesScreen key="categories" onContinue={() => setFlow('app')} />}
      {flow === 'app' && (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <AppShell active={tab} onChange={setTab}>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                {tab === 'dashboard' && <DashboardScreen />}
                {tab === 'expenses' && <ExpensesScreen />}
                {tab === 'wallet' && <WalletScreen />}
                {tab === 'aira' && <AiraScreen />}
                {tab === 'reports' && <ReportsScreen />}
                {tab === 'future' && <FutureScreen />}
                {tab === 'billscan' && <BillScanScreen />}
                {tab === 'pay' && <DemoPaymentScreen />}
                {tab === 'settings' && <SettingsScreen onReset={handleReset} />}
              </motion.div>
            </AnimatePresence>
          </AppShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
