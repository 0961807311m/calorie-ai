'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export function UpdateBanner() {
  const [show, setShow] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Якщо вже є новий SW в очікуванні
      if (reg.waiting) {
        setShow(true);
      }

      // Слухаємо оновлення
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShow(true);
          }
        });
      });
    });

    // Слухаємо оновлення від SW
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  function update() {
    if (!registration || !registration.waiting) {
      window.location.reload();
      return;
    }
    registration.waiting.postMessage('SKIP_WAITING');
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] glass px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-[calc(100vw-2rem)]"
          style={{ border: '1px solid rgba(167,139,250,0.4)' }}
        >
          <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">✨ Доступне оновлення</p>
            <p className="text-xs opacity-60">Нова версія готова до завантаження</p>
          </div>
          <button
            onClick={update}
            className="btn-grad px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Оновити
          </button>
          <button
            onClick={() => setShow(false)}
            className="p-1.5 opacity-50 hover:opacity-100 transition flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}