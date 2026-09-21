'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { macroSplit } from '@/lib/nutrition';
import type { Profile, Meal } from '@/lib/types';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroBar } from '@/components/MacroBar';
import { PhotoUploader } from '@/components/PhotoUploader';
import { BottomNav } from '@/components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!p) {
      router.push('/onboarding');
      return;
    }
    setProfile(p);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data: m } = await supabase
      .from('meals')
      .select('*')
      .gte('eaten_at', start.toISOString())
      .order('eaten_at', { ascending: false });

    setMeals(m || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteMeal(id: string) {
    if (!confirm('Видалити страву?')) return;
    await supabase.from('meals').delete().eq('id', id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const eaten = meals.reduce((s, m) => s + m.calories, 0);
  const protein = meals.reduce((s, m) => s + Number(m.protein || 0), 0);
  const fat = meals.reduce((s, m) => s + Number(m.fat || 0), 0);
  const carbs = meals.reduce((s, m) => s + Number(m.carbs || 0), 0);
  const target = macroSplit(profile.daily_norm, profile.goal);

  const goalLabel = {
    lose: '🔥 Схуднення',
    keep: '⚖️ Підтримка',
    gain: '💪 Набір',
  }[profile.goal];

  return (
    <main className="max-w-2xl mx-auto p-4 pb-32">
      <header className="flex items-center justify-between mb-6 fade-up">
        <div>
          <p className="text-white/50 text-sm">Сьогодні</p>
          <h1 className="text-2xl font-bold">
            {new Date().toLocaleDateString('uk-UA', {
              day: 'numeric',
              month: 'long',
            })}
          </h1>
        </div>
        <div className="glass px-4 py-2 text-sm">{goalLabel}</div>
      </header>

      <section className="glass p-6 mb-5 glow fade-up flex flex-col items-center">
        <CalorieRing eaten={eaten} norm={profile.daily_norm} />
        <div className="w-full mt-6 space-y-3">
          <MacroBar
            label="Білки"
            current={Math.round(protein)}
            target={target.protein}
            color="#60a5fa"
          />
          <MacroBar
            label="Жири"
            current={Math.round(fat)}
            target={target.fat}
            color="#fbbf24"
          />
          <MacroBar
            label="Вуглеводи"
            current={Math.round(carbs)}
            target={target.carbs}
            color="#34d399"
          />
        </div>
      </section>

      <PhotoUploader userId={profile.id} onAdd={load} />

      <section className="glass p-6 mt-5 fade-up">
        <h3 className="font-semibold mb-3">🍽️ Страви ({meals.length})</h3>
        {meals.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-6">
            Ще немає записів. Додай першу страву!
          </p>
        ) : (
          <AnimatePresence>
            {meals.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
              >
                {m.image_url ? (
                  <img
                    src={m.image_url}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                    🍽️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.name}</p>
                  <p className="text-white/40 text-xs">
                    {new Date(m.eaten_at).toLocaleTimeString('uk-UA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · '}Б{Math.round(m.protein)} Ж{Math.round(m.fat)} В
                    {Math.round(m.carbs)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{m.calories}</p>
                  <p className="text-white/40 text-xs">ккал</p>
                </div>
                <button
                  onClick={() => deleteMeal(m.id)}
                  className="p-2 text-white/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>

      <BottomNav />
    </main>
  );
}