/**
 * CoachInterventionsPanel — Panel de intervenciones (texto + audio premium).
 *
 * El coach puede:
 *   1. Generar mensaje escrito (con saludo personalizado obligatorio).
 *   2. Generar audio de voz (script via IA → TTS ElevenLabs → preview → envío).
 *   3. Editar antes de enviar.
 *   4. Descartar eventos.
 *
 * El modo audio se sugiere visualmente para eventos en `isAudioRecommendedFor`,
 * pero está disponible para todos.
 */

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Edit3,
  Sparkles,
  X,
  Check,
  Loader2,
  CheckCircle2,
  Clock,
  Mic,
  Type as TypeIcon,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  FlaskConical,
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
import { useCoachAudio, type CoachAudioRow } from "@/hooks/useCoachAudio";
import { isAudioRecommendedFor } from "@/lib/coachAudioPolicy";

interface CoachInterventionsPanelProps {
  athleteProfileId: string;
  athleteDisplayName: string | null;
  athleteFullName: string | null;
  athleteEmail: string | null;
  coachProfileId: string;
}

type Mode = "text" | "audio";

const severityConfig: Record<InterventionSeverity, { dot: string; ring: string; label: string; pill: string }> = {
  high: { dot: "bg-red-400", ring: "border-red-500/25 bg-red-500/[0.04]", label: "Alta", pill: "bg-red-500/15 text-red-400" },
  medium: { dot: "bg-yellow-400", ring: "border-yellow-500/25 bg-yellow-500/[0.04]", label: "Media", pill: "bg-yellow-500/15 text-yellow-400" },
  low: { dot: "bg-emerald-400", ring: "border-emerald-500/20 bg-emerald-500/[0.03]", label: "Baja", pill: "bg-emerald-500/15 text-emerald-400" },
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
  const audio = useCoachAudio(coachProfileId);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Record<string, Mode>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  // Estado audio por evento
  const [audioRows, setAudioRows] = useState<Record<string, CoachAudioRow | null>>({});
  const [audioBusy, setAudioBusy] = useState<Record<string, "script" | "tts" | "send" | null>>({});
  const [audioErrors, setAudioErrors] = useState<Record<string, string | null>>({});
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<Record<string, string | null>>({});
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [creatingTest, setCreatingTest] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const athleteFirstName = useMemo(
    () =>
      resolveAthleteFirstName({
        display_name: athleteDisplayName,
        full_name: athleteFullName,
        email: athleteEmail,
      }),
    [athleteDisplayName, athleteFullName, athleteEmail],
  );

  /** Crea un evento de intervención de prueba (low_sleep) para validar el flujo. */
  const handleCreateTestEvent = async () => {
    setTestError(null);
    setCreatingTest(true);
    try {
      const { error: insErr } = await (supabase as any)
        .from("coach_intervention_events")
        .insert({
          coach_id: coachProfileId,
          athlete_id: athleteProfileId,
          event_type: "low_sleep",
          severity: "medium",
          summary: "Evento de prueba: sueño bajo (4.5 h anoche)",
          metadata: {
            sleep_hours: 4.5,
            test: true,
            athlete_first_name: athleteFirstName,
          },
          status: "pending",
        });
      if (insErr) throw insErr;
      await refetch();
    } catch (err: any) {
      console.error("[CoachInterventionsPanel] create test event error", err);
      setTestError(err?.message ?? "No se pudo crear el evento de prueba");
    } finally {
      setCreatingTest(false);
    }
  };

  const activeEvents = events.filter((e) => e.status === "pending" || e.status === "drafted");
  const archivedEvents = events.filter((e) => e.status === "sent" || e.status === "dismissed");

  const setEventMode = (eventId: string, m: Mode) => {
    setMode((prev) => ({ ...prev, [eventId]: m }));
  };

  const getMode = (eventId: string, eventType: CoachInterventionEvent["event_type"]): Mode => {
    if (mode[eventId]) return mode[eventId];
    return isAudioRecommendedFor(eventType) ? "audio" : "text";
  };

  // ---------- TEXTO ----------
  const handleGenerateText = (event: CoachInterventionEvent) => {
    const text = generateInterventionMessage(event.event_type, athleteFirstName, event.metadata ?? {});
    setDrafts((d) => ({ ...d, [event.id]: text }));
    setExpandedId(event.id);
  };

  const handleSendText = async (event: CoachInterventionEvent) => {
    const draft = drafts[event.id] ?? event.generated_message ?? "";
    const finalText = ensureGreeting(draft, athleteFirstName);
    if (!finalText.trim()) return;
    setSending(event.id);

    try {
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

      await (supabase as any)
        .from("coach_conversations")
        .update({
          last_message_at: msg.created_at,
          last_message_preview: finalText.slice(0, 100),
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

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
      console.error("[CoachInterventionsPanel] send text error", err);
    } finally {
      setSending(null);
    }
  };

  // ---------- AUDIO ----------
  const handleGenerateAudio = async (event: CoachInterventionEvent) => {
    setAudioErrors((e) => ({ ...e, [event.id]: null }));
    setAudioBusy((b) => ({ ...b, [event.id]: "script" }));
    try {
      const baseText =
        drafts[event.id] ??
        event.generated_message ??
        generateInterventionMessage(event.event_type, athleteFirstName, event.metadata ?? {});

      const script = await audio.generateScript(event, athleteFirstName, baseText);
      if (!script) {
        setAudioErrors((e) => ({ ...e, [event.id]: audio.error || "Error generando script" }));
        return;
      }

      // Crear draft (o actualizar si ya hay row para este evento)
      // Eventos "virtuales" (id con prefijo "virtual:") no existen aún en la
      // tabla coach_intervention_events, así que pasamos null para evitar
      // errores 22P02 (uuid inválido) en la FK.
      const isVirtualEvent = event.id.startsWith("virtual:");
      let row = audioRows[event.id];
      if (!row) {
        row = await audio.createDraft({
          athleteProfileId: event.athlete_id,
          script,
          interventionEventId: isVirtualEvent ? null : event.id,
        });
      } else {
        await audio.updateScript(row.id, script);
        row = { ...row, script, status: "pending", storage_path: null, duration_seconds: null };
      }
      if (!row) {
        setAudioErrors((e) => ({ ...e, [event.id]: audio.error || "No se pudo crear el draft" }));
        return;
      }
      setAudioRows((r) => ({ ...r, [event.id]: row }));
      setAudioPreviewUrl((p) => ({ ...p, [event.id]: null }));
      setExpandedId(event.id);
    } finally {
      setAudioBusy((b) => ({ ...b, [event.id]: null }));
    }
  };

  const handleSynthesize = async (event: CoachInterventionEvent) => {
    const row = audioRows[event.id];
    if (!row) return;
    setAudioErrors((e) => ({ ...e, [event.id]: null }));
    setAudioBusy((b) => ({ ...b, [event.id]: "tts" }));
    try {
      // Asegurar script actualizado
      const currentScript = drafts[event.id] ?? row.script;
      if (currentScript !== row.script) {
        await audio.updateScript(row.id, currentScript);
        setAudioRows((r) => ({ ...r, [event.id]: { ...row, script: currentScript } }));
      }
      const result = await audio.synthesize(row.id);
      if (!result.ok) {
        setAudioErrors((e) => ({ ...e, [event.id]: audio.error || "Error sintetizando audio" }));
        return;
      }
      setAudioPreviewUrl((p) => ({ ...p, [event.id]: result.signedUrl }));
      setAudioRows((r) => {
        const cur = r[event.id];
        if (!cur) return r;
        return {
          ...r,
          [event.id]: {
            ...cur,
            status: "ready",
            duration_seconds: result.durationSeconds,
          },
        };
      });
    } finally {
      setAudioBusy((b) => ({ ...b, [event.id]: null }));
    }
  };

  const handleTogglePreview = async (eventId: string) => {
    const url = audioPreviewUrl[eventId];
    if (!url) return;
    if (previewPlaying === eventId && previewRef.current) {
      previewRef.current.pause();
      setPreviewPlaying(null);
      return;
    }
    if (previewRef.current) {
      previewRef.current.pause();
    }
    const a = new Audio(url);
    previewRef.current = a;
    a.addEventListener("ended", () => setPreviewPlaying(null));
    a.addEventListener("error", () => setPreviewPlaying(null));
    try {
      await a.play();
      setPreviewPlaying(eventId);
    } catch {
      setPreviewPlaying(null);
    }
  };

  const handleSendAudio = async (event: CoachInterventionEvent) => {
    const row = audioRows[event.id];
    if (!row) return;
    setAudioBusy((b) => ({ ...b, [event.id]: "send" }));
    setAudioErrors((e) => ({ ...e, [event.id]: null }));
    try {
      // Si aún no se ha sintetizado, hacerlo primero
      let synthRow = row;
      if (row.status !== "ready" && row.status !== "sent") {
        const result = await audio.synthesize(row.id);
        if (!result.ok) {
          setAudioErrors((e) => ({ ...e, [event.id]: audio.error || "Error sintetizando" }));
          return;
        }
        synthRow = {
          ...row,
          status: "ready",
          duration_seconds: result.durationSeconds,
        };
        setAudioRows((r) => ({ ...r, [event.id]: synthRow }));
      }

      const { error: sendErr } = await audio.sendToAthlete({
        audio: synthRow,
        eventType: event.event_type,
        eventSummary: event.summary,
      });
      if (sendErr) {
        setAudioErrors((e) => ({ ...e, [event.id]: sendErr }));
        return;
      }

      // Limpiar y refrescar
      if (previewRef.current && previewPlaying === event.id) {
        previewRef.current.pause();
        setPreviewPlaying(null);
      }
      setAudioRows((r) => {
        const next = { ...r };
        delete next[event.id];
        return next;
      });
      setAudioPreviewUrl((p) => {
        const next = { ...p };
        delete next[event.id];
        return next;
      });
      setExpandedId(null);
      await refetch();
    } finally {
      setAudioBusy((b) => ({ ...b, [event.id]: null }));
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

  const TestEventButton = (
    <button
      type="button"
      onClick={handleCreateTestEvent}
      disabled={creatingTest}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors border border-dashed",
        "border-border/30 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
        creatingTest && "opacity-60 cursor-wait",
      )}
      title="Crea un evento low_sleep para probar el flujo de audio/texto"
    >
      {creatingTest ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <FlaskConical className="w-3 h-3" />
      )}
      Crear evento de prueba
    </button>
  );

  if (activeEvents.length === 0 && archivedEvents.length === 0) {
    return (
      <div className="rounded-xl border border-border/15 bg-foreground/[0.02] p-4 text-center space-y-2">
        <Sparkles className="w-4 h-4 text-muted-foreground/30 mx-auto" />
        <p className="text-[11px] text-muted-foreground/60">Sin eventos relevantes</p>
        <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
          NEO mostrará aquí incidencias e hitos que merezca la pena comentar.
        </p>
        <div className="flex justify-center pt-1">{TestEventButton}</div>
        {testError && <p className="text-[10px] text-red-400/70">{testError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/50 font-semibold">
          {activeEvents.length} {activeEvents.length === 1 ? "evento activo" : "eventos activos"}
        </p>
        {TestEventButton}
      </div>
      {testError && <p className="text-[10px] text-red-400/70">{testError}</p>}
      {activeEvents.map((event) => {
        const sev = severityConfig[event.severity];
        const isExpanded = expandedId === event.id;
        const currentMode = getMode(event.id, event.event_type);
        const audioRow = audioRows[event.id] ?? null;
        const audioRecommended = isAudioRecommendedFor(event.event_type);
        const draftText = drafts[event.id] ?? event.generated_message ?? "";
        const hasTextDraft = currentMode === "text" && Boolean(draftText.trim());
        const hasAudioDraft = currentMode === "audio" && Boolean(audioRow);
        const busy = audioBusy[event.id];
        const audioErr = audioErrors[event.id];
        const previewUrl = audioPreviewUrl[event.id];

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
                  {audioRecommended && (
                    <span className="px-1.5 py-px rounded text-[9px] font-semibold bg-foreground/10 text-foreground/70 flex items-center gap-1">
                      <Mic className="w-2.5 h-2.5" />
                      Audio sugerido
                    </span>
                  )}
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
                  <div className="px-3 pb-3 space-y-2.5 border-t border-border/10 pt-2.5">
                    {/* Mode selector */}
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-foreground/[0.04] border border-border/15 w-fit">
                      <button
                        onClick={() => setEventMode(event.id, "text")}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors",
                          currentMode === "text"
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <TypeIcon className="w-2.5 h-2.5" />
                        Texto
                      </button>
                      <button
                        onClick={() => setEventMode(event.id, "audio")}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors",
                          currentMode === "audio"
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Mic className="w-2.5 h-2.5" />
                        Audio
                      </button>
                    </div>

                    {/* MODO TEXTO */}
                    {currentMode === "text" && (
                      <>
                        {!hasTextDraft ? (
                          <button
                            onClick={() => handleGenerateText(event)}
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
                                onClick={() => handleSendText(event)}
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
                                onClick={() => handleGenerateText(event)}
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
                      </>
                    )}

                    {/* MODO AUDIO */}
                    {currentMode === "audio" && (
                      <>
                        {!hasAudioDraft ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleGenerateAudio(event)}
                              disabled={busy === "script"}
                              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background py-2 text-[11px] font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
                            >
                              {busy === "script" ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              Generar script de voz
                            </button>
                            <p className="text-[9px] text-muted-foreground/50 leading-relaxed text-center">
                              NEO escribirá un guion breve para tu voz. Lo podrás editar y previsualizar antes de enviarlo.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-semibold flex items-center gap-1">
                                <Mic className="w-2.5 h-2.5" />
                                Script de voz · editable
                              </label>
                              <Textarea
                                value={drafts[event.id] ?? audioRow!.script}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setDrafts((d) => ({ ...d, [event.id]: v }));
                                  // invalidar preview si se cambia tras sintetizar
                                  if (audioPreviewUrl[event.id]) {
                                    setAudioPreviewUrl((p) => ({ ...p, [event.id]: null }));
                                    setAudioRows((r) => {
                                      const cur = r[event.id];
                                      return cur ? { ...r, [event.id]: { ...cur, status: "pending" } } : r;
                                    });
                                  }
                                }}
                                rows={4}
                                className="w-full text-[12px] leading-relaxed bg-background/40 border-border/20 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:ring-offset-0 resize-none"
                              />
                              <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
                                El audio empezará con un saludo personalizado para {athleteFirstName ?? "el atleta"}.
                              </p>
                            </div>

                            {/* Preview */}
                            {previewUrl ? (
                              <div className="flex items-center gap-2 rounded-lg bg-foreground/[0.04] border border-border/15 px-2.5 py-2">
                                <button
                                  onClick={() => handleTogglePreview(event.id)}
                                  className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center transition-transform active:scale-95"
                                  aria-label={previewPlaying === event.id ? "Pausar" : "Reproducir"}
                                >
                                  {previewPlaying === event.id ? (
                                    <Pause className="w-3 h-3" fill="currentColor" />
                                  ) : (
                                    <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-semibold text-foreground/80">Preview</p>
                                  <p className="text-[9px] text-muted-foreground/50">
                                    ~{audioRow!.duration_seconds ?? "?"}s · revisa antes de enviar
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleSynthesize(event)}
                                  disabled={busy === "tts"}
                                  className="p-1.5 rounded-md bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                                  title="Re-sintetizar"
                                >
                                  {busy === "tts" ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSynthesize(event)}
                                disabled={busy === "tts"}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-foreground/[0.04] border border-border/20 text-foreground py-2 text-[11px] font-semibold disabled:opacity-50 transition-colors hover:bg-foreground/[0.08]"
                              >
                                {busy === "tts" ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Sintetizando voz...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3" fill="currentColor" />
                                    Generar y previsualizar
                                  </>
                                )}
                              </button>
                            )}

                            {audioErr && (
                              <div className="flex items-start gap-1.5 rounded-md bg-red-500/[0.06] border border-red-500/20 px-2 py-1.5">
                                <AlertCircle className="w-3 h-3 text-red-400/80 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-red-400/90 leading-snug">{audioErr}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSendAudio(event)}
                                disabled={busy === "send" || busy === "tts"}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background py-2 text-[11px] font-semibold disabled:opacity-30 transition-opacity"
                              >
                                {busy === "send" ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                Enviar audio
                              </button>
                              <button
                                onClick={() => handleGenerateAudio(event)}
                                disabled={busy === "script"}
                                className="px-2.5 py-2 rounded-lg bg-foreground/[0.04] border border-border/20 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                title="Regenerar script"
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
