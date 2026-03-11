import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Activity, Utensils, Dumbbell, Heart, TrendingUp,
  AlertTriangle, FileText, Shield, Loader2, Zap,
  MessageSquarePlus, Clock, MessageCircle, ChevronRight, Flame, User
} from 'lucide-react';
import { NeoFatigueMap } from '@/components/neo/NeoFatigueMap';
import { Neo2DAnatomyModel } from '@/components/neo/Neo2DAnatomyModel';
import { CoachAthlete } from '@/hooks/useCoachAthletes';
import { useAthleteDetail } from '@/hooks/useAthleteDetail';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChatView } from './ChatView';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AthleteDetailViewProps {
  athlete: CoachAthlete;
  onBack: () => void;
}

/* ── Building blocks ── */

const MetricRow = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
    <span className="text-[12px] text-muted-foreground">{label}</span>
    <div className="text-right">
      <span className="text-[12px] font-medium text-foreground">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground/50 ml-1">{sub}</span>}
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
      <div className="h-1 rounded-full bg-foreground/5 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct >= 90 ? 'bg-emerald-500/60' : pct >= 60 ? 'bg-yellow-500/50' : 'bg-red-500/40'
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
    <div className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-14 h-1 rounded-full bg-foreground/5 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              (v ?? 0) >= 80 ? 'bg-emerald-500/60' : (v ?? 0) >= 50 ? 'bg-yellow-500/50' : 'bg-red-500/40'
            )}
            style={{ width: `${v ?? 0}%` }}
          />
        </div>
        <span className="text-[12px] font-medium text-foreground w-9 text-right">
          {v != null ? `${v}%` : '—'}
        </span>
      </div>
    </div>
  );
};

const MiniChart = ({ data, dataKey, color }: { data: { date: string; [k: string]: any }[]; dataKey: string; color: string }) => {
  if (!data.length) return <p className="text-[11px] text-muted-foreground py-1">Sin datos</p>;
  const values = data.map(d => d[dataKey] ?? 0).filter(v => v != null);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-[2px] h-10 mt-0.5">
      {data.map((d, i) => {
        const v = d[dataKey] ?? 0;
        const h = ((v - min) / range) * 100;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${Math.max(h, 4)}%`, backgroundColor: color, opacity: 0.5 + (i / data.length) * 0.5 }}
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
  s === 'high' ? 'border-red-500/20 bg-red-500/[0.03]'
    : s === 'medium' ? 'border-yellow-500/20 bg-yellow-500/[0.03]'
    : 'border-border/30 bg-card/20';

const severityDot = (s: string | null) =>
  s === 'high' ? 'bg-red-400' : s === 'medium' ? 'bg-yellow-400' : 'bg-emerald-400';

const conversationStatusConfig: Record<string, { label: string; className: string }> = {
  stable: { label: 'Estable', className: 'bg-emerald-500/15 text-emerald-400' },
  review_today: { label: 'Revisar hoy', className: 'bg-yellow-500/15 text-yellow-400' },
  waiting_response: { label: 'Esperando respuesta', className: 'bg-sky-500/15 text-sky-400' },
  action_pending: { label: 'Acción pendiente', className: 'bg-red-500/15 text-red-400' },
  followup_1on1: { label: 'Seguimiento 1:1', className: 'bg-foreground/10 text-foreground' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: 'Alta', className: 'bg-red-500/15 text-red-400' },
  review: { label: 'Revisar', className: 'bg-yellow-500/15 text-yellow-400' },
  stable: { label: 'Estable', className: 'bg-emerald-500/15 text-emerald-400' },
  one_to_one: { label: '1:1', className: 'bg-foreground/10 text-foreground' },
};

/* ── Refined accordion trigger ── */

const SectionRow = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-2.5">
    <Icon className="w-3.5 h-3.5 text-muted-foreground/70" />
    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
  </div>
);

/* ── Accordion item wrapper for consistent slim styling ── */
const SlimAccordionItem = ({ value, icon, label, children }: { value: string; icon: any; label: string; children: React.ReactNode }) => (
  <AccordionItem value={value} className="rounded-xl border border-border/20 bg-card/20 overflow-hidden border-b-0">
    <AccordionTrigger className="px-4 py-2.5 hover:no-underline [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:text-muted-foreground/40">
      <SectionRow icon={icon} label={label} />
    </AccordionTrigger>
    <AccordionContent className="px-4 pb-3">
      {children}
    </AccordionContent>
  </AccordionItem>
);

/* ── Main component ── */

export const AthleteDetailView = ({ athlete, onBack }: AthleteDetailViewProps) => {
  const { data: detail, loading, addNote } = useAthleteDetail(athlete.id);
  const model = athlete.active_model ?? 'VB1';

  const [noteText, setNoteText] = useState('');
  const [notePriority, setNotePriority] = useState('stable');
  const [saving, setSaving] = useState(false);
  const [convStatus, setConvStatus] = useState<string>(athlete.conversation_status ?? 'stable');

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    await addNote(noteText.trim(), notePriority);
    setNoteText('');
    setNotePriority('stable');
    setSaving(false);
  };

  const updateConversationStatus = useCallback(async (newStatus: string) => {
    setConvStatus(newStatus);
    await (supabase as any)
      .from('coach_conversations')
      .update({ status: newStatus })
      .eq('athlete_id', athlete.id)
      .eq('coach_id', athlete.coach_id);
  }, [athlete.id, athlete.coach_id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6 pb-12"
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <motion.button
          onClick={onBack}
          className="w-8 h-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center mt-1 flex-shrink-0"
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft className="w-4 h-4 text-foreground/60" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground truncate leading-tight">
            {athlete.full_name ?? athlete.email ?? 'Sin nombre'}
          </h2>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold",
              model === 'VB2' ? 'bg-foreground/10 text-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {model}
            </span>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", fatiguePillClass(athlete.fatigue_level))}>
              {athlete.fatigue_level}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
              Activo
            </span>
          </div>

          {athlete.last_activity_date && (
            <p className="text-[10px] text-muted-foreground/40 mt-1.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {athlete.last_activity_date}
            </p>
          )}

          {/* Conversation status */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {Object.entries(conversationStatusConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => updateConversationStatus(key)}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all",
                  convStatus === key
                    ? cfg.className + ' ring-1 ring-foreground/10'
                    : 'bg-foreground/[0.02] text-muted-foreground/30 hover:text-muted-foreground/50'
                )}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Adherencia', value: athlete.total_adherence != null ? `${Math.round(athlete.total_adherence)}%` : '—', icon: TrendingUp },
          { label: 'Readiness', value: detail?.metrics?.readiness_score != null ? `${Math.round(detail.metrics.readiness_score)}` : '—', icon: Zap },
          { label: 'Fatiga', value: athlete.fatigue_level, icon: Activity },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/20 bg-card/20 p-2.5 text-center">
            <s.icon className="w-3 h-3 text-muted-foreground/50 mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
            <p className="text-[9px] text-muted-foreground/50 mt-0.5 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-4 h-4 text-muted-foreground/50 animate-spin" />
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-1.5">

          {/* 1. Perfil base */}
          <SlimAccordionItem value="profile" icon={Heart} label="Perfil base">
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
              <p className="text-[11px] text-muted-foreground py-2">Pendiente de registro</p>
            )}
          </SlimAccordionItem>

          {/* 2. Estado NEO — nested accordions with real athlete components */}
          <SlimAccordionItem value="neo-state" icon={Activity} label="Estado NEO">
            <Accordion type="multiple" className="space-y-1.5">
              {/* NEO Fatigue */}
              <AccordionItem value="neo-fatigue" className="rounded-lg border border-border/15 bg-foreground/[0.02] overflow-hidden border-b-0">
                <AccordionTrigger className="px-3 py-2 hover:no-underline [&>svg]:w-3 [&>svg]:h-3 [&>svg]:text-muted-foreground/30">
                  <SectionRow icon={Flame} label="NEO Fatigue" />
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-2">
                  <NeoFatigueMap
                    setLogs={detail?.setLogs ?? []}
                    exercises={(detail?.exercises ?? []).map(e => ({ id: e.id, name: e.name }))}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Modelo NEO */}
              <AccordionItem value="neo-model" className="rounded-lg border border-border/15 bg-foreground/[0.02] overflow-hidden border-b-0">
                <AccordionTrigger className="px-3 py-2 hover:no-underline [&>svg]:w-3 [&>svg]:h-3 [&>svg]:text-muted-foreground/30">
                  <SectionRow icon={User} label="Modelo NEO" />
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-2">
                  <Neo2DAnatomyModel
                    setLogs={detail?.setLogs ?? []}
                    exercises={detail?.exercises ?? []}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SlimAccordionItem>

          {/* 3. Adherencia */}
          <SlimAccordionItem value="adherence" icon={TrendingUp} label="Adherencia">
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
              <p className="text-[11px] text-muted-foreground py-2">Sin datos</p>
            )}
          </SlimAccordionItem>

          {/* 4. Entrenamiento */}
          <SlimAccordionItem value="training" icon={Dumbbell} label="Entrenamiento">
            {detail?.trainingSessions && detail.trainingSessions.length > 0 ? (
              <div className="space-y-1.5">
                {detail.trainingSessions[0]?.microcycle_name && (
                  <MetricRow label="Microciclo" value={detail.trainingSessions[0].microcycle_name} />
                )}
                <MetricRow
                  label="Completadas"
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
                <div className="pt-1 space-y-0.5">
                  {detail.trainingSessions.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", s.completed ? 'bg-emerald-400/70' : 'bg-muted-foreground/20')} />
                        <span className="text-muted-foreground">{s.date}</span>
                        {s.session_type && <span className="text-foreground/70">{s.session_type}</span>}
                      </div>
                      {s.deviation_score != null && (
                        <span className={cn("text-[10px]",
                          s.deviation_score > 20 ? 'text-red-400/70' : 'text-muted-foreground/50'
                        )}>
                          {s.deviation_score > 0 ? `+${Math.round(s.deviation_score)}%` : `${Math.round(s.deviation_score)}%`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground py-2">Sin entrenamientos</p>
            )}
          </SlimAccordionItem>

          {/* 5. Nutrición */}
          <SlimAccordionItem value="nutrition" icon={Utensils} label="Nutrición">
            {detail?.nutrition ? (
              <div className="space-y-2.5">
                <MacroBar label="Calorías" actual={detail.nutrition.calories_actual} target={detail.nutrition.calories_target} />
                <MacroBar label="Proteína (g)" actual={detail.nutrition.protein_actual} target={detail.nutrition.protein_target} />
                <MacroBar label="Carbohidratos (g)" actual={detail.nutrition.carbs_actual} target={detail.nutrition.carbs_target} />
                <MacroBar label="Grasas (g)" actual={detail.nutrition.fats_actual} target={detail.nutrition.fats_target} />
                <MetricRow label="Hidratación" value={detail.nutrition.hydration_status ?? '—'} />
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground py-2">Sin datos</p>
            )}
          </SlimAccordionItem>

          {/* 6. Alertas */}
          <SlimAccordionItem value="alerts" icon={AlertTriangle} label={`Alertas ${detail?.alerts?.length ? `(${detail.alerts.length})` : ''}`}>
            {detail?.alerts && detail.alerts.length > 0 ? (
              <div className="space-y-1.5">
                {detail.alerts.map(al => (
                  <div key={al.id} className={cn("rounded-lg border p-2.5", severityClass(al.severity))}>
                    <div className="flex items-start gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", severityDot(al.severity))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-foreground">{al.alert_title ?? al.alert_type ?? 'Alerta'}</p>
                        {al.alert_message && (
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{al.alert_message}</p>
                        )}
                        <p className="text-[9px] text-muted-foreground/30 mt-0.5">{al.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground py-2">Sin alertas</p>
            )}
          </SlimAccordionItem>

          {/* 7. Historial */}
          <SlimAccordionItem value="history" icon={FileText} label="Historial">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-0.5">Peso</p>
                <MiniChart data={detail?.weightHistory ?? []} dataKey="weight" color="hsl(var(--foreground) / 0.4)" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-0.5">Fatiga</p>
                <MiniChart data={detail?.fatigueHistory ?? []} dataKey="global_fatigue" color="hsl(0 70% 60% / 0.5)" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-0.5">Adherencia</p>
                <MiniChart data={detail?.adherenceHistory ?? []} dataKey="total_adherence" color="hsl(145 60% 50% / 0.5)" />
              </div>
            </div>
          </SlimAccordionItem>

          {/* 8. Notas del coach */}
          <SlimAccordionItem value="notes" icon={MessageSquarePlus} label="Notas del coach">
            {detail?.coachNotes && detail.coachNotes.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {detail.coachNotes.map(n => (
                  <div key={n.id} className="rounded-lg border border-border/15 bg-card/10 p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {n.priority && priorityConfig[n.priority] && (
                        <span className={cn("px-1 py-px rounded text-[8px] font-bold", priorityConfig[n.priority].className)}>
                          {priorityConfig[n.priority].label}
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground/30">
                        {new Date(n.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-[12px] text-foreground/80 leading-relaxed">{n.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground py-1 mb-2">Sin notas</p>
            )}

            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Añadir nota..."
                rows={2}
                className="w-full rounded-lg border border-border/20 bg-background/30 p-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:ring-1 focus:ring-foreground/10"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(priorityConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setNotePriority(key)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all",
                      notePriority === key
                        ? cfg.className + ' ring-1 ring-foreground/10'
                        : 'bg-muted/20 text-muted-foreground/40'
                    )}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
              <motion.button
                onClick={handleAddNote}
                disabled={!noteText.trim() || saving}
                className="w-full rounded-lg bg-foreground text-background py-2 text-[12px] font-medium disabled:opacity-20 transition-opacity"
                whileTap={{ scale: 0.98 }}
              >
                {saving ? 'Guardando...' : 'Guardar nota'}
              </motion.button>
            </div>
          </SlimAccordionItem>

          {/* 9. Comunicación */}
          {athlete.coach_id && (
            <SlimAccordionItem value="chat" icon={MessageCircle} label="Comunicación">
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { label: 'Fatiga', value: detail?.fatigue?.global_fatigue != null ? `${Math.round(detail.fatigue.global_fatigue)}%` : '—' },
                  { label: 'Adherencia', value: detail?.adherence?.total_adherence != null ? `${Math.round(detail.adherence.total_adherence)}%` : '—' },
                  { label: 'Readiness', value: detail?.metrics?.readiness_score != null ? `${Math.round(detail.metrics.readiness_score)}` : '—' },
                  { label: 'Último', value: detail?.trainingSessions?.[0]?.date
                    ? new Date(detail.trainingSessions[0].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    : '—' },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-border/10 bg-foreground/[0.02] p-1.5 text-center">
                    <p className="text-[12px] font-semibold text-foreground leading-none">{m.value}</p>
                    <p className="text-[8px] text-muted-foreground/40 mt-0.5 uppercase tracking-widest">{m.label}</p>
                  </div>
                ))}
              </div>
              <ChatView
                athleteProfileId={athlete.id}
                coachProfileId={athlete.coach_id}
                athleteName={athlete.full_name ?? athlete.email ?? 'Atleta'}
                embedded
              />
            </SlimAccordionItem>
          )}
        </Accordion>
      )}

      {/* ── VB2 Premium card ── */}
      {model === 'VB2' && (
        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-foreground/40" />
            <p className="text-[13px] font-semibold text-foreground/80">VB2 · Asesoría 1:1 con Pablo</p>
          </div>
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
            Seguimiento avanzado con métricas y ajustes de mayor precisión.
          </p>
        </div>
      )}
    </motion.div>
  );
};
