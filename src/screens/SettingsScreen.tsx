import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Target, Trash2, LogOut, RotateCcw, Info } from 'lucide-react';
import { useStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Input';
import { formatINR } from '@/lib/finance';
import { fadeIn, stagger } from '@/lib/motion';

export function SettingsScreen({ onReset }: { onReset: () => void }) {
  const { profile, resetAll } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!profile) return null;

  const doReset = () => { resetAll(); onReset(); };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6 max-w-2xl">
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-extrabold font-display">Settings</h1>
        <p className="text-sm text-white/50">Manage your profile & data</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={fadeIn}>
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold font-display">{profile.name}</p>
              <p className="text-xs text-white/50">{profile.city}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow icon={<User className="h-4 w-4" />} label="Age" value={profile.age} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="City" value={profile.city} />
            <InfoRow icon={<Target className="h-4 w-4" />} label="Dream Goal" value={profile.dreamGoal} />
            <InfoRow icon={<Target className="h-4 w-4" />} label="Goal Cost" value={formatINR(profile.goalCost)} />
            <InfoRow label="Income" value={`${formatINR(profile.incomeAmount)} / ${profile.incomeType}`} />
            <InfoRow label="Current Savings" value={formatINR(profile.currentSavings)} />
          </div>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div variants={fadeIn}>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Info className="h-5 w-5 text-primary-300" />
            <h3 className="font-bold font-display">About Aspira AI</h3>
          </div>
          <p className="text-sm leading-relaxed text-white/65">
            Aspira AI connects your everyday spending to your biggest dreams. Aira, your AI companion,
            builds a savings plan and keeps you motivated. Small savings, big dreams.
          </p>
          <p className="mt-3 text-xs text-white/35">Version 1.0 · Built for National AI Hackathon</p>
        </Card>
      </motion.div>

      {/* Data */}
      <motion.div variants={fadeIn}>
        <Card className="border-error-500/20">
          <div className="flex items-center gap-3 mb-3">
            <RotateCcw className="h-5 w-5 text-rose-400" />
            <h3 className="font-bold font-display">Reset & Start Over</h3>
          </div>
          <p className="text-sm text-white/60 mb-4">
            This will erase your profile, categories, and transactions. You'll go through onboarding again.
          </p>
          {confirmReset ? (
            <div className="flex gap-2">
              <Button variant="danger" onClick={doReset} leftIcon={<Trash2 className="h-4 w-4" />}>Yes, erase everything</Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmReset(true)} leftIcon={<LogOut className="h-4 w-4" />}>Reset App</Button>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="flex items-center gap-1.5 text-xs text-white/45">{icon}{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
