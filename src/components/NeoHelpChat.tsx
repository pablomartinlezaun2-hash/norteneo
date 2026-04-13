import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleQuestion, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NeoLogo } from './NeoLogo';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neo-help-assistant`;

export const NeoHelpChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy **NEO**, tu asistente. Pregúntame cualquier cosa sobre cómo funciona la app y te lo explico al detalle 💪',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = useCallback(async (allMessages: Message[]) => {
    setIsLoading(true);
    let assistantSoFar = '';

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last === prev[prev.length - 1] && assistantSoFar.length > chunk.length) {
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
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        upsert(errData.error || 'Lo siento, ha ocurrido un error. Inténtalo de nuevo.');
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

      // flush remaining
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
      upsert('Lo siento, ha ocurrido un error. Inténtalo de nuevo.');
    }
    setIsLoading(false);
  }, []);

  const send = () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    streamChat(next);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-20 right-4 z-[60]"
          >
            <Button
              onClick={() => setOpen(true)}
              size="icon"
              className="h-12 w-12 rounded-full bg-primary shadow-lg hover:bg-primary/90"
            >
              <MessageCircleQuestion className="w-5 h-5 text-primary-foreground" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-4 right-4 left-4 z-[70] sm:left-auto sm:w-[380px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            style={{ maxHeight: 'calc(100dvh - 2rem)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <NeoLogo size="sm" className="bg-white text-black" />
                <div>
                  <h3 className="font-semibold text-sm">NEO Ayuda</h3>
                  <p className="text-[10px] text-white/70">Pregúntame sobre la app</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-white hover:bg-white/20 h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '50vh' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && <NeoLogo size="sm" className="flex-shrink-0 mt-0.5" />}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 border border-border'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2 items-start">
                  <NeoLogo size="sm" />
                  <div className="bg-muted/60 border border-border rounded-xl px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
                  placeholder="¿Cómo funciona...?"
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button onClick={send} disabled={!input.trim() || isLoading} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
