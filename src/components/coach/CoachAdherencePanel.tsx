import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Utensils, Dumbbell, Moon, Info, Calendar, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export interface AdherenceDayData {
  date: string;
  training_adherence: number | null;
  nutrition_adherence: number | null;
  sleep_adherence: number | null;
  supplement_adherence: number | null;
  total_adherence: number | null;
  exclusion_reasons?: {
    nutrition?: string;
    training?: string;
    sleep?: string;
    supplements?: string;
  };
}

interface Props {
  history: AdherenceDayData[];
  latest: AdherenceDayData | null;
}

/* ── Helpers ── */
type DayState = 'valid' | 'no-data' | 'excluded';

const adherenceColor = (v: number): string => {
  if (v >= 90) return 'hsl(142 71% 45%)';
  if (v >= 70) return 'hsl(38 92% 50%)';
  return 'hsl(0 62% 50%)';
};

const adherenceTextClass = (v: number | null): string => {
  if (v == null) return 'text-muted-foreground/40';
  if (v >= 90) return 'text-emerald-400';
  if (v >= 70) return 'text-yellow-400';
  return 'text-red-400';
};

const getDayState = (day: AdherenceDayData): DayState => {
  if (day.total_adherence != null) return 'valid';
  // Check if ALL metrics are excluded (disabled or no config)
  const reasons = day.exclusion_reasons ?? {};
  const allExcluded = reasons.nutrition && reasons.training && reasons.sleep;
  if (allExcluded) return 'excluded';
  return 'no-data';
};

const hasAnyData = (day: AdherenceDayData): boolean =>
  day.training_adherence != null ||
  day.nutrition_adherence != null ||
  day.sleep_adherence != null ||
  day.supplement_adherence != null;

const formatShortDay = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
};

const formatDayNum = (dateStr: string): string => {
  return new Date(dateStr + 'T12:00:00').getDate().toString();
};

const formatFullDate = (dateStr: string): string => {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
};

const formatShortDate = (dateStr: string): string => {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
};

/** Filter history to current microcycle: only show the relevant window (last 7 days or days with any real data) */
const getMicrocycleDays = (history: AdherenceDayData[]): AdherenceDayData[] => {
  if (history.length <= 7) return history;
  // Find the last day with real data
  const lastDataIdx = history.reduce((acc, d, i) => hasAnyData(d) ? i : acc, -1);
  if (lastDataIdx === -1) return history.slice(-7);
  // Show from 7 days before last data day, or start
  const start = Math.max(0, lastDataIdx - 6);
  const end = Math.min(history.length, start + 7);
  return history.slice(start, end);
};

/* ── Metric definition ── */
const METRICS = [
  { key: 'nutrition_adherence' as const, reasonKey: 'nutrition' as const, label: 'Nutrición', icon: Utensils },
  { key: 'training_adherence' as const, reasonKey: 'training' as const, label: 'Entrenamiento', icon: Dumbbell },
  { key: 'sleep_adherence' as const, reasonKey: 'sleep' as const, label: 'Sueño', icon: Moon },
];

/* ═══════════════ Category Row ═══════════════ */
const CategoryRow = ({ icon: Icon, label, value, reason, onClick }: {
  icon: any; label: string; value: number | null; reason?: string; onClick?: () => void;
}) => {
  const v = value != null ? Math.round(value) : null;
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 px-3 rounded-xl border border-border/10 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors"
      whileTap={{ scale: 0.985 }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
        <span className="text-[12px] font-medium text-foreground/80">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {v != null ? (
          <>
            <div className="w-12 h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: adherenceColor(v) }}
                initial={{ width: 0 }}
                animate={{ width: `${v}%` }}
                transition={{ duration: 0.8, ease }}
              />
            </div>
            <span className={cn("text-[12px] font-bold tabular-nums w-10 text-right", adherenceTextClass(v))}>
              {v}%
            </span>
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground/30 italic">
            {reason || 'Sin registro'}
          </span>
        )}
      </div>
    </motion.button>
  );
};

/* ═══════════════ Day Detail Sheet ═══════════════ */
const DayDetailSheet = ({ day, onClose }: { day: AdherenceDayData; onClose: () => void }) => {
  const active = METRICS.filter(m => day[m.key] != null);
  const excluded = METRICS.filter(m => day[m.key] == null);
  const state = getDayState(day);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-md rounded-t-2xl border border-border/20 bg-background p-5 pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Detalle del día</p>
            <p className="text-[13px] font-semibold text-foreground capitalize mt-0.5">{formatFullDate(day.date)}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-muted-foreground/50" />
          </button>
        </div>

        {/* Global score */}
        <div className="text-center py-4 mb-5 rounded-xl border border-border/10 bg-foreground/[0.02]">
          {state === 'valid' ? (
            <>
              <p className={cn("text-3xl font-black tabular-nums", adherenceTextClass(day.total_adherence))}>
                {Math.round(day.total_adherence!)}%
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">Adherencia global</p>
            </>
          ) : state === 'excluded' ? (
            <div className="flex flex-col items-center gap-1">
              <Info className="w-4 h-4 text-muted-foreground/30" />
              <p className="text-[12px] text-muted-foreground/40">Día excluido del cálculo</p>
              <p className="text-[10px] text-muted-foreground/25">Todas las métricas desactivadas o sin configurar</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground/30" />
              <p className="text-[12px] text-muted-foreground/40">Sin datos válidos</p>
              <p className="text-[10px] text-muted-foreground/25">No se registró actividad este día</p>
            </div>
          )}
        </div>

        {/* Metrics that counted */}
        {active.length > 0 && (
          <div className="space-y-1.5 mb-5">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-1.5">Métricas que computaron</p>
            {active.map(m => {
              const v = day[m.key]!;
              return (
                <div key={m.key} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-foreground/[0.02] border border-border/5">
                  <div className="flex items-center gap-2">
                    <m.icon className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-[11px] text-foreground/70">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: adherenceColor(v) }} />
                    </div>
                    <span className={cn("text-[12px] font-bold tabular-nums", adherenceTextClass(v))}>
                      {Math.round(v)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Excluded metrics */}
        {excluded.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-1.5">No computaron</p>
            {excluded.map(m => {
              const reason = day.exclusion_reasons?.[m.reasonKey] ?? 'Sin registro';
              return (
                <div key={m.key} className="flex items-center justify-between py-2 px-3 rounded-lg border border-dashed border-border/10">
                  <div className="flex items-center gap-2">
                    <m.icon className="w-3 h-3 text-muted-foreground/20" />
                    <span className="text-[11px] text-muted-foreground/30">{m.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/25 italic">{reason}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Denominator explanation */}
        <div className="mt-5 pt-4 border-t border-border/10">
          <div className="flex items-start gap-2">
            <Info className="w-3 h-3 text-muted-foreground/20 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground/25 leading-relaxed">
              Solo se promedian las métricas con datos reales registrados y habilitadas por el atleta. Las métricas sin registro o desactivadas no penalizan.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════ Category Detail Sheet ═══════════════ */
const CategoryDetailSheet = ({ label, icon: Icon, history, metricKey, reasonKey, onClose }: {
  label: string;
  icon: any;
  history: AdherenceDayData[];
  metricKey: 'nutrition_adherence' | 'training_adherence' | 'sleep_adherence';
  reasonKey: 'nutrition' | 'training' | 'sleep';
  onClose: () => void;
}) => {
  const daysWithData = history.filter(d => d[metricKey] != null);
  const daysWithout = history.filter(d => d[metricKey] == null);
  const avg = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + (d[metricKey] as number), 0) / daysWithData.length)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-md rounded-t-2xl border border-border/20 bg-background p-5 pb-8 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground/40">Análisis del microciclo</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-muted-foreground/50" />
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="text-center py-3 rounded-xl border border-border/10 bg-foreground/[0.02]">
            {avg != null ? (
              <p className={cn("text-xl font-black tabular-nums", adherenceTextClass(avg))}>{avg}%</p>
            ) : (
              <p className="text-xl font-black text-muted-foreground/20">—</p>
            )}
            <p className="text-[9px] text-muted-foreground/40 mt-0.5">Promedio</p>
          </div>
          <div className="text-center py-3 rounded-xl border border-border/10 bg-foreground/[0.02]">
            <p className="text-xl font-black text-foreground/80 tabular-nums">{daysWithData.length}</p>
            <p className="text-[9px] text-muted-foreground/40 mt-0.5">Días válidos</p>
          </div>
          <div className="text-center py-3 rounded-xl border border-border/10 bg-foreground/[0.02]">
            <p className="text-xl font-black text-muted-foreground/30 tabular-nums">{daysWithout.length}</p>
            <p className="text-[9px] text-muted-foreground/40 mt-0.5">Sin datos</p>
          </div>
        </div>

        {/* Days that counted */}
        {daysWithData.length > 0 && (
          <div className="mb-5">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-2">Días que computaron</p>
            <div className="space-y-1">
              {daysWithData.map(day => {
                const v = day[metricKey] as number;
                return (
                  <div key={day.date} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-foreground/[0.02] border border-border/5">
                    <span className="text-[11px] text-foreground/60 capitalize">{formatShortDate(day.date)}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: adherenceColor(v) }} />
                      </div>
                      <span className={cn("text-[12px] font-bold tabular-nums w-10 text-right", adherenceTextClass(v))}>
                        {Math.round(v)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Days that didn't count */}
        {daysWithout.length > 0 && (
          <div className="mb-5">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-2">No computaron</p>
            <div className="space-y-1">
              {daysWithout.map(day => {
                const reason = day.exclusion_reasons?.[reasonKey] ?? 'Sin registro';
                return (
                  <div key={day.date} className="flex items-center justify-between py-2 px-3 rounded-lg border border-dashed border-border/10">
                    <span className="text-[11px] text-muted-foreground/30 capitalize">{formatShortDate(day.date)}</span>
                    <span className="text-[10px] text-muted-foreground/25 italic">{reason}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Denominator logic explanation */}
        <div className="pt-4 border-t border-border/10">
          <div className="flex items-start gap-2">
            <Info className="w-3 h-3 text-muted-foreground/20 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground/25 leading-relaxed">
              El promedio se calcula solo con días que tienen registros reales.
              {' '}Días sin registro o con la métrica desactivada no penalizan ni inflan el resultado.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════ Main Panel ═══════════════════ */

export const CoachAdherencePanel = ({ history, latest }: Props) => {
  const [selectedDay, setSelectedDay] = useState<AdherenceDayData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{
    label: string; icon: any; key: 'nutrition_adherence' | 'training_adherence' | 'sleep_adherence'; reasonKey: 'nutrition' | 'training' | 'sleep';
  } | null>(null);

  // Scope to microcycle
  const microcycleDays = getMicrocycleDays(history);

  const validDays = microcycleDays.filter(d => d.total_adherence != null);
  const avg = validDays.length > 0
    ? Math.round(validDays.reduce((s, d) => s + (d.total_adherence ?? 0), 0) / validDays.length)
    : null;

  const activeMetricsCount = latest
    ? [latest.nutrition_adherence, latest.training_adherence, latest.sleep_adherence].filter(v => v != null).length
    : 0;

  // Category averages from microcycle days only
  const catAvg = (key: 'nutrition_adherence' | 'training_adherence' | 'sleep_adherence'): number | null => {
    const valid = microcycleDays.filter(d => d[key] != null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((s, d) => s + (d[key] as number), 0) / valid.length);
  };

  // Get dominant exclusion reason for a category
  const catReason = (reasonKey: 'nutrition' | 'training' | 'sleep'): string | undefined => {
    const reasons = microcycleDays
      .map(d => d.exclusion_reasons?.[reasonKey])
      .filter(Boolean) as string[];
    if (reasons.length === 0) return undefined;
    // Return most common reason
    const counts = new Map<string, number>();
    reasons.forEach(r => counts.set(r, (counts.get(r) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Top Summary ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-center py-3 rounded-xl border border-border/10 bg-foreground/[0.02]">
          {avg != null ? (
            <motion.p
              className={cn("text-2xl font-black tabular-nums", adherenceTextClass(avg))}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease }}
            >
              {avg}%
            </motion.p>
          ) : (
            <p className="text-lg font-bold text-muted-foreground/20">—</p>
          )}
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Promedio</p>
        </div>
        <div className="flex-1 text-center py-3 rounded-xl border border-border/10 bg-foreground/[0.02]">
          <p className="text-2xl font-black text-foreground/80 tabular-nums">{validDays.length}</p>
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Días válidos</p>
        </div>
        <div className="flex-1 text-center py-3 rounded-xl border border-border/10 bg-foreground/[0.02]">
          <p className="text-2xl font-black text-foreground/80 tabular-nums">{activeMetricsCount}</p>
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Métricas</p>
        </div>
      </div>

      {/* ── 2. Microcycle Adherence Strip ── */}
      {microcycleDays.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">Microciclo actual</p>
          <div className="flex gap-1.5">
            {microcycleDays.map((day, i) => {
              const state = getDayState(day);
              const v = day.total_adherence;
              const isToday = day.date === new Date().toISOString().split('T')[0];
              return (
                <motion.button
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 group relative",
                    isToday && "ring-1 ring-foreground/10 rounded-lg"
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className={cn(
                    "text-[8px] font-medium",
                    isToday ? 'text-foreground/60' : 'text-muted-foreground/30'
                  )}>
                    {formatShortDay(day.date)}
                  </span>

                  {state === 'valid' ? (
                    <div
                      className="w-full min-h-[40px] rounded-lg group-hover:ring-1 group-hover:ring-foreground/10 transition-all"
                      style={{
                        backgroundColor: adherenceColor(v!),
                        opacity: 0.25 + (v! / 100) * 0.75,
                      }}
                    />
                  ) : state === 'excluded' ? (
                    <div className="w-full min-h-[40px] rounded-lg border border-dashed border-border/15 bg-transparent" />
                  ) : (
                    <div className="w-full min-h-[40px] rounded-lg bg-foreground/[0.03]" />
                  )}

                  <span className={cn(
                    "text-[9px] font-bold tabular-nums",
                    state === 'valid' ? adherenceTextClass(v) : 'text-muted-foreground/15'
                  )}>
                    {state === 'valid' ? Math.round(v!) : '·'}
                  </span>
                  <span className="text-[8px] text-muted-foreground/20">{formatDayNum(day.date)}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-emerald-500/50" />
              <span className="text-[8px] text-muted-foreground/30">Con datos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-foreground/[0.04]" />
              <span className="text-[8px] text-muted-foreground/30">Sin datos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm border border-dashed border-border/20" />
              <span className="text-[8px] text-muted-foreground/30">Excluido</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center rounded-xl border border-dashed border-border/10">
          <BarChart3 className="w-4 h-4 text-muted-foreground/20 mx-auto mb-1.5" />
          <p className="text-[11px] text-muted-foreground/30">Sin datos de adherencia registrados</p>
        </div>
      )}

      {/* ── 3. Category Summary ── */}
      <div className="space-y-1.5">
        {METRICS.map(m => (
          <CategoryRow
            key={m.key}
            icon={m.icon}
            label={m.label}
            value={catAvg(m.key)}
            reason={catReason(m.reasonKey)}
            onClick={() => setSelectedCategory({ label: m.label, icon: m.icon, key: m.key, reasonKey: m.reasonKey })}
          />
        ))}
      </div>

      {/* ── Sheets ── */}
      <AnimatePresence>
        {selectedDay && (
          <DayDetailSheet day={selectedDay} onClose={() => setSelectedDay(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedCategory && (
          <CategoryDetailSheet
            label={selectedCategory.label}
            icon={selectedCategory.icon}
            history={microcycleDays}
            metricKey={selectedCategory.key}
            reasonKey={selectedCategory.reasonKey}
            onClose={() => setSelectedCategory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
