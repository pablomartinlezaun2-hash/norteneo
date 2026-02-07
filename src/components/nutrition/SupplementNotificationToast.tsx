import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, X, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupplementReminders } from '@/hooks/useSupplementReminders';
import { useNutritionData } from '@/hooks/useNutritionData';

interface PendingNotification {
  id: string;
  supplementId: string;
  reminderId: string;
  supplementName: string;
  dosage?: string;
}

export const SupplementNotificationToast = () => {
  const { reminders, logNotificationAction } = useSupplementReminders();
  const { supplements, toggleSupplementTaken } = useNutritionData();
  const [pendingNotifications, setPendingNotifications] = useState<PendingNotification[]>([]);
  const [checkedTimes, setCheckedTimes] = useState<Set<string>>(new Set());

  // Check for due reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      reminders.forEach(reminder => {
        if (!reminder.is_active) return;
        
        const timeKey = `${reminder.id}-${currentTime}`;
        if (checkedTimes.has(timeKey)) return;
        
        if (reminder.reminder_times.includes(currentTime)) {
          const supplement = supplements.find(s => s.id === reminder.supplement_id);
          if (supplement) {
            // Add to pending notifications
            setPendingNotifications(prev => [
              ...prev,
              {
                id: `${reminder.id}-${Date.now()}`,
                supplementId: supplement.id,
                reminderId: reminder.id,
                supplementName: supplement.name,
                dosage: supplement.dosage || undefined
              }
            ]);
            
            // Mark this time as checked
            setCheckedTimes(prev => new Set([...prev, timeKey]));
            
            // Send browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Es hora de tu ${supplement.name}`, {
                body: supplement.dosage ? `Dosis: ${supplement.dosage}` : 'Recuerda tomar tu suplemento',
                icon: '/favicon.ico',
                tag: `supplement-${supplement.id}`,
                requireInteraction: true
              });
            }
          }
        }
      });
    };

    // Check immediately and then every 30 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    
    // Reset checked times at midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    const midnightTimeout = setTimeout(() => {
      setCheckedTimes(new Set());
    }, msUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, [reminders, supplements, checkedTimes]);

  const handleAction = async (notification: PendingNotification, action: 'taken' | 'snoozed' | 'dismissed') => {
    await logNotificationAction(notification.supplementId, notification.reminderId, action);
    
    if (action === 'taken') {
      await toggleSupplementTaken(notification.supplementId);
    }
    
    if (action === 'snoozed') {
      // Re-add notification after 10 minutes
      setTimeout(() => {
        setPendingNotifications(prev => [
          ...prev,
          { ...notification, id: `${notification.id}-snoozed-${Date.now()}` }
        ]);
      }, 10 * 60 * 1000);
    }
    
    // Remove from pending
    setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  if (pendingNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 max-w-md mx-auto">
      <AnimatePresence>
        {pendingNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-background border border-border rounded-2xl shadow-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">RECORDATORIO</span>
                </div>
                <p className="font-semibold text-foreground mt-1">
                  Es hora de tu {notification.supplementName}
                </p>
                {notification.dosage && (
                  <p className="text-sm text-muted-foreground">
                    Dosis: {notification.dosage}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleAction(notification, 'taken')}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Tomado
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(notification, 'snoozed')}
                    className="flex-1"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    10 min
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleAction(notification, 'dismissed')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
