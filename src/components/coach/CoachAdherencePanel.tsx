import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, X, ChevronRight, Utensils, Dumbbell, Moon, Pill } from 'lucide-react';
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

/* ── Color helpers ── */
const adherenceColor = (v: number | null): string => {
  if (v == null) return 'hsl(var(--muted-foreground) / 0.15)';
  if (v >= 90) return 'hsl(142 71% 45%)';
  if (v >= 70) return 'hsl(38 92% 50%)';
  return 'hsl(0 62% 50%)';
};

const adherenceTextColor = (v: number | null): string => {
  if (v == null) return 'text-muted-foreground/40';
  if (v >= 90) return 'text-emerald-400';
  if (v >= 70) return 'text-yellow-400';
  return 'text-red-400';
};

const hasRealData = (day: AdherenceDayData): boolean =>
  day.training_adherence != null ||
  day.nutrition_adherence != null ||
  day.sleep_adherence != null ||
  day.supplement_adherence != null;

const countActiveMetrics = (day: AdherenceDayData): number => {
  let c = 0;
  if (day.training_adherence != null) c++;
  if (day.nutrition_adherence != null) c++;
  if (day.sleep_adherence != null) c++;
  if (day.supplement_adherence != null) c++;
  return c;
};

const formatDayLabel = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
};

const formatDayNum = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.getDate().toString();
};

/* ── Category Row ── */
const CategoryRow = ({ icon: Icon, label, value, onClick }: {
  icon: any; label: string; value: number | null; onClick?: () => void;
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
            <span className={cn("text-[12px] font-bold tabular-nums w-10 text-right", adherenceTextColor(v))}>
              {v}%
            </span>
          </>
        ) : (
          <span className="text-[11px] text-muted-foreground/30">Sin datos</span>
        )}
        <ChevronRight className="w-3 h-3 text-muted-foreground/20" />
      </div>
    </motion.button>
  );
};

/* ── Day Detail Drawer ── */
const DayDetailSheet = ({ day, onClose }: { day: AdherenceDayData; onClose: () => void }) => {
  const metrics = [
    { key: 'nutrition_adherence' as const, label: 'Nutrición', icon: Utensils },
    { key: 'training_adherence' as const, label: 'Entrenamiento', icon: Dumbbell },
    { key: 'sleep_adherence' as const, label: 'Sueño', icon: Moon },
    { key: 'supplement_adherence' as const, label: 'Suplementación', icon: Pill },
  ];

  const active = metrics.filter(m => day[m.key] != null);
  const excluded = metrics.filter(m => day[m.key] == null);
  const dateFormatted = new Date(day.date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

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

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Detalle del día</p>
            <p className="text-[13px] font-semibold text-foreground capitalize mt-0.5">{dateFormatted}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-muted-foreground/50" />
          </button>
        </div>

        {/* Global score */}
        <div className="text-center py-4 mb-4 rounded-xl border border-border/10 bg-foreground/[0.02]">
          {day.total_adherence != null ? (
            <>
              <p className={cn("text-3xl font-black tabular-nums", adherenceTextColor(day.total_adherence))}>
                {Math.round(day.total_adherence)}%
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">Adherencia global</p>
            </>
          ) : (
            <p className="text-[12px] text-muted-foreground/40">Sin datos válidos</p>
          )}
        </div>

        {/* Active metrics */}
        {active.length > 0 && (
          <div className="space-y-1.5 mb-4">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-1">Métricas activas</p>
            {active.map(m => {
              const v = day[m.key]!;
              return (
                <div key={m.key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-foreground/[0.02]">
                  <div className="flex items-center gap-2">
                    <m.icon className="w-3 h-3 text-muted-foreground/50" />
                    <span className="text-[11px] text-foreground/70">{m.label}</span>
                  </div>
                  <span className={cn("text-[12px] font-bold tabular-nums", adherenceTextColor(v))}>
                    {Math.round(v)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Excluded metrics */}
        {excluded.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-1">Excluidas</p>
            {excluded.map(m => (
              <div key={m.key} className="flex items-center justify-between py-1.5 px-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <m.icon className="w-3 h-3 text-muted-foreground/20" />
                  <span className="text-[11px] text-muted-foreground/30">{m.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/20">No registrado</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ── Category Detail Sheet ── */
const CategoryDetailSheet = ({ label, icon: Icon, history, metricKey, onClose }: {
  label: string; icon: any; history: AdherenceDayData[]; metricKey: keyof AdherenceDayData; onClose: () => void;
}) => {
  const daysWithData = history.filter(d => d[metricKey] != null);
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
        className="w-full max-w-md rounded-t-2xl border border-border/20 bg-background p-5 pb-8 max-h-[70vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground/40">
                {daysWithData.length} día{daysWithData.length !== 1 ? 's' : ''} con datos
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-muted-foreground/50" />
          </button>
        </div>

        {/* Average */}
        <div className="text-center py-3 mb-4 rounded-xl border border-border/10 bg-foreground/[0.02]">
          {avg != null ? (
            <>
              <p className={cn("text-2xl font-black tabular-nums", adherenceTextColor(avg))}>{avg}%</p>
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">Promedio del microciclo</p>
            </>
          ) : (
            <p className="text-[12px] text-muted-foreground/30">Sin datos</p>
          )}
        </div>

        {/* Day-by-day */}
        <div className="space-y-1">
          {history.map(day => {
            const v = day[metricKey] as number | null;
            const dateLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
            return (
              <div key={day.date} className="flex items-center justify-between py-2 px-3 rounded-lg bg-foreground/[0.015]">
                <span className="text-[11px] text-muted-foreground/60 capitalize">{dateLabel}</span>
                {v != null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1 rounded-full bg-foreground/[0.05] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: adherenceColor(v) }} />
                    </div>
                    <span className={cn("text-[11px] font-bold tabular-nums w-8 text-right", adherenceTextColor(v))}>
                      {Math.round(v)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground/20">—</span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════ Main Panel ══════════════════ */

export const CoachAdherencePanel = ({ history, latest }: Props) => {
  const [selectedDay, setSelectedDay] = useState<AdherenceDayData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{
    label: string; icon: any; key: keyof AdherenceDayData;
  } | null>(null);

  const daysWithData = history.filter(hasRealData);
  const avg = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + (d.total_adherence ?? 0), 0) / daysWithData.filter(d => d.total_adherence != null).length || 0)
    : null;

  // Compute per-category averages from history
  const catAvg = (key: keyof AdherenceDayData): number | null => {
    const valid = history.filter(d => d[key] != null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((s, d) => s + (d[key] as number), 0) / valid.length);
  };

  const activeMetricsCount = latest ? countActiveMetrics(latest) : 0;

  return (
    <div className="space-y-4">
      {/* ── 1. Top Summary ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-center py-3 rounded-xl border border-border/10 bg-foreground/[0.02]">
          {avg != null ? (
            <motion.p
              className={cn("text-2xl font-black tabular-nums", adherenceTextColor(avg))}
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
          <p className="text-2xl font-black text-foreground/80 tabular-nums">{daysWithData.length}</p>
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Días</p>
        </div>
        <div className="flex-1 text-center py-3 rounded-xl border border-border/10 bg-foreground/[0.02]">
          <p className="text-2xl font-black text-foreground/80 tabular-nums">{activeMetricsCount}</p>
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Métricas</p>
        </div>
      </div>

      {/* ── 2. Microcycle Adherence Strip ── */}
      {history.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">Adherencia por día</p>
          <div className="flex gap-1">
            {history.map((day, i) => {
              const hasData = hasRealData(day);
              const v = day.total_adherence;
              return (
                <motion.button
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  className="flex-1 flex flex-col items-center gap-1 group"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3, ease }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-[8px] text-muted-foreground/30 font-medium">
                    {formatDayLabel(day.date)}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-lg transition-all duration-300",
                      hasData
                        ? 'min-h-[36px] group-hover:ring-1 group-hover:ring-foreground/10'
                        : 'min-h-[36px] bg-foreground/[0.03] border border-dashed border-border/10'
                    )}
                    style={hasData ? {
                      backgroundColor: adherenceColor(v),
                      opacity: v != null ? 0.25 + (v / 100) * 0.75 : 0.15,
                    } : undefined}
                  />
                  <span className={cn(
                    "text-[9px] font-bold tabular-nums",
                    hasData ? adherenceTextColor(v) : 'text-muted-foreground/15'
                  )}>
                    {hasData && v != null ? `${Math.round(v)}` : '·'}
                  </span>
                  <span className="text-[8px] text-muted-foreground/20">{formatDayNum(day.date)}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-6 text-center rounded-xl border border-dashed border-border/10">
          <p className="text-[11px] text-muted-foreground/30">Sin datos de adherencia registrados</p>
        </div>
      )}

      {/* ── 3. Category Summary ── */}
      <div className="space-y-1.5">
        <CategoryRow
          icon={Utensils}
          label="Nutrición"
          value={catAvg('nutrition_adherence')}
          onClick={() => setSelectedCategory({ label: 'Nutrición', icon: Utensils, key: 'nutrition_adherence' })}
        />
        <CategoryRow
          icon={Dumbbell}
          label="Entrenamiento"
          value={catAvg('training_adherence')}
          onClick={() => setSelectedCategory({ label: 'Entrenamiento', icon: Dumbbell, key: 'training_adherence' })}
        />
        <CategoryRow
          icon={Moon}
          label="Sueño"
          value={catAvg('sleep_adherence')}
          onClick={() => setSelectedCategory({ label: 'Sueño', icon: Moon, key: 'sleep_adherence' })}
        />
      </div>

      {/* ── Drawers ── */}
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
            history={history}
            metricKey={selectedCategory.key}
            onClose={() => setSelectedCategory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
