import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { AVAILABLE_LANGUAGES, changeLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (code: string) => void;
}

export const LanguageSelector = ({ currentLanguage, onLanguageChange }: LanguageSelectorProps) => {
  const { t } = useTranslation();

  const handleSelect = (code: string) => {
    changeLanguage(code);
    onLanguageChange(code);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{t('profile.language')}</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {AVAILABLE_LANGUAGES.map((lang, index) => (
          <motion.button
            key={lang.code}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => handleSelect(lang.code)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all",
              currentLanguage === lang.code
                ? "gradient-primary text-primary-foreground glow-primary"
                : "bg-muted/50 hover:bg-muted text-foreground"
            )}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm font-medium flex-1 text-left">{lang.name}</span>
            {currentLanguage === lang.code && (
              <Check className="w-4 h-4" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
