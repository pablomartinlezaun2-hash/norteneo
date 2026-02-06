import { motion } from 'framer-motion';
import type { WeeklyNutritionPlan } from './types';
import { getActivityIcon } from './calculations';

interface WeeklyOverviewProps {
  plan: WeeklyNutritionPlan;
  onSelectDay: (index: number) => void;
  selectedDay: number;
}

export const WeeklyOverview = ({ plan, onSelectDay, selectedDay }: WeeklyOverviewProps) => {
  const maxCalories = Math.max(...plan.days.map(d => d.targetCalories));

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <h4 className="font-semibold mb-3">Vista semanal</h4>
      
      <div className="flex gap-1 h-32">
        {plan.days.map((day, idx) => {
          const heightPercent = (day.targetCalories / maxCalories) * 100;
          const isSelected = selectedDay === idx;
          
          return (
            <button
              key={day.day}
              onClick={() => onSelectDay(idx)}
              className={`flex-1 flex flex-col items-center justify-end rounded-lg transition-all ${
                isSelected ? 'bg-orange-500/20' : 'hover:bg-muted'
              }`}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className={`w-full rounded-t-md ${
                  day.isRestDay
                    ? 'bg-gray-400'
                    : day.activities.length > 1
                      ? 'bg-gradient-to-t from-purple-500 to-purple-400'
                      : 'bg-gradient-to-t from-green-500 to-green-400'
                }`}
              />
              
              <div className="py-1 text-center">
                <div className="text-xs flex justify-center gap-0.5 mb-0.5">
                  {day.activities.slice(0, 2).map((a, i) => (
                    <span key={i} className="text-[10px]">{getActivityIcon(a)}</span>
                  ))}
                </div>
                <span className={`text-[10px] font-medium ${
                  isSelected ? 'text-orange-500' : 'text-muted-foreground'
                }`}>
                  {day.day.slice(0, 3)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Entreno
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Combinado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400" /> Descanso
        </span>
      </div>
    </div>
  );
};
