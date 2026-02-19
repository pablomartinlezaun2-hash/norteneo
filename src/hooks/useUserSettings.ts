import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { changeLanguage } from '@/i18n';
import { toast } from 'sonner';

export interface HealthProfile {
  weight: number;
  height: number;
  age: number;
  injuries: string;
  allergies: string;
  unit: 'kg' | 'lbs';
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system' | 'night-shift';
  notifications: boolean;
  privacyAccepted: boolean;
  unit: 'kg' | 'lbs';
}

export interface Subscription {
  type: 'free' | 'pro' | 'ultra';
  expiresAt?: string;
}

export interface Integration {
  id: string;
  name: string;
  connected: boolean;
  icon: string;
}

const DEFAULT_HEALTH_PROFILE: HealthProfile = {
  weight: 70,
  height: 175,
  age: 25,
  injuries: '',
  allergies: '',
  unit: 'kg',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'es',
  theme: 'system',
  notifications: true,
  privacyAccepted: false,
  unit: 'kg',
};

export const useUserSettings = () => {
  const { user } = useAuth();
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(DEFAULT_HEALTH_PROFILE);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [subscription, setSubscription] = useState<Subscription>({ type: 'free' });
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: 'strava', name: 'Strava', connected: false, icon: 'strava' },
    { id: 'apple-health', name: 'Apple Health', connected: false, icon: 'apple' },
  ]);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage (for now, can be migrated to DB later)
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = () => {
    try {
      const savedHealth = localStorage.getItem(`neo-health-${user?.id}`);
      const savedPrefs = localStorage.getItem(`neo-prefs-${user?.id}`);
      const savedSub = localStorage.getItem(`neo-sub-${user?.id}`);
      const savedIntegrations = localStorage.getItem(`neo-integrations-${user?.id}`);

      if (savedHealth) setHealthProfile(JSON.parse(savedHealth));
      if (savedPrefs) {
        const parsedPrefs = JSON.parse(savedPrefs);
        setPreferences(parsedPrefs);
        // Apply saved language to i18next on load
        if (parsedPrefs.language) {
          changeLanguage(parsedPrefs.language);
        }
      }
      if (savedSub) setSubscription(JSON.parse(savedSub));
      if (savedIntegrations) setIntegrations(JSON.parse(savedIntegrations));
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveHealthProfile = (profile: HealthProfile) => {
    setHealthProfile(profile);
    localStorage.setItem(`neo-health-${user?.id}`, JSON.stringify(profile));
    toast.success('Perfil de salud guardado');
  };

  const savePreferences = (prefs: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...prefs };
    setPreferences(newPrefs);
    localStorage.setItem(`neo-prefs-${user?.id}`, JSON.stringify(newPrefs));
    // Sync language with i18next so the entire app re-renders in the new language
    if (prefs.language && prefs.language !== preferences.language) {
      changeLanguage(prefs.language);
    }
  };

  const setSubscriptionType = (type: Subscription['type']) => {
    const newSub = { type, expiresAt: type !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined };
    setSubscription(newSub);
    localStorage.setItem(`neo-sub-${user?.id}`, JSON.stringify(newSub));
    toast.success(`Suscripción ${type.toUpperCase()} activada`);
  };

  const toggleIntegration = (integrationId: string) => {
    const newIntegrations = integrations.map(int => 
      int.id === integrationId ? { ...int, connected: !int.connected } : int
    );
    setIntegrations(newIntegrations);
    localStorage.setItem(`neo-integrations-${user?.id}`, JSON.stringify(newIntegrations));
    
    const integration = newIntegrations.find(i => i.id === integrationId);
    if (integration) {
      toast.success(`${integration.name} ${integration.connected ? 'conectado' : 'desconectado'}`);
    }
  };

  const isPro = subscription.type === 'pro' || subscription.type === 'ultra';
  const isUltra = subscription.type === 'ultra';

  return {
    healthProfile,
    preferences,
    subscription,
    integrations,
    loading,
    saveHealthProfile,
    savePreferences,
    setSubscriptionType,
    toggleIntegration,
    isPro,
    isUltra,
  };
};
