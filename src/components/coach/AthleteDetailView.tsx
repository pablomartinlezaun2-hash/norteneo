import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Moon, Brain, Utensils, Dumbbell, Heart, TrendingUp } from 'lucide-react';
import { CoachAthlete } from '@/hooks/useCoachAthletes';
import { cn } from '@/lib/utils';

interface AthleteDetailViewProps {
  athlete: CoachAthlete;
  onBack: () => void;
}

const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

const fatiguePillClass = (f: string) =>
  f === 'Alta'
    ? 'bg-red-500/15 text-red-400'
    : f === 'Media'
    ? 'bg-yellow-500/15 text-yellow-400'
    : f === 'Sin datos'
    ? 'bg-muted text-muted-foreground'
    : 'bg-emerald-500/15 text-emerald-400';

export const AthleteDetailView = ({ athlete, onBack }: AthleteDetailViewProps) => {
  const model = athlete.active_model ?? 'VB1';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center"
          whileTap={{ scale: 0.92 }}
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">
            {athlete.full_name ?? 'Sin nombre'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-semibold",
              model === 'VB2'
                ? 'bg-foreground/10 text-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {model}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", fatiguePillClass(athlete.fatigue_level))}>
              Fatiga {athlete.fatigue_level}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Adherencia', value: athlete.total_adherence != null ? `${Math.round(athlete.total_adherence)}%` : '—', icon: TrendingUp },
          { label: 'Readiness', value: athlete.latest_metrics?.readiness_score != null ? `${Math.round(athlete.latest_metrics.readiness_score)}` : '—', icon: Dumbbell },
          { label: 'Fatiga', value: athlete.fatigue_level, icon: Activity },
        ].map((s) => (
          <motion.div
            key={s.label}
            className="rounded-2xl border border-border/40 bg-card/50 p-4 text-center"
            whileTap={{ scale: 0.97 }}
          >
            <s.icon className="w-4 h-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Section: Base */}
      <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Heart className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base</span>
        </div>
        <div className="px-4">
          {athlete.age && <InfoRow label="Edad" value={`${athlete.age} años`} />}
          {athlete.weight && <InfoRow label="Peso" value={`${athlete.weight} kg`} />}
          {athlete.height && <InfoRow label="Altura" value={`${athlete.height} cm`} />}
          {athlete.disciplines && athlete.disciplines.length > 0 && (
            <InfoRow label="Disciplinas" value={athlete.disciplines.join(', ')} />
          )}
          {athlete.years_training && <InfoRow label="Experiencia" value={athlete.years_training} />}
        </div>
      </div>

      {/* Section: Contexto */}
      <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Moon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contexto</span>
        </div>
        <div className="px-4">
          <InfoRow
            label="Sueño"
            value={athlete.latest_metrics?.sleep_hours != null ? `${athlete.latest_metrics.sleep_hours} h` : '—'}
          />
          <InfoRow
            label="Estrés"
            value={athlete.latest_metrics?.stress_level ?? '—'}
          />
          <InfoRow
            label="Fatiga global"
            value={athlete.global_fatigue != null ? `${Math.round(athlete.global_fatigue)}%` : '—'}
          />
        </div>
      </div>

      {/* Section: Objetivo */}
      <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objetivo</span>
        </div>
        <div className="px-4">
          <InfoRow label="Objetivo principal" value={athlete.main_goal ?? '—'} />
        </div>
      </div>

      {/* Model card */}
      <div className={cn(
        "rounded-2xl border p-5",
        model === 'VB2'
          ? 'border-foreground/20 bg-foreground/5'
          : 'border-border/40 bg-card/30'
      )}>
        <p className="text-sm font-bold text-foreground">
          {model === 'VB2' ? 'VB2 · Asesoría 1:1 con Pablo' : 'VB1 · Configuración simple'}
        </p>
        {model === 'VB2' && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            VB2 funciona como una asesoría 1:1 con Pablo. NEO se utiliza como sistema de medición, control y ajuste para trabajar con mucha más precisión.
          </p>
        )}
      </div>

      {/* Last update */}
      <p className="text-[11px] text-muted-foreground text-center pb-4">
        Última actividad: {athlete.last_activity_date ?? 'Sin registros'}
      </p>
    </motion.div>
  );
};
