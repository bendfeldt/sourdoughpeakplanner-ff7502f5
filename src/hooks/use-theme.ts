import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

// Same key the old settings hook used. Only `theme` is read: the old `isDarkMode` was
// overwritten with the device's mode on every visit, so it never meant a user's choice.
const SETTINGS_KEY = 'sourdough-calculator-settings';

type Theme = 'light' | 'dark';

const deviceIsDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

/** The theme the user picked with the moon/sun button, if any. */
function savedTheme(): Theme | null {
  try {
    const theme = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')?.theme;
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    return null;
  }
}

/** Dark or not on first paint: the saved choice, else the device. Called in main.tsx. */
export function initialIsDark(): boolean {
  const theme = savedTheme();
  return theme ? theme === 'dark' : deviceIsDark();
}

function useThemeState() {
  const [choice, setChoice] = useState<Theme | null>(savedTheme);
  const [deviceDark, setDeviceDark] = useState(deviceIsDark);
  const isDark = choice ? choice === 'dark' : deviceDark;

  // Without a choice, follow the device when it switches
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setDeviceDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    const next: Theme = isDark ? 'light' : 'dark';
    setChoice(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: next }));
    } catch {
      // Storage blocked: the choice lasts until reload
    }
  }, [isDark]);

  return { isDark, toggleTheme };
}

const ThemeContext = createContext<ReturnType<typeof useThemeState> | null>(null);

/** One theme for every page, the menu and the pop-ups. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return createElement(ThemeContext.Provider, { value: useThemeState() }, children);
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>');
  return value;
}
