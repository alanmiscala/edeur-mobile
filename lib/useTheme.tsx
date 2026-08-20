import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getThemeColors, type ThemeColors, type ThemeMode } from './theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = 'erms_theme_mode_v1';

function loadMode(): ThemeMode {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(THEME_KEY);
      if (raw === 'light' || raw === 'dark') return raw;
    }
  } catch { /* ignore */ }
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadMode);
  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, m); } catch { /* ignore */ }
  };
  const toggle = () => setMode(mode === 'light' ? 'dark' : 'light');
  useEffect(() => {
    try { if (typeof document !== 'undefined') document.body.style.backgroundColor = mode === 'dark' ? '#0f172a' : '#f8fafc'; } catch { /* ignore */ }
  }, [mode]);
  const colors = getThemeColors(mode);
  return <ThemeContext.Provider value={{ mode, colors, toggle, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
