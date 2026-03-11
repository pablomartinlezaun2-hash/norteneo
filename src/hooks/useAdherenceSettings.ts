import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface AdherenceMetricSettings {
  nutritionEnabled: boolean;
  trainingEnabled: boolean;
  sleepEnabled: boolean;
  supplementsEnabled: boolean;
}

export const DEFAULT_SETTINGS: AdherenceMetricSettings = {
  nutritionEnabled: true,
  trainingEnabled: true,
  sleepEnabled: true,
  supplementsEnabled: true,
};

const toDbRow = (settings: AdherenceMetricSettings) => ({
  nutrition_enabled: settings.nutritionEnabled,
  training_enabled: settings.trainingEnabled,
  sleep_enabled: settings.sleepEnabled,
  supplements_enabled: settings.supplementsEnabled,
});

const fromDbRow = (row: any): AdherenceMetricSettings => ({
  nutritionEnabled: row?.nutrition_enabled ?? true,
  trainingEnabled: row?.training_enabled ?? true,
  sleepEnabled: row?.sleep_enabled ?? true,
  supplementsEnabled: row?.supplements_enabled ?? true,
});

export const useAdherenceSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdherenceMetricSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!user) return;

    const key = `neo-adherence-settings-${user.id}`;

    const load = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('adherence_metric_settings')
          .select('nutrition_enabled, training_enabled, sleep_enabled, supplements_enabled')
          .eq('user_id', user.id)
          .limit(1);

        if (error) {
          throw error;
        }

        const dbRow = data?.[0];
        if (dbRow) {
          const parsed = fromDbRow(dbRow);
          setSettings(parsed);
          localStorage.setItem(key, JSON.stringify(parsed));
          return;
        }

        const saved = localStorage.getItem(key);
        const localSettings = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        setSettings(localSettings);

        await (supabase as any)
          .from('adherence_metric_settings')
          .upsert({ user_id: user.id, ...toDbRow(localSettings) }, { onConflict: 'user_id' });
      } catch {
        try {
          const saved = localStorage.getItem(key);
          if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        } catch {
          /* ignore */
        }
      }
    };

    void load();
  }, [user]);

  const updateSettings = useCallback((partial: Partial<AdherenceMetricSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };

      if (user) {
        localStorage.setItem(`neo-adherence-settings-${user.id}`, JSON.stringify(next));

        void (supabase as any)
          .from('adherence_metric_settings')
          .upsert({ user_id: user.id, ...toDbRow(next) }, { onConflict: 'user_id' });
      }

      return next;
    });
  }, [user]);

  return { settings, updateSettings };
};

/**
 * Calculate dynamic global adherence from only the metrics that:
 * 1. Are enabled in settings
 * 2. Have real logged data (hasData = true)
 *
 * Returns null if no metric qualifies (nothing to calculate).
 */
export function calcDynamicAdherence(
  metrics: {
    nutrition: { acc: number; hasData: boolean };
    training: { acc: number; hasData: boolean };
    sleep: { acc: number; hasData: boolean };
    supplements: { acc: number; hasData: boolean };
  },
  settings: AdherenceMetricSettings
): number | null {
  const active: number[] = [];

  if (settings.nutritionEnabled && metrics.nutrition.hasData) active.push(metrics.nutrition.acc);
  if (settings.trainingEnabled && metrics.training.hasData) active.push(metrics.training.acc);
  if (settings.sleepEnabled && metrics.sleep.hasData) active.push(metrics.sleep.acc);
  if (settings.supplementsEnabled && metrics.supplements.hasData) active.push(metrics.supplements.acc);

  if (active.length === 0) return null;
  return Math.round(active.reduce((a, b) => a + b, 0) / active.length);
}
