import { useState, useEffect, useCallback } from 'react';
import { getJSON, setJSON } from '../lib/storage';
import { STORAGE_KEYS, type Theme } from '../lib/constants';

type ThemeMode = Theme | 'system';

const THEME_KEY = STORAGE_KEYS.THEME;

// Check if dark matches system preference
function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(mode: ThemeMode) {
  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
  const theme: Theme = isDark ? 'dark' : 'naranja';

  document.documentElement.setAttribute('data-theme', theme === 'naranja' ? '' : theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#0A0A0A' : '#FFFFFF');
  }
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() =>
    getJSON<ThemeMode>(THEME_KEY, 'naranja'),
  );

  // Apply on mount and when mode changes
  useEffect(() => {
    applyTheme(mode);
    setJSON(THEME_KEY, mode);
  }, [mode]);

  // Listen to OS dark/light changes when mode is 'system'
  useEffect(() => {
    if (mode !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);

  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark());

  return { mode, setMode, isDark } as const;
}
