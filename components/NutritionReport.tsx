'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function NutritionReport({
  userId,
  profile,
}: {
  userId: string;
  profile: any;
}) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getWeekStart(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const weekStart = getWeekStart();

      // Перевіряємо чи є вже звіт за цей тиждень
      const { data: existing } = await supabase
        .from('nutrition_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .single();

      if (existing) {
        setReport(existing.report);
        setLoading(false);
        return;
      }

      // Завантажуємо страви за тиждень
      const start = new Date(weekStart);
      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .gte('eaten_at', start.toISOString());

      // Запит до ШІ
      const res = await fetch('/api/weekly-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals, profile, weekStart }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setReport(data.report);

      // Зберігаємо звіт
      await supabase.from('nutrition_reports').upsert({
        user_id: userId,
        week_start: weekStart,
        report: data.report,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass p-6 mb-5 fade-up">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <Apple className="w-4 h-4 text-emerald-400" /> Вітаміни та мінерали
      </h3>
      <p className="text-xs opacity-60 mb-3">
        AI-аналіз раціону за тиждень
      </p>

      {!report && !loading && (
        <button
          onClick={analyze}
          className="btn-grad w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <Apple className="w-4 h-4" /> Проаналізувати тиждень
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm opacity-70">ШІ аналізує раціон...</span>
        </div>
      )}

      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4"
          >
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {report}
            </div>
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