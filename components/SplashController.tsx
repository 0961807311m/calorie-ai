'use client';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function SplashController() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let hidden = false;

    async function hideSplash() {
      if (hidden) return;
      hidden = true;
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch (e) {
        console.error('Splash hide error:', e);
      }
    }

    // Якщо сторінка вже завантажена — ховаємо одразу
    if (document.readyState === 'complete') {
      hideSplash();
      return;
    }

    // Інакше — чекаємо на load
    const onLoad = () => hideSplash();
    window.addEventListener('load', onLoad);

    // Fallback: максимум 8 секунд
    const timeout = setTimeout(hideSplash, 8000);

    return () => {
      window.removeEventListener('load', onLoad);
      clearTimeout(timeout);
    };
  }, []);

  return null;
}