import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
  neoRecommendedRir?: number | null;
}

export const SetForm = ({ setNumber, onSubmit, lastLog, neoRecommendedRir }: SetFormProps) => {
  const { t } = useTranslation();
  const [weight, setWeight] = useState(lastLog?.weight?.toString() || '');
  const [reps, setReps] = useState(lastLog?.reps?.toString() || '');
  const [partialReps, setPartialReps] = useState('0');
  const [rir, setRir] = useState(lastLog?.rir?.toString() || '0');
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
      className="space-y-4 neo-surface-inset p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Warmup toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          id={`warmup-${setNumber}`}
          checked={isWarmup}
          onCheckedChange={(checked) => setIsWarmup(checked === true)}
          className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
        />
        <Label
          htmlFor={`warmup-${setNumber}`}
          className={cn(
            "text-[11px] cursor-pointer flex items-center gap-1.5 transition-colors",
            isWarmup ? "text-amber-500 font-medium" : "text-muted-foreground"
          )}
        >
          <Flame className={cn("w-3 h-3", isWarmup && "text-amber-500")} />
          {t('setForm.warmupSet')}
        </Label>
      </div>

      {/* Input grid — premium */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { id: `weight-${setNumber}`, label: t('setForm.weightKg'), value: weight, setter: setWeight, placeholder: '80', mode: 'decimal' as const, big: true },
          { id: `reps-${setNumber}`, label: t('setForm.repetitions'), value: reps, setter: setReps, placeholder: '10', mode: 'numeric' as const, big: true },
          { id: `partial-${setNumber}`, label: t('setForm.partialReps'), value: partialReps, setter: setPartialReps, placeholder: '0', mode: 'numeric' as const, big: false },
          { id: `rir-${setNumber}`, label: t('setForm.rir'), value: rir, setter: setRir, placeholder: '0', mode: 'numeric' as const, big: false },
        ].map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {field.label}
            </Label>
            {field.id === `rir-${setNumber}` && neoRecommendedRir != null && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10">
                <span className="text-[9px] font-bold text-destructive tracking-wide">RIR {neoRecommendedRir} NEO</span>
              </div>
            )}
            <input
              id={field.id}
              type="text"
              inputMode={field.mode}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.setter(e.target.value.replace(field.mode === 'decimal' ? /[^0-9.]/g : /[^0-9]/g, ''))}
              className={cn(
                "w-full neo-input",
                field.big ? "text-xl" : "text-base"
              )}
            />
          </div>
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[11px] text-destructive font-medium bg-destructive/8 px-3 py-2 rounded-lg">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Success */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="p-3 bg-success/8 rounded-xl flex items-center justify-center gap-2" style={{ border: '1px solid hsl(var(--success) / 0.15)' }}>
            <CheckCircle2 className="w-4 h-4 text-success" />
            <p className="text-[13px] text-success font-semibold">{t('setForm.saved')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <Button type="submit" size="lg" disabled={loading} className="w-full bg-foreground text-background font-semibold h-12 text-[14px] rounded-xl hover:bg-foreground/90 transition-all">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
        {t('setForm.saveSet')}
      </Button>
    </motion.form>
  );
};
