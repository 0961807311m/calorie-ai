'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition } from '@/components/PageTransition';
import { Loader2, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type DayData = {
  date: string;
  label: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

function getCacheKey(period: 7 | 30) {
  return `history-cache-${period}`;
}

export default function History() {
  const [days, setDays] = useState<DayData[]>([]);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [norm, setNorm] = useState<number>(0);
  const router = useRouter();

  const load = useCallback(async () => {
    const cacheKey = getCacheKey(period);

    // 1. Кеш — миттєво
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setDays(data.days);
          setNorm(data.norm);
          setLoading(false);
        } catch {
          setLoading(true);
        }
      } else {
        setLoading(true);
      }
    }

    // 2. Оновлення у фоні
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_norm')
      .eq('id', user.id)
      .single();
    if (profile) setNorm(profile.daily_norm);

    const start = new Date();
    start.setDate(start.getDate() - period + 1);
    start.setHours(0, 0, 0, 0);

    const { data: meals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('eaten_at', start.toISOString());

    const map = new Map<string, DayData>();
    for (let i = 0; i < period; i++) {
      const d = new Date();
      d.setDate(d.getDate() - period + 1 + i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, {
        date: key,
        label: d.toLocaleDateString('uk-UA', {
          day: 'numeric',
          month: 'short',
        }),
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      });
    }

    (meals || []).forEach((m) => {
      const key = new Date(m.eaten_at).toISOString().slice(0, 10);
      const day = map.get(key);
      if (day) {
        day.calories += m.calories || 0;
        day.protein += Number(m.protein || 0);
        day.fat += Number(m.fat || 0);
        day.carbs += Number(m.carbs || 0);
      }
    });

    const daysData = Array.from(map.values());
    setDays(daysData);
    setLoading(false);

    // 3. Кеш
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ days: daysData, norm: profile?.daily_norm || 0 })
      );
    }
  }, [period, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const totalCal = days.reduce((s, d) => s + d.calories, 0);
  const avgCal = Math.round(totalCal / days.length);
  const daysWithMeals = days.filter((d) => d.calories > 0).length;

  const totalProtein = Math.round(days.reduce((s, d) => s + d.protein, 0));
  const totalFat = Math.round(days.reduce((s, d) => s + d.fat, 0));
  const totalCarbs = Math.round(days.reduce((s, d) => s + d.carbs, 0));

  const macroData = [
    { name: 'Білки', value: totalProtein },
    { name: 'Жири', value: totalFat },
    { name: 'Вуглеводи', value: totalCarbs },
  ];

  return (
    <PageTransition>
      <main
        className="max-w-2xl mx-auto p-4"
        style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}
      >
        <header className="mb-6 fade-up">
          <h1 className="text-3xl font-bold gradient-text mb-1">Історія</h1>
          <p className="text-white/50 text-sm">Твій прогрес за період</p>
        </header>

        <div className="flex gap-2 mb-5 fade-up">
          {([7, 30] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                period === p ? 'btn-grad' : 'glass hover:bg-white/10'
              }`}
            >
              {p === 7 ? '7 днів' : '30 днів'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 fade-up">
          <div className="glass p-4 text-center">
            <TrendingUp className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{avgCal}</p>
            <p className="text-xs text-white/50">сер. ккал</p>
          </div>
          <div className="glass p-4 text-center">
            <p className="text-xl font-bold">{totalCal}</p>
            <p className="text-xs text-white/50">всього ккал</p>
          </div>
          <div className="glass p-4 text-center">
            <p className="text-xl font-bold">
              {daysWithMeals}/{days.length}
            </p>
            <p className="text-xs text-white/50">днів</p>
          </div>
        </div>

        <section className="glass p-6 mb-5 fade-up">
          <h3 className="font-semibold mb-4">🔥 Калорії по днях</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart
                data={days}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: 11 }}
                  interval={period === 30 ? 4 : 0}
                />
                <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20,20,30,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: 'white',
                  }}
                  formatter={(v: any) => [`${v} ккал`, 'Калорії']}
                />
                {norm > 0 && (
                  <Line
                    type="monotone"
                    dataKey={() => norm}
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="5 5"
                    dot={false}
                    name="Норма"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="url(#calGrad)"
                  strokeWidth={3}
                  dot={{ fill: '#a78bfa', r: 3 }}
                  activeDot={{ r: 6, fill: '#ec4899' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass p-6 mb-5 fade-up">
          <h3 className="font-semibold mb-4">🥩 Макронутрієнти</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart
                data={days}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: 11 }}
                  interval={period === 30 ? 4 : 0}
                />
                <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20,20,30,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: 'white',
                  }}
                  formatter={(v: any, n: any) => [`${Math.round(v)} г`, n]}
                />
                <Bar
                  dataKey="protein"
                  name="Білки"
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="fat"
                  name="Жири"
                  fill="#fbbf24"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="carbs"
                  name="Вуглеводи"
                  fill="#34d399"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass p-6 mb-5 fade-up">
          <h3 className="font-semibold mb-4">🥧 Розподіл макросів</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={macroData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  <Cell fill="#60a5fa" />
                  <Cell fill="#fbbf24" />
                  <Cell fill="#34d399" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20,20,30,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: 'white',
                  }}
                  formatter={(v: any) => [`${v} г`, '']}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: 'white' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <BottomNav />
      </main>
    </PageTransition>
  );
}