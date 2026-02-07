import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Plus, 
  Clock, 
  Trash2, 
  Settings2, 
  Check,
  History,
  Volume2,
  VolumeX,
  ChevronRight,
  Pill,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupplementReminders } from '@/hooks/useSupplementReminders';
import { useNutritionData, UserSupplement } from '@/hooks/useNutritionData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReminderConfigModalProps {
  supplement: UserSupplement;
  existingReminder?: any;
  onClose: () => void;
}

const ReminderConfigModal = ({ supplement, existingReminder, onClose }: ReminderConfigModalProps) => {
  const { createReminder, updateReminder, deleteReminder } = useSupplementReminders();
  const [times, setTimes] = useState<string[]>(existingReminder?.reminder_times || ['08:00']);
  const [frequency, setFrequency] = useState(existingReminder?.frequency || 'daily');
  const [soundEnabled, setSoundEnabled] = useState(existingReminder?.sound_enabled ?? true);
  const [saving, setSaving] = useState(false);

  const addTime = () => {
    setTimes([...times, '12:00']);
  };

  const removeTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSave = async () => {
    setSaving(true);
    if (existingReminder) {
      await updateReminder(existingReminder.id, {
        reminder_times: times,
        frequency,
        sound_enabled: soundEnabled
      });
    } else {
      await createReminder(supplement.id, times, frequency, soundEnabled);
    }
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (existingReminder) {
      await deleteReminder(existingReminder.id);
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Pill className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{supplement.name}</p>
          {supplement.dosage && (
            <p className="text-sm text-muted-foreground">{supplement.dosage}</p>
          )}
        </div>
      </div>

      {/* Times */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Horas de recordatorio</Label>
        <div className="space-y-2">
          {times.map((time, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => updateTime(index, e.target.value)}
                  className="pl-10"
                />
              </div>
              {times.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTime(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addTime} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Añadir hora
        </Button>
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Frecuencia</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Todos los días</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sound */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
        <div className="flex items-center gap-3">
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-primary" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Sonido de notificación</span>
        </div>
        <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {existingReminder && (
          <Button variant="destructive" onClick={handleDelete} className="flex-1">
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          <Check className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
};

export const SupplementRemindersSection = () => {
  const { supplements } = useNutritionData();
  const { 
    reminders, 
    history, 
    loading, 
    notificationPermission,
    requestPermission,
    toggleReminder,
    getReminderForSupplement 
  } = useSupplementReminders();
  
  const [selectedSupplement, setSelectedSupplement] = useState<UserSupplement | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      // Toast is shown by the hook
    }
  };

  const activeSupplements = supplements.filter(s => s.is_active);

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
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Activa las notificaciones</p>
              <p className="text-sm text-muted-foreground mt-1">
                Necesitamos permiso para enviarte recordatorios de suplementos.
              </p>
              <Button 
                onClick={handleRequestPermission} 
                size="sm" 
                className="mt-3"
              >
                <Bell className="w-4 h-4 mr-2" />
                Activar notificaciones
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recordatorios</h3>
          <p className="text-sm text-muted-foreground">
            Configura alertas para tus suplementos
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
          <History className="w-4 h-4 mr-2" />
          Historial
        </Button>
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

      {/* Supplements List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeSupplements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tienes suplementos activos</p>
            <p className="text-sm">Añade suplementos para configurar recordatorios</p>
          </div>
        ) : (
          activeSupplements.map((supplement) => {
            const reminder = getReminderForSupplement(supplement.id);
            
            return (
              <Dialog key={supplement.id}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                      reminder?.is_active 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-muted/30 border-border hover:border-primary/30"
                    )}
                    onClick={() => setSelectedSupplement(supplement)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        reminder?.is_active ? "bg-primary/10" : "bg-muted"
                      )}>
                        {reminder?.is_active ? (
                          <Bell className="w-5 h-5 text-primary" />
                        ) : (
                          <BellOff className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{supplement.name}</p>
                        {reminder ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {reminder.reminder_times.join(', ')}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin recordatorio</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {reminder && (
                        <Switch
                          checked={reminder.is_active}
                          onCheckedChange={(checked) => {
                            toggleReminder(reminder.id, checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5" />
                      Configurar recordatorio
                    </DialogTitle>
                  </DialogHeader>
                  <ReminderConfigModal
                    supplement={supplement}
                    existingReminder={reminder}
                    onClose={() => setSelectedSupplement(null)}
                  />
                </DialogContent>
              </Dialog>
            );
          })
        )}
      </div>
    </div>
  );
};
