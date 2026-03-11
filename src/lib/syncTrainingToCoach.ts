import { supabase } from '@/integrations/supabase/client';

/**
 * Syncs a completed training session to the coach_training_sessions table
 * so it appears in the Coach Panel athlete detail view.
 * Uses the profile id (not auth uid) since coach_training_sessions.user_id references profiles.id.
 */
export async function syncTrainingToCoach(opts: {
  sessionName?: string;
  sessionType?: string;
  microcycleName?: string;
  completed?: boolean;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No authenticated user' };

    // Get profile id
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.id) return { success: false, error: 'No profile found' };

    const today = new Date().toISOString().split('T')[0];

    const row: Record<string, any> = {
      user_id: profile.id,
      date: today,
      completed: opts.completed ?? true,
      planned: true,
    };

    if (opts.sessionType) row.session_type = opts.sessionType;
    if (opts.microcycleName) row.microcycle_name = opts.microcycleName;
    if (opts.notes) row.notes = opts.notes;
    if (opts.sessionName) {
      row.notes = opts.sessionName + (opts.notes ? ` — ${opts.notes}` : '');
    }

    const { error } = await (supabase as any)
      .from('coach_training_sessions')
      .insert(row);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    console.error('syncTrainingToCoach error:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
