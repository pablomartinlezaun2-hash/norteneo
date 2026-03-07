import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Layers, ChevronRight, Plus, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePeriodization } from '@/hooks/usePeriodization';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { MicrocycleHistoryChart } from '@/components/MicrocycleHistoryChart';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

// Animated counter component
const CountUp = ({ value, duration = 0.8 }: { value: number; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mv = { val: 0 };
    const controls = animate(mv, { val: value }, {
      duration,
      ease: 'easeOut',
      onUpdate: () => {
        el.textContent = String(Math.round(mv.val));
      }
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span ref={ref}>0</span>;
};

interface PeriodizationBadgeProps {
  programId?: string;
  variant?: 'compact' | 'full';
}

export const PeriodizationBadge = ({ programId, variant = 'compact' }: PeriodizationBadgeProps) => {
  const { t } = useTranslation();
  const {
    activeMesocycle, activeMicrocycle, allMicrocycles,
    sessionStatuses, loading, initializePeriodization, getLastCompletedMicrocycle,
  } = usePeriodization(programId);

  const [initializing, setInitializing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [microcycleCount, setMicrocycleCount] = useState(4);
  const [durationWeeks, setDurationWeeks] = useState(8);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeMesocycle) {
    if (variant === 'compact') {
      return (
        <motion.button
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: premiumEase }}
          onClick={async () => {
            setInitializing(true);
            await initializePeriodization(4, 8);
            setInitializing(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors duration-200"
          whileTap={{ scale: 0.96 }}
        >
          {initializing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Iniciar periodización
        </motion.button>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: premiumEase }}
        className="p-4 rounded-2xl bg-card border border-border space-y-4"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Configurar periodización</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Define cuántos microciclos tendrá cada mesociclo y la duración en semanas.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Microciclos:</span>
          <div className="flex gap-1">
            {[3, 4, 5, 6].map(n => (
              <motion.button
                key={n}
                onClick={() => setMicrocycleCount(n)}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-colors duration-200",
                  microcycleCount === n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {n}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Duración (sem):</span>
          <select
            value={durationWeeks}
            onChange={e => setDurationWeeks(Number(e.target.value))}
            className="text-xs rounded-lg bg-muted border border-border px-2 py-1.5 text-foreground"
          >
            {[8, 9, 10, 11, 12].map(w => (
              <option key={w} value={w}>{w} semanas</option>
            ))}
          </select>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            setInitializing(true);
            await initializePeriodization(microcycleCount, durationWeeks);
            setInitializing(false);
          }}
          disabled={initializing}
          className="w-full gradient-primary text-primary-foreground"
        >
          {initializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Layers className="w-4 h-4 mr-2" />}
          Crear Mesociclo 1
        </Button>
      </motion.div>
    );
  }

  const mesoNum = activeMesocycle.mesocycle_number;
  const microNum = activeMicrocycle?.microcycle_number ?? 0;
  const totalMicros = activeMesocycle.total_microcycles;
  const lastCompleted = getLastCompletedMicrocycle();

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: premiumEase }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
      >
        <Layers className="w-3 h-3 text-primary" />
        <span className="text-xs font-semibold text-primary">M{mesoNum}</span>
        <ChevronRight className="w-3 h-3 text-primary/50" />
        <span className="text-xs font-medium text-primary/80">μ{microNum}/{totalMicros}</span>
      </motion.div>
    );
  }

  // Full variant with metrics
  const progress = totalMicros > 0 ? (microNum / totalMicros) * 100 : 0;
  const completedCount = sessionStatuses.filter(s => s.completedInCurrentMicrocycle).length;
  const totalSessions = sessionStatuses.length;

  const getRecommendationInfo = (rec: string) => {
    switch (rec) {
      case 'deload':
        return { label: 'Deload recomendado', color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle };
      case 'block_change':
        return { label: 'Cambio de bloque recomendado', color: 'text-destructive', bgColor: 'bg-destructive/10 border-destructive/20', icon: AlertTriangle };
      default:
        return { label: 'Óptimo', color: 'text-primary', bgColor: 'bg-primary/10 border-primary/20', icon: Activity };
    }
  };

  const currentRec = lastCompleted?.recommendation || 'optimal';
  const recInfo = getRecommendationInfo(currentRec);
  const RecIcon = recInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: premiumEase }}
      className="p-4 rounded-2xl bg-card border border-border space-y-3"
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.06, duration: 0.24 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Mesociclo {mesoNum}</p>
            <p className="text-xs text-muted-foreground">
              Microciclo {microNum} de {totalMicros}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-primary">{microNum}/{totalMicros}</span>
        </div>
      </motion.div>

      {/* Animated progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </div>

      {/* Microcycle dots — staggered fade */}
      <div className="flex gap-1.5 justify-center">
        {Array.from({ length: totalMicros }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.06, duration: 0.24, ease: premiumEase }}
            className={cn(
              "w-3 h-3 rounded-full transition-colors duration-240",
              i + 1 < microNum
                ? "bg-primary"
                : i + 1 === microNum
                  ? "bg-primary ring-2 ring-primary/30 shadow-[0_0_6px_hsl(var(--primary)/0.3)]"
                  : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Sessions progress */}
      <motion.div
        className="flex items-center justify-between text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.24 }}
      >
        <span className="text-muted-foreground">Sesiones del microciclo:</span>
        <span className="font-semibold text-foreground">{completedCount}/{totalSessions}</span>
      </motion.div>

      {/* Session chips */}
      {totalSessions > 0 && (
        <motion.div
          className="flex flex-wrap gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.34, duration: 0.24 }}
        >
          {sessionStatuses.map(s => (
            <span
              key={s.sessionId}
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors duration-200",
                s.completedInCurrentMicrocycle
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted/50 text-muted-foreground border-border"
              )}
            >
              {s.sessionName}
            </span>
          ))}
        </motion.div>
      )}

      {/* Metrics with count-up */}
      {lastCompleted && (
        <motion.div
          className="grid grid-cols-3 gap-2 pt-2 border-t border-border"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.28, ease: premiumEase }}
        >
          {/* Fatigue — count up */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Fatiga</p>
            <p className="text-sm font-bold text-foreground">
              {lastCompleted.fatigue_index !== null
                ? <CountUp value={Math.round(lastCompleted.fatigue_index)} duration={0.9} />
                : '—'}
            </p>
          </div>
          {/* Trend */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Tendencia</p>
            <motion.div
              className="flex items-center justify-center gap-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.24 }}
            >
              {lastCompleted.performance_trend !== null ? (
                <>
                  {lastCompleted.performance_trend > 0 ? (
                    <TrendingUp className="w-3 h-3 text-primary" />
                  ) : lastCompleted.performance_trend < 0 ? (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  ) : (
                    <Minus className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className={cn(
                    "text-sm font-bold",
                    lastCompleted.performance_trend > 0 ? "text-primary" : lastCompleted.performance_trend < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {lastCompleted.performance_trend > 0 ? '+' : ''}{Math.round(lastCompleted.performance_trend * 10) / 10}%
                  </span>
                </>
              ) : <span className="text-sm font-bold text-muted-foreground">—</span>}
            </motion.div>
          </div>
          {/* Status — single pulse glow */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Estado</p>
            <motion.div
              className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border", recInfo.bgColor)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, duration: 0.28, ease: premiumEase }}
            >
              <RecIcon className={cn("w-2.5 h-2.5", recInfo.color)} />
              <span className={recInfo.color}>{recInfo.label}</span>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* History button */}
      {allMicrocycles.filter(m => m.status === 'completed').length > 0 && (
        <motion.button
          onClick={() => setShowHistory(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors duration-200"
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.24 }}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Ver historial de microciclos
        </motion.button>
      )}

      <AnimatePresence>
        {showHistory && (
          <MicrocycleHistoryChart
            microcycles={allMicrocycles}
            mesocycleNumber={mesoNum}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
