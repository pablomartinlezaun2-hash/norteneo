import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, CheckCircle2, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface SetFormProps {
  setNumber: number;
  onSubmit: (data: {
    weight: number;
    reps: number;
    partialReps: number;
    rir: number | null;
    isWarmup: boolean;
  }) => Promise<{ error: string | null }>;
  lastLog?: {
    weight: number;
    reps: number;
    rir: number | null;
  } | null;
}

export const SetForm = ({ setNumber, onSubmit, lastLog }: SetFormProps) => {
  const { t } = useTranslation();
  const [weight, setWeight] = useState(lastLog?.weight?.toString() || '');
  const [reps, setReps] = useState(lastLog?.reps?.toString() || '');
  const [partialReps, setPartialReps] = useState('0');
  const [rir, setRir] = useState(lastLog?.rir?.toString() || '2');
  const [isWarmup, setIsWarmup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!weight || !reps) {
      setError(t('setForm.weightRequired'));
      return;
    }

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    const partialRepsNum = parseInt(partialReps) || 0;
    const rirNum = rir ? parseInt(rir) : null;

    if (isNaN(weightNum) || weightNum <= 0) {
      setError(t('setForm.invalidWeight'));
      return;
    }
    if (isNaN(repsNum) || repsNum <= 0) {
      setError(t('setForm.invalidReps'));
      return;
    }

    setLoading(true);
    const result = await onSubmit({ weight: weightNum, reps: repsNum, partialReps: partialRepsNum, rir: rirNum, isWarmup });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-4 p-4 bg-muted/20 rounded-2xl border border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id={`warmup-${setNumber}`}
          checked={isWarmup}
          onCheckedChange={(checked) => setIsWarmup(checked === true)}
          className="border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
        />
        <Label 
          htmlFor={`warmup-${setNumber}`} 
          className={cn(
            "text-xs cursor-pointer flex items-center gap-1.5 transition-colors",
            isWarmup ? "text-amber-600 font-medium" : "text-muted-foreground"
          )}
        >
          <Flame className={cn("w-3.5 h-3.5", isWarmup && "text-amber-500")} />
          {t('setForm.warmupSet')}
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`weight-${setNumber}`} className="text-xs font-semibold text-foreground">
            {t('setForm.weightKg')}
          </Label>
          <Input id={`weight-${setNumber}`} type="number" step="0.5" placeholder="80" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-11 text-center text-lg font-bold bg-background border-2 focus:border-primary" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reps-${setNumber}`} className="text-xs font-semibold text-foreground">
            {t('setForm.repetitions')}
          </Label>
          <Input id={`reps-${setNumber}`} type="number" placeholder="10" value={reps} onChange={(e) => setReps(e.target.value)} className="h-11 text-center text-lg font-bold bg-background border-2 focus:border-primary" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`partial-${setNumber}`} className="text-xs font-semibold text-foreground">
            {t('setForm.partialReps')}
          </Label>
          <Input id={`partial-${setNumber}`} type="number" placeholder="0" value={partialReps} onChange={(e) => setPartialReps(e.target.value)} className="h-11 text-center font-semibold bg-background border-2 focus:border-primary" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`rir-${setNumber}`} className="text-xs font-semibold text-foreground">
            {t('setForm.rir')}
          </Label>
          <Input id={`rir-${setNumber}`} type="number" min="0" max="5" placeholder="2" value={rir} onChange={(e) => setRir(e.target.value)} className="h-11 text-center font-semibold bg-background border-2 focus:border-primary" />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-600 font-semibold">{t('setForm.saved')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button type="submit" size="lg" disabled={loading} className="w-full gradient-primary text-primary-foreground font-semibold h-12 text-base rounded-xl">
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
        {t('setForm.saveSet')}
      </Button>
    </motion.form>
  );
};