import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Moon, Brain, Utensils, Dumbbell, Heart, TrendingUp } from 'lucide-react';
import { MockAthlete } from './mockAthletes';
import { cn } from '@/lib/utils';

interface AthleteDetailViewProps {
  athlete: MockAthlete;
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
    : 'bg-emerald-500/15 text-emerald-400';

export const AthleteDetailView = ({ athlete, onBack }: AthleteDetailViewProps) => {
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
          <h2 className="text-xl font-bold text-foreground truncate">{athlete.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-semibold",
              athlete.model === 'VB2'
                ? 'bg-foreground/10 text-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {athlete.model}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", fatiguePillClass(athlete.fatigue))}>
              Fatiga {athlete.fatigue}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Adherencia', value: `${athlete.adherence}%`, icon: TrendingUp },
          { label: 'Días/sem', value: `${athlete.trainingDays}`, icon: Dumbbell },
          { label: 'Fatiga', value: athlete.fatigue, icon: Activity },
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
          <InfoRow label="Edad" value={`${athlete.age} años`} />
          <InfoRow label="Peso" value={`${athlete.weight} kg`} />
          <InfoRow label="Altura" value={`${athlete.height} cm`} />
          <InfoRow label="Disciplinas" value={athlete.disciplines} />
          <InfoRow label="Experiencia" value={athlete.experience} />
        </div>
      </div>

      {/* Section: Contexto */}
      <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Moon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contexto</span>
        </div>
        <div className="px-4">
          <InfoRow label="Sueño" value={`${athlete.sleepHours} h`} />
          <InfoRow label="Estrés" value={athlete.stress} />
          <InfoRow label="Recuperación" value={athlete.recovery} />
        </div>
      </div>

      {/* Section: Nutrición */}
      <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Utensils className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nutrición</span>
        </div>
        <div className="px-4">
          <InfoRow label="Adherencia nutricional" value={athlete.nutritionAdherence} />
        </div>
      </div>

      {/* Section: Objetivo */}
      <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objetivo</span>
        </div>
        <div className="px-4">
          <InfoRow label="Objetivo principal" value={athlete.objective} />
        </div>
      </div>

      {/* Model card */}
      <div className={cn(
        "rounded-2xl border p-5",
        athlete.model === 'VB2'
          ? 'border-foreground/20 bg-foreground/5'
          : 'border-border/40 bg-card/30'
      )}>
        <p className="text-sm font-bold text-foreground">
          {athlete.model === 'VB2' ? 'VB2 · Asesoría 1:1 con Pablo' : 'VB1 · Configuración simple'}
        </p>
        {athlete.model === 'VB2' && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            VB2 funciona como una asesoría 1:1 con Pablo. NEO se utiliza como sistema de medición, control y ajuste para trabajar con mucha más precisión.
          </p>
        )}
      </div>

      {/* Last update */}
      <p className="text-[11px] text-muted-foreground text-center pb-4">
        Última actualización: {athlete.lastUpdate}
      </p>
    </motion.div>
  );
};
