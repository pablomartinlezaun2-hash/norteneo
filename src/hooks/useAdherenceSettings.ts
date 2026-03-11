import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AdherenceMetricSettings {
  nutritionEnabled: boolean;
  trainingEnabled: boolean;
  sleepEnabled: boolean;
  supplementsEnabled: boolean;
}

const DEFAULT_SETTINGS: AdherenceMetricSettings = {
  nutritionEnabled: true,
  trainingEnabled: true,
  sleepEnabled: true,
  supplementsEnabled: true,
};

export const useAdherenceSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdherenceMetricSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(`neo-adherence-settings-${user.id}`);
      if (saved) setSettings(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [user]);

  const updateSettings = useCallback((partial: Partial<AdherenceMetricSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      if (user) localStorage.setItem(`neo-adherence-settings-${user.id}`, JSON.stringify(next));
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
