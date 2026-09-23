'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  FlaskConical,
  Coffee,
  Loader2,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type TabType = 'photo' | 'additives' | 'drink' | null;

export function QuickActions({
  userId,
  onAdd,
}: {
  userId: string;
  onAdd: () => void;
}) {
  const [tab, setTab] = useState<TabType>(null);

  return (
    <>
      {/* 3 компактні кнопки */}
      <div className="grid grid-cols-3 gap-2 mb-5 fade-up">
        <ActionButton
          icon={Camera}
          label="Фото"
          color="linear-gradient(135deg, #7c3aed, #a78bfa)"
          active={tab === 'photo'}
          onClick={() => setTab(tab === 'photo' ? null : 'photo')}
        />
        <ActionButton
          icon={FlaskConical}
          label="E-добавки"
          color="linear-gradient(135deg, #10b981, #06b6d4)"
          active={tab === 'additives'}
          onClick={() => setTab(tab === 'additives' ? null : 'additives')}
        />
        <ActionButton
          icon={Coffee}
          label="Напій"
          color="linear-gradient(135deg, #f59e0b, #fb923c)"
          active={tab === 'drink'}
          onClick={() => setTab(tab === 'drink' ? null : 'drink')}
        />
      </div>

      {/* Розгорнутий контент */}
      <AnimatePresence mode="wait">
        {tab === 'photo' && (
          <PhotoTab key="photo" userId={userId} onAdd={onAdd} onClose={() => setTab(null)} />
        )}
        {tab === 'additives' && (
          <AdditivesTab key="additives" userId={userId} onAdd={onAdd} onClose={() => setTab(null)} />
        )}
        {tab === 'drink' && (
          <DrinkTab key="drink" userId={userId} onAdd={onAdd} onClose={() => setTab(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// === Кнопка ===
function ActionButton({
  icon: Icon,
  label,
  color,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all ${
        active ? 'ring-2 ring-white/30' : ''
      }`}
      style={{
        background: active ? color : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Icon
        className="w-5 h-5"
        style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}
      />
      <span
        className="text-[11px] font-medium"
        style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}
      >
        {label}
      </span>
    </motion.button>
  );
}

// === Фото-таб ===
function PhotoTab({
  userId,
  onAdd,
  onClose,
}: {
  userId: string;
  onAdd: () => void;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function compress(file: File, maxSize = 1024): Promise<string> {
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
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    const compressed = await compress(file);
    setPreview(compressed);
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed }),
      });
      const json = await res.json();
      if (json.error)
        throw new Error(
          json.error === 'not_food' ? 'Це не схоже на їжу 🤔' : json.error
        );
      setResult(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addPoint() {
    const { data: cp } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
    if (cp) {
      await supabase
        .from('profiles')
        .update({ points: (cp.points || 0) + 1 })
        .eq('id', userId);
    }
  }

  async function save() {
    if (!result || !preview) return;
    setLoading(true);
    try {
      const blob = await (await fetch(preview)).blob();
      const path = `${userId}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from('meals').upload(path, blob);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('meals').getPublicUrl(path);

      const { error: dbErr } = await supabase.from('meals').insert({
        user_id: userId,
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        fat: result.fat,
        carbs: result.carbs,
        portion: result.portion,
        image_url: urlData.publicUrl,
      });
      if (dbErr) throw dbErr;

      await addPoint();
      onAdd();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass p-4 mb-5 overflow-hidden"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-white/15 rounded-xl p-4 text-center hover:border-purple-400/50 transition"
        >
          <Camera className="w-6 h-6 mx-auto mb-1.5 text-white/40" />
          <p className="text-sm text-white/70">Сфотографуй страву</p>
        </button>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden">
            <img src={preview} alt="" className="w-full max-h-48 object-cover" />
            <button
              onClick={() => {
                setPreview(null);
                setResult(null);
              }}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading && !result && (
            <div className="flex items-center justify-center gap-2 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-xs text-white/60">Аналізую...</span>
            </div>
          )}

          {result && (
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-3 space-y-2">
              <p className="font-medium text-sm">{result.name}</p>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  ['ккал', result.calories],
                  ['Б', `${result.protein}г`],
                  ['Ж', `${result.fat}г`],
                  ['В', `${result.carbs}г`],
                ].map(([l, v]) => (
                  <div key={String(l)} className="bg-white/5 rounded-lg py-1.5">
                    <p className="font-bold text-sm">{v}</p>
                    <p className="text-[10px] text-white/50">{l}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={save}
                disabled={loading}
                className="w-full btn-grad rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Додати (+1 бал)
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-2.5 text-xs text-red-300">
              {error}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// === E-добавки таб ===
function AdditivesTab({
  userId,
  onAdd,
  onClose,
}: {
  userId: string;
  onAdd: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
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
      if (data.error === 'not_label')
        throw new Error('Не видно склад. Спробуй ближче.');
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addPoint() {
    const { data: cp } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
    if (cp) {
      await supabase
        .from('profiles')
        .update({ points: (cp.points || 0) + 1 })
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
      onAdd();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const verdictCfg = {
    safe: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/30', icon: ShieldCheck, label: '✅ Безпечно' },
    caution: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-400/30', icon: AlertTriangle, label: '⚡ Ризики' },
    danger: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-400/30', icon: ShieldAlert, label: '🚫 Небезпечно' },
  } as any;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass p-4 mb-5 overflow-hidden"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {!image ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed rounded-xl p-4 text-center transition"
          style={{ borderColor: 'rgba(16,185,129,0.25)' }}
        >
          <FlaskConical className="w-6 h-6 mx-auto mb-1.5 text-emerald-400/60" />
          <p className="text-sm text-white/70">Сфотографуй склад продукту</p>
        </button>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden">
            <img src={image} alt="" className="w-full max-h-40 object-cover" />
            <button
              onClick={() => {
                setImage(null);
                setAnalysis(null);
              }}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading && !analysis && (
            <div className="flex items-center justify-center gap-2 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span className="text-xs text-white/60">Аналізую склад...</span>
            </div>
          )}

          {analysis && (
            <div className="space-y-2">
              {(() => {
                const cfg = verdictCfg[analysis.verdict];
                const Icon = cfg.icon;
                return (
                  <div className={`rounded-xl p-3 border ${cfg.bg}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-sm font-semibold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {analysis.verdict_text}
                    </p>
                  </div>
                );
              })()}

              {analysis.dangerous.length > 0 && (
                <div className="space-y-1.5">
                  {analysis.dangerous.map((a: any, i: number) => (
                    <div
                      key={i}
                      className="bg-red-500/10 border border-red-400/30 rounded-lg p-2"
                    >
                      <p className="text-xs font-semibold text-red-400 underline decoration-red-400/60 underline-offset-2">
                        {a.code} — {a.name}
                      </p>
                      {a.effect && (
                        <p className="text-[10px] text-white/60 mt-0.5">
                          {a.effect}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {analysis.caution.length > 0 && (
                <div className="space-y-1.5">
                  {analysis.caution.map((a: any, i: number) => (
                    <div
                      key={i}
                      className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-2"
                    >
                      <p className="text-xs font-semibold text-yellow-400 underline decoration-yellow-400/60 underline-offset-2">
                        {a.code} — {a.name}
                      </p>
                      {a.risk && (
                        <p className="text-[10px] text-white/60 mt-0.5">
                          {a.risk}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={save}
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 text-white"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                }}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Зберегти (+1 бал)
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-2.5 text-xs text-red-300">
              {error}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// === Напій таб ===
function DrinkTab({
  userId,
  onAdd,
  onClose,
}: {
  userId: string;
  onAdd: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/drink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (data.error)
        throw new Error(data.error === 'unknown' ? 'Не розпізнав' : data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addPoint() {
    const { data: cp } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
    if (cp) {
      await supabase
        .from('profiles')
        .update({ points: (cp.points || 0) + 1 })
        .eq('id', userId);
    }
  }

  async function save() {
    if (!result) return;
    setLoading(true);
    try {
      await supabase.from('meals').insert({
        user_id: userId,
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        fat: result.fat,
        carbs: result.carbs,
        portion: result.portion,
        sugar: result.sugar,
        is_drink: true,
        volume_ml: result.volume_ml,
      });
      await addPoint();
      onAdd();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass p-4 mb-5 overflow-hidden"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Наприклад: "кола 0.5л"'
          className="flex-1 rounded-xl px-3 py-2.5 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && analyze()}
          autoFocus
        />
        <button
          onClick={analyze}
          disabled={loading || !text.trim()}
          className="px-4 rounded-xl text-sm font-medium disabled:opacity-50 text-white"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #fb923c)',
          }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
        </button>
      </div>

      {result && (
        <div className="mt-3 bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 space-y-2">
          <p className="font-medium text-sm">{result.name}</p>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              ['ккал', result.calories],
              ['Б', `${result.protein}г`],
              ['В', `${result.carbs}г`],
              ['Цукор', `${result.sugar}г`],
            ].map(([l, v]) => (
              <div key={String(l)} className="bg-white/5 rounded-lg py-1.5">
                <p className="font-bold text-sm">{v}</p>
                <p className="text-[10px] text-white/50">{l}</p>
              </div>
            ))}
          </div>
          <button
            onClick={save}
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 text-white"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #fb923c)',
            }}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Додати (+1 бал)
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 bg-red-500/10 border border-red-400/30 rounded-xl p-2.5 text-xs text-red-300">
          {error}
        </div>
      )}
    </motion.div>
  );
}