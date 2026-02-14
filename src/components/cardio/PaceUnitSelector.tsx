import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RUNNING_PACE_UNITS, SWIMMING_PACE_UNITS, formatUnitLabel } from './paceUtils';

interface PaceUnitSelectorProps {
  activityType: 'running' | 'swimming';
  value: number;
  onChange: (unitM: number) => void;
}

export const PaceUnitSelector = ({ activityType, value, onChange }: PaceUnitSelectorProps) => {
  const presets = activityType === 'running' ? RUNNING_PACE_UNITS : SWIMMING_PACE_UNITS;
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const isPreset = presets.some(p => p.value === value);
  const currentLabel = isPreset ? String(value) : 'custom';

  const handleSelect = (val: string) => {
    if (val === 'custom') {
      setCustomMode(true);
      return;
    }
    setCustomMode(false);
    onChange(Number(val));
  };

  const handleCustomConfirm = () => {
    const num = parseInt(customValue);
    if (num > 0) {
      onChange(num);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Ritmo por:</span>
      <Select value={customMode ? 'custom' : currentLabel} onValueChange={handleSelect}>
        <SelectTrigger className="h-8 text-xs w-32 bg-background">
          <SelectValue placeholder="Unidad" />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border z-50">
          {presets.map(p => (
            <SelectItem key={p.value} value={String(p.value)} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
          <SelectItem value="custom" className="text-xs">Personalizada</SelectItem>
        </SelectContent>
      </Select>
      {(customMode || !isPreset) && (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="metros"
            value={customValue || (!isPreset ? String(value) : '')}
            onChange={e => setCustomValue(e.target.value)}
            onBlur={handleCustomConfirm}
            onKeyDown={e => e.key === 'Enter' && handleCustomConfirm()}
            className="h-8 w-20 text-xs bg-background"
          />
          <span className="text-xs text-muted-foreground">m</span>
        </div>
      )}
    </div>
  );
};
