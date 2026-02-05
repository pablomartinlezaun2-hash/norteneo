import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Integration } from '@/hooks/useUserSettings';
import { cn } from '@/lib/utils';

interface IntegrationsSectionProps {
  integrations: Integration[];
  onToggle: (id: string) => void;
}

export const IntegrationsSection = ({ integrations, onToggle }: IntegrationsSectionProps) => {
  const { t } = useTranslation();

  const getIntegrationIcon = (id: string) => {
    switch (id) {
      case 'strava':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#FC4C02] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
          </div>
        );
      case 'apple-health':
        return (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-pink-500 to-red-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Link2 className="w-5 h-5 text-muted-foreground" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{t('profile.integrations')}</h3>
      </div>

      <div className="space-y-3">
        {integrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="gradient-card rounded-xl p-4 border border-border flex items-center gap-3"
          >
            {getIntegrationIcon(integration.id)}
            
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{integration.name}</h4>
              <p className="text-xs text-muted-foreground">
                {integration.connected 
                  ? t('integrations.connected')
                  : t('integrations.notConnected')
                }
              </p>
            </div>

            <Button
              variant={integration.connected ? 'outline' : 'default'}
              size="sm"
              onClick={() => onToggle(integration.id)}
              className={cn(
                integration.connected 
                  ? 'text-destructive border-destructive/20 hover:bg-destructive/10'
                  : 'gradient-primary text-primary-foreground'
              )}
            >
              {integration.connected ? (
                <>
                  <X className="w-4 h-4 mr-1" />
                  {t('integrations.disconnect')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  {t('integrations.connect')}
                </>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
