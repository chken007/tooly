import { useEffect } from 'react';
import { useBrowserPreference } from './useBrowserPreference';

type Theme = 'auto' | 'light' | 'dark';
export const isTheme = (value: unknown): value is Theme =>
  value === 'auto' || value === 'light' || value === 'dark';

export function useTheme() {
  const [theme, setTheme, error] = useBrowserPreference<Theme>('tooly.theme', 'auto', isTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const dark = theme === 'dark' || (theme === 'auto' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  return { theme, setTheme, error };
}
