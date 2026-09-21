'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { calcNorm } from '@/lib/nutrition';
import { motion } from 'framer-motion';

export default function Onboarding() {
  const [form, setForm] = useState({
    sex: 'm' as 'm' | 'f',
    age: 25,
    weight: 70,
    height: 175,
    activity: 'light' as 'sed' | 'light' | 'mod' | 'high' | 'ath',
    goal: 'lose' as 'lose' | 'keep' | 'gain',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      const norm = calcNorm({ ...form, id: user.id, daily_norm: 0 });
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...form,
        daily_norm: norm,
      });
      if (error) throw error;
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen max-w-xl mx-auto p-6 flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 glow space-y-5"
      >
        <h1 className="text-3xl font-bold gradient-text">Розкажи про себе</h1>

        <div className="grid grid-cols-2 gap-4">
          <select
            value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value as any })}
            className="rounded-xl px-4 py-3"
          >
            <option value="m">Чоловік</option>
            <option value="f">Жінка</option>
          </select>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: +e.target.value })}
            placeholder="Вік"
            className="rounded-xl px-4 py-3"
          />
          <input
            type="number"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: +e.target.value })}
            placeholder="Вага (кг)"
            className="rounded-xl px-4 py-3"
          />
          <input
            type="number"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: +e.target.value })}
            placeholder="Зріст (см)"
            className="rounded-xl px-4 py-3"
          />
        </div>

        <select
          value={form.activity}
          onChange={(e) => setForm({ ...form, activity: e.target.value as any })}
          className="w-full rounded-xl px-4 py-3"
        >
          <option value="sed">Сидячий спосіб життя</option>
          <option value="light">Легка активність (1-3 трен.)</option>
          <option value="mod">Середня (3-5 трен.)</option>
          <option value="high">Висока (6-7 трен.)</option>
          <option value="ath">Атлет</option>
        </select>

        <div className="grid grid-cols-3 gap-2">
          {[
            ['lose', '🔥 Схуднути'],
            ['keep', '⚖️ Підтримка'],
            ['gain', '💪 Набрати'],
          ].map(([g, l]) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm({ ...form, goal: g as any })}
              className={`py-4 rounded-2xl text-sm transition-all ${
                form.goal === g ? 'btn-grad ring-2 ring-purple-400' : 'glass'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="btn-grad w-full py-4 rounded-2xl font-semibold text-lg disabled:opacity-50"
        >
          {loading ? 'Збереження...' : 'Почати →'}
        </button>
      </motion.div>
    </main>
  );
}