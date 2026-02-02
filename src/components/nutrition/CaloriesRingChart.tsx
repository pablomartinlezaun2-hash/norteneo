import { motion } from 'framer-motion';

interface CaloriesRingChartProps {
  consumed: number;
  target: number;
}

export const CaloriesRingChart = ({ consumed, target }: CaloriesRingChartProps) => {
  const percentage = Math.min((consumed / target) * 100, 100);
  const remaining = Math.max(target - consumed, 0);
  const isOver = consumed > target;
  
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="hsl(var(--secondary))"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke={isOver ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-3xl font-bold ${isOver ? 'text-destructive' : 'text-foreground'}`}
          >
            {consumed}
          </motion.span>
          <span className="text-xs text-muted-foreground">de {target} kcal</span>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className={`text-lg font-semibold ${isOver ? 'text-destructive' : 'text-primary'}`}>
          {isOver ? `+${consumed - target} kcal de más` : `${remaining} kcal restantes`}
        </p>
      </div>
    </div>
  );
};
