import { motion } from 'framer-motion';

interface MacroProgressChartProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export const MacroProgressChart = ({ 
  label, 
  current, 
  target, 
  color,
  unit = 'g' 
}: MacroProgressChartProps) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isOver = current > target;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={`text-xs ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
          {current.toFixed(0)}/{target}{unit}
        </span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: isOver ? 'hsl(var(--destructive))' : color }}
        />
      </div>
    </div>
  );
};
