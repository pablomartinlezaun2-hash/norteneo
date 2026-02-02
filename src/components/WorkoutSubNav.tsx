import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WorkoutSession {
  id: string;
  short_name: string;
}

interface WorkoutSubNavProps {
  sessions: WorkoutSession[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export const WorkoutSubNav = ({ sessions, activeIndex, onSelect }: WorkoutSubNavProps) => {
  return (
    <motion.div 
      className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {sessions.map((session, index) => (
        <motion.button
          key={session.id}
          onClick={() => onSelect(index)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
            activeIndex === index
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          {session.short_name}
        </motion.button>
      ))}
    </motion.div>
  );
};
