import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, AlertTriangle, ChevronRight, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useCoachAthletes, CoachAthlete, CoachFilter, CoachSort } from '@/hooks/useCoachAthletes';
import { AthleteDetailView } from './AthleteDetailView';
import { cn } from '@/lib/utils';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

const fatiguePillClass = (f: string) =>
  f === 'Alta'
    ? 'bg-red-500/15 text-red-400'
    : f === 'Media'
    ? 'bg-yellow-500/15 text-yellow-400'
    : f === 'Sin datos'
    ? 'bg-muted text-muted-foreground'
    : 'bg-emerald-500/15 text-emerald-400';

const KpiCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <motion.div
    className="rounded-2xl border border-border/40 bg-card/30 p-4 flex flex-col items-center justify-center text-center min-h-[88px]"
    whileTap={{ scale: 0.97 }}
  >
    <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
    <p className="text-[11px] text-muted-foreground mt-1.5">{label}</p>
    {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
  </motion.div>
);

const filters: { key: CoachFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'vb1', label: 'VB1' },
  { key: 'vb2', label: 'VB2' },
  { key: 'high_fatigue', label: 'Fatiga alta' },
  { key: 'low_adherence', label: 'Baja adherencia' },
];

const sorts: { key: CoachSort; label: string }[] = [
  { key: 'adherence', label: 'Adherencia' },
  { key: 'fatigue', label: 'Fatiga' },
  { key: 'last_activity', label: 'Última actividad' },
];

export const CoachPanel = () => {
  const {
    athletes,
    allAthletes,
    loading,
    error,
    kpis,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
  } = useCoachAthletes();

  const [selectedAthlete, setSelectedAthlete] = useState<CoachAthlete | null>(null);
  const [showSort, setShowSort] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {selectedAthlete ? (
        <AthleteDetailView
          key="detail"
          athlete={selectedAthlete}
          onBack={() => setSelectedAthlete(null)}
        />
      ) : (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: premiumEase }}
          className="space-y-6 pb-8"
        >
          {/* Header */}
          <div className="text-center mb-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.28 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-foreground/10 mb-4"
            >
              <Users className="w-4 h-4 text-foreground/60" />
              <span className="text-sm font-medium text-foreground/80">Coach Panel</span>
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground">Coach Panel</h2>
            <p className="text-sm text-muted-foreground mt-1">Vista general de atletas</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-3 gap-3">
                <KpiCard label="Atletas activos" value={kpis.total} />
                <KpiCard label="VB1" value={kpis.vb1} />
                <KpiCard label="VB2" value={kpis.vb2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <KpiCard label="Fatiga alta" value={kpis.highFatigue} />
                <KpiCard label="Adherencia media" value={`${kpis.avgAdherence}%`} />
                <KpiCard label="Alertas activas" value={kpis.activeAlerts} />
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar atleta..."
                  className="w-full rounded-xl border border-border/40 bg-card/30 py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
                <button
                  onClick={() => setShowSort(!showSort)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted/40"
                >
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground/60" />
                </button>
              </div>

              {/* Sort dropdown */}
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Ordenar:</span>
                      {sorts.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => setSort(s.key)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
                            sort === s.key
                              ? 'bg-foreground text-background'
                              : 'bg-muted/40 text-muted-foreground'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                      filter === f.key
                        ? 'bg-foreground text-background'
                        : 'bg-foreground/5 text-muted-foreground border border-border/40'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Athlete List */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Atletas {athletes.length !== allAthletes.length && `(${athletes.length}/${allAthletes.length})`}
                  </span>
                </div>

                {athletes.length === 0 ? (
                  <div className="rounded-2xl border border-border/40 bg-card/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {allAthletes.length === 0
                        ? 'No tienes atletas asignados aún'
                        : 'No se encontraron atletas con esos filtros'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {athletes.map((athlete, i) => (
                      <motion.button
                        key={athlete.id}
                        onClick={() => setSelectedAthlete(athlete)}
                        className="w-full rounded-2xl border border-border/40 bg-card/30 p-4 flex items-center gap-3 text-left transition-colors hover:bg-card/50 active:bg-card/60"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i, duration: 0.24, ease: premiumEase }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-foreground/70">
                            {((athlete.full_name ?? athlete.email ?? '?')
                              .split(/[\s@]/)
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)).toUpperCase()}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {athlete.full_name ?? athlete.email ?? 'Sin nombre'}
                            </p>
                            {athlete.active_model && (
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-[10px] font-bold',
                                  athlete.active_model === 'VB2'
                                    ? 'bg-foreground/10 text-foreground'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                {athlete.active_model}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                                fatiguePillClass(athlete.fatigue_level)
                              )}
                            >
                              {athlete.fatigue_level}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {athlete.total_adherence != null ? `${Math.round(athlete.total_adherence)}%` : '—'}
                            </span>
                            {athlete.last_activity_date && (
                              <span className="text-[10px] text-muted-foreground/50">
                                {athlete.last_activity_date}
                              </span>
                            )}
                            {athlete.active_alerts_count > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                                <AlertTriangle className="w-3 h-3" />
                                {athlete.active_alerts_count}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Alerts preview */}
              {kpis.highFatigue > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {kpis.highFatigue} atleta{kpis.highFatigue > 1 ? 's' : ''} con fatiga alta
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                    {allAthletes
                        .filter((a) => a.fatigue_level === 'Alta')
                        .map((a) => a.full_name ?? a.email ?? 'Sin nombre')
                        .join(', ')}
                    </p>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
