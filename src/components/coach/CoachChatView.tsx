import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useCoachChat, ChatMessage } from '@/hooks/useCoachChat';
import { cn } from '@/lib/utils';

interface CoachChatViewProps {
  /** Profile id of the counterpart (athlete for coach, null for athlete side) */
  counterpartProfileId?: string | null;
  counterpartName?: string;
  onBack: () => void;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateGroup = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export const CoachChatView = ({ counterpartProfileId, counterpartName, onBack }: CoachChatViewProps) => {
  const {
    messages,
    loading,
    sending,
    sendMessage,
    myProfileId,
    myRole,
  } = useCoachChat(counterpartProfileId);

  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateKey) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, messages: [msg] });
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col h-[calc(100vh-140px)] max-h-[700px]"
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
          <h3 className="text-sm font-semibold text-foreground truncate">
            {counterpartName ?? 'Mensajes'}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {myRole === 'coach' ? 'Conversación con atleta' : 'Conversación con tu coach'}
          </p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500/60 animate-pulse" />
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-hide"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-10 h-10 rounded-2xl bg-muted/30 flex items-center justify-center">
              <Send className="w-4 h-4 text-muted-foreground/40 rotate-[-20deg]" />
            </div>
            <p className="text-xs text-muted-foreground/50">Sin mensajes aún</p>
            <p className="text-[10px] text-muted-foreground/30">Envía el primer mensaje</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center py-3">
                <span className="text-[10px] text-muted-foreground/40 px-3 py-0.5 rounded-full bg-muted/20">
                  {formatDateGroup(group.messages[0].created_at)}
                </span>
              </div>
              {/* Messages */}
              {group.messages.map((msg, i) => {
                const isMine = msg.sender_id === myProfileId;
                const showTail = i === 0 || group.messages[i - 1].sender_id !== msg.sender_id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: i * 0.02 }}
                    className={cn(
                      'flex px-1',
                      isMine ? 'justify-end' : 'justify-start',
                      showTail ? 'mt-2' : 'mt-0.5'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] px-3.5 py-2 text-[13px] leading-relaxed',
                        isMine
                          ? 'bg-foreground/[0.08] text-foreground rounded-2xl rounded-br-md'
                          : 'bg-muted/30 text-foreground rounded-2xl rounded-bl-md',
                        msg.is_system_message && 'italic text-muted-foreground text-[11px] bg-transparent text-center max-w-full'
                      )}
                    >
                      {msg.message}
                      <span className={cn(
                        'block text-[9px] mt-1',
                        isMine ? 'text-muted-foreground/40 text-right' : 'text-muted-foreground/30'
                      )}>
                        {formatTime(msg.created_at)}
                        {isMine && msg.read_at && (
                          <span className="ml-1 text-emerald-500/50">✓</span>
                        )}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="pt-3 border-t border-border/20">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className={cn(
              'flex-1 resize-none bg-muted/20 border border-border/20 rounded-2xl px-4 py-2.5',
              'text-[13px] text-foreground placeholder:text-muted-foreground/30',
              'focus:outline-none focus:border-foreground/20 transition-colors',
              'max-h-24 scrollbar-hide'
            )}
            style={{ minHeight: '40px' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 96) + 'px';
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all',
              text.trim()
                ? 'bg-foreground text-background'
                : 'bg-muted/20 text-muted-foreground/30'
            )}
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
