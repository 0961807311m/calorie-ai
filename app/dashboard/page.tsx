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
import { FeatureMenu } from '@/components/FeatureMenu';
import { PageTransition } from '@/components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';

const CACHE_KEY = 'dashboard-cache';

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    // 1. МИТТЄВЕ завантаження з кешу
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setProfile(data.profile);
          setMeals(data.meals);
          setLoading(false);
          if (data.profile?.theme) applyTheme(data.profile.theme);
        } catch {}
      }
    }

    // 2. Оновлення у фоні
    const { data: { user } } = await supabase.auth.getUser();
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

    const mealsData = m || [];
    setMeals(mealsData);
    setLoading(false);

    // 3. Оновлюємо кеш
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ profile: p, meals: mealsData })
      );
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteMeal(id: string) {
    if (!confirm('Видалити страву?')) return;
    await supabase.from('meals').delete().eq('id', id);
    setMeals((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      if (typeof window !== 'undefined' && profile) {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ profile, meals: updated })
        );
      }
      return updated;
    });
  }

  async function updateMealCalories(id: string, newCalories: number) {
    await supabase.from('meals').update({ calories: newCalories }).eq('id', id);
    setMeals((prev) => {
      const updated = prev.map((m) =>
        m.id === id ? { ...m, calories: newCalories } : m
      );
      if (typeof window !== 'undefined' && profile) {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ profile, meals: updated })
        );
      }
      return updated;
    });
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
  const sugar = meals.reduce((s, m) => s + Number(m.sugar || 0), 0);
  const target = macroSplit(profile.daily_norm, profile.goal);

  const goalLabel = {
    lose: '🔥 Схуднення',
    keep: '⚖️ Підтримка',
    gain: '💪 Набір',
  }[profile.goal];

  return (
    <PageTransition>
      <main
        className="max-w-2xl mx-auto p-4"
        style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}
      >
        {/* ПРЕМІУМ STICKY HEADER */}
        <header
          className="sticky top-0 z-30 -mx-4 px-4 py-3 mb-5 backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(to bottom, rgba(7,7,12,0.95), rgba(7,7,12,0.7))',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="min-w-0"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] uppercase tracking-widest opacity-40 font-medium"
              >
                Сьогодні
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold truncate tracking-tight"
              >
                {new Date().toLocaleDateString('uk-UA', {
                  day: 'numeric',
                  month: 'long',
                })}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(167,139,250,0.1)',
                  border: '1px solid rgba(167,139,250,0.2)',
                }}
              >
                <span className="text-[10px] font-medium gradient-text">
                  {goalLabel}
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              <PointsCounter userId={profile.id} />
              <FeatureMenu userId={profile.id} />
            </motion.div>
          </div>
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
          <h3 className="font-semibold mb-3 text-sm">
            🍽️ Страви ({meals.length})
          </h3>
          {meals.length === 0 ? (
            <p className="text-sm opacity-40 text-center py-6">
              Ще немає записів. Додай першу страву!
            </p>
          ) : (
            <AnimatePresence>
              {meals.map((m, idx) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: idx * 0.03 }}
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
    </PageTransition>
  );
}