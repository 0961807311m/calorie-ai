'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FeatureModal } from './FeatureMenu';

export function CalorieHeatmap({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<Record<string, number>>({});
  const [norm, setNorm] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setHours(0, 0, 0, 0);

      const [{ data: meals }, { data: profile }] = await Promise.all([
        supabase
          .from('meals')
          .select('calories, eaten_at')
          .eq('user_id', userId)
          .gte('eaten_at', oneYearAgo.toISOString()),
        supabase
          .from('profiles')
          .select('daily_norm')
          .eq('id', userId)
          .single(),
      ]);

      const map: Record<string, number> = {};
      (meals || []).forEach((m: any) => {
        const key = m.eaten_at.slice(0, 10);
        map[key] = (map[key] || 0) + (m.calories || 0);
      });

      setData(map);
      setNorm(profile?.daily_norm || 2000);
      setLoading(false);
    }
    load();
  }, [userId]);

  // Генеруємо 365 днів
  const days: { date: string; value: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, value: data[key] || 0 });
  }

  // Розбиваємо на тижні (52-53 стовпці)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  function colorFor(v: number): string {
    if (v === 0) return 'rgba(255,255,255,0.06)';
    const ratio = v / norm;
    if (ratio < 0.5) return 'rgba(167,139,250,0.35)'; // недобір
    if (ratio < 0.85) return 'rgba(96,165,250,0.6)'; // мало
    if (ratio <= 1.05) return 'rgba(16,185,129,0.9)'; // ціль 🎯
    if (ratio <= 1.25) return 'rgba(251,191,36,0.9)'; // трохи перебір
    return 'rgba(239,68,68,0.9)'; // перебір
  }

  const totalDays = Object.keys(data).length;
  const streak = (() => {
    let s = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (data[key]) {
        s++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return s;
  })();

  return (
    <FeatureModal
      title="Heatmap калорій"
      icon={Flame}
      color="linear-gradient(135deg, #ec4899, #f43f5e)"
      onClose={onClose}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Статистика */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-3 text-center bg-white/5 border border-white/10">
              <p className="text-xl font-bold text-white">{totalDays}</p>
              <p className="text-[10px] text-white/50">днів з їжею</p>
            </div>
            <div className="rounded-2xl p-3 text-center bg-white/5 border border-white/10">
              <p className="text-xl font-bold text-emerald-400">{streak}</p>
              <p className="text-[10px] text-white/50">стрік 🔥</p>
            </div>
            <div className="rounded-2xl p-3 text-center bg-white/5 border border-white/10">
              <p className="text-xl font-bold text-purple-400">{norm}</p>
              <p className="text-[10px] text-white/50">норма ккал</p>
            </div>
          </div>

          {/* Heatmap */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-[3px]" style={{ minWidth: 'max-content' }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: wi * 0.005 + week.indexOf(day) * 0.002 }}
                      className="w-[10px] h-[10px] rounded-[2px] cursor-pointer hover:ring-2 hover:ring-white/40 transition"
                      style={{ background: colorFor(day.value) }}
                      title={`${day.date}: ${day.value} ккал`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Легенда */}
          <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/10">
            <span>Менше</span>
            <div className="flex gap-1">
              {[0, 0.4, 0.7, 1, 1.4].map((r, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-[2px]"
                  style={{
                    background: colorFor(r === 0 ? 0 : r * norm),
                  }}
                />
              ))}
            </div>
            <span>Більше</span>
          </div>

          {/* Підказка кольорів */}
          <div className="text-xs text-white/50 space-y-1.5 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(16,185,129,0.9)' }} />
              <span>В яблучко (85-105% норми)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(251,191,36,0.9)' }} />
              <span>Трохи перебір (105-125%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.9)' }} />
              <span>Серйозний перебір (&gt;125%)</span>
            </div>
          </div>
        </div>
      )}
    </FeatureModal>
  );
}