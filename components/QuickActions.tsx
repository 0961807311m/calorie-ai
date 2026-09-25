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
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { tapLight, notifySuccess, notifyError } from '@/lib/haptics';
import { useToast } from '@/lib/useToast';

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
      <div className="grid grid-cols-3 gap-2.5 mb-5 fade-up">
        <ActionButton
          icon={Camera}
          label="Фото"
          gradient="linear-gradient(135deg, #7c3aed, #ec4899)"
          color="rgba(124,58,237,0.3)"
          active={tab === 'photo'}
          onClick={() => setTab(tab === 'photo' ? null : 'photo')}
        />
        <ActionButton
          icon={FlaskConical}
          label="E-добавки"
          gradient="linear-gradient(135deg, #10b981, #06b6d4)"
          color="rgba(16,185,129,0.3)"
          active={tab === 'additives'}
          onClick={() => setTab(tab === 'additives' ? null : 'additives')}
        />
        <ActionButton
          icon={Coffee}
          label="Напій"
          gradient="linear-gradient(135deg, #f59e0b, #fb923c)"
          color="rgba(245,158,11,0.3)"
          active={tab === 'drink'}
          onClick={() => setTab(tab === 'drink' ? null : 'drink')}
        />
      </div>

      <AnimatePresence mode="wait">
        {tab === 'photo' && (
          <PhotoTab
            key="photo"
            userId={userId}
            onAdd={onAdd}
            onClose={() => setTab(null)}
          />
        )}
        {tab === 'additives' && (
          <AdditivesTab
            key="additives"
            userId={userId}
            onAdd={onAdd}
            onClose={() => setTab(null)}
          />
        )}
        {tab === 'drink' && (
          <DrinkTab
            key="drink"
            userId={userId}
            onAdd={onAdd}
            onClose={() => setTab(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ActionButton({
  icon: Icon,
  label,
  gradient,
  color,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  gradient: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        tapLight();
        onClick();
      }}
      className="relative rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all overflow-hidden"
      style={{
        background: active ? gradient : 'rgba(255,255,255,0.06)',
        border: active
          ? '1px solid rgba(255,255,255,0.4)'
          : '1px solid rgba(255,255,255,0.12)',
        boxShadow: active
          ? '0 8px 24px rgba(0,0,0,0.3)'
          : `0 0 15px ${color}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: active ? 'rgba(255,255,255,0.25)' : gradient,
          boxShadow: active ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
        }}
      >
        <Icon
          className="w-5 h-5 text-white"
          style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
        />
      </div>

      <span
        className="text-[11px] font-semibold tracking-wide"
        style={{
          color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {label}
      </span>

      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.25), transparent 70%)',
          }}
        />
      )}
    </motion.button>
  );
}

// === Фото ===
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
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

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
    setResult(null);
    const compressed = await compress(file);
    setPreview(compressed);
    setLoading(true);
    const toastId = toast.loading('Аналізую страву...');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed }),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(
          json.error === 'not_food' ? 'Це не схоже на їжу 🤔' : json.error
        );
      }
      setResult(json);
      toast.hide(toastId);
      toast.success('Розпізнано! 🎉');
      await notifySuccess();
    } catch (err: any) {
      toast.hide(toastId);
      toast.error(err.message);
      await notifyError();
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
      const { error: upErr } = await supabase.storage
        .from('meals')
        .upload(path, blob);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from('meals')
        .getPublicUrl(path);

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
      toast.success(`"${result.name}" додано! +1 бал`);
      await notifySuccess();
      onAdd();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
      await notifyError();
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
          className="w-full border-2 border-dashed rounded-xl p-5 text-center transition"
          style={{ borderColor: 'rgba(124,58,237,0.3)' }}
        >
          <Camera className="w-7 h-7 mx-auto mb-2 text-purple-300" />
          <p className="text-sm text-white/80 font-medium">
            Сфотографуй страву
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            ШІ розпізнає калорії та БЖВ
          </p>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={preview}
              alt=""
              className="w-full max-h-48 object-cover"
            />
            <button
              onClick={() => {
                setPreview(null);
                setResult(null);
              }}
              className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-1.5"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {loading && !result && (
            <div className="flex items-center justify-center gap-2 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-xs text-white/60">Аналізую страву...</span>
            </div>
          )}

          {result && (
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-3 space-y-3">
              <div>
                <p className="font-semibold text-sm text-white">
                  {result.name}
                </p>
                {result.portion && (
                  <p className="text-[10px] text-white/50">
                    {result.portion}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  ['ккал', result.calories],
                  ['Б', `${result.protein}г`],
                  ['Ж', `${result.fat}г`],
                  ['В', `${result.carbs}г`],
                ].map(([l, v]) => (
                  <div
                    key={String(l)}
                    className="bg-white/5 rounded-lg py-1.5"
                  >
                    <p className="font-bold text-sm text-white">{v}</p>
                    <p className="text-[10px] text-white/50">{l}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={save}
                disabled={loading}
                className="w-full btn-grad rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 text-white"
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
        </div>
      )}
    </motion.div>
  );
}

// === E-добавки ===
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
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

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
    setAnalysis(null);
    const compressed = await compress(file);
    setImage(compressed);
    setLoading(true);
    const toastId = toast.loading('Аналізую склад...');

    try {
      const res = await fetch('/api/additives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed }),
      });
      const data = await res.json();
      if (data.error === 'not_label') {
        throw new Error('Не видно склад. Спробуй ближче.');
      }
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      toast.hide(toastId);
      if (data.verdict === 'danger') {
        toast.error('Знайдено небезпечні добавки!');
      } else if (data.verdict === 'caution') {
        toast.info('Є ризики — перевір деталі');
      } else {
        toast.success('Продукт безпечний ✅');
      }
      await notifySuccess();
    } catch (e: any) {
      toast.hide(toastId);
      toast.error(e.message);
      await notifyError();
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
      toast.success('Збережено! +1 бал');
      await notifySuccess();
      onAdd();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
      await notifyError();
    } finally {
      setLoading(false);
    }
  }

  const verdictCfg = {
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
      label: '⚡ Ризики',
    },
    danger: {
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-400/30',
      icon: ShieldAlert,
      label: '🚫 Небезпечно',
    },
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
          className="w-full border-2 border-dashed rounded-xl p-5 text-center transition"
          style={{ borderColor: 'rgba(16,185,129,0.3)' }}
        >
          <FlaskConical className="w-7 h-7 mx-auto mb-2 text-emerald-300" />
          <p className="text-sm text-white/80 font-medium">
            Сфотографуй склад продукту
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            ШІ перевірить E-добавки та безпечність
          </p>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={image}
              alt=""
              className="w-full max-h-40 object-cover"
            />
            <button
              onClick={() => {
                setImage(null);
                setAnalysis(null);
              }}
              className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-1.5"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {loading && !analysis && (
            <div className="flex items-center justify-center gap-2 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span className="text-xs text-white/60">Аналізую склад...</span>
            </div>
          )}

          {analysis && (
            <div className="space-y-2.5">
              {(() => {
                const cfg = verdictCfg[analysis.verdict];
                const Icon = cfg.icon;
                return (
                  <div className={`rounded-xl p-3 border ${cfg.bg}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-sm font-semibold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/85 leading-relaxed">
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
                      className="bg-red-500/10 border border-red-400/30 rounded-lg p-2.5"
                    >
                      <p className="text-xs font-semibold text-red-400 underline decoration-red-400/60 decoration-2 underline-offset-2">
                        {a.code} — {a.name}
                      </p>
                      {a.effect && (
                        <p className="text-[10px] text-white/65 mt-1">
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
                      className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-2.5"
                    >
                      <p className="text-xs font-semibold text-yellow-400 underline decoration-yellow-400/60 decoration-2 underline-offset-2">
                        {a.code} — {a.name}
                      </p>
                      {a.risk && (
                        <p className="text-[10px] text-white/65 mt-1">
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
        </div>
      )}
    </motion.div>
  );
}

// === Напій ===
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
  const toast = useToast();

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    const toastId = toast.loading('Аналізую напій...');

    try {
      const res = await fetch('/api/drink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(
          data.error === 'unknown' ? 'Не розпізнав напій' : data.error
        );
      }
      setResult(data);
      toast.hide(toastId);
      toast.success('Розпізнано! 🥤');
      await notifySuccess();
    } catch (e: any) {
      toast.hide(toastId);
      toast.error(e.message);
      await notifyError();
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
      toast.success(`"${result.name}" додано! +1 бал`);
      await notifySuccess();
      onAdd();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
      await notifyError();
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
          placeholder='Наприклад: "кола 0.5л", "кава з молоком"'
          className="flex-1 rounded-xl px-3 py-2.5 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && analyze()}
          autoFocus
        />
        <button
          onClick={analyze}
          disabled={loading || !text.trim()}
          className="px-4 rounded-xl text-sm font-semibold disabled:opacity-50 text-white"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #fb923c)',
          }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
        </button>
      </div>

      {result && (
        <div className="mt-3 bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 space-y-3">
          <div>
            <p className="font-semibold text-sm text-white">{result.name}</p>
            {result.portion && (
              <p className="text-[10px] text-white/50">{result.portion}</p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              ['ккал', result.calories],
              ['Б', `${result.protein}г`],
              ['В', `${result.carbs}г`],
              ['Цукор', `${result.sugar}г`],
            ].map(([l, v]) => (
              <div key={String(l)} className="bg-white/5 rounded-lg py-1.5">
                <p className="font-bold text-sm text-white">{v}</p>
                <p className="text-[10px] text-white/50">{l}</p>
              </div>
            ))}
          </div>
          <button
            onClick={save}
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 text-white disabled:opacity-50"
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
    </motion.div>
  );
}