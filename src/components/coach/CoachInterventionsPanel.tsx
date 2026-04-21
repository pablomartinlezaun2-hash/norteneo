/**
 * CoachInterventionsPanel — Fase 1 del sistema de intervenciones.
 *
 * Muestra los eventos relevantes detectados por NEO para un atleta.
 * El coach puede:
 *   1. Generar un mensaje (con saludo personalizado obligatorio).
 *   2. Editar el texto antes de enviar.
 *   3. Enviarlo al chat interno del atleta.
 *   4. Descartar eventos.
 *
 * El mensaje se guarda en `coach_messages` con `context_type='intervention'`
 * y queda enlazado al evento origen en `coach_intervention_events`.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Send,
  Edit3,
  Sparkles,
  X,
  Check,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  useCoachInterventionEvents,
  type CoachInterventionEvent,
  type InterventionSeverity,
} from "@/hooks/useCoachInterventionEvents";
import {
  EVENT_TYPE_LABEL,
  generateInterventionMessage,
  resolveAthleteFirstName,
  ensureGreeting,
} from "@/lib/coachCopy";

interface CoachInterventionsPanelProps {
  athleteProfileId: string;
  athleteDisplayName: string | null;
  athleteFullName: string | null;
  athleteEmail: string | null;
  coachProfileId: string;
}

const severityConfig: Record<InterventionSeverity, { dot: string; ring: string; label: string; pill: string }> = {
  high: {
    dot: "bg-red-400",
    ring: "border-red-500/25 bg-red-500/[0.04]",
    label: "Alta",
    pill: "bg-red-500/15 text-red-400",
  },
  medium: {
    dot: "bg-yellow-400",
    ring: "border-yellow-500/25 bg-yellow-500/[0.04]",
    label: "Media",
    pill: "bg-yellow-500/15 text-yellow-400",
  },
  low: {
    dot: "bg-emerald-400",
    ring: "border-emerald-500/20 bg-emerald-500/[0.03]",
    label: "Baja",
    pill: "bg-emerald-500/15 text-emerald-400",
  },
};

export const CoachInterventionsPanel = ({
  athleteProfileId,
  athleteDisplayName,
  athleteFullName,
  athleteEmail,
  coachProfileId,
}: CoachInterventionsPanelProps) => {
  const { events, loading, error, refetch, upsertEvent, dismissEvent } =
    useCoachInterventionEvents(athleteProfileId);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  const athleteFirstName = useMemo(
    () =>
      resolveAthleteFirstName({
        display_name: athleteDisplayName,
        full_name: athleteFullName,
        email: athleteEmail,
      }),
    [athleteDisplayName, athleteFullName, athleteEmail],
  );

  const activeEvents = events.filter((e) => e.status === "pending" || e.status === "drafted");
  const archivedEvents = events.filter((e) => e.status === "sent" || e.status === "dismissed");

  const handleGenerate = (event: CoachInterventionEvent) => {
    const text = generateInterventionMessage(event.event_type, athleteFirstName, event.metadata ?? {});
    setDrafts((d) => ({ ...d, [event.id]: text }));
    setExpandedId(event.id);
  };

  const handleSend = async (event: CoachInterventionEvent) => {
    const draft = drafts[event.id] ?? event.generated_message ?? "";
    const finalText = ensureGreeting(draft, athleteFirstName);
    if (!finalText.trim()) return;
    setSending(event.id);

    try {
      // 1) Find or create conversation
      let conversationId: string | null = null;
      const { data: existingConv } = await (supabase as any)
        .from("coach_conversations")
        .select("id")
        .eq("athlete_id", event.athlete_id)
        .eq("coach_id", coachProfileId)
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const { data: createdConv, error: convErr } = await (supabase as any)
          .from("coach_conversations")
          .insert({ athlete_id: event.athlete_id, coach_id: coachProfileId })
          .select()
          .single();
        if (convErr) throw convErr;
        conversationId = createdConv.id;
      }

      if (!conversationId) throw new Error("No se pudo crear la conversación");

      // 2) Insert message in coach_messages
      const { data: msg, error: msgErr } = await (supabase as any)
        .from("coach_messages")
        .insert({
          conversation_id: conversationId,
          athlete_id: event.athlete_id,
          coach_id: coachProfileId,
          sender_id: coachProfileId,
          sender_role: "coach",
          message: finalText,
          context_type: "intervention",
          metadata: {
            event_type: event.event_type,
            severity: event.severity,
            event_summary: event.summary,
            event_metadata: event.metadata,
          },
        })
        .select()
        .single();

      if (msgErr) throw msgErr;

      // 3) Update conversation preview
      await (supabase as any)
        .from("coach_conversations")
        .update({
          last_message_at: msg.created_at,
          last_message_preview: finalText.slice(0, 100),
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      // 4) Persist intervention event with sent status
      await upsertEvent(event, {
        generated_message: finalText,
        status: "sent",
        sent_message_id: msg.id,
        sent_at: msg.created_at,
      });

      setDrafts((d) => {
        const next = { ...d };
        delete next[event.id];
        return next;
      });
      setExpandedId(null);
      await refetch();
    } catch (err) {
      console.error("[CoachInterventionsPanel] send error", err);
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 text-muted-foreground/40 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-[11px] text-red-400/70 py-2">{error}</p>;
  }

  if (activeEvents.length === 0 && archivedEvents.length === 0) {
    return (
      <div className="rounded-xl border border-border/15 bg-foreground/[0.02] p-4 text-center">
        <Sparkles className="w-4 h-4 text-muted-foreground/30 mx-auto mb-1.5" />
        <p className="text-[11px] text-muted-foreground/60">Sin eventos relevantes</p>
        <p className="text-[10px] text-muted-foreground/40 mt-0.5 leading-relaxed">
          NEO mostrará aquí incidencias e hitos que merezca la pena comentar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activeEvents.map((event) => {
        const sev = severityConfig[event.severity];
        const isExpanded = expandedId === event.id;
        const draftText = drafts[event.id] ?? event.generated_message ?? "";
        const hasDraft = Boolean(draftText.trim());

        return (
          <div
            key={event.id}
            className={cn("rounded-xl border overflow-hidden transition-colors", sev.ring)}
          >
            {/* Row header */}
            <button
              type="button"
              onClick={() => setExpandedId((cur) => (cur === event.id ? null : event.id))}
              className="w-full flex items-start gap-2.5 p-3 text-left hover:bg-foreground/[0.02] transition-colors"
            >
              <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", sev.dot)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-foreground/90">
                    {EVENT_TYPE_LABEL[event.event_type]}
                  </span>
                  <span className={cn("px-1.5 py-px rounded text-[9px] font-bold", sev.pill)}>
                    {sev.label}
                  </span>
                  {event.status === "drafted" && (
                    <span className="px-1.5 py-px rounded text-[9px] font-semibold bg-foreground/10 text-foreground/60">
                      Borrador
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {event.summary}
                </p>
                <p className="text-[9px] text-muted-foreground/40 mt-0.5">
                  {new Date(event.occurred_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2 border-t border-border/10 pt-2.5">
                    {!hasDraft ? (
                      <button
                        onClick={() => handleGenerate(event)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background py-2 text-[11px] font-semibold transition-opacity hover:opacity-90"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generar mensaje
                      </button>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-semibold flex items-center gap-1">
                            <Edit3 className="w-2.5 h-2.5" />
                            Vista previa · editable
                          </label>
                          <Textarea
                            value={draftText}
                            onChange={(e) =>
                              setDrafts((d) => ({ ...d, [event.id]: e.target.value }))
                            }
                            rows={4}
                            className="w-full text-[12px] leading-relaxed bg-background/40 border-border/20 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:ring-offset-0 resize-none"
                          />
                          <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
                            Recuerda mantener el saludo inicial. Si lo borras, se añadirá automáticamente al enviar.
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSend(event)}
                            disabled={sending === event.id || !draftText.trim()}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background py-2 text-[11px] font-semibold disabled:opacity-30 transition-opacity"
                          >
                            {sending === event.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Enviar al atleta
                          </button>
                          <button
                            onClick={() => handleGenerate(event)}
                            className="px-2.5 py-2 rounded-lg bg-foreground/[0.04] border border-border/20 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            title="Regenerar"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => dismissEvent(event)}
                            className="px-2.5 py-2 rounded-lg bg-foreground/[0.04] border border-border/20 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            title="Descartar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {activeEvents.length === 0 && (
        <div className="rounded-xl border border-border/15 bg-foreground/[0.02] p-3 text-center">
          <Check className="w-3.5 h-3.5 text-emerald-400/60 mx-auto mb-1" />
          <p className="text-[11px] text-muted-foreground/60">Todo al día</p>
        </div>
      )}

      {archivedEvents.length > 0 && (
        <details className="rounded-xl border border-border/15 bg-foreground/[0.015] overflow-hidden group">
          <summary className="px-3 py-2 cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Historial · {archivedEvents.length}
          </summary>
          <div className="px-3 pb-3 space-y-1.5">
            {archivedEvents.slice(0, 12).map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2 py-1.5 border-t border-border/5 first:border-0"
              >
                {event.status === "sent" ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400/60 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="w-3 h-3 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-foreground/70 truncate">
                    {EVENT_TYPE_LABEL[event.event_type]}
                  </p>
                  <p className="text-[9px] text-muted-foreground/40 mt-0.5">
                    {event.status === "sent"
                      ? `Enviado · ${new Date(event.sent_at ?? event.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
                      : `Descartado · ${new Date(event.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
