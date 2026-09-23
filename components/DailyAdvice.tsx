'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

export function DailyAdvice({
  meals,
  profile,
}: {
  meals: any[];
  profile: any;
}) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function analyze() {
    setOpen(true);
    if (advice) return; // вже є — не робимо новий запит
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/daily-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals, profile }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAdvice(data.advice);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    setAdvice(null);
    try {
      const res = await fetch('/api/daily-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals, profile }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAdvice(data.advice);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass p-3 mb-5 fade-up">
      {/* Компактна панель */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(236,72,153,0.25))',
            }}
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">Аналіз дня</p>
            <p className="text-[10px] text-white/40 leading-tight">
              {meals.length > 0
                ? `${meals.length} страв сьогодні`
                : 'Почни додавати страви'}
            </p>
          </div>
        </div>

        <button
          onClick={open ? refresh : analyze}
          disabled={loading}
          className="btn-grad px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {open ? 'Оновити' : 'Порада AI'}
        </button>
      </div>

      {/* Розгорнутий аналіз */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            {loading && !advice && (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-xs text-white/60">
                  Аналізую твій день...
                </span>
              </div>
            )}

            {advice && (
              <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-3">
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-white/90">
                  {advice}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            {advice && (
              <button
                onClick={() => setOpen(false)}
                className="w-full mt-2 py-1.5 text-xs text-white/40 hover:text-white/70 transition"
              >
                Згорнути
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}