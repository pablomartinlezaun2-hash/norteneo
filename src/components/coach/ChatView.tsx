import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useCoachChat } from '@/hooks/useCoachChat';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

interface ChatViewProps {
  athleteProfileId: string;
  coachProfileId: string;
  athleteName: string;
  onBack: () => void;
}

export const ChatView = ({ athleteProfileId, coachProfileId, athleteName, onBack }: ChatViewProps) => {
  const { messages, loading, sending, sendMessage, myProfileId, myRole } = useCoachChat(athleteProfileId, coachProfileId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msg = text;
    setText('');
    await sendMessage(msg);
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.28, ease: premiumEase }}
      className="flex flex-col h-[calc(100vh-180px)] max-h-[700px]"
    >
      {/* Header */}
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
        <div className="w-2 h-2 rounded-full bg-emerald-400/60" title="Conectado" />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full py-20">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Sin mensajes aún</p>
            <p className="text-[11px] text-muted-foreground/50 mt-1">Envía el primer mensaje</p>
          </div>
        ) : (
          <div className="space-y-1">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center justify-center py-3">
                  <span className="text-[10px] text-muted-foreground/50 bg-background px-3 py-0.5 rounded-full border border-border/20">
                    {formatDateSeparator(group.date)}
                  </span>
                </div>

                {/* Messages in group */}
                {group.messages.map((msg, i) => {
                  const isMine = msg.sender_id === myProfileId;
                  const showTime = i === group.messages.length - 1 ||
                    group.messages[i + 1]?.sender_id !== msg.sender_id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.1) }}
                      className={cn(
                        "flex mb-0.5",
                        isMine ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] px-3.5 py-2 text-[13px] leading-relaxed",
                          isMine
                            ? "bg-foreground text-background rounded-2xl rounded-br-md"
                            : "bg-card/60 text-foreground border border-border/30 rounded-2xl rounded-bl-md",
                          msg.is_system_message && "italic text-muted-foreground bg-muted/20 border-0 rounded-xl text-[11px] text-center"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        {showTime && (
                          <p className={cn(
                            "text-[9px] mt-1",
                            isMine ? "text-background/50 text-right" : "text-muted-foreground/40"
                          )}>
                            {formatTime(msg.created_at)}
                            {isMine && msg.read_at && ' · leído'}
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

      {/* Input */}
      <div className="pt-3 border-t border-border/20">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border/40 bg-card/30 px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20 max-h-24 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
              text.trim()
                ? "bg-foreground text-background"
                : "bg-muted/40 text-muted-foreground/40"
            )}
            whileTap={{ scale: 0.92 }}
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
