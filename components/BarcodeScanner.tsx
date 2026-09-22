'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { Scan, X, Loader2, Check, Camera, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ProductData = {
  name: string;
  brand: string;
  barcode: string;
  image_url: string;
  serving_size: string;
  serving_grams: number;
  per_100g: any;
  per_serving: any;
};

export function BarcodeScanner({
  userId,
  onAdd,
}: {
  userId: string;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [portionGrams, setPortionGrams] = useState('100');
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);

  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch {}
      controlsRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopScanning();
      setProduct(null);
      setError(null);
      setManualCode('');
    }
  }, [open, stopScanning]);

  async function fetchProduct(barcode: string) {
    setLoading(true);
    setError(null);
    stopScanning();

    try {
      const res = await fetch('/api/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      });
      const data = await res.json();

      if (data.error === 'product_not_found') {
        setError('Продукт не знайдено. Спробуй інший або введи калорії вручну.');
        return;
      }
      if (data.error) throw new Error(data.error);

      setProduct(data);
      setPortionGrams(String(data.serving_grams || 100));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function startScanning() {
    setError(null);
    setProduct(null);
    setScanning(true);

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
      ]);

      const reader = new BrowserMultiFormatReader(hints);
      readerRef.current = reader;

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result, err) => {
          if (result) {
            const code = result.getText();
            console.log('Scanned:', code);
            fetchProduct(code);
          }
        }
      );
      controlsRef.current = controls;
    } catch (e: any) {
      setError('Не вдалось відкрити камеру. Дозволь доступ або введи штрих-код вручну.');
      setScanning(false);
    }
  }

  async function save() {
    if (!product) return;
    setLoading(true);

    try {
      const grams = parseFloat(portionGrams) || product.serving_grams;
      const ratio = grams / 100;

      const cal = Math.round(product.per_100g.calories * ratio);
      const prot = Math.round(product.per_100g.protein * ratio * 10) / 10;
      const fat = Math.round(product.per_100g.fat * ratio * 10) / 10;
      const carbs = Math.round(product.per_100g.carbs * ratio * 10) / 10;
      const sugar = Math.round((product.per_100g.sugar || 0) * ratio * 10) / 10;

      const fullName = product.brand
        ? `${product.name} (${product.brand})`
        : product.name;

      const { error: dbErr } = await supabase.from('meals').insert({
        user_id: userId,
        name: fullName,
        calories: cal,
        protein: prot,
        fat,
        carbs,
        sugar,
        portion: `${grams} г`,
        image_url: product.image_url || null,
      });

      if (dbErr) throw dbErr;

      onAdd();
      setOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Кнопка вгорі справа (додається в dashboard) */}
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setOpen(true)}
        className="glass p-2.5 rounded-full hover:bg-white/10 transition"
        title="Сканер штрих-коду"
      >
        <Scan className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/70 z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-x-2 top-4 bottom-24 z-50 glass flex flex-col overflow-hidden shadow-2xl"
              style={{ borderRadius: 24 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Scan className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="font-semibold">Сканер штрих-коду</p>
                    <p className="text-xs opacity-40">Спрямуй камеру на EAN/UPC</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Відео */}
                {!product && (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full rounded-2xl bg-black aspect-video object-cover"
                      playsInline
                      muted
                    />
                    {!scanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl gap-3">
                        <Camera className="w-10 h-10 opacity-50" />
                        <button
                          onClick={startScanning}
                          className="btn-grad px-6 py-3 rounded-xl font-medium"
                        >
                          Запустити камеру
                        </button>
                      </div>
                    )}
                    {scanning && (
                      <div className="absolute inset-x-8 inset-y-1/3 border-2 border-purple-400 rounded-xl pointer-events-none">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ручний ввід */}
                {!product && !scanning && (
                  <div className="space-y-2">
                    <p className="text-xs opacity-50 text-center">або введи штрих-код вручну</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Наприклад: 4820012345678"
                        className="flex-1 rounded-xl px-4 py-3"
                      />
                      <button
                        onClick={() => manualCode && fetchProduct(manualCode)}
                        disabled={!manualCode || loading}
                        className="btn-grad rounded-xl px-4 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Знайти'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                    <span className="opacity-70">Шукаю продукт...</span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-sm text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}

                {/* Product found */}
                {product && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex gap-3">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-20 h-20 rounded-xl object-cover bg-white/5"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{product.name}</p>
                        {product.brand && (
                          <p className="text-xs opacity-50">{product.brand}</p>
                        )}
                        <p className="text-xs opacity-40 mt-1">
                          {product.barcode}
                        </p>
                      </div>
                    </div>

                    {/* Порція */}
                    <div>
                      <label className="text-xs opacity-60 mb-2 block">Порція (грам)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={portionGrams}
                          onChange={(e) => setPortionGrams(e.target.value.replace(/[^0-9]/g, ''))}
                          className="flex-1 rounded-xl px-4 py-3"
                        />
                        {[50, 100, 200, 250].map((g) => (
                          <button
                            key={g}
                            onClick={() => setPortionGrams(String(g))}
                            className={`px-3 rounded-xl text-sm ${
                              portionGrams === String(g) ? 'btn-grad' : 'glass'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Розрахунок на обрану порцію */}
                    {(() => {
                      const g = parseFloat(portionGrams) || 100;
                      const ratio = g / 100;
                      return (
                        <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-4">
                          <p className="text-xs text-purple-300 mb-3">На {g} г</p>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {[
                              ['ккал', Math.round(product.per_100g.calories * ratio)],
                              ['Б', `${Math.round(product.per_100g.protein * ratio * 10) / 10}г`],
                              ['Ж', `${Math.round(product.per_100g.fat * ratio * 10) / 10}г`],
                              ['В', `${Math.round(product.per_100g.carbs * ratio * 10) / 10}г`],
                            ].map(([l, v]) => (
                              <div key={String(l)} className="bg-white/5 rounded-xl py-2">
                                <p className="font-bold">{v}</p>
                                <p className="text-xs opacity-50">{l}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Кнопки */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setProduct(null);
                          setError(null);
                          setManualCode('');
                        }}
                        className="glass flex-1 py-3 rounded-xl font-medium"
                      >
                        Сканувати ще
                      </button>
                      <button
                        onClick={save}
                        disabled={loading}
                        className="btn-grad flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Додати
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}