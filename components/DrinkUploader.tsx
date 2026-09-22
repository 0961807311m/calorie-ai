'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function DrinkUploader({
  userId,
  onAdd,
}: {
  userId: string;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/drink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error === 'unknown' ? 'Не розпізнав напій' : data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!result) return;
    setLoading(true);
    try {
      await supabase.from('meals').insert({
        user_id: userId,
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        fat: result.fat,
        carbs: result.carbs,
        portion: result.portion,
        sugar: result.sugar,
        is_drink: true,
        volume_ml: result.volume_ml,
      });
      setText('');
      setResult(null);
      setOpen(false);
      onAdd();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass p-6 mt-5 fade-up">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <Coffee className="w-4 h-4 text-amber-400" /> Додати напій
      </h3>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full border-2 border-dashed border-white/15 rounded-2xl p-6 text-center hover:border-amber-400/50 transition"
        >
          <Coffee className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm opacity-70">Опиши напій словами</p>
          <p className="text-xs opacity-40 mt-1">Наприклад: "кава з молоком"</p>
        </button>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Наприклад: "кола 0.5л", "сік апельсиновий"'
            className="w-full rounded-xl px-4 py-3"
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            autoFocus
          />

          {!result && (
            <div className="flex gap-2">
              <button
                onClick={analyze}
                disabled={loading || !text.trim()}
                className="btn-grad flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Проаналізувати
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setText('');
                  setResult(null);
                }}
                className="glass px-4 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 space-y-3"
              >
                <div>
                  <p className="font-semibold">{result.name}</p>
                  <p className="text-xs opacity-60">{result.portion}</p>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ['ккал', result.calories],
                    ['Б', `${result.protein}г`],
                    ['В', `${result.carbs}г`],
                    ['Цукор', `${result.sugar}г`],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="bg-white/5 rounded-xl py-2">
                      <p className="font-bold text-sm">{v}</p>
                      <p className="text-xs opacity-50">{l}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={save}
                  disabled={loading}
                  className="w-full btn-grad rounded-xl py-3 font-medium flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Додати
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}