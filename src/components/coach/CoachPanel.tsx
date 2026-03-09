import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, AlertTriangle, ChevronRight } from 'lucide-react';
import { mockAthletes, MockAthlete } from './mockAthletes';
import { AthleteDetailView } from './AthleteDetailView';
import { cn } from '@/lib/utils';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

const fatiguePillClass = (f: string) =>
  f === 'Alta'
    ? 'bg-red-500/15 text-red-400'
    : f === 'Media'
    ? 'bg-yellow-500/15 text-yellow-400'
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

export const CoachPanel = () => {
  const [selectedAthlete, setSelectedAthlete] = useState<MockAthlete | null>(null);

  const totalActive = mockAthletes.length;
  const vb1Count = mockAthletes.filter((a) => a.model === 'VB1').length;
  const vb2Count = mockAthletes.filter((a) => a.model === 'VB2').length;
  const highFatigue = mockAthletes.filter((a) => a.fatigue === 'Alta').length;
  const avgAdherence = Math.round(mockAthletes.reduce((s, a) => s + a.adherence, 0) / totalActive);
  const alertsCount = highFatigue; // simplified

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

          {/* KPI Grid */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Atletas activos" value={totalActive} />
            <KpiCard label="VB1" value={vb1Count} />
            <KpiCard label="VB2" value={vb2Count} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Fatiga alta" value={highFatigue} />
            <KpiCard label="Adherencia media" value={`${avgAdherence}%`} />
            <KpiCard label="Alertas activas" value={alertsCount} />
          </div>

          {/* Athlete List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Atletas</span>
            </div>
            <div className="space-y-2">
              {mockAthletes.map((athlete, i) => (
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
                      {athlete.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{athlete.name}</p>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                        athlete.model === 'VB2'
                          ? 'bg-foreground/10 text-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {athlete.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", fatiguePillClass(athlete.fatigue))}>
                        {athlete.fatigue}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{athlete.adherence}%</span>
                      <span className="text-[10px] text-muted-foreground/50">{athlete.lastUpdate}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Alerts preview */}
          {highFatigue > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {highFatigue} atleta{highFatigue > 1 ? 's' : ''} con fatiga alta
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mockAthletes
                    .filter((a) => a.fatigue === 'Alta')
                    .map((a) => a.name)
                    .join(', ')}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
