import { supabase } from '@/integrations/supabase/client';
import type { MetricsDataFromQuestionnaire } from './questionnaireMapper';
import { parseSleepHoursToNumber } from './questionnaireMapper';

/**
 * Saves initial athlete_metrics row from questionnaire answers.
 * Uses the profile id (not auth uid) since athlete_metrics.user_id references profiles.id.
 */
export async function saveInitialMetrics(
  metricsData: MetricsDataFromQuestionnaire
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No authenticated user' };

  // Get profile id
  const { data: profiles } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profiles?.id) return { success: false, error: 'No profile found' };

  const today = new Date().toISOString().split('T')[0];

  const row: Record<string, any> = {
    user_id: profiles.id,
    date: today,
  };

  if (metricsData.sleep_hours) {
    row.sleep_hours = parseSleepHoursToNumber(metricsData.sleep_hours);
  }
  if (metricsData.sleep_quality) {
    row.sleep_quality = metricsData.sleep_quality;
  }
  if (metricsData.stress_level) {
    row.stress_level = metricsData.stress_level;
  }
  if (metricsData.mental_load) {
    row.mental_load = metricsData.mental_load;
  }
  if (metricsData.fatigue_subjective != null) {
    row.fatigue_subjective = metricsData.fatigue_subjective;
  }
  if (metricsData.injuries_or_discomfort) {
    row.injuries_or_discomfort = metricsData.injuries_or_discomfort;
  }

  // Check if a record for today already exists
  const { data: existing } = await (supabase as any)
    .from('athlete_metrics')
    .select('id')
    .eq('user_id', profiles.id)
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    const { error } = await (supabase as any)
      .from('athlete_metrics')
      .update(row)
      .eq('id', existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await (supabase as any)
      .from('athlete_metrics')
      .insert(row);
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}
