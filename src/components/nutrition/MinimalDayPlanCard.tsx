import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Dumbbell, Waves, Activity, Moon, Flame, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayNutritionPlan, FoodItem, ActivityType } from './types';
import { MinimalFoodSubstitutionModal } from './MinimalFoodSubstitutionModal';

interface MinimalDayPlanCardProps {
  day: DayNutritionPlan;
  expanded: boolean;
  onToggle: () => void;
  onUpdateMeal: (mealIndex: number, newFoods: FoodItem[]) => void;
  allergies: string[];
}

// Activity icons mapping (outline style)
const ACTIVITY_ICONS: Record<ActivityType, typeof Dumbbell> = {
  gym: Dumbbell,
  swimming: Waves,
  running: Activity,
  rest: Moon
};

// Macro colors - subtle and professional
const MACRO_COLORS = {
  protein: 'bg-emerald-500/10 text-emerald-600',
  carbs: 'bg-blue-500/10 text-blue-600',
  fat: 'bg-amber-500/10 text-amber-600'
};

export const MinimalDayPlanCard = ({ 
  day, 
  expanded, 
  onToggle,
  onUpdateMeal,
  allergies 
}: MinimalDayPlanCardProps) => {
  const [substitutionModal, setSubstitutionModal] = useState<{
    isOpen: boolean;
    mealIndex: number;
    food: FoodItem | null;
  }>({ isOpen: false, mealIndex: 0, food: null });

  const handleFoodClick = useCallback((mealIndex: number, food: FoodItem) => {
    setSubstitutionModal({ isOpen: true, mealIndex, food });
  }, []);

  const handleSubstitution = useCallback((newFood: FoodItem, adjustedFoods: FoodItem[]) => {
    onUpdateMeal(substitutionModal.mealIndex, adjustedFoods);
    setSubstitutionModal({ isOpen: false, mealIndex: 0, food: null });
  }, [substitutionModal.mealIndex, onUpdateMeal]);

  const isCombo = day.activities.filter(a => a !== 'rest').length > 1;

  return (
    <>
      <motion.div
        layout
        className={cn(
          "bg-card rounded-xl border overflow-hidden transition-all",
          day.isRestDay 
            ? "border-border" 
            : isCombo 
              ? "border-primary/30" 
              : "border-border"
        )}
      >
        {/* Header */}
        <button 
          onClick={onToggle}
          className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            {/* Day name */}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium">{day.day}</span>
                {isCombo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    Combo
                  </span>
                )}
              </div>
              {/* Activity icons */}
              <div className="flex items-center gap-1 mt-1">
                {day.activities.map((activity, i) => {
                  const Icon = ACTIVITY_ICONS[activity];
                  return (
                    <Icon 
                      key={i} 
                      className={cn(
                        "w-3.5 h-3.5",
                        activity === 'rest' ? "text-muted-foreground" : "text-primary"
                      )} 
                    />
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Calories */}
            <div className="text-right">
              <p className={cn(
                "text-lg font-semibold",
                day.isRestDay ? "text-muted-foreground" : "text-foreground"
              )}>
                {day.targetCalories}
              </p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            
            {/* Adjustment badge */}
            {day.adjustment !== 0 && (
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                day.adjustment > 0 
                  ? "bg-emerald-500/10 text-emerald-600" 
                  : "bg-red-500/10 text-red-600"
              )}>
                {day.adjustment > 0 ? '+' : ''}{day.adjustment}
              </span>
            )}
            
            {/* Chevron */}
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* Macros bar */}
        <div className="px-4 pb-3 flex gap-2 text-xs">
          <span className={cn("px-2 py-1 rounded-md", MACRO_COLORS.protein)}>
            {day.macros.protein}g P
          </span>
          <span className={cn("px-2 py-1 rounded-md", MACRO_COLORS.carbs)}>
            {day.macros.carbs}g C
          </span>
          <span className={cn("px-2 py-1 rounded-md", MACRO_COLORS.fat)}>
            {day.macros.fat}g G
          </span>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border"
            >
              <div className="p-4 space-y-4">
                {/* TDEE breakdown */}
                <div className="bg-secondary/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Desglose energético</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-medium">{day.bmr}</p>
                      <p className="text-[10px] text-muted-foreground">BMR</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">+{day.activityCalories}</p>
                      <p className="text-[10px] text-muted-foreground">Actividad</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-500">+{day.stepsCalories}</p>
                      <p className="text-[10px] text-muted-foreground">Pasos</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border flex justify-between text-sm">
                    <span className="text-muted-foreground">TDEE</span>
                    <span className="font-medium">{day.tdee} kcal</span>
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Comidas</h4>
                  {day.meals.map((meal, mealIdx) => (
                    <motion.div 
                      key={mealIdx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mealIdx * 0.05 }}
                      className="bg-secondary/20 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{meal.name}</span>
                          <span className="text-[10px] text-muted-foreground">{meal.time}</span>
                        </div>
                        <span className="text-sm font-medium">{meal.calories} kcal</span>
                      </div>
                      
                      {/* Meal macros */}
                      <div className="flex gap-1.5 mb-2">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded", MACRO_COLORS.protein)}>
                          P: {meal.protein}g
                        </span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded", MACRO_COLORS.carbs)}>
                          C: {meal.carbs}g
                        </span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded", MACRO_COLORS.fat)}>
                          G: {meal.fat}g
                        </span>
                      </div>
                      
                      {/* Foods - clickable for substitution */}
                      <div className="space-y-1">
                        {meal.foods.map((food, foodIdx) => (
                          <button
                            key={foodIdx}
                            onClick={() => handleFoodClick(mealIdx, food)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-card transition-colors text-left group"
                          >
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              {food.name}
                              <span className="text-xs ml-1 opacity-60">
                                ({food.quantity}{food.unit})
                              </span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{food.calories} kcal</span>
                              <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Substitution Modal */}
      {substitutionModal.food && (
        <MinimalFoodSubstitutionModal
          isOpen={substitutionModal.isOpen}
          onClose={() => setSubstitutionModal({ isOpen: false, mealIndex: 0, food: null })}
          currentFood={substitutionModal.food}
          onSubstitute={handleSubstitution}
          mealFoods={day.meals[substitutionModal.mealIndex]?.foods || []}
          targetMacros={day.macros}
          allergies={allergies}
        />
      )}
    </>
  );
};
