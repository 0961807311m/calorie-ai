'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { macroSplit } from '@/lib/nutrition';
import { applyTheme } from '@/lib/theme';
import type { Profile, Meal } from '@/lib/types';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroBar } from '@/components/MacroBar';
import { BottomNav } from '@/components/BottomNav';
import { StreakCard } from '@/components/StreakCard';
import { ChatCoach } from '@/components/ChatCoach';
import { DailyAdvice } from '@/components/DailyAdvice';
import { NutritionReport } from '@/components/NutritionReport';
import { WeightBadge } from '@/components/WeightEditor';
import { QuickActions } from '@/components/QuickActions';
import { PointsCounter } from '@/components/PointsCounter';
import { Preloader } from '@/components/Preloader';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullPreloader, setShowFullPreloader] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().slice(0, 10);
    const seenDate = localStorage.getItem('preloader-seen-date');
    if (seenDate !== today) {
      setShowFullPreloader(true);
      localStorage.setItem('preloader-seen-date', today);
    }
  }, []);

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
    if (p.theme) applyTheme(p.theme);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data: m } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
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

  async function updateMealCalories(id: string, newCalories: number) {
    await supabase.from('meals').update({ calories: newCalories }).eq('id', id);
    setMeals((prev) =>
      prev.map((m) => (m.id === id ? { ...m, calories: newCalories } : m))
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-5xl animate-pulse">🍎</div>
      </div>
    );
  }

  if (showFullPreloader) {
    return <Preloader />;
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl"
        >
          🍎
        </motion.div>
      </div>
    );
  }

  const eaten = meals.reduce((s, m) => s + m.calories, 0);
  const protein = meals.reduce((s, m) => s + Number(m.protein || 0), 0);
  const fat = meals.reduce((s, m) => s + Number(m.fat || 0), 0);
  const carbs = meals.reduce((s, m) => s + Number(m.carbs || 0), 0);
  const sugar = meals.reduce((s, m) => s + Number(m.sugar || 0), 0);
  const target = macroSplit(profile.daily_norm, profile.goal);

  const goalLabel = {
    lose: '🔥 Схуднення',
    keep: '⚖️ Підтримка',
    gain: '💪 Набір',
  }[profile.goal];

  return (
    <main className="max-w-2xl mx-auto p-4 pb-32">
      <header className="flex items-center justify-between mb-5 fade-up gap-3">
        <div className="min-w-0">
          <p className="text-xs opacity-50">Сьогодні</p>
          <h1 className="text-xl font-bold truncate">
            {new Date().toLocaleDateString('uk-UA', {
              day: 'numeric',
              month: 'long',
            })}
          </h1>
          <p className="text-xs gradient-text font-medium mt-0.5">{goalLabel}</p>
        </div>
        <PointsCounter userId={profile.id} />
      </header>

      <section className="glass p-5 mb-4 glow fade-up flex flex-col items-center">
        <CalorieRing eaten={eaten} norm={profile.daily_norm} size={190} />
        <div className="w-full mt-5 space-y-2.5">
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
          {sugar > 0 && (
            <MacroBar
              label="Цукор"
              current={Math.round(sugar)}
              target={50}
              color="#f87171"
            />
          )}
        </div>
      </section>

      <DailyAdvice meals={meals} profile={profile} />

      <QuickActions userId={profile.id} onAdd={load} />

      <StreakCard userId={profile.id} />

      <NutritionReport userId={profile.id} profile={profile} />

      <section className="glass p-5 mt-5 fade-up">
        <h3 className="font-semibold mb-3 text-sm">🍽️ Страви ({meals.length})</h3>
        {meals.length === 0 ? (
          <p className="text-sm opacity-40 text-center py-6">
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
                className="flex items-center gap-2.5 py-2.5 border-b border-white/5 last:border-0"
              >
                {m.image_url ? (
                  <img
                    src={m.image_url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-xl">
                    {m.is_drink ? '🥤' : m.label_analysis ? '🔬' : '🍽️'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.name}</p>
                  <p className="text-[11px] opacity-40">
                    {new Date(m.eaten_at).toLocaleTimeString('uk-UA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · '}Б{Math.round(m.protein)} Ж{Math.round(m.fat)} В
                    {Math.round(m.carbs)}
                    {m.sugar ? ` · Ц${Math.round(m.sugar)}` : ''}
                  </p>
                </div>
                {m.calories > 0 ? (
                  <WeightBadge
                    item={m}
                    onUpdate={(newCal) => updateMealCalories(m.id, newCal)}
                  />
                ) : (
                  <p className="text-[10px] opacity-50 text-right max-w-[80px]">
                    {m.portion}
                  </p>
                )}
                <button
                  onClick={() => deleteMeal(m.id)}
                  className="p-1.5 opacity-30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>

      <ChatCoach profile={profile} />
      <BottomNav />
    </main>
  );
}