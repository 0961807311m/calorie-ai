'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FeatureModal } from './FeatureMenu';

type Challenge = {
  key: string;
  emoji: string;
  title: string;
  description: string;
  points: number;
  check: (stats: any) => boolean;
};

const CHALLENGES: Challenge[] = [
  {
    key: 'protein-100',
    emoji: '💪',
    title: 'Білковий день',
    description: 'З\'їж 100 г білка за день',
    points: 10,
    check: (s) => s.protein >= 100,
  },
  {
    key: 'water-2l',
    emoji: '💧',
    title: 'Водний баланс',
    description: 'Випий 2 л води',
    points: 10,
    check: (s) => s.water >= 2000,
  },
  {
    key: 'meals-4',
    emoji: '🍽️',
    title: 'Регулярність',
    description: '4+ прийоми їжі',
    points: 5,
    check: (s) => s.mealsCount >= 4,
  },
  {
    key: 'calories-goal',
    emoji: '🎯',
    title: 'В яблучко',
    description: 'Потрап у норму ±5%',
    points: 20,
    check: (s) =>
      s.norm > 0 && Math.abs(s.calories - s.norm) / s.norm < 0.05,
  },
  {
    key: 'sugar-low',
    emoji: '🍭',
    title: 'Мінімум цукру',
    description: 'Менше 25 г цукру',
    points: 15,
    check: (s) => s.sugar < 25 && s.mealsCount > 0,
  },
  {
    key: 'no-overeat',
    emoji: '🛑',
    title: 'Без переїдання',
    description: 'Не перевищуй норму',
    points: 10,
    check: (s) => s.calories > 0 && s.calories <= s.norm,
  },
];

export function ChallengeCard({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    calories: 0,
    protein: 0,
    sugar: 0,
    mealsCount: 0,
    water: 0,
    norm: 0,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const [{ data: meals }, { data: water }, { data: profile }, { data: done }] =
        await Promise.all([
          supabase
            .from('meals')
            .select('*')
            .eq('user_id', userId)
            .gte('eaten_at', start.toISOString()),
          supabase
            .from('water_logs')
            .select('amount_ml')
            .eq('user_id', userId)
            .eq('date', today),
          supabase
            .from('profiles')
            .select('daily_norm')
            .eq('id', userId)
            .single(),
          supabase
            .from('challenges')
            .select('challenge_key')
            .eq('user_id', userId)
            .eq('date', today),
        ]);

      const m = meals || [];
      const newStats = {
        calories: m.reduce((s, x) => s + (x.calories || 0), 0),
        protein: m.reduce((s, x) => s + Number(x.protein || 0), 0),
        sugar: m.reduce((s, x) => s + Number(x.sugar || 0), 0),
        mealsCount: m.length,
        water: (water || []).reduce((s, x) => s + (x.amount_ml || 0), 0),
        norm: profile?.daily_norm || 0,
      };
      setStats(newStats);

      const completedSet = new Set<string>(
        (done || []).map((d: any) => d.challenge_key)
      );

      // Автоматично відмічаємо виконані
      for (const ch of CHALLENGES) {
        if (!completedSet.has(ch.key) && ch.check(newStats)) {
          completedSet.add(ch.key);
          await supabase.from('challenges').insert({
            user_id: userId,
            challenge_key: ch.key,
            date: today,
          });
          // + бали
          await supabase.rpc('increment_points', {
            user_id_param: userId,
            amount: ch.points,
          }).then(async () => {
            // fallback якщо RPC немає
          });
          // Простий інкремент балів
          const { data: cur } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .single();
          if (cur) {
            await supabase
              .from('profiles')
              .update({ points: (cur.points || 0) + ch.points })
              .eq('id', userId);
          }
        }
      }

      setCompleted(completedSet);
      setLoading(false);
    }
    load();
  }, [userId]);

  const totalCompleted = completed.size;
  const totalPoints = CHALLENGES.filter((c) => completed.has(c.key)).reduce(
    (s, c) => s + c.points,
    0
  );

  return (
    <FeatureModal
      title="Щоденні челенджі"
      icon={Trophy}
      color="linear-gradient(135deg, #fbbf24, #f59e0b)"
      onClose={onClose}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Прогрес */}
          <div
            className="rounded-2xl p-4"
            style={{
              background:
                'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))',
              border: '1px solid rgba(251,191,36,0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">
                Виконано {totalCompleted} з {CHALLENGES.length}
              </span>
              <span className="text-sm font-bold text-yellow-400">
                +{totalPoints} балів
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(totalCompleted / CHALLENGES.length) * 100}%`,
                }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                }}
              />
            </div>
          </div>

          {/* Список челенджів */}
          {CHALLENGES.map((ch) => {
            const isDone = completed.has(ch.key);
            const isProgress = !isDone && ch.check(stats);
            return (
              <motion.div
                key={ch.key}
                layout
                className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{
                  background: isDone
                    ? 'rgba(16,185,129,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  border: isDone
                    ? '1px solid rgba(16,185,129,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className={`text-2xl transition ${
                    isDone ? '' : 'grayscale opacity-50'
                  }`}
                >
                  {ch.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm ${
                      isDone ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {ch.title}
                  </p>
                  <p className="text-xs text-white/50">{ch.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {isDone ? (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-bold">+{ch.points}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-white/40">
                      +{ch.points} балів
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </FeatureModal>
  );
}