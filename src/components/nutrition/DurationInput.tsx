import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ActivityType } from './types';
import { getActivityIcon, getActivityLabel } from './calculations';

interface DurationInputProps {
  activity: ActivityType;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const DurationInput = ({ 
  activity, 
  value, 
  onChange, 
  min = 5, 
  max = 180 
}: DurationInputProps) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    const numVal = parseInt(val);
    if (!isNaN(numVal) && numVal >= min && numVal <= max) {
      onChange(numVal);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numVal = parseInt(inputValue);
    if (isNaN(numVal) || numVal < min) {
      setInputValue(min.toString());
      onChange(min);
    } else if (numVal > max) {
      setInputValue(max.toString());
      onChange(max);
    } else {
      onChange(numVal);
    }
  };

  const increment = () => {
    const newVal = Math.min(max, value + 5);
    onChange(newVal);
    setInputValue(newVal.toString());
  };

  const decrement = () => {
    const newVal = Math.max(min, value - 5);
    onChange(newVal);
    setInputValue(newVal.toString());
  };

  // Calculate calories burned (approximate)
  const ACTIVITY_CALORIES: Record<ActivityType, number> = {
    gym: 6.5,
    swimming: 9,
    running: 10,
    rest: 0
  };
  const estimatedCalories = Math.round(value * ACTIVITY_CALORIES[activity]);

  return (
    <motion.div 
      className="bg-muted/50 rounded-xl p-3 border border-border"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.span 
            className="text-2xl"
            animate={isFocused ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {getActivityIcon(activity)}
          </motion.span>
          <span className="font-medium text-sm">{getActivityLabel(activity)}</span>
        </div>
        
        {estimatedCalories > 0 && (
          <motion.div 
            className="text-xs px-2 py-1 bg-orange-500/20 text-orange-600 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            key={estimatedCalories}
          >
            ~{estimatedCalories} kcal
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={value <= min}
          className="h-10 w-10 rounded-full shrink-0"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="relative flex-1">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            min={min}
            max={max}
            className="pl-10 pr-14 text-center font-bold text-lg h-10"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
            min
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={value >= max}
          className="h-10 w-10 rounded-full shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick presets */}
      <div className="flex gap-1 mt-2">
        {[30, 45, 60, 90].map((preset) => (
          <motion.button
            key={preset}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onChange(preset);
              setInputValue(preset.toString());
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value === preset 
                ? 'bg-orange-500 text-white' 
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {preset}'
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
