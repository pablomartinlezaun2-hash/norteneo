import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, MessageCircle } from 'lucide-react';
import { useCoachChat } from '@/hooks/useCoachChat';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

interface ChatViewProps {
  athleteProfileId: string;
  coachProfileId: string;
  athleteName: string;
  onBack?: () => void;
  /** If true, renders without the header (for inline/embedded use) */
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

export const ChatView = ({ athleteProfileId, coachProfileId, athleteName, onBack, embedded = false }: ChatViewProps) => {
  const { messages, loading, sending, sendMessage, myProfileId, myRole } = useCoachChat(athleteProfileId, coachProfileId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }, [messages.length]);

  const handleSend = async (overrideText?: string) => {
    const msgText = overrideText ?? text;
    if (!msgText.trim() || sending) return;
    if (!overrideText) setText('');
    await sendMessage(msgText);
    inputRef.current?.focus();
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

  return (
    <motion.div
      initial={{ opacity: 0, y: embedded ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: embedded ? 0 : -12 }}
      transition={{ duration: 0.28, ease: premiumEase }}
      className={containerClass}
    >
      {/* Header — only in standalone mode */}
      {!embedded && onBack && (
        <div className="flex items-center gap-3 pb-4 border-b border-border/20">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center flex-shrink-0"
            whileTap={{ scale: 0.92 }}
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{athleteName}</h3>
            <p className="text-[10px] text-muted-foreground">
              {myRole === 'coach' ? 'Conversación con atleta' : 'Conversación con coach'}
            </p>
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
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: premiumEase }}
          >
            <div className="w-14 h-14 rounded-2xl bg-foreground/[0.04] border border-border/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/70">
              {myRole === 'coach' ? 'Aún no hay conversación' : 'Aún no hay mensajes'}
            </p>
            <p className="text-[11px] text-muted-foreground/40 mt-1.5 max-w-[200px] leading-relaxed">
              {myRole === 'coach'
                ? 'Inicia el seguimiento con este atleta'
                : 'Tu seguimiento con el coach aparecerá aquí'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-0.5 px-0.5">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center justify-center py-3">
                  <motion.span
                    className="text-[10px] text-muted-foreground/40 tracking-wide uppercase font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * gi }}
                  >
                    {formatDateSeparator(group.date)}
                  </motion.span>
                </div>

                {/* Messages */}
                {group.messages.map((msg, i) => {
                  const isMine = msg.sender_id === myProfileId;
                  const isNextSameSender = group.messages[i + 1]?.sender_id === msg.sender_id;
                  const isPrevSameSender = i > 0 && group.messages[i - 1]?.sender_id === msg.sender_id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: Math.min(i * 0.015, 0.08), ease: premiumEase }}
                      className={cn(
                        "flex",
                        isPrevSameSender ? 'mt-[2px]' : 'mt-2',
                        isMine ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[78%] px-3.5 py-2 text-[13px] leading-[1.45]",
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
                          msg.is_system_message && "italic text-muted-foreground bg-muted/10 border-0 rounded-xl text-[11px] max-w-full text-center"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        {!isNextSameSender && (
                          <p className={cn(
                            "text-[9px] mt-1 tabular-nums",
                            isMine ? "text-background/40 text-right" : "text-muted-foreground/30"
                          )}>
                            {formatTime(msg.created_at)}
                            {isMine && msg.read_at && (
                              <span className="ml-1 opacity-60">· leído</span>
                            )}
                          </p>
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

      {/* Quick actions — coach only */}
      {myRole === 'coach' && !loading && (
        <div className="pt-2 pb-1">
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

      {/* Input area */}
      <div className={cn("pt-2", !embedded && "border-t border-border/10")}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border/30 bg-card/20 px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors max-h-24 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          <motion.button
            onClick={() => handleSend()}
            disabled={!text.trim() || sending}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
              text.trim()
                ? "bg-foreground text-background shadow-sm"
                : "bg-foreground/[0.06] text-muted-foreground/30"
            )}
            whileTap={{ scale: 0.9 }}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
