import { useState, useEffect, useRef } from 'react';
import { Minus, Plus, Dumbbell, Waves, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityType } from './types';

interface MinimalDurationInputProps {
  activity: ActivityType;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const ACTIVITY_CONFIG: Record<Exclude<ActivityType, 'rest'>, { 
  icon: typeof Dumbbell; 
  label: string;
  caloriesPerMin: number;
}> = {
  gym: { icon: Dumbbell, label: 'Fuerza', caloriesPerMin: 6.5 },
  swimming: { icon: Waves, label: 'Natación', caloriesPerMin: 9 },
  running: { icon: Activity, label: 'Running', caloriesPerMin: 10 }
};

const QUICK_DURATIONS = [30, 45, 60, 90];

export const MinimalDurationInput = ({ 
  activity, 
  value, 
  onChange,
  min = 5,
  max = 180
}: MinimalDurationInputProps) => {
  if (activity === 'rest') return null;
  
  const config = ACTIVITY_CONFIG[activity];
  const Icon = config.icon;
  const estimatedCalories = Math.round(value * config.caloriesPerMin);
  
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);
    
    const num = parseInt(rawValue, 10);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < min) {
      setInputValue(min.toString());
      onChange(min);
    } else if (num > max) {
      setInputValue(max.toString());
      onChange(max);
    } else {
      setInputValue(num.toString());
      onChange(num);
    }
  };

  const adjustValue = (delta: number) => {
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between gap-2">
        {/* Activity label */}
        <div className="flex items-center gap-2 min-w-[80px]">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{config.label}</span>
        </div>
        
        {/* Duration controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => adjustValue(-5)}
            className="w-7 h-7 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={cn(
              "w-12 h-7 text-center text-sm font-medium rounded-lg",
              "bg-secondary/30 border-0",
              "focus:outline-none focus:ring-1 focus:ring-primary"
            )}
          />
          
          <span className="text-xs text-muted-foreground mr-1">min</span>
          
          <button
            onClick={() => adjustValue(5)}
            className="w-7 h-7 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        
        {/* Estimated calories */}
        <span className="text-xs text-primary font-medium min-w-[60px] text-right">
          ~{estimatedCalories} kcal
        </span>
      </div>
      
      {/* Quick duration buttons */}
      <div className="flex gap-1 mt-1.5 pl-6">
        {QUICK_DURATIONS.map((duration) => (
          <button
            key={duration}
            onClick={() => {
              onChange(duration);
              setInputValue(duration.toString());
            }}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
              value === duration
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
            )}
          >
            {duration}'
          </button>
        ))}
      </div>
    </div>
  );
};
