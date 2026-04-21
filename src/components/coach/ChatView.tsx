import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, MessageCircle, Link2, ClipboardCheck, X, Sparkles } from 'lucide-react';
import { useCoachChat, MessageContextType, ReviewData } from '@/hooks/useCoachChat';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

interface ChatViewProps {
  athleteProfileId: string;
  coachProfileId: string;
  athleteName: string;
  onBack?: () => void;
  embedded?: boolean;
}

const COACH_QUICK_ACTIONS = [
  'Revisado ✓',
  'Mantén el plan',
  'Baja volumen hoy',
  'Sube carbohidratos',
  'Actualiza métricas',
  'Dame feedback del entreno',
  '¿Cómo has dormido?',
];

const CONTEXT_OPTIONS: { key: MessageContextType; label: string }[] = [
  { key: 'training', label: 'Entreno' },
  { key: 'alert', label: 'Alerta' },
  { key: 'nutrition', label: 'Nutrición' },
  { key: 'adherence', label: 'Adherencia' },
  { key: 'fatigue', label: 'Fatiga' },
];

const CONTEXT_LABELS: Record<string, string> = {
  training: 'Entreno',
  alert: 'Alerta',
  nutrition: 'Nutrición',
  adherence: 'Adherencia',
  fatigue: 'Fatiga',
  review: 'Revisión',
  intervention: 'Intervención',
};

const INTERVENTION_EVENT_LABELS: Record<string, string> = {
  reps_out_of_range: 'Reps fuera de rango',
  missing_set: 'Serie faltante',
  load_drop: 'Caída de carga',
  performance_drop: 'Caída de rendimiento',
  low_sleep: 'Sueño bajo',
  high_fatigue: 'Fatiga alta',
  low_protein: 'Proteína baja',
  calorie_off_target: 'Calorías fuera de objetivo',
  low_adherence: 'Mala adherencia',
  progress_milestone: 'Progreso relevante',
};

export const ChatView = ({ athleteProfileId, coachProfileId, athleteName, onBack, embedded = false }: ChatViewProps) => {
  const { messages, loading, sending, sendMessage, sendReview, myProfileId, myRole } = useCoachChat(athleteProfileId, coachProfileId);
  const [text, setText] = useState('');
  const [selectedContext, setSelectedContext] = useState<MessageContextType>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState<ReviewData>({ estado: '', mantener: '', corregir: '', proximo_paso: '' });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }, [messages.length]);

  const handleSend = async (overrideText?: string) => {
    const msgText = overrideText ?? text;
    if (!msgText.trim() || sending) return;
    if (!overrideText) setText('');
    await sendMessage(msgText, selectedContext);
    setSelectedContext(null);
    inputRef.current?.focus();
  };

  const handleSendReview = async () => {
    if (!review.estado.trim()) return;
    await sendReview(review);
    setReview({ estado: '', mantener: '', corregir: '', proximo_paso: '' });
    setShowReviewForm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== lastDate) {
      lastDate = msgDate;
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const containerClass = embedded
    ? 'flex flex-col'
    : 'flex flex-col h-[calc(100vh-180px)] max-h-[700px]';

  const renderReviewCard = (msg: typeof messages[0]) => {
    const meta = msg.metadata as ReviewData | null;
    if (!meta) return null;
    return (
      <div className="space-y-2">
        {[
          { label: 'Estado', value: meta.estado },
          { label: 'Mantener', value: meta.mantener },
          { label: 'Corregir', value: meta.corregir },
          { label: 'Próximo paso', value: meta.proximo_paso },
        ].filter(r => r.value?.trim()).map((r) => (
          <div key={r.label}>
            <p className="text-[9px] uppercase tracking-wider text-background/40 font-semibold">{r.label}</p>
            <p className="text-[12px] leading-relaxed">{r.value}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: embedded ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: embedded ? 0 : -12 }}
      transition={{ duration: 0.28, ease: premiumEase }}
      className={containerClass}
    >
      {/* Header — standalone mode */}
      {!embedded && onBack && (
        <div className="flex items-center gap-3 pb-4 border-b border-border/20">
          <motion.button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center flex-shrink-0" whileTap={{ scale: 0.92 }}>
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{athleteName}</h3>
            <p className="text-[10px] text-muted-foreground">{myRole === 'coach' ? 'Conversación con atleta' : 'Conversación con coach'}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-pulse" />
        </div>
      )}

      {/* Messages area */}
      <ScrollArea className={cn("py-3", embedded ? "max-h-[380px]" : "flex-1")}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <motion.div className="flex flex-col items-center justify-center py-16 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: premiumEase }}>
            <div className="w-14 h-14 rounded-2xl bg-foreground/[0.04] border border-border/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/70">{myRole === 'coach' ? 'Aún no hay conversación' : 'Aún no hay mensajes'}</p>
            <p className="text-[11px] text-muted-foreground/40 mt-1.5 max-w-[200px] leading-relaxed">
              {myRole === 'coach' ? 'Inicia el seguimiento con este atleta' : 'Tu seguimiento con el coach aparecerá aquí'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-0.5 px-0.5">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center justify-center py-3">
                  <motion.span className="text-[10px] text-muted-foreground/40 tracking-wide uppercase font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * gi }}>
                    {formatDateSeparator(group.date)}
                  </motion.span>
                </div>

                {group.messages.map((msg, i) => {
                  const isMine = msg.sender_id === myProfileId;
                  const isNextSameSender = group.messages[i + 1]?.sender_id === msg.sender_id;
                  const isPrevSameSender = i > 0 && group.messages[i - 1]?.sender_id === msg.sender_id;
                  const isReview = msg.context_type === 'review' && msg.metadata;
                  const isIntervention = msg.context_type === 'intervention';
                  const isAudio = msg.context_type === 'audio';
                  const interventionMeta = isIntervention ? (msg.metadata as any) : null;
                  const audioMeta = isAudio ? (msg.metadata as any) : null;
                  const hasContext = msg.context_type && !['review','intervention','audio'].includes(msg.context_type);

                  // System message
                  if (msg.is_system_message) {
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }} className="flex justify-center mt-2">
                        <div className="italic text-muted-foreground bg-muted/10 rounded-xl text-[11px] px-3.5 py-2 text-center max-w-[85%]">
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: Math.min(i * 0.015, 0.08), ease: premiumEase }}
                      className={cn("flex", isPrevSameSender ? 'mt-[2px]' : 'mt-2', isMine ? "justify-end" : "justify-start")}
                    >
                      <div className="max-w-[78%]">
                        {/* Context label */}
                        {hasContext && !isPrevSameSender && (
                          <div className={cn("flex items-center gap-1 mb-1", isMine ? "justify-end" : "justify-start")}>
                            <Link2 className="w-2.5 h-2.5 text-muted-foreground/30" />
                            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider font-medium">
                              {CONTEXT_LABELS[msg.context_type!] ?? msg.context_type}
                            </span>
                          </div>
                        )}

                        {/* Review card */}
                        {isReview ? (
                          <div className={cn(
                            "rounded-2xl px-4 py-3 border",
                            isMine
                              ? "bg-foreground text-background border-foreground/80"
                              : "bg-card/50 text-foreground border-border/30"
                          )}>
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <ClipboardCheck className={cn("w-3.5 h-3.5", isMine ? "text-background/50" : "text-muted-foreground/50")} />
                              <span className={cn("text-[10px] uppercase tracking-wider font-bold", isMine ? "text-background/50" : "text-muted-foreground/50")}>Revisión</span>
                            </div>
                            {renderReviewCard(msg)}
                            <p className={cn("text-[9px] mt-2.5 tabular-nums", isMine ? "text-background/40 text-right" : "text-muted-foreground/30")}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        ) : isIntervention ? (
                          <div className={cn(
                            "rounded-2xl px-4 py-3 border shadow-sm",
                            isMine
                              ? "bg-foreground text-background border-foreground/80"
                              : "bg-card/60 text-foreground border-border/30 ring-1 ring-foreground/[0.03]"
                          )}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles className={cn("w-3 h-3", isMine ? "text-background/60" : "text-foreground/50")} />
                              <span className={cn("text-[9px] uppercase tracking-wider font-bold", isMine ? "text-background/60" : "text-muted-foreground/60")}>
                                Intervención del coach
                              </span>
                              {interventionMeta?.event_type && INTERVENTION_EVENT_LABELS[interventionMeta.event_type] && (
                                <span className={cn(
                                  "ml-auto px-1.5 py-px rounded text-[9px] font-semibold",
                                  isMine ? "bg-background/15 text-background/70" : "bg-foreground/[0.06] text-muted-foreground/70"
                                )}>
                                  {INTERVENTION_EVENT_LABELS[interventionMeta.event_type]}
                                </span>
                              )}
                            </div>
                            <p className="text-[13px] leading-[1.5] whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className={cn("text-[9px] mt-2 tabular-nums", isMine ? "text-background/40 text-right" : "text-muted-foreground/30")}>
                              {formatTime(msg.created_at)}
                              {isMine && msg.read_at && <span className="ml-1 opacity-60">· leído</span>}
                            </p>
                          </div>
                        ) : (
                          /* Normal message */
                          <div
                            className={cn(
                              "px-3.5 py-2 text-[13px] leading-[1.45]",
                              isMine
                                ? cn(
                                    "bg-foreground text-background",
                                    !isPrevSameSender && !isNextSameSender && "rounded-2xl",
                                    !isPrevSameSender && isNextSameSender && "rounded-2xl rounded-br-lg",
                                    isPrevSameSender && isNextSameSender && "rounded-xl rounded-r-lg",
                                    isPrevSameSender && !isNextSameSender && "rounded-2xl rounded-tr-lg",
                                  )
                                : cn(
                                    "bg-card/50 text-foreground border border-border/20",
                                    !isPrevSameSender && !isNextSameSender && "rounded-2xl",
                                    !isPrevSameSender && isNextSameSender && "rounded-2xl rounded-bl-lg",
                                    isPrevSameSender && isNextSameSender && "rounded-xl rounded-l-lg",
                                    isPrevSameSender && !isNextSameSender && "rounded-2xl rounded-tl-lg",
                                  ),
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            {!isNextSameSender && (
                              <p className={cn("text-[9px] mt-1 tabular-nums", isMine ? "text-background/40 text-right" : "text-muted-foreground/30")}>
                                {formatTime(msg.created_at)}
                                {isMine && msg.read_at && <span className="ml-1 opacity-60">· leído</span>}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Quick actions + context selector — coach only */}
      {myRole === 'coach' && !loading && (
        <div className="pt-2 pb-1 space-y-1.5">
          {/* Context selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider font-medium flex-shrink-0">Sobre:</span>
            {CONTEXT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedContext(prev => prev === opt.key ? null : opt.key)}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all",
                  selectedContext === opt.key
                    ? 'bg-foreground/15 text-foreground ring-1 ring-foreground/20'
                    : 'bg-foreground/[0.03] text-muted-foreground/40 hover:text-muted-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => setShowReviewForm(prev => !prev)}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all flex items-center gap-1",
                showReviewForm
                  ? 'bg-foreground/15 text-foreground ring-1 ring-foreground/20'
                  : 'bg-foreground/[0.03] text-muted-foreground/40 hover:text-muted-foreground'
              )}
            >
              <ClipboardCheck className="w-3 h-3" />
              Revisión
            </button>
          </div>

          {/* Active context indicator */}
          {selectedContext && (
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground/60">Mensaje sobre: <span className="text-foreground/70 font-medium">{CONTEXT_LABELS[selectedContext]}</span></span>
              <button onClick={() => setSelectedContext(null)} className="ml-auto p-0.5 rounded hover:bg-foreground/10">
                <X className="w-3 h-3 text-muted-foreground/40" />
              </button>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {COACH_QUICK_ACTIONS.map((action) => (
              <motion.button
                key={action}
                onClick={() => handleSend(action)}
                disabled={sending}
                className="px-2.5 py-1.5 rounded-lg bg-foreground/[0.04] border border-border/20 text-[11px] font-medium text-muted-foreground whitespace-nowrap transition-colors hover:bg-foreground/[0.08] hover:text-foreground active:bg-foreground/[0.12] disabled:opacity-40"
                whileTap={{ scale: 0.95 }}
              >
                {action}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Review form */}
      <AnimatePresence>
        {showReviewForm && myRole === 'coach' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border/30 bg-card/20 p-3 space-y-2 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Revisión estructurada</span>
                </div>
                <button onClick={() => setShowReviewForm(false)} className="p-1 rounded-lg hover:bg-foreground/10">
                  <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                </button>
              </div>
              {[
                { key: 'estado' as const, label: 'Estado', placeholder: 'Estado general del atleta...' },
                { key: 'mantener' as const, label: 'Qué mantener', placeholder: 'Aspectos positivos...' },
                { key: 'corregir' as const, label: 'Qué corregir', placeholder: 'Aspectos a mejorar...' },
                { key: 'proximo_paso' as const, label: 'Próximo paso', placeholder: 'Siguiente acción...' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-semibold">{field.label}</label>
                  <input
                    type="text"
                    value={review[field.key]}
                    onChange={(e) => setReview(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full mt-0.5 rounded-lg border border-border/20 bg-background/30 px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:border-foreground/20"
                  />
                </div>
              ))}
              <motion.button
                onClick={handleSendReview}
                disabled={!review.estado.trim() || sending}
                className="w-full rounded-xl bg-foreground text-background py-2 text-[12px] font-medium disabled:opacity-30 transition-opacity"
                whileTap={{ scale: 0.98 }}
              >
                {sending ? 'Enviando...' : 'Enviar revisión'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className={cn("pt-2", !embedded && "border-t border-border/10")}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedContext ? `Mensaje sobre ${CONTEXT_LABELS[selectedContext]?.toLowerCase()}...` : "Escribe un mensaje..."}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border/30 bg-card/20 px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors max-h-24 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          <motion.button
            onClick={() => handleSend()}
            disabled={!text.trim() || sending}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
              text.trim() ? "bg-foreground text-background shadow-sm" : "bg-foreground/[0.06] text-muted-foreground/30"
            )}
            whileTap={{ scale: 0.9 }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
