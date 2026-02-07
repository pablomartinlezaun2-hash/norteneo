import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SupplementReminder {
  id: string;
  supplement_id: string;
  reminder_times: string[];
  frequency: 'daily' | 'weekly' | 'custom';
  is_active: boolean;
  sound_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  supplement_id: string;
  reminder_id: string;
  sent_at: string;
  action_taken: 'taken' | 'snoozed' | 'dismissed' | null;
  action_at: string | null;
}

export const useSupplementReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<SupplementReminder[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('supplement_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching reminders:', error);
      return;
    }
    
    setReminders((data || []) as SupplementReminder[]);
  }, [user]);

  // Fetch notification history
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('supplement_notification_history')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching history:', error);
      return;
    }
    
    setHistory((data || []) as NotificationHistory[]);
  }, [user]);

  // Load data
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchReminders(), fetchHistory()]).finally(() => setLoading(false));
    }
  }, [user, fetchReminders, fetchHistory]);

  // Create reminder
  const createReminder = async (supplementId: string, times: string[], frequency: string, soundEnabled: boolean = true) => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('supplement_reminders')
      .insert({
        user_id: user.id,
        supplement_id: supplementId,
        reminder_times: times,
        frequency,
        sound_enabled: soundEnabled,
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Error al crear recordatorio');
      console.error(error);
      return null;
    }
    
    toast.success('Recordatorio creado');
    fetchReminders();
    return data;
  };

  // Update reminder
  const updateReminder = async (id: string, updates: Partial<SupplementReminder>) => {
    const { error } = await supabase
      .from('supplement_reminders')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast.error('Error al actualizar recordatorio');
      console.error(error);
      return false;
    }
    
    toast.success('Recordatorio actualizado');
    fetchReminders();
    return true;
  };

  // Toggle reminder active status
  const toggleReminder = async (id: string, isActive: boolean) => {
    return updateReminder(id, { is_active: isActive });
  };

  // Delete reminder
  const deleteReminder = async (id: string) => {
    const { error } = await supabase
      .from('supplement_reminders')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Error al eliminar recordatorio');
      console.error(error);
      return false;
    }
    
    toast.success('Recordatorio eliminado');
    fetchReminders();
    return true;
  };

  // Log notification action
  const logNotificationAction = async (supplementId: string, reminderId: string, action: 'taken' | 'snoozed' | 'dismissed') => {
    if (!user) return;
    
    const { error } = await supabase
      .from('supplement_notification_history')
      .insert({
        user_id: user.id,
        supplement_id: supplementId,
        reminder_id: reminderId,
        action_taken: action,
        action_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error logging action:', error);
    }
    
    fetchHistory();
  };

  // Send notification
  const sendNotification = (supplementName: string, supplementId: string, reminderId: string) => {
    if (notificationPermission !== 'granted') return;
    
    const notification = new Notification(`Es hora de tu ${supplementName}`, {
      body: 'Recuerda tomar tu suplemento para mantener tu rutina',
      icon: '/favicon.ico',
      tag: `supplement-${supplementId}`,
      requireInteraction: true
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    // Log that notification was sent
    if (user) {
      supabase.from('supplement_notification_history').insert({
        user_id: user.id,
        supplement_id: supplementId,
        reminder_id: reminderId
      });
    }
  };

  // Get reminder for a specific supplement
  const getReminderForSupplement = (supplementId: string) => {
    return reminders.find(r => r.supplement_id === supplementId);
  };

  return {
    reminders,
    history,
    loading,
    notificationPermission,
    requestPermission,
    createReminder,
    updateReminder,
    toggleReminder,
    deleteReminder,
    logNotificationAction,
    sendNotification,
    getReminderForSupplement,
    refetch: () => Promise.all([fetchReminders(), fetchHistory()])
  };
};
