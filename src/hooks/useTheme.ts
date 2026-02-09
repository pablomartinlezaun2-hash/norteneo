import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system' | 'night-shift';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('neo-theme') as ThemeMode) || 'system';
    }
    return 'system';
  });

  const [nightShift, setNightShift] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('neo-night-shift') === 'true';
    }
    return false;
  });

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    
    // Remove dark class first
    root.classList.remove('dark');
    
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      }
    }
  }, []);

  const applyNightShift = useCallback((enabled: boolean) => {
    const root = document.documentElement;
    
    if (enabled) {
      root.classList.add('night-shift');
    } else {
      root.classList.remove('night-shift');
    }
  }, []);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('neo-theme', theme);
  }, [theme, applyTheme]);

  // Apply night shift on mount and when it changes
  useEffect(() => {
    applyNightShift(nightShift);
    localStorage.setItem('neo-night-shift', nightShift.toString());
  }, [nightShift, applyNightShift]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    // If selecting night-shift mode, enable night shift filter and keep current dark/light
    if (mode === 'night-shift') {
      setNightShift(true);
    } else {
      // If selecting any other mode, apply it and disable night shift
      setNightShift(false);
      setTheme(mode);
    }
  }, []);

  const toggleNightShift = useCallback(() => {
    setNightShift(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      return 'dark';
    });
  }, []);

  const isDark = theme === 'dark' || 
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return {
    theme,
    nightShift,
    isDark,
    setTheme: setThemeMode,
    toggleNightShift,
    toggleDarkMode,
  };
};
