import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { supabase } from '@/integrations/supabase/client';
import { User, LogOut, ChevronRight, Bell, Shield, Scale, Heart, Crown, Sparkles, Trash2 } from 'lucide-react';
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

type ProfileView = 'main' | 'subscription' | 'language' | 'health' | 'integrations' | 'privacy';

export const ProfileSection = () => {
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
      if (error) throw error;
      toast.success('Tu cuenta ha sido eliminada');
      navigate('/auth');
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
            <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-2">
              ← {t('common.back')}
            </Button>
            <SubscriptionCard currentSubscription={subscription} onSubscribe={setSubscriptionType} />
          </div>
        );
      case 'language':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-2">
              ← {t('common.back')}
            </Button>
            <LanguageSelector currentLanguage={preferences.language} onLanguageChange={(lang) => savePreferences({ language: lang })} />
          </div>
        );
      case 'health':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-2">
              ← {t('common.back')}
            </Button>
            <HealthProfileForm profile={healthProfile} onSave={saveHealthProfile} />
          </div>
        );
      case 'integrations':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-2">
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gradient-card rounded-2xl p-5 border border-border apple-shadow">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground truncate">{user?.email?.split('@')[0] || 'Usuario'}</p>
              {subscription.type !== 'free' && (
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold text-white", subscription.type === 'ultra' ? 'bg-gradient-to-r from-purple-500 to-violet-500' : 'bg-gradient-to-r from-amber-500 to-yellow-500')}>
                  {subscription.type.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Subscription */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="gradient-card rounded-2xl border border-border overflow-hidden">
        <button onClick={() => setCurrentView('subscription')} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">{t('profile.manageSubscription')}</p>
            <p className="text-xs text-muted-foreground">{subscription.type === 'free' ? 'Plan gratuito' : `Plan ${subscription.type.toUpperCase()}`}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Quick Settings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="gradient-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
        <button onClick={() => setCurrentView('language')} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-lg">🌐</span></div>
          <p className="flex-1 text-left text-sm font-medium text-foreground">{t('profile.language')}</p>
          <span className="text-sm text-muted-foreground mr-2">{preferences.language.toUpperCase()}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={() => setCurrentView('health')} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center"><Heart className="w-4 h-4 text-red-500" /></div>
          <p className="flex-1 text-left text-sm font-medium text-foreground">{t('profile.healthActivity')}</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={() => setCurrentView('integrations')} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center"><Scale className="w-4 h-4 text-cyan-500" /></div>
          <p className="flex-1 text-left text-sm font-medium text-foreground">{t('profile.integrations')}</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Bell className="w-4 h-4 text-primary" /></div>
          <p className="flex-1 text-sm font-medium text-foreground">{t('profile.notifications')}</p>
          <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationToggle} />
        </div>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="gradient-card rounded-2xl p-4 border border-border">
        <ThemeSelector />
      </motion.div>

      {/* Data Export */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="gradient-card rounded-2xl p-4 border border-border">
        <DataExportSection isPro={isPro} />
      </motion.div>

      {/* Support */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SupportSection />
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Button variant="outline" onClick={signOut} className="w-full h-12 text-destructive border-destructive/20 hover:bg-destructive/10">
          <LogOut className="w-4 h-4 mr-2" />
          {t('profile.logout')}
        </Button>
      </motion.div>

      {/* Delete Account */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full h-12 text-destructive/70 hover:text-destructive hover:bg-destructive/5 text-sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar mi cuenta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                ¿Eliminar tu cuenta?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left space-y-2">
                <p className="font-semibold text-foreground">Esta acción es permanente e irreversible.</p>
                <p>Se eliminarán todos tus datos para siempre, incluyendo:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Programas de entrenamiento y sesiones</li>
                  <li>Registros de series, cardio y actividades</li>
                  <li>Datos de nutrición y suplementos</li>
                  <li>Perfil de salud y preferencias</li>
                  <li>Tu cuenta de usuario</li>
                </ul>
                <p className="font-medium text-destructive pt-2">No podrás recuperar ningún dato después de confirmar.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div className="text-center mb-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">{t('profile.title')}</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">{t('profile.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('profile.subtitle')}</p>
      </div>
      {renderView()}
    </motion.div>
  );
};
