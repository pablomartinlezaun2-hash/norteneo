import { motion } from 'framer-motion';
import { Layers, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePeriodization } from '@/hooks/usePeriodization';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface PeriodizationBadgeProps {
  programId?: string;
  variant?: 'compact' | 'full';
  onCompleteMicrocycle?: () => void;
}

export const PeriodizationBadge = ({ programId, variant = 'compact', onCompleteMicrocycle }: PeriodizationBadgeProps) => {
  const { t } = useTranslation();
  const {
    activeMesocycle,
    activeMicrocycle,
    loading,
    initializePeriodization,
    completeMicrocycle,
  } = usePeriodization(programId);

  const [initializing, setInitializing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [microcycleCount, setMicrocycleCount] = useState(4);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No periodization yet — offer to create
  if (!activeMesocycle) {
    if (variant === 'compact') {
      return (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={async () => {
            setInitializing(true);
            await initializePeriodization(4);
            setInitializing(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          {initializing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          {t('periodization.init', 'Iniciar periodización')}
        </motion.button>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-card border border-border space-y-3"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{t('periodization.setup', 'Configurar periodización')}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('periodization.setupDesc', 'Define cuántos microciclos tendrá cada mesociclo.')}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('periodization.microcycles', 'Microciclos')}:</span>
          <div className="flex gap-1">
            {[3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setMicrocycleCount(n)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                  microcycleCount === n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            setInitializing(true);
            await initializePeriodization(microcycleCount);
            setInitializing(false);
          }}
          disabled={initializing}
          className="w-full gradient-primary text-primary-foreground"
        >
          {initializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Layers className="w-4 h-4 mr-2" />}
          {t('periodization.create', 'Crear Mesociclo 1')}
        </Button>
      </motion.div>
    );
  }

  const mesoNum = activeMesocycle.mesocycle_number;
  const microNum = activeMicrocycle?.microcycle_number ?? 0;
  const totalMicros = activeMesocycle.total_microcycles;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
      >
        <Layers className="w-3 h-3 text-primary" />
        <span className="text-xs font-semibold text-primary">
          M{mesoNum}
        </span>
        <ChevronRight className="w-3 h-3 text-primary/50" />
        <span className="text-xs font-medium text-primary/80">
          μ{microNum}/{totalMicros}
        </span>
      </motion.div>
    );
  }

  // Full variant
  const progress = totalMicros > 0 ? (microNum / totalMicros) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-card border border-border space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {t('periodization.mesocycle', 'Mesociclo')} {mesoNum}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('periodization.microcycleOf', 'Microciclo {{current}} de {{total}}', { current: microNum, total: totalMicros })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-primary">{microNum}/{totalMicros}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Microcycle dots */}
      <div className="flex gap-1.5 justify-center">
        {Array.from({ length: totalMicros }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              i + 1 < microNum
                ? "bg-primary"
                : i + 1 === microNum
                  ? "bg-primary ring-2 ring-primary/30"
                  : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Complete microcycle button */}
      {activeMicrocycle && (
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            setCompleting(true);
            await completeMicrocycle();
            setCompleting(false);
            onCompleteMicrocycle?.();
          }}
          disabled={completing}
          className="w-full text-xs"
        >
          {completing ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : null}
          {microNum === totalMicros
            ? t('periodization.completeMeso', 'Completar mesociclo y avanzar')
            : t('periodization.completeMicro', 'Completar microciclo {{n}}', { n: microNum })}
        </Button>
      )}
    </motion.div>
  );
};
