import { supabase } from '@/integrations/supabase/client';

const COACH_PROFILE_ID = 'ab5265b7-6b0f-4a44-91a3-b3ff310cee18';

export interface VB2ActivationResult {
  success: boolean;
  error?: string;
}

export interface ProfileDataFromQuestionnaire {
  age?: number;
  weight?: number;
  height?: number;
  disciplines?: string[];
  years_training?: string;
  main_goal?: string;
  full_name?: string;
}

/**
 * Activates VB2 for the current authenticated user.
 * Optionally saves questionnaire-derived profile data.
 */
export async function activateVB2(profileData?: ProfileDataFromQuestionnaire): Promise<VB2ActivationResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No authenticated user' };

  const updates: Record<string, any> = {
    active_model: 'VB2',
    vb2_enabled: true,
    coach_id: COACH_PROFILE_ID,
    role: 'athlete',
    updated_at: new Date().toISOString(),
  };

  // Merge questionnaire data if provided
  if (profileData) {
    if (profileData.age != null) updates.age = profileData.age;
    if (profileData.weight != null) updates.weight = profileData.weight;
    if (profileData.height != null) updates.height = profileData.height;
    if (profileData.disciplines) updates.disciplines = profileData.disciplines;
    if (profileData.years_training) updates.years_training = profileData.years_training;
    if (profileData.main_goal) updates.main_goal = profileData.main_goal;
    if (profileData.full_name) updates.full_name = profileData.full_name;
  }

  // Check if profile exists
  const { data: existing } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await (supabase as any)
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        ...updates,
      });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Saves profile data to Supabase for VB1 users (no coach assignment).
 */
export async function saveProfileToSupabase(
  model: 'VB1' | 'VB2',
  profileData?: ProfileDataFromQuestionnaire
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No authenticated user' };

  const updates: Record<string, any> = {
    active_model: model,
    role: 'athlete',
    updated_at: new Date().toISOString(),
  };

  if (profileData) {
    if (profileData.age != null) updates.age = profileData.age;
    if (profileData.weight != null) updates.weight = profileData.weight;
    if (profileData.height != null) updates.height = profileData.height;
    if (profileData.disciplines) updates.disciplines = profileData.disciplines;
    if (profileData.years_training) updates.years_training = profileData.years_training;
    if (profileData.main_goal) updates.main_goal = profileData.main_goal;
    if (profileData.full_name) updates.full_name = profileData.full_name;
  }

  const { data: existing } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await (supabase as any)
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        ...updates,
      });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}
