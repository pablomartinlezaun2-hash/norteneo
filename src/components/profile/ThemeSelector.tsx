import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system' | 'night-shift';

interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const ThemeSelector = ({ currentTheme, onThemeChange }: ThemeSelectorProps) => {
  const { t } = useTranslation();

  const themes: { mode: ThemeMode; icon: typeof Sun; label: string; color?: string }[] = [
    { mode: 'light', icon: Sun, label: t('profile.light') },
    { mode: 'dark', icon: Moon, label: t('profile.dark') },
    { mode: 'night-shift', icon: Sunset, label: t('profile.nightShift'), color: 'text-orange-400' },
    { mode: 'system', icon: Monitor, label: t('profile.system') },
  ];

  const applyTheme = (mode: ThemeMode) => {
    onThemeChange(mode);
    
    // Remove all theme classes
    document.documentElement.classList.remove('dark', 'night-shift');
    
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'night-shift') {
      document.documentElement.classList.add('night-shift');
      // Apply warm filter for Night Shift
      document.documentElement.style.setProperty('--night-shift-filter', 'sepia(20%) saturate(110%)');
    } else if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
    
    if (mode !== 'night-shift') {
      document.documentElement.style.removeProperty('--night-shift-filter');
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {t('profile.appearance')}
      </h3>
      
      <div className="grid grid-cols-4 gap-2">
        {themes.map(({ mode, icon: Icon, label, color }) => (
          <motion.button
            key={mode}
            onClick={() => applyTheme(mode)}
            className={cn(
              "flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all",
              currentTheme === mode
                ? "gradient-primary text-primary-foreground glow-primary"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className={cn("w-5 h-5", currentTheme !== mode && color)} />
            <span className="text-[10px] font-medium">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
