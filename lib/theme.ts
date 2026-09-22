export type Theme = 'dark' | 'light';

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('theme-light');
  } else {
    root.classList.remove('theme-light');
  }
  localStorage.setItem('calorieai-theme', theme);
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('calorieai-theme') as Theme) || 'dark';
}