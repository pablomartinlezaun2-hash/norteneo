import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { supabase } from '@/integrations/supabase/client';
import { User, LogOut, ChevronRight, Bell, Scale, Heart, Crown, Trash2, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ThemeSelector } from './ThemeSelector';
import { LanguageSelector } from './LanguageSelector';
import { HealthProfileForm } from './HealthProfileForm';
import { SubscriptionCard } from './SubscriptionCard';
import { IntegrationsSection } from './IntegrationsSection';
import { DataExportSection } from './DataExportSection';
import { SupportSection } from './SupportSection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { NeoProfileSummary } from './NeoProfileSummary';
import { VB2FollowUpSection } from './VB2FollowUpSection';
import { VB2ActivationCTA } from './VB2ActivationCTA';
import { AthleteChatSection } from '@/components/coach/AthleteChatSection';

type ProfileView = 'main' | 'subscription' | 'language' | 'health' | 'integrations' | 'privacy';

interface ProfileSectionProps {
  onRestartTour?: () => void;
}

export const ProfileSection = ({ onRestartTour }: ProfileSectionProps) => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { healthProfile, preferences, subscription, integrations, saveHealthProfile, savePreferences, setSubscriptionType, toggleIntegration, isPro } = useUserSettings();
  const [currentView, setCurrentView] = useState<ProfileView>('main');
  const [notificationsEnabled, setNotificationsEnabled] = useState(preferences.notifications);
  const [deleting, setDeleting] = useState(false);

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    savePreferences({ notifications: enabled });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No se pudo verificar tu sesión');
        return;
      }

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        const message = typeof error.message === 'string' ? error.message : '';
        const alreadyDeleted = message.includes('Invalid user') || message.includes('401');

        if (alreadyDeleted) {
          await supabase.auth.signOut({ scope: 'local' });
          toast.success('Tu cuenta ya había sido eliminada');
          navigate('/auth', { replace: true });
          return;
        }

        throw error;
      }

      toast.success('Tu cuenta ha sido eliminada');
      await supabase.auth.signOut({ scope: 'local' });
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error('Error al eliminar la cuenta. Inténtalo de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'subscription':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-2 text-body">
              ← {t('common.back')}
            </Button>
            <SubscriptionCard currentSubscription={subscription} onSubscribe={setSubscriptionType} />
          </div>
        );
      case 'language':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-2 text-body">
              ← {t('common.back')}
            </Button>
            <LanguageSelector currentLanguage={preferences.language} onLanguageChange={(lang) => savePreferences({ language: lang })} />
          </div>
        );
      case 'health':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-2 text-body">
              ← {t('common.back')}
            </Button>
            <HealthProfileForm profile={healthProfile} onSave={saveHealthProfile} />
          </div>
        );
      case 'integrations':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-2 text-body">
              ← {t('common.back')}
            </Button>
            <IntegrationsSection integrations={integrations} onToggle={toggleIntegration} />
          </div>
        );
      default:
        return renderMainView();
    }
  };

  const renderMainView = () => (
    <div className="space-y-6">
      {/* User Card */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="neo-surface p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center">
            <User className="w-6 h-6 text-background" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-title text-foreground truncate">{user?.email?.split('@')[0] || 'Usuario'}</p>
              {subscription.type !== 'free' && (
                <span className="px-2 py-0.5 rounded-full text-overline font-semibold bg-foreground text-background">
                  {subscription.type.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-caption text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* NEO Profile Summary */}
      <NeoProfileSummary />

      {/* VB2 Follow-up or Activation CTA */}
      <VB2FollowUpSection />
      <VB2ActivationCTA />

      {/* Coach Chat */}
      <AthleteChatSection />

      {/* Subscription */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <button onClick={() => setCurrentView('subscription')} className="w-full flex items-center gap-3 px-4 py-3.5 neo-surface hover:bg-muted/30 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
            <Crown className="w-4 h-4 text-background" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-body font-medium text-foreground">{t('profile.manageSubscription')}</p>
            <p className="text-caption text-muted-foreground">{subscription.type === 'free' ? t('profile.freePlan') : t('profile.planLabel', { type: subscription.type.toUpperCase() })}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Quick Settings */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="neo-surface divide-y divide-border/50 overflow-hidden">
        <button onClick={() => setCurrentView('language')} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><span className="text-sm">🌐</span></div>
          <p className="flex-1 text-left text-body font-medium text-foreground">{t('profile.language')}</p>
          <span className="text-caption text-muted-foreground mr-2">{preferences.language.toUpperCase()}</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => setCurrentView('health')} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Heart className="w-3.5 h-3.5 text-muted-foreground" /></div>
          <p className="flex-1 text-left text-body font-medium text-foreground">{t('profile.healthActivity')}</p>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => setCurrentView('integrations')} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Scale className="w-3.5 h-3.5 text-muted-foreground" /></div>
          <p className="flex-1 text-left text-body font-medium text-foreground">{t('profile.integrations')}</p>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Bell className="w-3.5 h-3.5 text-muted-foreground" /></div>
          <p className="flex-1 text-body font-medium text-foreground">{t('profile.notifications')}</p>
          <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationToggle} />
        </div>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="neo-surface p-4">
        <ThemeSelector />
      </motion.div>

      {/* Data Export */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="neo-surface p-4">
        <DataExportSection isPro={isPro} />
      </motion.div>

      {/* Support */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <SupportSection />
      </motion.div>

      {/* Solar Launcher (experimental) */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}>
        <button
          onClick={() => navigate('/launcher')}
          className="w-full h-11 rounded-xl border border-border hover:bg-muted/40 transition-colors flex items-center justify-center gap-2 text-caption font-medium text-muted-foreground"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Explorar (Sistema solar)
        </button>
      </motion.div>

      {/* Restart Tour */}
      {onRestartTour && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <button
            onClick={onRestartTour}
            className="w-full h-11 rounded-xl border border-border hover:bg-muted/40 transition-colors flex items-center justify-center gap-2 text-caption font-medium text-muted-foreground"
          >
            <Play className="w-3.5 h-3.5" />
            {t('profile.restartTour')}
          </button>
        </motion.div>
      )}

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
        <Button variant="outline" onClick={handleSignOut} className="w-full h-11 text-destructive border-destructive/20 hover:bg-destructive/5 rounded-xl text-body">
          <LogOut className="w-4 h-4 mr-2" />
          {t('profile.logout')}
        </Button>
      </motion.div>

      {/* Delete Account */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full h-11 text-destructive/50 hover:text-destructive hover:bg-destructive/5 text-caption">
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              {t('profile.deleteAccount')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="neo-surface-elevated">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2 text-title">
                <Trash2 className="w-4 h-4" />
                {t('profile.deleteTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left space-y-2">
                <p className="font-semibold text-foreground text-body">{t('profile.deleteWarning')}</p>
                <p className="text-body">{t('profile.deleteDesc')}</p>
                <ul className="list-disc list-inside space-y-1 text-caption">
                  {(t('profile.deleteItems', { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p className="font-medium text-destructive pt-2 text-body">{t('profile.deleteConfirmMsg')}</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('profile.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? t('profile.deleting') : t('profile.deleteConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div className="mb-8">
        <h2 className="section-headline text-foreground">{t('profile.title')}</h2>
        <p className="section-subheadline mt-2">{t('profile.subtitle')}</p>
      </div>
      {renderView()}
    </motion.div>
  );
};
