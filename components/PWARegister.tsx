'use client';
import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('✅ PWA registered:', reg.scope))
      .catch((err) => console.error('❌ PWA error:', err));
  }, []);

  return null;
}