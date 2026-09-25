'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, Minus, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FeatureModal } from './FeatureMenu';

const GOAL = 2000; // мл

export function WaterTracker({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: false });

    setLogs(data || []);
    setAmount((data || []).reduce((s, l) => s + l.amount_ml, 0));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [userId]);

  async function addWater(ml: number) {
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('water_logs').insert({
      user_id: userId,
      amount_ml: ml,
      date: today,
    });
    await load();

    // +1 бал за перше додавання води цього дня
    if (amount === 0) {
      const { data: cur } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
      if (cur) {
        await supabase
          .from('profiles')
          .update({ points: (cur.points || 0) + 1 })
          .eq('id', userId);
      }
    }
    setSaving(false);
  }

  async function deleteLog(id: string) {
    await supabase.from('water_logs').delete().eq('id', id);
    await load();
  }

  const pct = Math.min(100, (amount / GOAL) * 100);

  return (
    <FeatureModal
      title="Трекер води"
      icon={Droplets}
      color="linear-gradient(135deg, #06b6d4, #3b82f6)"
      onClose={onClose}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Візуалізація */}
          <div className="relative rounded-3xl p-5 bg-gradient-to-b from-cyan-500/10 to-blue-500/10 border border-cyan-400/30">
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <motion.span
                key={amount}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-bold text-cyan-300 tabular-nums"
              >
                {amount}
              </motion.span>
              <span className="text-lg text-cyan-400/60">мл</span>
            </div>
            <p className="text-center text-xs text-white/50 mb-4">
              з {GOAL} мл цілі
            </p>

            {/* Прогрес */}
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                  boxShadow: '0 0 12px rgba(6,182,212,0.6)',
                }}
              />
            </div>
            <p className="text-center text-xs text-cyan-300 mt-2 font-medium">
              {pct.toFixed(0)}% {pct >= 100 ? '🎉 Ціль виконано!' : ''}
            </p>
          </div>

          {/* Кнопки додавання */}
          <div className="grid grid-cols-3 gap-3">
            {[200, 250, 500].map((ml) => (
              <motion.button
                key={ml}
                whileTap={{ scale: 0.95 }}
                onClick={() => addWater(ml)}
                disabled={saving}
                className="rounded-2xl py-4 flex flex-col items-center gap-1 transition text-white disabled:opacity-50"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))',
                  border: '1px solid rgba(6,182,212,0.3)',
                }}
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span className="text-base font-bold">{ml}</span>
                <span className="text-[10px] text-white/50">мл</span>
              </motion.button>
            ))}
          </div>

          {/* Кастомна кількість */}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Своя кількість (мл)"
              className="flex-1 rounded-xl px-4 py-3 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = parseInt((e.target as HTMLInputElement).value);
                  if (v > 0) {
                    addWater(v);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>

          {/* Список */}
          {logs.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-white/50 mb-2">
                Сьогодні ({logs.length})
              </p>
              <div className="space-y-1.5">
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      layout
                      exit={{ opacity: 0, x: -50 }}
                      className="flex items-center gap-2 bg-white/5 rounded-xl p-2.5"
                    >
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      <span className="flex-1 text-sm text-white">
                        +{log.amount_ml} мл
                      </span>
                      <span className="text-[10px] text-white/40">
                        {new Date(log.created_at).toLocaleTimeString('uk-UA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="p-1 opacity-40 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </FeatureModal>
  );
}