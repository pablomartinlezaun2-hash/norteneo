import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { Sparkles, ArrowUp, X, Loader2, Command, Zap, BarChart3, Dumbbell, Apple } from 'lucide-react';
import { NeoLogo } from './NeoLogo';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neo-help-assistant`;

const QUICK_ACTIONS: QuickAction[] = [
  { icon: <Zap className="w-3.5 h-3.5" />, label: 'Autorregulación', prompt: '¿Cómo funciona la autorregulación?' },
  { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Alertas', prompt: '¿Qué son las alertas de rendimiento?' },
  { icon: <Dumbbell className="w-3.5 h-3.5" />, label: 'Microciclos', prompt: '¿Cómo creo un microciclo personalizado?' },
  { icon: <Apple className="w-3.5 h-3.5" />, label: 'Nutrición', prompt: '¿Cómo configuro mis objetivos de nutrición?' },
];

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

export const NeoHelpChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name, full_name').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        setUserName(data?.display_name || data?.full_name || null);
      });
  }, [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [open]);

  const streamChat = useCallback(async (allMessages: Message[]) => {
    setIsLoading(true);
    let assistantSoFar = '';

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && assistantSoFar.length > chunk.length) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        if (last?.role === 'user') {
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        }
        return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          userName: userName || undefined,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        upsert(errData.error || 'Error de conexión. Inténtalo de nuevo.');
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw.startsWith('data: ')) continue;
          const json = raw.slice(6).trim();
          if (json === '[DONE]') continue;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {}
        }
      }
    } catch (e) {
      console.error('NeoHelpChat error:', e);
      upsert('Error de conexión. Inténtalo de nuevo.');
    }
    setIsLoading(false);
  }, [userName]);

  const send = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    const userMsg: Message = { role: 'user', content: msg };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    streamChat(next);
  };

  const handleQuickAction = (action: QuickAction) => {
    send(action.prompt);
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Trigger — minimal floating pill */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: premiumEase }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-[60] flex items-center gap-2 h-11 px-4 rounded-full bg-foreground/[0.95] backdrop-blur-xl shadow-lg active:scale-95 transition-transform"
          >
            <Sparkles className="w-4 h-4 text-background" />
            <span className="text-[13px] font-semibold text-background tracking-wide">NEO</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[65] bg-background/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Console bottom sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.4, ease: premiumEase }}
            className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col bg-background border-t border-border/30 rounded-t-[20px] overflow-hidden"
            style={{ maxHeight: '85dvh' }}
          >
            {/* Drag handle + header */}
            <div className="flex flex-col items-center pt-2 pb-3 px-5 flex-shrink-0">
              <div className="w-8 h-1 rounded-full bg-foreground/15 mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-background" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground leading-none">NEO</h3>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Copiloto de rendimiento</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/[0.06] hover:bg-foreground/[0.1] transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5">
              {!hasMessages ? (
                /* Empty state — quick actions */
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15, ease: premiumEase }}
                  className="py-4 space-y-4"
                >
                  <p className="text-[13px] text-muted-foreground/50 text-center">
                    ¿En qué puedo ayudarte?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action, i) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + i * 0.05, ease: premiumEase }}
                        onClick={() => handleQuickAction(action)}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-border/20 bg-foreground/[0.03] hover:bg-foreground/[0.06] active:scale-[0.97] transition-all text-left group"
                      >
                        <span className="text-muted-foreground/50 group-hover:text-foreground/70 transition-colors">
                          {action.icon}
                        </span>
                        <span className="text-[12px] font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                          {action.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* Messages */
                <div className="py-3 space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: premiumEase }}
                      className={msg.role === 'user' ? 'flex justify-end' : ''}
                    >
                      {msg.role === 'user' ? (
                        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-foreground text-background text-[13px] leading-relaxed">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {i === 1 || messages[i - 1]?.role === 'user' ? (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Sparkles className="w-3 h-3 text-muted-foreground/40" />
                              <span className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-wider">Neo</span>
                            </div>
                          ) : null}
                          <div className="text-[13px] text-foreground/85 leading-[1.7] prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mt-1 [&>ul]:mb-2 [&>li]:text-foreground/75">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 py-1"
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map(j => (
                          <motion.div
                            key={j}
                            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input — command-style */}
            <div className="flex-shrink-0 px-4 pb-5 pt-2">
              <div className="flex items-center gap-2 rounded-xl border border-border/25 bg-foreground/[0.03] px-3.5 py-2 focus-within:border-foreground/20 transition-colors">
                <Command className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
                  placeholder="Pregunta algo a NEO..."
                  className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/35 outline-none"
                  disabled={isLoading}
                />
                <motion.button
                  onClick={() => send()}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-foreground disabled:opacity-20 transition-opacity"
                  whileTap={{ scale: 0.85 }}
                >
                  <ArrowUp className="w-3.5 h-3.5 text-background" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
