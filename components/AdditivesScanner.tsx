'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Camera,
  Loader2,
  Check,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Additive = {
  code: string;
  name?: string;
  effect?: string;
  risk?: string;
};

type Analysis = {
  product_name: string;
  verdict: 'safe' | 'caution' | 'danger';
  verdict_text: string;
  dangerous: Additive[];
  caution: Additive[];
  safe_count: number;
};

export function AdditivesScanner({
  userId,
  onAdd,
}: {
  userId: string;
  onAdd: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function compress(file: File, maxSize = 1280): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(file: File) {
    setError(null);
    setAnalysis(null);
    const compressed = await compress(file);
    setImage(compressed);
    setLoading(true);

    try {
      const res = await fetch('/api/additives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed }),
      });
      const data = await res.json();
      if (data.error === 'not_label') {
        throw new Error(
          'На фото не видно склад продукту. Спробуй сфотографувати етикетку ближче.'
        );
      }
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addPoint() {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();

    if (currentProfile) {
      await supabase
        .from('profiles')
        .update({ points: (currentProfile.points || 0) + 1 })
        .eq('id', userId);
    }
  }

  async function save() {
    if (!analysis) return;
    setLoading(true);
    try {
      await supabase.from('meals').insert({
        user_id: userId,
        name: `🔬 ${analysis.product_name}`,
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        portion:
          analysis.verdict === 'danger'
            ? '⚠️ Небезпечні добавки'
            : analysis.verdict === 'caution'
            ? '⚡ Є ризики'
            : '✅ Безпечно',
        label_analysis: JSON.stringify(analysis),
        has_additives: analysis.dangerous.length > 0,
        additives_list: JSON.stringify([
          ...analysis.dangerous,
          ...analysis.caution,
        ]),
      });

      await addPoint();

      // Скидаємо форму
      setAnalysis(null);
      setImage(null);
      if (inputRef.current) inputRef.current.value = '';
      onAdd();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setAnalysis(null);
    setImage(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const verdictConfig = {
    safe: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-400/30',
      icon: ShieldCheck,
      label: '✅ Безпечно',
    },
    caution: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-400/30',
      icon: AlertTriangle,
      label: '⚡ Є ризики',
    },
    danger: {
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-400/30',
      icon: ShieldAlert,
      label: '🚫 Небезпечно',
    },
  };

  return (
    <div className="glass p-6 fade-up">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-emerald-400" /> Аналіз E-добавок
      </h3>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <AnimatePresence mode="wait">
        {!image ? (
          <motion.button
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-white/15 rounded-2xl p-8 text-center transition-colors group"
            style={{ borderColor: 'rgba(16,185,129,0.15)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.15)')
            }
          >
            <Camera className="w-10 h-10 mx-auto mb-3 text-white/40 group-hover:text-emerald-400 transition-colors" />
            <p className="text-white/70 text-sm">Сфотографуй склад продукту</p>
            <p className="text-white/40 text-xs mt-1">
              ШІ перевірить E-добавки та безпечність
            </p>
          </motion.button>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3"
          >
            {/* Фото */}
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={image}
                alt=""
                className="w-full max-h-48 object-cover"
              />
              <button
                onClick={reset}
                className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Loading */}
            {loading && !analysis && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-sm text-white/70">Аналізую склад...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Результат аналізу */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Вердикт */}
                {(() => {
                  const cfg = verdictConfig[analysis.verdict];
                  const Icon = cfg.icon;
                  return (
                    <div className={`rounded-2xl p-4 border ${cfg.bg}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                        <span className={`font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {analysis.verdict_text}
                      </p>
                    </div>
                  );
                })()}

                {/* Небезпечні — ЧЕРВОНИМ */}
                {analysis.dangerous.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                      🚫 Небезпечні ({analysis.dangerous.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.dangerous.map((a, i) => (
                        <div
                          key={i}
                          className="bg-red-500/10 border border-red-400/30 rounded-xl p-3"
                        >
                          <p className="font-semibold text-red-400 underline decoration-red-400/60 decoration-2 underline-offset-2">
                            {a.code} — {a.name}
                          </p>
                          {a.effect && (
                            <p className="text-xs text-white/70 mt-1">
                              Побічні ефекти: {a.effect}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Обережно — ЖОВТИМ */}
                {analysis.caution.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-1.5">
                      ⚡ Ризики ({analysis.caution.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.caution.map((a, i) => (
                        <div
                          key={i}
                          className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-3"
                        >
                          <p className="font-semibold text-yellow-400 underline decoration-yellow-400/60 decoration-2 underline-offset-2">
                            {a.code} — {a.name}
                          </p>
                          {a.risk && (
                            <p className="text-xs text-white/70 mt-1">
                              Ризик: {a.risk}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.safe_count > 0 && (
                  <p className="text-xs text-white/40 text-center">
                    ✅ + {analysis.safe_count} безпечних добавок
                  </p>
                )}

                {/* Кнопки */}
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-1 py-3 rounded-xl font-medium bg-white/5 text-white/80"
                  >
                    Новий скан
                  </button>
                  <button
                    onClick={save}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-white disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    }}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Зберегти (+1 бал)
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}