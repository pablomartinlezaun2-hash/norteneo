import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Flame, Beef, Wheat, Droplets, Clock } from 'lucide-react';
import type { DayNutritionPlan } from './types';
import { getActivityIcon, getActivityColor } from './calculations';

interface DayPlanCardProps {
  day: DayNutritionPlan;
  expanded: boolean;
  onToggle: () => void;
}

export const DayPlanCard = ({ day, expanded, onToggle }: DayPlanCardProps) => {
  return (
    <motion.div
      layout
      className={`bg-card rounded-xl border overflow-hidden ${
        day.isRestDay 
          ? 'border-gray-500/30' 
          : day.activities.length > 1 
            ? 'border-purple-500/50 bg-purple-500/5' 
            : 'border-green-500/50 bg-green-500/5'
      }`}
    >
      {/* Header - Always visible */}
      <button 
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">{day.day}</span>
          <div className="flex gap-0.5">
            {day.activities.map((activity, i) => (
              <span key={i} className="text-sm">{getActivityIcon(activity)}</span>
            ))}
          </div>
          {day.activities.length > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500 text-white">
              Combinado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${
            day.isRestDay ? 'text-gray-500' : 'text-green-500'
          }`}>
            {day.targetCalories} kcal
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Macros bar */}
      <div className="px-3 pb-2 flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {day.macros.protein}g P
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          {day.macros.carbs}g C
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          {day.macros.fat}g G
        </span>
        {day.adjustment !== 0 && (
          <span className={`ml-auto font-medium ${
            day.adjustment > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {day.adjustment > 0 ? '+' : ''}{day.adjustment} kcal
          </span>
        )}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-3 space-y-2">
              {/* TDEE breakdown */}
              <div className="bg-muted/50 rounded-lg p-2 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-muted-foreground">BMR</p>
                    <p className="font-medium">{day.bmr}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Actividad</p>
                    <p className="font-medium text-orange-500">+{day.activityCalories}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pasos</p>
                    <p className="font-medium text-blue-500">+{day.stepsCalories}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border flex justify-between">
                  <span className="text-muted-foreground">TDEE Total</span>
                  <span className="font-bold">{day.tdee} kcal</span>
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Comidas</h4>
                {day.meals.map((meal, idx) => (
                  <div key={idx} className="bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{meal.name}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {meal.time}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-orange-500">{meal.calories} kcal</span>
                    </div>
                    
                    {/* Meal macros */}
                    <div className="flex gap-2 text-[10px] mb-2">
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-600 rounded">
                        P: {meal.protein}g
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-600 rounded">
                        C: {meal.carbs}g
                      </span>
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 rounded">
                        G: {meal.fat}g
                      </span>
                    </div>
                    
                    {/* Foods */}
                    <div className="space-y-1">
                      {meal.foods.map((food, foodIdx) => (
                        <div key={foodIdx} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {food.name} ({food.quantity}{food.unit})
                          </span>
                          <span>{food.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
