'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { calcNorm } from '@/lib/nutrition';
import { motion } from 'framer-motion';

export default function Onboarding() {
  const [sex, setSex] = useState<'m' | 'f'>('m');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState<'sed' | 'light' | 'mod' | 'high' | 'ath'>('light');
  const [goal, setGoal] = useState<'lose' | 'keep' | 'gain'>('lose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit() {
    setError(null);

    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!ageNum || ageNum < 10 || ageNum > 120) {
      setError('Введи коректний вік (10-120)');
      return;
    }
    if (!weightNum || weightNum < 30 || weightNum > 300) {
      setError('Введи коректну вагу (30-300 кг)');
      return;
    }
    if (!heightNum || heightNum < 100 || heightNum > 250) {
      setError('Введи коректний зріст (100-250 см)');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      const norm = calcNorm({
        id: user.id,
        sex,
        age: ageNum,
        weight: weightNum,
        height: heightNum,
        activity,
        goal,
        daily_norm: 0,
      });
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        sex,
        age: ageNum,
        weight: weightNum,
        height: heightNum,
        activity,
        goal,
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
            onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="Вага (кг)"
            className="rounded-xl px-4 py-3"
          />
          <input
            type="text"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="Зріст (см)"
            className="rounded-xl px-4 py-3"
          />
        </div>

        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value as any)}
          className="w-full rounded-xl px-4 py-3"
        >
          <option value="sed">Сидячий спосіб життя</option>
          <option value="light">Легка активність (1-3 трен.)</option>
          <option value="mod">Середня (3-5 трен.)</option>
          <option value="high">Висока (6-7 трен.)</option>
          <option value="ath">Атлет</option>
        </select>

        <div className="grid grid-cols-3 gap-2">
          {([
            ['lose', '🔥 Схуднути'],
            ['keep', '⚖️ Підтримка'],
            ['gain', '💪 Набрати'],
          ] as const).map(([g, l]) => (
            <button
              key={g}
              type="button"
              onClick={() => setGoal(g)}
              className={`py-4 rounded-2xl text-sm transition-all ${
                goal === g ? 'btn-grad ring-2 ring-purple-400' : 'glass'
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