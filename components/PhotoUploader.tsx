'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Sparkles, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function PhotoUploader({
  userId,
  onAdd,
}: {
  userId: string;
  onAdd: () => void;
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

  // 🏆 Додає +1 бал користувачу
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
    if (!result || !preview) return;
    setLoading(true);
    try {
      // 1. Завантажуємо фото в Storage
      const blob = await (await fetch(preview)).blob();
      const path = `${userId}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('meals')
        .upload(path, blob);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from('meals')
        .getPublicUrl(path);

      // 2. Вставляємо страву в БД
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

      // 3. Нараховуємо +1 бал
      await addPoint();

      // 4. Скидаємо форму
      setPreview(null);
      setResult(null);
      if (inputRef.current) inputRef.current.value = '';
      onAdd();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass p-6 fade-up">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" /> Додати страву
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
        {!preview ? (
          <motion.button
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-purple-400/50 transition-colors group"
          >
            <Camera className="w-10 h-10 mx-auto mb-3 text-white/40 group-hover:text-purple-400 transition-colors" />
            <p className="text-white/70 text-sm">
              Сфотографуй або завантаж фото
            </p>
            <p className="text-white/40 text-xs mt-1">
              ШІ розпізнає страву та калорії
            </p>
          </motion.button>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3"
          >
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={preview}
                alt=""
                className="w-full max-h-64 object-cover"
              />
              <button
                onClick={() => {
                  setPreview(null);
                  setResult(null);
                }}
                className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading && !result && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <span className="text-sm text-white/70">ШІ аналізує...</span>
              </div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-4 space-y-3"
              >
                <div>
                  <p className="text-xs text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Розпізнано
                  </p>
                  <p className="font-semibold text-lg">{result.name}</p>
                  {result.portion && (
                    <p className="text-white/50 text-xs">{result.portion}</p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ['ккал', result.calories],
                    ['Б', `${result.protein}г`],
                    ['Ж', `${result.fat}г`],
                    ['В', `${result.carbs}г`],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="bg-white/5 rounded-xl py-2">
                      <p className="font-bold">{v}</p>
                      <p className="text-xs text-white/50">{l}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={save}
                  disabled={loading}
                  className="w-full btn-grad rounded-xl py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Додати в щоденник (+1 бал)
                </button>
              </motion.div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}