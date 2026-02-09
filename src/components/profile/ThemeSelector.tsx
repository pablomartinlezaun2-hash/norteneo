import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, ThemeMode } from '@/hooks/useTheme';

export const ThemeSelector = () => {
  const { t } = useTranslation();
  const { theme, nightShift, setTheme, toggleNightShift } = useTheme();

  const themes: { mode: ThemeMode | 'night-shift-toggle'; icon: typeof Sun; label: string; color?: string }[] = [
    { mode: 'light', icon: Sun, label: t('profile.light') },
    { mode: 'dark', icon: Moon, label: t('profile.dark') },
    { mode: 'night-shift-toggle', icon: Sunset, label: t('profile.nightShift'), color: 'text-orange-400' },
    { mode: 'system', icon: Monitor, label: t('profile.system') },
  ];

  const handleThemeClick = (mode: ThemeMode | 'night-shift-toggle') => {
    if (mode === 'night-shift-toggle') {
      toggleNightShift();
    } else {
      setTheme(mode);
    }
  };

  const isActive = (mode: ThemeMode | 'night-shift-toggle') => {
    if (mode === 'night-shift-toggle') {
      return nightShift;
    }
    return theme === mode && !nightShift;
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
            onClick={() => handleThemeClick(mode)}
            className={cn(
              "flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all",
              isActive(mode)
                ? "gradient-primary text-primary-foreground glow-primary"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className={cn("w-5 h-5", !isActive(mode) && color)} />
            <span className="text-[10px] font-medium">{label}</span>
          </motion.button>
        ))}
      </div>

      {nightShift && (
        <p className="text-xs text-muted-foreground text-center">
          Night Shift activo - Reducción de luz azul
        </p>
      )}
    </div>
  );
};
