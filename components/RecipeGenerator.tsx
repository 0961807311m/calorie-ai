'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Loader2,
  Clock,
  RefreshCw,
  Check,
  Plus,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FeatureModal } from './FeatureMenu';

type Recipe = {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time_min: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: string[];
  steps: string[];
};

export function RecipeGenerator({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set());

  // Налаштування
  const [target, setTarget] = useState('500');
  const [dietary, setDietary] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('вечеря');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => setProfile(data));
  }, [userId]);

  async function generate() {
    if (!profile) return;
    setLoading(true);
    setExpanded(null);
    setAdded(new Set());

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          target: parseInt(target),
          dietary,
          timeOfDay,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipes(data.recipes || []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addToDiary(recipe: Recipe, idx: number) {
    const { error } = await supabase.from('meals').insert({
      user_id: userId,
      name: `${recipe.emoji} ${recipe.name}`,
      calories: recipe.calories,
      protein: recipe.protein,
      fat: recipe.fat,
      carbs: recipe.carbs,
      portion: `${recipe.ingredients.length} інгредієнтів`,
    });
    if (error) {
      alert(error.message);
      return;
    }

    // +1 бал
    const { data: cur } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
    if (cur) {
      await supabase
        .from('profiles')
        .update({ points: (cur.points || 0) + 1 })
        .eq('id', userId);
    }

    setAdded((prev) => new Set(prev).add(idx));
  }

  const difficultyLabel = {
    easy: { label: 'Легко', color: 'text-emerald-400' },
    medium: { label: 'Середньо', color: 'text-yellow-400' },
    hard: { label: 'Складно', color: 'text-red-400' },
  };

  return (
    <FeatureModal
      title="AI-рецепти"
      icon={ChefHat}
      color="linear-gradient(135deg, #10b981, #84cc16)"
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Налаштування */}
        {recipes.length === 0 && !loading && (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60 mb-2 block">
                  Калорійність страви
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['300', '500', '700', '900'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setTarget(v)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition text-white ${
                        target === v ? 'btn-grad' : 'bg-white/5'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block">
                  Прийом їжі
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['сніданок', 'обід', 'вечеря', 'перекус'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setTimeOfDay(v)}
                      className={`py-2 rounded-xl text-xs font-medium transition text-white ${
                        timeOfDay === v ? 'btn-grad' : 'bg-white/5'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block">
                  Обмеження (опційно)
                </label>
                <input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="Наприклад: без лактози, веган, без глютену"
                  className="w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!profile}
              className="w-full btn-grad rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 text-white"
            >
              <Sparkles className="w-5 h-5" />
              Згенерувати 3 рецепти
            </button>
          </>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm text-white/60">ШІ готує рецепти...</p>
          </div>
        )}

        {/* Рецепти */}
        {recipes.length > 0 && !loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">
                {recipes.length} рецепти для тебе
              </p>
              <button
                onClick={generate}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ще рецепти
              </button>
            </div>

            {recipes.map((r, idx) => {
              const diff = difficultyLabel[r.difficulty];
              const isExpanded = expanded === idx;
              const isAdded = added.has(idx);

              return (
                <motion.div
                  key={idx}
                  layout
                  className="rounded-2xl overflow-hidden bg-white/5 border border-white/10"
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : idx)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{r.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{r.name}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-white/60">
                            🔥 {r.calories} ккал
                          </span>
                          <span className="text-xs text-white/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {r.time_min} хв
                          </span>
                          <span className={`text-xs ${diff.color}`}>
                            {diff.label}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2 text-[10px] text-white/50">
                          <span>Б {r.protein}г</span>
                          <span>Ж {r.fat}г</span>
                          <span>В {r.carbs}г</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-4 border-t border-white/10">
                          <div>
                            <p className="text-xs font-semibold text-white/70 mb-2">
                              🛒 Інгредієнти
                            </p>
                            <ul className="space-y-1">
                              {r.ingredients.map((ing, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-white/70 flex items-start gap-2"
                                >
                                  <span className="text-emerald-400 mt-0.5">
                                    •
                                  </span>
                                  {ing}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-white/70 mb-2">
                              👨‍🍳 Приготування
                            </p>
                            <ol className="space-y-1.5">
                              {r.steps.map((step, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-white/70 flex items-start gap-2"
                                >
                                  <span className="text-emerald-400 font-bold mt-0.5 flex-shrink-0">
                                    {i + 1}.
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>

                          <button
                            onClick={() => addToDiary(r, idx)}
                            disabled={isAdded}
                            className={`w-full rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 text-white ${
                              isAdded ? 'bg-emerald-500/30' : ''
                            }`}
                            style={
                              !isAdded
                                ? {
                                    background:
                                      'linear-gradient(135deg, #10b981, #84cc16)',
                                  }
                                : {}
                            }
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-4 h-4" /> Додано
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Додати в щоденник
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </FeatureModal>
  );
}