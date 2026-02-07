import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Plus, 
  Clock, 
  Settings2, 
  History,
  Pill,
  AlertCircle,
  Check,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSupplementReminders } from '@/hooks/useSupplementReminders';
import { useNutritionData, UserSupplement } from '@/hooks/useNutritionData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { SupplementCatalog } from './SupplementCatalog';
import { ReminderConfigPanel } from './ReminderConfigPanel';
import { toast } from 'sonner';

export const SupplementRemindersSection = () => {
  const { supplements, addSupplement } = useNutritionData();
  const { 
    reminders, 
    history, 
    loading, 
    notificationPermission,
    requestPermission,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    getReminderForSupplement 
  } = useSupplementReminders();
  
  const [showCatalog, setShowCatalog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<UserSupplement | null>(null);
  const [requestingPermission, setRequestingPermission] = useState(false);

  const handleRequestPermission = async () => {
    setRequestingPermission(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        toast.success('¡Notificaciones activadas!', {
          description: 'Ahora recibirás recordatorios de tus suplementos'
        });
      } else {
        toast.error('Permiso denegado', {
          description: 'Necesitas permitir notificaciones en tu navegador'
        });
      }
    } catch (error) {
      toast.error('Error al solicitar permiso');
    }
    setRequestingPermission(false);
  };

  const handleSelectFromCatalog = async (supplement: { name: string; dosage: string }) => {
    // First add the supplement to user's supplements
    const newSupplement = await addSupplement({
      name: supplement.name,
      dosage: supplement.dosage,
      timing: 'morning'
    });
    
    setShowCatalog(false);
    
    if (newSupplement) {
      // Open config panel for the new supplement
      setSelectedSupplement(newSupplement);
    }
  };

  const handleSaveReminder = async (supplementId: string, config: {
    times: string[];
    frequency: string;
    soundEnabled: boolean;
  }) => {
    const existingReminder = getReminderForSupplement(supplementId);
    
    if (existingReminder) {
      await updateReminder(existingReminder.id, {
        reminder_times: config.times,
        frequency: config.frequency as 'daily' | 'weekly' | 'custom',
        sound_enabled: config.soundEnabled
      });
    } else {
      await createReminder(supplementId, config.times, config.frequency, config.soundEnabled);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    await deleteReminder(reminderId);
  };

  const activeSupplements = supplements.filter(s => s.is_active);
  const supplementsWithReminders = activeSupplements.filter(s => getReminderForSupplement(s.id));
  const supplementsWithoutReminders = activeSupplements.filter(s => !getReminderForSupplement(s.id));

  return (
    <div className="space-y-6">
      {/* Permission Banner */}
      {notificationPermission !== 'granted' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Activa las notificaciones</p>
              <p className="text-sm text-muted-foreground mt-1">
                Necesitamos permiso para enviarte recordatorios de suplementos.
              </p>
              <Button 
                onClick={handleRequestPermission} 
                disabled={requestingPermission}
                size="sm" 
                className="mt-3"
              >
                <Bell className="w-4 h-4 mr-2" />
                {requestingPermission ? 'Solicitando...' : 'Activar notificaciones'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recordatorios</h3>
          <p className="text-sm text-muted-foreground">
            {supplementsWithReminders.length} recordatorios activos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="w-4 h-4 mr-2" />
            Historial
          </Button>
          <Button size="sm" onClick={() => setShowCatalog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir
          </Button>
        </div>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <History className="w-4 h-4" />
                Historial de notificaciones
              </h4>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay historial aún
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.slice(0, 10).map((item) => {
                    const supplement = supplements.find(s => s.id === item.supplement_id);
                    return (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                      >
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">
                            {supplement?.name || 'Suplemento'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.action_taken && (
                            <Badge 
                              variant={item.action_taken === 'taken' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {item.action_taken === 'taken' ? 'Tomado' : 
                               item.action_taken === 'snoozed' ? 'Pospuesto' : 'Ignorado'}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(item.sent_at), "dd MMM HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supplements with Reminders */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Active reminders */}
            {supplementsWithReminders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground px-1">Con recordatorio</p>
                {supplementsWithReminders.map((supplement) => {
                  const reminder = getReminderForSupplement(supplement.id);
                  if (!reminder) return null;
                  
                  return (
                    <motion.div
                      key={supplement.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                        reminder.is_active 
                          ? "bg-primary/5 border-primary/20" 
                          : "bg-muted/30 border-border"
                      )}
                      onClick={() => setSelectedSupplement(supplement)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          reminder.is_active ? "bg-primary/10" : "bg-muted"
                        )}>
                          {reminder.is_active ? (
                            <Bell className="w-5 h-5 text-primary" />
                          ) : (
                            <BellOff className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{supplement.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {reminder.reminder_times.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reminder.is_active}
                          onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Settings2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Supplements without reminders */}
            {supplementsWithoutReminders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground px-1">Sin recordatorio</p>
                {supplementsWithoutReminders.map((supplement) => (
                  <motion.div
                    key={supplement.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-dashed border-border cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
                    onClick={() => setSelectedSupplement(supplement)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Pill className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{supplement.name}</p>
                        {supplement.dosage && (
                          <p className="text-sm text-muted-foreground">{supplement.dosage}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Añadir</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {activeSupplements.length === 0 && (
              <div className="text-center py-12">
                <Pill className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">No tienes suplementos</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Añade suplementos para configurar recordatorios
                </p>
                <Button onClick={() => setShowCatalog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir suplemento
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Catalog Modal */}
      <AnimatePresence>
        {showCatalog && (
          <SupplementCatalog
            existingSupplements={supplements.map(s => s.name)}
            onSelectSupplement={handleSelectFromCatalog}
            onClose={() => setShowCatalog(false)}
          />
        )}
      </AnimatePresence>

      {/* Config Panel */}
      <AnimatePresence>
        {selectedSupplement && (
          <ReminderConfigPanel
            supplementName={selectedSupplement.name}
            supplementDosage={selectedSupplement.dosage || undefined}
            existingReminder={getReminderForSupplement(selectedSupplement.id) || undefined}
            onSave={(config) => handleSaveReminder(selectedSupplement.id, config)}
            onDelete={
              getReminderForSupplement(selectedSupplement.id)
                ? () => handleDeleteReminder(getReminderForSupplement(selectedSupplement.id)!.id)
                : undefined
            }
            onClose={() => setSelectedSupplement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
