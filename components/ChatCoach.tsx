'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

export function ChatCoach({ profile }: { profile: any }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Привіт! Я твій AI-тренер 💪 Запитай мене про харчування, тренування або мотивацію.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, profile }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (e: any) {
      setMessages([...newMessages, { role: 'assistant', content: `Помилка: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 btn-grad rounded-full p-4 shadow-2xl"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 bottom-4 top-20 z-50 glass flex flex-col overflow-hidden shadow-2xl"
            style={{ borderRadius: 24 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-semibold">AI-тренер</p>
                  <p className="text-xs text-white/40">Онлайн</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                      m.role === 'user' ? 'btn-grad text-white' : 'bg-white/5 text-white/90'
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 px-4 py-3 rounded-2xl">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Запитай щось..."
                className="flex-1 rounded-xl px-4 py-3 text-sm"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="btn-grad rounded-xl px-4 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
