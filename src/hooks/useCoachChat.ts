import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'coach' | 'athlete';
  message: string;
  created_at: string;
  read_at: string | null;
  is_system_message: boolean;
}

export interface Conversation {
  id: string;
  athlete_id: string;
  coach_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
}

async function getProfileId(authUid: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('user_id', authUid)
    .maybeSingle();
  return data?.id ?? null;
}

async function getProfileRole(authUid: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('user_id', authUid)
    .maybeSingle();
  return data?.role ?? null;
}

/**
 * Get or create the conversation between a coach and athlete.
 * Returns the conversation id.
 */
async function getOrCreateConversation(
  athleteProfileId: string,
  coachProfileId: string
): Promise<string | null> {
  // Try to find existing
  const { data: existing } = await (supabase as any)
    .from('coach_conversations')
    .select('id')
    .eq('athlete_id', athleteProfileId)
    .eq('coach_id', coachProfileId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Create new
  const { data: created, error } = await (supabase as any)
    .from('coach_conversations')
    .insert({
      athlete_id: athleteProfileId,
      coach_id: coachProfileId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create conversation:', error);
    return null;
  }
  return created?.id ?? null;
}

/**
 * Hook for coach-athlete chat.
 * For coaches: pass the athlete's profile id as `counterpartProfileId`.
 * For athletes: pass nothing or null, and it will find the coach automatically.
 */
export function useCoachChat(counterpartProfileId?: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<'coach' | 'athlete' | null>(null);
  const channelRef = useRef<any>(null);

  // Initialize: resolve profile, role, conversation
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function init() {
      setLoading(true);
      const profileId = await getProfileId(user!.id);
      if (!profileId || cancelled) { setLoading(false); return; }

      const role = await getProfileRole(user!.id);
      const resolvedRole = (role === 'coach' ? 'coach' : 'athlete') as 'coach' | 'athlete';

      if (cancelled) return;
      setMyProfileId(profileId);
      setMyRole(resolvedRole);

      let athleteId: string;
      let coachId: string;

      if (resolvedRole === 'coach') {
        if (!counterpartProfileId) { setLoading(false); return; }
        coachId = profileId;
        athleteId = counterpartProfileId;
      } else {
        // Athlete: find coach_id from own profile
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('coach_id')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (!profile?.coach_id || cancelled) { setLoading(false); return; }
        athleteId = profileId;
        coachId = profile.coach_id;
      }

      const convId = await getOrCreateConversation(athleteId, coachId);
      if (cancelled) return;
      setConversationId(convId);

      if (convId) {
        await fetchMessages(convId);
        // Mark unread messages as read
        markAsRead(convId, profileId);
      }
      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, counterpartProfileId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read if from the other side
          if (myProfileId && newMsg.sender_id !== myProfileId) {
            markAsRead(conversationId, myProfileId);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, myProfileId]);

  async function fetchMessages(convId: string) {
    const { data } = await (supabase as any)
      .from('coach_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(200);

    setMessages((data as ChatMessage[]) ?? []);
  }

  async function markAsRead(convId: string, profileId: string) {
    await (supabase as any)
      .from('coach_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .neq('sender_id', profileId)
      .is('read_at', null);
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !myProfileId || !myRole || !text.trim()) return;
      setSending(true);

      // Determine athlete_id and coach_id from conversation
      const { data: conv } = await (supabase as any)
        .from('coach_conversations')
        .select('athlete_id, coach_id')
        .eq('id', conversationId)
        .single();

      if (!conv) { setSending(false); return; }

      const { error } = await (supabase as any)
        .from('coach_messages')
        .insert({
          conversation_id: conversationId,
          athlete_id: conv.athlete_id,
          coach_id: conv.coach_id,
          sender_id: myProfileId,
          sender_role: myRole,
          message: text.trim(),
        });

      if (!error) {
        // Update conversation metadata
        await (supabase as any)
          .from('coach_conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: text.trim().slice(0, 100),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
      }

      setSending(false);
    },
    [conversationId, myProfileId, myRole]
  );

  const unreadCount = messages.filter(
    (m) => m.sender_id !== myProfileId && !m.read_at
  ).length;

  return {
    messages,
    loading,
    sending,
    sendMessage,
    conversationId,
    myProfileId,
    myRole,
    unreadCount,
  };
}
