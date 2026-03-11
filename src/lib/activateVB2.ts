import { supabase } from '@/integrations/supabase/client';

const COACH_PROFILE_ID = 'ab5265b7-6b0f-4a44-91a3-b3ff310cee18';

export interface VB2ActivationResult {
  success: boolean;
  error?: string;
}

/**
 * Activates VB2 for the current authenticated user.
 * - Sets active_model = 'VB2', vb2_enabled = true
 * - Assigns coach_id to the main coach profile
 * - Creates the profile row if it doesn't exist yet
 */
export async function activateVB2(): Promise<VB2ActivationResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No authenticated user' };

  const updates = {
    active_model: 'VB2',
    vb2_enabled: true,
    coach_id: COACH_PROFILE_ID,
    role: 'athlete',
  };

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
