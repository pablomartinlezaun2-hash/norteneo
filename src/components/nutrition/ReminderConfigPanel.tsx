import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Check,
  Volume2,
  VolumeX,
  Pill,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReminderConfigPanelProps {
  supplementName: string;
  supplementDosage?: string;
  existingReminder?: {
    id: string;
    reminder_times: string[];
    frequency: string;
    sound_enabled: boolean;
  };
  onSave: (config: {
    times: string[];
    frequency: string;
    soundEnabled: boolean;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export const ReminderConfigPanel = ({
  supplementName,
  supplementDosage,
  existingReminder,
  onSave,
  onDelete,
  onClose
}: ReminderConfigPanelProps) => {
  const [times, setTimes] = useState<string[]>(existingReminder?.reminder_times || ['08:00']);
  const [frequency, setFrequency] = useState(existingReminder?.frequency || 'daily');
  const [soundEnabled, setSoundEnabled] = useState(existingReminder?.sound_enabled ?? true);
  const [saving, setSaving] = useState(false);

  const addTime = () => {
    setTimes([...times, '12:00']);
  };

  const removeTime = (index: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ times, frequency, soundEnabled });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-background border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Configurar Recordatorio</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Supplement info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{supplementName}</p>
            {supplementDosage && (
              <p className="text-sm text-muted-foreground">{supplementDosage}</p>
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
        <div className="flex gap-2 pt-2">
          {existingReminder && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="flex-1">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : existingReminder ? 'Guardar' : 'Crear recordatorio'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
