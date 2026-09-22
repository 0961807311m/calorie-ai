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

  async function analyze() {
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

  return (
    <section className="glass p-6 mb-5 fade-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" /> Порада ШІ на сьогодні
        </h3>
      </div>

      {!advice && !loading && (
        <button
          onClick={analyze}
          className="btn-grad w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Проаналізувати мій день
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span className="text-sm opacity-70">ШІ аналізує твій день...</span>
        </div>
      )}

      <AnimatePresence>
        {advice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-4 space-y-3"
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{advice}</p>
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full py-2 rounded-xl text-sm opacity-70 hover:opacity-100 flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Оновити аналіз
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-sm text-red-300 mt-3">
          {error}
        </div>
      )}
    </section>
  );
}