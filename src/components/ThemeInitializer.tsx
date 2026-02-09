import { useEffect } from 'react';

/**
 * Component that initializes the theme on app load
 * Reads from localStorage and applies the saved theme/night-shift settings
 */
export const ThemeInitializer = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('neo-theme') || 'system';
    const nightShift = localStorage.getItem('neo-night-shift') === 'true';
    const root = document.documentElement;

    // Apply dark mode
    root.classList.remove('dark');
    if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      }
    }

    // Apply night shift
    if (nightShift) {
      root.classList.add('night-shift');
    } else {
      root.classList.remove('night-shift');
    }
  }, []);

  return null;
};
