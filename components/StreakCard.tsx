'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { calcStreak, getAchievements } from '@/lib/achievements';

export function StreakCard({ userId }: { userId: string }) {
  const [streak, setStreak] = useState(0);
  const [totalMeals, setTotalMeals] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [daysUsed, setDaysUsed] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: meals } = await supabase
        .from('meals')
        .select('eaten_at, image_url')
        .eq('user_id', userId);

      if (!meals) return;

      const dates = meals.map((m) => m.eaten_at);
      const aiMeals = meals.filter((m) => m.image_url);

      setStreak(calcStreak(dates));
      setTotalMeals(meals.length);
      setAiCount(aiMeals.length);
      setDaysUsed(new Set(dates.map((d) => d.slice(0, 10))).size);
    }
    load();
  }, [userId]);

  const achievements = getAchievements({
    totalMeals,
    streak,
    daysUsed,
    aiRecognitions: aiCount,
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const visible = showAll ? achievements : achievements.slice(0, 3);

  return (
    <section className="glass p-6 mb-5 fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: streak > 0 ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-4xl"
          >
            {streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✨'}
          </motion.div>
          <div>
            <p className="text-2xl font-bold gradient-text">{streak}</p>
            <p className="text-xs text-white/50">
              {streak === 1 ? 'день підряд' : streak < 5 ? 'дні підряд' : 'днів підряд'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">
              {unlockedCount}/{achievements.length}
            </span>
          </div>
          <p className="text-xs text-white/40">досягнень</p>
        </div>
      </div>

      <div className="space-y-2">
        {visible.map((a) => (
          <motion.div
            key={a.id}
            layout
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              a.unlocked
                ? 'bg-purple-500/10 border border-purple-400/30'
                : 'bg-white/5 border border-white/5'
            }`}
          >
            <div className={`text-2xl ${a.unlocked ? '' : 'grayscale opacity-40'}`}>
              {a.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${a.unlocked ? 'text-white' : 'text-white/40'}`}>
                {a.title}
              </p>
              <p className="text-xs text-white/40 truncate">{a.description}</p>
              {!a.unlocked && a.target > 1 && (
                <div className="h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-purple-500/50 rounded-full transition-all"
                    style={{ width: `${(a.progress / a.target) * 100}%` }}
                  />
                </div>
              )}
            </div>
            {a.unlocked && <span className="text-xs text-purple-300 font-medium">✓</span>}
          </motion.div>
        ))}
      </div>

      {achievements.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-sm text-white/50 hover:text-white/80 transition"
        >
          {showAll ? '− Згорнути' : `+ Показати всі (${achievements.length})`}
        </button>
      )}
    </section>
  );
}
