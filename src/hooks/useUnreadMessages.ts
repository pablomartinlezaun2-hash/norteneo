import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Returns unread message counts for the current user.
 * - For coaches: map of athleteProfileId → unread count
 * - For athletes: total unread from coach
 */
export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadByAthlete, setUnreadByAthlete] = useState<Map<string, number>>(new Map());
  const [totalUnread, setTotalUnread] = useState(0);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
      .then(({ data }: any) => setMyProfileId(data?.id ?? null));
  }, [user]);

  const refresh = useCallback(async () => {
    if (!myProfileId) return;

    // Get all unread messages where I'm not the sender
    const { data, error } = await (supabase as any)
      .from('coach_messages')
      .select('athlete_id, coach_id, sender_id')
      .is('read_at', null)
      .neq('sender_id', myProfileId);

    if (error || !data) return;

    const map = new Map<string, number>();
    let total = 0;

    for (const msg of data) {
      // For coach: group by athlete_id
      // For athlete: group by coach_id
      const isCoach = msg.coach_id === myProfileId;
      const key = isCoach ? msg.athlete_id : msg.coach_id;
      map.set(key, (map.get(key) ?? 0) + 1);
      total++;
    }

    setUnreadByAthlete(map);
    setTotalUnread(total);
  }, [myProfileId]);

  useEffect(() => {
    if (!myProfileId) return;
    refresh();

    // Subscribe to new messages for realtime badge updates
    const channel = supabase
      .channel('unread-badges')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coach_messages' },
        () => { refresh(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myProfileId, refresh]);

  return {
    /** Map of counterpart profile id → unread count (for coach: keyed by athlete id) */
    unreadByAthlete,
    /** Total unread messages for current user */
    totalUnread,
    /** Force refresh counts */
    refresh,
  };
}
