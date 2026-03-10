import { motion } from 'framer-motion';
import { Shield, TrendingUp, Zap, Activity, Clock, ChevronRight } from 'lucide-react';
import { useVB2FollowUp } from '@/hooks/useVB2FollowUp';
import { cn } from '@/lib/utils';

const fatigueLabel = (v: number | null) =>
  v == null ? 'Sin datos' : v >= 70 ? 'Alta' : v >= 40 ? 'Media' : 'Baja';

const fatigueClass = (v: number | null) =>
  v == null ? 'text-muted-foreground' : v >= 70 ? 'text-red-400' : v >= 40 ? 'text-yellow-400' : 'text-emerald-400';

const StatusDot = ({ value, threshold }: { value: number | null; threshold?: number }) => {
  const t = threshold ?? 70;
  const color = value == null ? 'bg-muted-foreground/30' : value >= t ? 'bg-emerald-400' : value >= t * 0.7 ? 'bg-yellow-400' : 'bg-red-400';
  return <div className={cn("w-2 h-2 rounded-full", color)} />;
};

export const VB2FollowUpSection = () => {
  const { data, loading } = useVB2FollowUp();

  // Don't render anything if not VB2 or loading
  if (loading || !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Premium header card */}
      <div className="rounded-2xl border border-foreground/15 bg-foreground/[0.03] overflow-hidden">
        {/* Title bar */}
        <div className="px-4 py-3.5 flex items-center gap-2.5 border-b border-foreground/10">
          <Shield className="w-4 h-4 text-foreground/60" />
          <span className="text-[13px] font-semibold text-foreground">VB2 · Seguimiento activo</span>
          <div className="flex-1" />
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
            Activo
          </span>
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-2 divide-x divide-foreground/5">
          {/* Readiness */}
          <div className="px-4 py-3.5 border-b border-foreground/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Readiness</span>
            </div>
            <p className="text-lg font-bold text-foreground leading-none">
              {data.readiness_score != null ? Math.round(data.readiness_score) : '—'}
            </p>
          </div>

          {/* Fatigue */}
          <div className="px-4 py-3.5 border-b border-foreground/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Fatiga</span>
            </div>
            <p className={cn("text-lg font-bold leading-none", fatigueClass(data.global_fatigue))}>
              {fatigueLabel(data.global_fatigue)}
            </p>
          </div>

          {/* Weekly adherence */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Adh. semanal</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground leading-none">
                {data.weekly_adherence != null ? `${data.weekly_adherence}%` : '—'}
              </p>
              <StatusDot value={data.weekly_adherence} threshold={80} />
            </div>
          </div>

          {/* Recovery */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Recuperación</span>
            </div>
            <p className="text-[13px] font-medium text-foreground leading-snug">
              {data.recovery_trend ?? '—'}
            </p>
          </div>
        </div>

        {/* Alert level strip */}
        {data.alert_level && (
          <div className={cn(
            "px-4 py-2.5 border-t text-[11px] font-medium flex items-center gap-2",
            data.alert_level === 'high' ? 'border-red-500/20 bg-red-500/5 text-red-400'
              : data.alert_level === 'medium' ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400'
              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              data.alert_level === 'high' ? 'bg-red-400'
                : data.alert_level === 'medium' ? 'bg-yellow-400'
                : 'bg-emerald-400'
            )} />
            Nivel de alerta: {data.alert_level === 'high' ? 'Alto' : data.alert_level === 'medium' ? 'Medio' : 'Bajo'}
          </div>
        )}

        {/* Coach message placeholder */}
        {data.coach_message && (
          <div className="px-4 py-3 border-t border-foreground/5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Mensaje del coach</p>
            <p className="text-[13px] text-foreground leading-relaxed">{data.coach_message}</p>
            {data.coach_message_date && (
              <p className="text-[10px] text-muted-foreground/50 mt-1">{data.coach_message_date}</p>
            )}
          </div>
        )}

        {/* VB2 footer */}
        <div className="px-4 py-3 border-t border-foreground/5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Asesoría 1:1 con Pablo · Métricas, ajustes y análisis de mayor precisión.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
