import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MessageContextType =
  | 'training'
  | 'alert'
  | 'nutrition'
  | 'adherence'
  | 'fatigue'
  | 'review'
  | 'intervention'
  | 'audio'
  | null;

export interface ReviewData {
  estado: string;
  mantener: string;
  corregir: string;
  proximo_paso: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'coach' | 'athlete';
  message: string;
  created_at: string;
  read_at: string | null;
  is_system_message: boolean;
  context_type: MessageContextType;
  metadata: ReviewData | Record<string, any> | null;
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
    .limit(1)
    .single();
  return data?.id ?? null;
}

async function getOrCreateConversation(athleteId: string, coachId: string): Promise<Conversation | null> {
  // Try to find existing
  const { data: existing } = await (supabase as any)
    .from('coach_conversations')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('coach_id', coachId)
    .limit(1)
    .single();

  if (existing) return existing;

  // Create new
  const { data: created, error } = await (supabase as any)
    .from('coach_conversations')
    .insert({
      athlete_id: athleteId,
      coach_id: coachId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    // Might be race condition — try fetching again
    const { data: retry } = await (supabase as any)
      .from('coach_conversations')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('coach_id', coachId)
      .limit(1)
      .single();
    return retry ?? null;
  }

  return created;
}

export function useCoachChat(athleteProfileId: string, coachProfileId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  // Resolve my profile id
  useEffect(() => {
    if (!user) return;
    getProfileId(user.id).then(setMyProfileId);
  }, [user]);

  // Determine my role
  const myRole: 'coach' | 'athlete' | null =
    myProfileId === coachProfileId ? 'coach' :
    myProfileId === athleteProfileId ? 'athlete' : null;

  // Init conversation + load messages
  useEffect(() => {
    if (!athleteProfileId || !coachProfileId || !myProfileId || !myRole) return;

    let cancelled = false;

    async function init() {
      setLoading(true);
      const conv = await getOrCreateConversation(athleteProfileId, coachProfileId);
      if (cancelled || !conv) {
        setLoading(false);
        return;
      }
      setConversation(conv);

      // Load messages
      const { data: msgs } = await (supabase as any)
        .from('coach_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      if (!cancelled) {
        setMessages(msgs ?? []);
        setLoading(false);
      }

      // Mark unread messages as read
      markAsRead(conv.id);
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteProfileId, coachProfileId, myProfileId, myRole]);

  // Realtime subscription
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // If incoming message is from the other side, mark as read
          if (newMsg.sender_id !== myProfileId) {
            markAsRead(conversation.id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, myProfileId]);

  const markAsRead = useCallback(async (convId: string) => {
    if (!myProfileId) return;
    // Mark all messages not from me as read
    await (supabase as any)
      .from('coach_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .neq('sender_id', myProfileId)
      .is('read_at', null);
  }, [myProfileId]);

  const sendMessage = useCallback(async (text: string, contextType?: MessageContextType, metadata?: Record<string, any>) => {
    if (!conversation || !myProfileId || !myRole || !text.trim()) return;
    setSending(true);

    const msgRow: Record<string, any> = {
      conversation_id: conversation.id,
      athlete_id: athleteProfileId,
      coach_id: coachProfileId,
      sender_id: myProfileId,
      sender_role: myRole,
      message: text.trim(),
      is_system_message: false,
    };
    if (contextType) msgRow.context_type = contextType;
    if (metadata) msgRow.metadata = metadata;

    const { data: inserted, error } = await (supabase as any)
      .from('coach_messages')
      .insert(msgRow)
      .select()
      .single();

    if (!error && inserted) {
      await (supabase as any)
        .from('coach_conversations')
        .update({
          last_message_at: inserted.created_at,
          last_message_preview: text.trim().slice(0, 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);
    }

    setSending(false);
    return { error: error?.message ?? null };
  }, [conversation, myProfileId, myRole, athleteProfileId, coachProfileId]);

  const sendReview = useCallback(async (review: ReviewData) => {
    const summary = `📋 Revisión:\n• Estado: ${review.estado}\n• Mantener: ${review.mantener}\n• Corregir: ${review.corregir}\n• Próximo paso: ${review.proximo_paso}`;
    return sendMessage(summary, 'review', review);
  }, [sendMessage]);

  return {
    messages,
    conversation,
    loading,
    sending,
    sendMessage,
    sendReview,
    myProfileId,
    myRole,
  };
}

/** Hook for athlete side — resolves coach from profile */
export function useAthleteChatInfo() {
  const { user } = useAuth();
  const [coachId, setCoachId] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCoach, setHasCoach] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function resolve() {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('id, coach_id')
        .eq('user_id', user!.id)
        .limit(1)
        .single();

      setMyProfileId(profile?.id ?? null);
      setCoachId(profile?.coach_id ?? null);
      setHasCoach(!!profile?.coach_id);
      setLoading(false);
    }

    resolve();
  }, [user]);

  return { coachId, myProfileId, loading, hasCoach };
}
