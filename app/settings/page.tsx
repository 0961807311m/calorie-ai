'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { calcNorm } from '@/lib/nutrition';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition } from '@/components/PageTransition';
import { applyTheme } from '@/lib/theme';
import { useToast } from '@/lib/useToast';
import type { Profile } from '@/lib/types';
import { motion } from 'framer-motion';
import { Loader2, Sun, Moon, Save } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [sex, setSex] = useState<'m' | 'f'>('m');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState<any>('light');
  const [goal, setGoal] = useState<any>('lose');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    async function load() {
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
      setSex(p.sex);
      setAge(String(p.age));
      setWeight(String(p.weight));
      setHeight(String(p.height));
      setActivity(p.activity);
      setGoal(p.goal);
      setTheme(p.theme || 'dark');
      setLoading(false);
    }
    load();
  }, [router]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!ageNum || !weightNum || !heightNum) {
      toast.error('Заповни всі поля');
      setSaving(false);
      return;
    }

    try {
      const norm = calcNorm({
        id: profile.id,
        sex,
        age: ageNum,
        weight: weightNum,
        height: heightNum,
        activity,
        goal,
        daily_norm: 0,
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          sex,
          age: ageNum,
          weight: weightNum,
          height: heightNum,
          activity,
          goal,
          daily_norm: norm,
          theme,
        })
        .eq('id', profile.id);

      if (error) throw error;

      applyTheme(theme);
      setSaved(true);
      toast.success('Збережено! ✅');
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleTheme(newTheme: 'dark' | 'light') {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <PageTransition>
      <main
        className="max-w-2xl mx-auto p-4"
        style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}
      >
        <header className="mb-6 fade-up">
          <h1 className="text-3xl font-bold gradient-text mb-1">
            Налаштування
          </h1>
          <p className="text-sm opacity-50">Зміни свої параметри та вигляд</p>
        </header>

        {/* Тема */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 mb-5"
        >
          <h3 className="font-semibold mb-4">🎨 Тема інтерфейсу</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toggleTheme('dark')}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition ${
                theme === 'dark' ? 'btn-grad' : 'glass'
              }`}
            >
              <Moon className="w-6 h-6" />
              <span className="text-sm font-medium">Темна</span>
            </button>
            <button
              onClick={() => toggleTheme('light')}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition ${
                theme === 'light' ? 'btn-grad' : 'glass'
              }`}
            >
              <Sun className="w-6 h-6" />
              <span className="text-sm font-medium">Світла</span>
            </button>
          </div>
        </motion.section>

        {/* Особисті дані */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-6 mb-5"
        >
          <h3 className="font-semibold mb-4">👤 Особисті дані</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as any)}
              className="rounded-xl px-4 py-3"
            >
              <option value="m">Чоловік</option>
              <option value="f">Жінка</option>
            </select>
            <input
              type="text"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Вік"
              className="rounded-xl px-4 py-3"
            />
            <input
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) =>
                setWeight(e.target.value.replace(/[^0-9.]/g, ''))
              }
              placeholder="Вага (кг)"
              className="rounded-xl px-4 py-3"
            />
            <input
              type="text"
              inputMode="decimal"
              value={height}
              onChange={(e) =>
                setHeight(e.target.value.replace(/[^0-9.]/g, ''))
              }
              placeholder="Зріст (см)"
              className="rounded-xl px-4 py-3"
            />
          </div>

          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full rounded-xl px-4 py-3 mb-4"
          >
            <option value="sed">Сидячий спосіб життя</option>
            <option value="light">Легка активність (1-3 трен.)</option>
            <option value="mod">Середня (3-5 трен.)</option>
            <option value="high">Висока (6-7 трен.)</option>
            <option value="ath">Атлет</option>
          </select>

          <h4 className="text-sm opacity-60 mb-2">Ціль</h4>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['lose', '🔥 Схуднути'],
                ['keep', '⚖️ Підтримка'],
                ['gain', '💪 Набрати'],
              ] as const
            ).map(([g, l]) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={`py-3 rounded-xl text-sm transition ${
                  goal === g ? 'btn-grad ring-2 ring-purple-400' : 'glass'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Зберегти */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={save}
          disabled={saving}
          className="btn-grad w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saved ? '✓ Збережено!' : 'Зберегти зміни'}
        </motion.button>

        <BottomNav />
      </main>
    </PageTransition>
  );
}