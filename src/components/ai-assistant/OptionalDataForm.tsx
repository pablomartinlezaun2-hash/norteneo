import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Scale, Ruler, Calendar, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from './types';

interface OptionalDataFormProps {
  onSubmit: (data: Partial<UserProfile>) => void;
  onSkip: () => void;
}

const commonInjuries = ['Espalda baja', 'Rodillas', 'Hombros', 'Cuello', 'Muñecas'];
const commonEquipment = ['Mancuernas', 'Barra', 'Máquinas', 'Bandas', 'Kettlebells', 'Solo cuerpo'];

export const OptionalDataForm = ({ onSubmit, onSkip }: OptionalDataFormProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<Partial<UserProfile>>({
    injuries: [],
    equipment: [],
  });

  const toggleInjury = (injury: string) => {
    setData(prev => ({
      ...prev,
      injuries: prev.injuries?.includes(injury)
        ? prev.injuries.filter(i => i !== injury)
        : [...(prev.injuries || []), injury]
    }));
  };

  const toggleEquipment = (equip: string) => {
    setData(prev => ({
      ...prev,
      equipment: prev.equipment?.includes(equip)
        ? prev.equipment.filter(e => e !== equip)
        : [...(prev.equipment || []), equip]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Quick data inputs */}
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Edad
            </label>
            <Input
              type="number"
              placeholder="25"
              className="h-9 text-sm"
              onChange={(e) => setData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Scale className="w-3 h-3" /> Peso (kg)
            </label>
            <Input
              type="number"
              placeholder="70"
              className="h-9 text-sm"
              onChange={(e) => setData(prev => ({ ...prev, weight: parseInt(e.target.value) || undefined }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Ruler className="w-3 h-3" /> Altura (cm)
            </label>
            <Input
              type="number"
              placeholder="175"
              className="h-9 text-sm"
              onChange={(e) => setData(prev => ({ ...prev, height: parseInt(e.target.value) || undefined }))}
            />
          </div>
        </div>

        {/* Expandable section */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Lesiones y equipamiento
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            {/* Injuries */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">¿Alguna lesión o molestia?</label>
              <div className="flex flex-wrap gap-1.5">
                {commonInjuries.map(injury => (
                  <Badge
                    key={injury}
                    variant={data.injuries?.includes(injury) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleInjury(injury)}
                  >
                    {injury}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Equipamiento disponible</label>
              <div className="flex flex-wrap gap-1.5">
                {commonEquipment.map(equip => (
                  <Badge
                    key={equip}
                    variant={data.equipment?.includes(equip) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleEquipment(equip)}
                  >
                    {equip}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Days per week */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Días por semana</label>
              <div className="flex gap-1">
                {[2, 3, 4, 5, 6].map(days => (
                  <button
                    key={days}
                    onClick={() => setData(prev => ({ ...prev, daysPerWeek: days }))}
                    className={`w-9 h-9 rounded-lg border-2 text-sm font-semibold transition-all ${
                      data.daysPerWeek === days
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 p-3 pt-0">
        <Button variant="outline" size="sm" onClick={onSkip} className="flex-1">
          Saltar
        </Button>
        <Button size="sm" onClick={() => onSubmit(data)} className="flex-1 gradient-primary">
          Continuar
        </Button>
      </div>
    </motion.div>
  );
};
