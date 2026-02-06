import { motion } from 'framer-motion';
import { Dumbbell, Waves, Timer, Moon } from 'lucide-react';
import type { ActivityType } from './types';

interface ActivityBadgeProps {
  activity: ActivityType;
  duration?: number;
  size?: 'sm' | 'md' | 'lg';
  showCalories?: boolean;
}

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: typeof Dumbbell;
  label: string;
  emoji: string;
  gradient: string;
  caloriesPerMin: number;
}> = {
  gym: {
    icon: Dumbbell,
    label: 'Gimnasio',
    emoji: '🏋️',
    gradient: 'from-red-500 to-orange-500',
    caloriesPerMin: 6.5
  },
  swimming: {
    icon: Waves,
    label: 'Natación',
    emoji: '🏊',
    gradient: 'from-blue-500 to-cyan-500',
    caloriesPerMin: 9
  },
  running: {
    icon: Timer,
    label: 'Running',
    emoji: '🏃',
    gradient: 'from-green-500 to-emerald-500',
    caloriesPerMin: 10
  },
  rest: {
    icon: Moon,
    label: 'Descanso',
    emoji: '😴',
    gradient: 'from-gray-500 to-slate-500',
    caloriesPerMin: 0
  }
};

const SIZE_CLASSES = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-14 h-14 text-2xl',
  lg: 'w-20 h-20 text-4xl'
};

export const ActivityBadge = ({ 
  activity, 
  duration, 
  size = 'md',
  showCalories = false 
}: ActivityBadgeProps) => {
  const config = ACTIVITY_CONFIG[activity];
  const estimatedCalories = duration ? Math.round(duration * config.caloriesPerMin) : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-1"
    >
      <motion.div
        className={`${SIZE_CLASSES[size]} rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <motion.span
          animate={{ 
            y: [0, -3, 0],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: 'easeInOut'
          }}
        >
          {config.emoji}
        </motion.span>
      </motion.div>
      
      <span className="text-xs font-medium text-center">{config.label}</span>
      
      {duration && (
        <span className="text-[10px] text-muted-foreground">{duration} min</span>
      )}
      
      {showCalories && estimatedCalories > 0 && (
        <motion.span 
          className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-600 rounded-full"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          ~{estimatedCalories} kcal
        </motion.span>
      )}
    </motion.div>
  );
};

interface ActivityGridProps {
  activities: ActivityType[];
  durations?: Record<ActivityType, number>;
  size?: 'sm' | 'md' | 'lg';
}

export const ActivityGrid = ({ activities, durations, size = 'md' }: ActivityGridProps) => {
  return (
    <div className="flex gap-2 justify-center">
      {activities.map((activity, idx) => (
        <motion.div
          key={activity}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <ActivityBadge
            activity={activity}
            duration={durations?.[activity]}
            size={size}
            showCalories={!!durations}
          />
        </motion.div>
      ))}
    </div>
  );
};
