import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Activity, Moon, Brain, Utensils, Dumbbell, Heart, TrendingUp,
  AlertTriangle, FileText, Shield, Loader2, ChevronDown, Zap, Droplets,
  MessageSquarePlus, Clock
} from 'lucide-react';
import { CoachAthlete } from '@/hooks/useCoachAthletes';
import { useAthleteDetail } from '@/hooks/useAthleteDetail';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface AthleteDetailViewProps {
  athlete: CoachAthlete;
  onBack: () => void;
}

/* ── Shared building blocks ── */

const MetricRow = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
    <span className="text-[13px] text-muted-foreground">{label}</span>
    <div className="text-right">
      <span className="text-[13px] font-medium text-foreground">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground/60 ml-1">{sub}</span>}
    </div>
  </div>
);

const MacroBar = ({ label, actual, target }: { label: string; actual: number | null; target: number | null }) => {
  const pct = target && actual ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">
          {actual != null ? Math.round(actual) : '—'} / {target != null ? Math.round(target) : '—'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct >= 90 ? 'bg-emerald-500/70' : pct >= 60 ? 'bg-yellow-500/60' : 'bg-red-500/50'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const AdherenceBar = ({ label, value }: { label: string; value: number | null }) => {
  const v = value != null ? Math.round(value) : null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-foreground/5 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              (v ?? 0) >= 80 ? 'bg-emerald-500/70' : (v ?? 0) >= 50 ? 'bg-yellow-500/60' : 'bg-red-500/50'
            )}
            style={{ width: `${v ?? 0}%` }}
          />
        </div>
        <span className="text-[13px] font-medium text-foreground w-10 text-right">
          {v != null ? `${v}%` : '—'}
        </span>
      </div>
    </div>
  );
};

const MiniChart = ({ data, dataKey, color }: { data: { date: string; [k: string]: any }[]; dataKey: string; color: string }) => {
  if (!data.length) return <p className="text-[11px] text-muted-foreground py-2">Sin datos históricos</p>;
  const values = data.map(d => d[dataKey] ?? 0).filter(v => v != null);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-[3px] h-12 mt-1">
      {data.map((d, i) => {
        const v = d[dataKey] ?? 0;
        const h = ((v - min) / range) * 100;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all"
            style={{
              height: `${Math.max(h, 4)}%`,
              backgroundColor: color,
              opacity: 0.6 + (i / data.length) * 0.4,
            }}
            title={`${d.date}: ${v != null ? Math.round(v) : '—'}`}
          />
        );
      })}
    </div>
  );
};

const fatiguePillClass = (f: string) =>
  f === 'Alta' ? 'bg-red-500/15 text-red-400'
    : f === 'Media' ? 'bg-yellow-500/15 text-yellow-400'
    : f === 'Sin datos' ? 'bg-muted text-muted-foreground'
    : 'bg-emerald-500/15 text-emerald-400';

const severityClass = (s: string | null) =>
  s === 'high' ? 'border-red-500/30 bg-red-500/5'
    : s === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5'
    : 'border-border/40 bg-card/30';

const severityDot = (s: string | null) =>
  s === 'high' ? 'bg-red-400' : s === 'medium' ? 'bg-yellow-400' : 'bg-emerald-400';

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: 'Prioridad alta', className: 'bg-red-500/15 text-red-400' },
  review: { label: 'Revisar', className: 'bg-yellow-500/15 text-yellow-400' },
  stable: { label: 'Estable', className: 'bg-emerald-500/15 text-emerald-400' },
  one_to_one: { label: 'Seguimiento 1:1', className: 'bg-foreground/10 text-foreground' },
};

/* ── Section wrapper ── */

const SectionIcon = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-muted-foreground" />
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
  </div>
);

/* ── Main component ── */

export const AthleteDetailView = ({ athlete, onBack }: AthleteDetailViewProps) => {
  const { data: detail, loading, addNote } = useAthleteDetail(athlete.id);
  const model = athlete.active_model ?? 'VB1';

  const [noteText, setNoteText] = useState('');
  const [notePriority, setNotePriority] = useState('stable');
  const [saving, setSaving] = useState(false);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    await addNote(noteText.trim(), notePriority);
    setNoteText('');
    setNotePriority('stable');
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-5 pb-10"
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <motion.button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center mt-0.5 flex-shrink-0"
          whileTap={{ scale: 0.92 }}
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">{athlete.full_name ?? athlete.email ?? 'Sin nombre'}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-semibold",
              model === 'VB2' ? 'bg-foreground/10 text-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {model}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", fatiguePillClass(athlete.fatigue_level))}>
              Fatiga {athlete.fatigue_level}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400">
              Seguimiento activo
            </span>
          </div>
          {athlete.last_activity_date && (
            <p className="text-[10px] text-muted-foreground/50 mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Última actividad: {athlete.last_activity_date}
            </p>
          )}
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Adherencia', value: athlete.total_adherence != null ? `${Math.round(athlete.total_adherence)}%` : '—', icon: TrendingUp },
          { label: 'Readiness', value: detail?.metrics?.readiness_score != null ? `${Math.round(detail.metrics.readiness_score)}` : '—', icon: Zap },
          { label: 'Fatiga', value: athlete.fatigue_level, icon: Activity },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/40 bg-card/30 p-3 text-center">
            <s.icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-base font-bold text-foreground leading-none">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {/* ── 1. Perfil base ── */}
          <AccordionItem value="profile" className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionIcon icon={Heart} label="Perfil base" />
            </AccordionTrigger>
            <AccordionContent className="px-4">
              {(athlete.age != null || athlete.weight != null || athlete.height != null || athlete.disciplines?.length || athlete.years_training || athlete.main_goal) ? (
                <>
                  <MetricRow label="Edad" value={athlete.age != null ? `${athlete.age} años` : '—'} />
                  <MetricRow label="Peso" value={athlete.weight != null ? `${athlete.weight} kg` : '—'} />
                  <MetricRow label="Altura" value={athlete.height != null ? `${athlete.height} cm` : '—'} />
                  <MetricRow label="Disciplinas" value={athlete.disciplines?.length ? athlete.disciplines.join(', ') : '—'} />
                  <MetricRow label="Experiencia" value={athlete.years_training ?? '—'} />
                  <MetricRow label="Objetivo" value={athlete.main_goal ?? '—'} />
                </>
              ) : (
                <p className="text-[12px] text-muted-foreground py-3">Pendiente de registro</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── 2. Contexto actual ── */}
          <AccordionItem value="context" className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionIcon icon={Moon} label="Contexto actual" />
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <MetricRow label="Sueño" value={detail?.metrics?.sleep_hours != null ? `${detail.metrics.sleep_hours} h` : '—'} />
              <MetricRow label="Calidad sueño" value={detail?.metrics?.sleep_quality ?? '—'} />
              <MetricRow label="Estrés" value={detail?.metrics?.stress_level ?? '—'} />
              <MetricRow label="Adh. nutricional" value={detail?.adherence?.nutrition_adherence != null ? `${Math.round(detail.adherence.nutrition_adherence)}%` : '—'} />
              <MetricRow label="Carga mental" value={detail?.metrics?.mental_load ?? '—'} />
              <MetricRow label="Lesiones / molestias" value={detail?.metrics?.injuries_or_discomfort ?? '—'} />
            </AccordionContent>
          </AccordionItem>

          {/* ── 3. Estado NEO ── */}
          <AccordionItem value="neo-state" className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionIcon icon={Activity} label="Estado NEO" />
            </AccordionTrigger>
            <AccordionContent className="px-4">
              {detail?.fatigue ? (
                <>
                  <MetricRow label="Fatiga muscular" value={detail.fatigue.muscular_fatigue != null ? `${Math.round(detail.fatigue.muscular_fatigue)}%` : '—'} />
                  <MetricRow label="Fatiga neuromuscular" value={detail.fatigue.neuro_fatigue != null ? `${Math.round(detail.fatigue.neuro_fatigue)}%` : '—'} />
                  <MetricRow label="Fatiga conectiva" value={detail.fatigue.connective_fatigue != null ? `${Math.round(detail.fatigue.connective_fatigue)}%` : '—'} />
                  <MetricRow label="Fatiga global" value={detail.fatigue.global_fatigue != null ? `${Math.round(detail.fatigue.global_fatigue)}%` : '—'} />
                  <MetricRow label="Readiness" value={detail.metrics?.readiness_score != null ? `${Math.round(detail.metrics.readiness_score)}` : '—'} />
                  <MetricRow label="Tendencia recuperación" value={detail.fatigue.recovery_trend ?? '—'} />
                  <MetricRow label="Nivel alerta" value={detail.fatigue.alert_level ?? '—'} />
                </>
              ) : (
                <p className="text-[12px] text-muted-foreground py-3">Sin datos de estado</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── 4. Adherencia ── */}
          <AccordionItem value="adherence" className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionIcon icon={TrendingUp} label="Adherencia" />
            </AccordionTrigger>
            <AccordionContent className="px-4">
              {detail?.adherence ? (
                <>
                  <AdherenceBar label="Entrenamiento" value={detail.adherence.training_adherence} />
                  <AdherenceBar label="Nutrición" value={detail.adherence.nutrition_adherence} />
                  <AdherenceBar label="Sueño" value={detail.adherence.sleep_adherence} />
                  <AdherenceBar label="Suplementos" value={detail.adherence.supplement_adherence} />
                  <AdherenceBar label="Total" value={detail.adherence.total_adherence} />
                  <AdherenceBar label="Microciclo" value={detail.adherence.microcycle_adherence} />
                </>
              ) : (
                <p className="text-[12px] text-muted-foreground py-3">Sin datos de adherencia</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── 5. Entrenamiento ── */}
          <AccordionItem value="training" className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionIcon icon={Dumbbell} label="Entrenamiento" />
            </AccordionTrigger>
            <AccordionContent className="px-4">
              {detail?.trainingSessions && detail.trainingSessions.length > 0 ? (
                <div className="space-y-2">
                  {detail.trainingSessions[0]?.microcycle_name && (
                    <MetricRow label="Microciclo actual" value={detail.trainingSessions[0].microcycle_name} />
                  )}
                  <MetricRow
                    label="Sesiones completadas"
                    value={`${detail.trainingSessions.filter(s => s.completed).length} / ${detail.trainingSessions.length}`}
                  />
                  {detail.trainingSessions.some(s => s.deviation_score != null) && (
                    <MetricRow
                      label="Desviación media"
                      value={`${Math.round(
                        detail.trainingSessions
                          .filter(s => s.deviation_score != null)
                          .reduce((s, t) => s + (t.deviation_score ?? 0), 0) /
                        Math.max(detail.trainingSessions.filter(s => s.deviation_score != null).length, 1)
                      )}%`}
                    />
                  )}
                  <div className="pt-2 space-y-1.5">
                    {detail.trainingSessions.slice(0, 5).map(s => (
                      <div key={s.id} className="flex items-center justify-between py-1.5 text-[12px]">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", s.completed ? 'bg-emerald-400' : 'bg-muted-foreground/30')} />
                          <span className="text-muted-foreground">{s.date}</span>
                          {s.session_type && <span className="text-foreground">{s.session_type}</span>}
                        </div>
                        {s.deviation_score != null && (
                          <span className={cn("text-[10px] font-medium",
                            s.deviation_score > 20 ? 'text-red-400' : 'text-muted-foreground'
                          )}>
                            {s.deviation_score > 0 ? `+${Math.round(s.deviation_score)}%` : `${Math.round(s.deviation_score)}%`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 pt-1 italic">Ajuste sugerido: placeholder</p>
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground py-3">Sin sesiones registradas</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── 6. Nutrición ── */}
          <AccordionItem value="nutrition" className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionIcon icon={Utensils} label="Nutrición" />
            </AccordionTrigger>
            <AccordionContent className="px-4">
              {detail?.nutrition ? (
                <div className="space-y-3">
                  <MacroBar label="Calorías" actual={detail.nutrition.calories_actual} target={detail.nutrition.calories_target} />
                  <MacroBar label="Proteína (g)" actual={detail.nutrition.protein_actual} target={detail.nutrition.protein_target} />
                  <MacroBar label="Carbohidratos (g)" actual={detail.nutrition.carbs_actual} target={detail.nutrition.carbs_target} />
                  <MacroBar label="Grasas (g)" actual={detail.nutrition.fats_actual} target={detail.nutrition.fats_target} />
                  <MetricRow label="Hidratación" value={detail.nutrition.hydration_status ?? '—'} />
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground py-3">Sin datos de nutrición</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── 7. Alertas ── */}
          <AccordionItem value="alerts" className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionIcon icon={AlertTriangle} label={`Alertas ${detail?.alerts?.length ? `(${detail.alerts.length})` : ''}`} />
            </AccordionTrigger>
            <AccordionContent className="px-4">
              {detail?.alerts && detail.alerts.length > 0 ? (
                <div className="space-y-2">
                  {detail.alerts.map(al => (
                    <div key={al.id} className={cn("rounded-xl border p-3", severityClass(al.severity))}>
                      <div className="flex items-start gap-2">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", severityDot(al.severity))} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground">{al.alert_title ?? al.alert_type ?? 'Alerta'}</p>
                          {al.alert_message && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{al.alert_message}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground/50 mt-1">{al.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground py-3">Sin alertas activas</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── 8. Historial ── */}
          <AccordionItem value="history" className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionIcon icon={FileText} label="Historial" />
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Peso corporal</p>
                  <MiniChart data={detail?.weightHistory ?? []} dataKey="weight" color="hsl(var(--foreground) / 0.5)" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Fatiga global</p>
                  <MiniChart data={detail?.fatigueHistory ?? []} dataKey="global_fatigue" color="hsl(0 70% 60% / 0.6)" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Adherencia total</p>
                  <MiniChart data={detail?.adherenceHistory ?? []} dataKey="total_adherence" color="hsl(145 60% 50% / 0.6)" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── 9. Coach Notes ── */}
          <AccordionItem value="notes" className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionIcon icon={MessageSquarePlus} label="Notas del coach" />
            </AccordionTrigger>
            <AccordionContent className="px-4">
              {/* Existing notes */}
              {detail?.coachNotes && detail.coachNotes.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {detail.coachNotes.map(n => (
                    <div key={n.id} className="rounded-xl border border-border/30 bg-card/20 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {n.priority && priorityConfig[n.priority] && (
                          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", priorityConfig[n.priority].className)}>
                            {priorityConfig[n.priority].label}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/50">
                          {new Date(n.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[13px] text-foreground leading-relaxed">{n.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground py-2 mb-3">Sin notas aún</p>
              )}

              {/* Add note */}
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Añadir nota..."
                  rows={2}
                  className="w-full rounded-xl border border-border/40 bg-background/50 p-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(priorityConfig).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setNotePriority(key)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-semibold transition-all",
                        notePriority === key
                          ? cfg.className + ' ring-1 ring-foreground/20'
                          : 'bg-muted/30 text-muted-foreground'
                      )}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
                <motion.button
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || saving}
                  className="w-full rounded-xl bg-foreground text-background py-2.5 text-[13px] font-medium disabled:opacity-30 transition-opacity"
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? 'Guardando...' : 'Guardar nota'}
                </motion.button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* ── VB2 Premium card ── */}
      {model === 'VB2' && (
        <div className="rounded-2xl border border-foreground/20 bg-foreground/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-foreground/60" />
            <p className="text-sm font-bold text-foreground">VB2 · Asesoría 1:1 con Pablo</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seguimiento avanzado con métricas, ajustes y análisis de mayor precisión.
          </p>
        </div>
      )}
    </motion.div>
  );
};
