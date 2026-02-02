import { useState } from 'react';
import { Pill, Plus, Check, Trash2, Clock, Sun, Dumbbell, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserSupplement, SupplementLog } from '@/hooks/useNutritionData';

interface SupplementsSectionProps {
  supplements: UserSupplement[];
  supplementLogs: SupplementLog[];
  onAddSupplement: (supplement: Omit<UserSupplement, 'id' | 'is_active'>) => void;
  onDeleteSupplement: (id: string) => void;
  onToggleTaken: (supplementId: string) => void;
}

export const SupplementsSection = ({
  supplements,
  supplementLogs,
  onAddSupplement,
  onDeleteSupplement,
  onToggleTaken
}: SupplementsSectionProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newTiming, setNewTiming] = useState('morning');

  const timingOptions = [
    { value: 'morning', label: 'Mañana', icon: <Sun className="w-4 h-4" /> },
    { value: 'pre_workout', label: 'Pre-entreno', icon: <Dumbbell className="w-4 h-4" /> },
    { value: 'post_workout', label: 'Post-entreno', icon: <Dumbbell className="w-4 h-4" /> },
    { value: 'night', label: 'Noche', icon: <Moon className="w-4 h-4" /> }
  ];

  const handleAdd = () => {
    if (newName.trim()) {
      onAddSupplement({
        name: newName.trim(),
        dosage: newDosage.trim() || undefined,
        timing: newTiming
      });
      setNewName('');
      setNewDosage('');
      setNewTiming('morning');
      setShowAddForm(false);
    }
  };

  const isSupplementTaken = (supplementId: string) => {
    return supplementLogs.some(log => log.supplement_id === supplementId);
  };

  const getTimingIcon = (timing?: string) => {
    const option = timingOptions.find(opt => opt.value === timing);
    return option?.icon || <Clock className="w-4 h-4" />;
  };

  const getTimingLabel = (timing?: string) => {
    const option = timingOptions.find(opt => opt.value === timing);
    return option?.label || timing;
  };

  // Group supplements by timing
  const groupedSupplements = timingOptions.map(timing => ({
    ...timing,
    supplements: supplements.filter(s => s.timing === timing.value)
  })).filter(group => group.supplements.length > 0);

  const takenCount = supplements.filter(s => isSupplementTaken(s.id)).length;
  const totalCount = supplements.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="gradient-primary rounded-xl p-3">
            <Pill className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Suplementación</h2>
            <p className="text-sm text-muted-foreground">
              {takenCount}/{totalCount} tomados hoy
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Añadir
        </Button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="gradient-card rounded-xl border border-border p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso del día</span>
            <span className="font-semibold text-foreground">
              {Math.round((takenCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(takenCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full gradient-primary rounded-full"
            />
          </div>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="gradient-card rounded-xl border border-border p-4 space-y-3"
          >
            <h3 className="font-semibold text-foreground">Nuevo suplemento</h3>
            <Input
              placeholder="Nombre del suplemento"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="Dosis (ej: 5g, 2 cápsulas)"
              value={newDosage}
              onChange={(e) => setNewDosage(e.target.value)}
            />
            <Select value={newTiming} onValueChange={setNewTiming}>
              <SelectTrigger>
                <SelectValue placeholder="Momento del día" />
              </SelectTrigger>
              <SelectContent>
                {timingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1">
                Añadir
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supplements list grouped by timing */}
      {groupedSupplements.length > 0 ? (
        <div className="space-y-4">
          {groupedSupplements.map((group, groupIndex) => (
            <motion.div
              key={group.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                {group.icon}
                <h3 className="font-semibold text-foreground text-sm">{group.label}</h3>
              </div>
              <div className="space-y-2">
                {group.supplements.map((supplement, index) => {
                  const isTaken = isSupplementTaken(supplement.id);
                  return (
                    <motion.div
                      key={supplement.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                      className={`gradient-card rounded-xl border p-4 transition-all ${
                        isTaken ? 'border-primary/50 bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onToggleTaken(supplement.id)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              isTaken 
                                ? 'bg-primary border-primary text-primary-foreground' 
                                : 'border-muted-foreground/30 hover:border-primary'
                            }`}
                          >
                            {isTaken && <Check className="w-4 h-4" />}
                          </button>
                          <div>
                            <p className={`font-medium ${isTaken ? 'text-primary' : 'text-foreground'}`}>
                              {supplement.name}
                            </p>
                            {supplement.dosage && (
                              <p className="text-xs text-muted-foreground">{supplement.dosage}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => onDeleteSupplement(supplement.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Pill className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No tienes suplementos añadidos</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setShowAddForm(true)}
          >
            Añadir tu primer suplemento
          </Button>
        </motion.div>
      )}
    </div>
  );
};
