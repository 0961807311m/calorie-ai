'use client';
import { useEffect } from 'react';
import { applyTheme, getStoredTheme } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const theme = getStoredTheme();
    applyTheme(theme);
  }, []);

  return <>{children}</>;
}