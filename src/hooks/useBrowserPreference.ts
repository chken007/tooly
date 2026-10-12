import { useCallback, useState } from 'react';

export function useBrowserPreference<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
) {
  const [preference, setPreference] = useState<{ value: T; error: string }>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const value: unknown = JSON.parse(stored);
        if (isValid(value)) return { value, error: '' };
        console.warn(`Ignoring invalid browser preference: ${key}`);
      }
      return { value: fallback, error: '' };
    } catch (error) {
      console.warn(`Unable to read browser preference: ${key}`, error);
      return { value: fallback, error: 'Browser preferences could not be loaded.' };
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setPreference({ value, error: '' });
    } catch (error) {
      console.warn(`Unable to save browser preference: ${key}`, error);
      setPreference({ value, error: 'This setting could not be saved in your browser.' });
    }
  }, [key]);

  return [preference.value, setValue, preference.error] as const;
}
