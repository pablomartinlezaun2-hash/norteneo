import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Edit2, Sparkles, Flame } from 'lucide-react';
import type { DayNutritionPlan, FoodItem } from './types';
import { getActivityIcon } from './calculations';
import { FoodSubstitutionModal } from './FoodSubstitutionModal';
import { SubstitutionFeedback } from './SubstitutionFeedback';
import { ActivityGrid } from './ActivityBadge';

interface EnhancedDayPlanCardProps {
  day: DayNutritionPlan;
  expanded: boolean;
  onToggle: () => void;
  onUpdateMeal: (mealIndex: number, newFoods: FoodItem[]) => void;
  allergies: string[];
}

// Food emoji mapping
const FOOD_EMOJIS: Record<string, string> = {
  'pechuga de pollo': '🍗',
  'ternera magra': '🥩',
  'salmón': '🐟',
  'atún en lata': '🐟',
  'huevos enteros': '🥚',
  'claras de huevo': '🥚',
  'pavo': '🦃',
  'merluza': '🐟',
  'gambas': '🦐',
  'tofu': '🧈',
  'arroz blanco': '🍚',
  'arroz integral': '🍚',
  'patata': '🥔',
  'boniato': '🍠',
  'pasta integral': '🍝',
  'pan integral': '🍞',
  'avena': '🥣',
  'quinoa': '🌾',
  'legumbres cocidas': '🫘',
  'aceite de oliva': '🫒',
  'aguacate': '🥑',
  'almendras': '🥜',
  'nueces': '🥜',
  'crema de cacahuete': '🥜',
  'yogur griego': '🥛',
  'queso fresco batido': '🧀',
  'leche desnatada': '🥛',
  'brócoli': '🥦',
  'espinacas': '🥬',
  'pimientos': '🫑',
  'tomate': '🍅',
  'calabacín': '🥒',
  'champiñones': '🍄',
  'plátano': '🍌',
  'manzana': '🍎',
  'fresas': '🍓',
  'arándanos': '🫐',
};

const getFoodEmoji = (foodName: string): string => {
  const key = foodName.toLowerCase();
  return FOOD_EMOJIS[key] || '🍽️';
};

export const EnhancedDayPlanCard = ({ 
  day, 
  expanded, 
  onToggle,
  onUpdateMeal,
  allergies 
}: EnhancedDayPlanCardProps) => {
  const [substitutionModal, setSubstitutionModal] = useState<{
    isOpen: boolean;
    mealIndex: number;
    food: FoodItem | null;
  }>({ isOpen: false, mealIndex: 0, food: null });

  const [feedback, setFeedback] = useState<{
    visible: boolean;
    oldFood: string;
    newFood: string;
    calorieChange: number;
  }>({ visible: false, oldFood: '', newFood: '', calorieChange: 0 });

  const handleFoodClick = useCallback((mealIndex: number, food: FoodItem) => {
    setSubstitutionModal({ isOpen: true, mealIndex, food });
  }, []);

  const handleSubstitution = useCallback((newFood: FoodItem, adjustedFoods: FoodItem[]) => {
    const oldCalories = substitutionModal.food?.calories || 0;
    const newCalories = newFood.calories;
    
    // Show feedback
    setFeedback({
      visible: true,
      oldFood: substitutionModal.food?.name || '',
      newFood: newFood.name,
      calorieChange: newCalories - oldCalories
    });
    
    onUpdateMeal(substitutionModal.mealIndex, adjustedFoods);
  }, [substitutionModal, onUpdateMeal]);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card rounded-2xl border-2 overflow-hidden shadow-lg transition-all ${
          day.isRestDay 
            ? 'border-gray-500/30' 
            : day.activities.length > 1 
              ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5' 
              : 'border-green-500/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5'
        }`}
      >
        {/* Header */}
        <button 
          onClick={onToggle}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
              day.isRestDay 
                ? 'bg-gray-500/20' 
                : day.activities.length > 1 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-500'
            }`}>
              {day.activities.map((a, i) => (
                <span key={i} className={i > 0 ? '-ml-2' : ''}>{getActivityIcon(a)}</span>
              ))}
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{day.day}</span>
                {day.activities.length > 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500 text-white font-medium">
                    COMBO
                  </span>
                )}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
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
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-xl font-bold ${
                day.isRestDay ? 'text-gray-500' : 'text-green-500'
              }`}>
                {day.targetCalories}
              </div>
              <div className="text-xs text-muted-foreground">kcal</div>
            </div>
            
            {day.adjustment !== 0 && (
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                day.adjustment > 0 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-red-500/20 text-red-500'
              }`}>
                {day.adjustment > 0 ? '+' : ''}{day.adjustment}
              </div>
            )}
            
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-border"
            >
              <div className="p-4 space-y-4">
                {/* TDEE Breakdown */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium">Desglose TDEE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-card rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">BMR</p>
                      <p className="font-bold text-sm">{day.bmr}</p>
                    </div>
                    <div className="bg-card rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Actividad</p>
                      <p className="font-bold text-sm text-orange-500">+{day.activityCalories}</p>
                    </div>
                    <div className="bg-card rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Pasos</p>
                      <p className="font-bold text-sm text-blue-500">+{day.stepsCalories}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Total TDEE</span>
                    <span className="font-bold">{day.tdee} kcal</span>
                  </div>
                </motion.div>

                {/* Meals */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <h4 className="font-semibold text-sm">Comidas del día</h4>
                    <span className="text-xs text-muted-foreground">(toca un alimento para cambiarlo)</span>
                  </div>
                  
                  {day.meals.map((meal, mealIdx) => (
                    <motion.div 
                      key={mealIdx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + mealIdx * 0.05 }}
                      className="bg-muted/30 rounded-xl p-3 border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{meal.name}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {meal.time}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-orange-500">{meal.calories} kcal</span>
                      </div>
                      
                      {/* Meal macros */}
                      <div className="flex gap-2 mb-3">
                        <span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-600 rounded-full">
                          P: {meal.protein}g
                        </span>
                        <span className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-600 rounded-full">
                          C: {meal.carbs}g
                        </span>
                        <span className="text-[10px] px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-full">
                          G: {meal.fat}g
                        </span>
                      </div>
                      
                      {/* Foods - Interactive */}
                      <div className="space-y-2">
                        {meal.foods.map((food, foodIdx) => (
                          <motion.button
                            key={foodIdx}
                            onClick={() => handleFoodClick(mealIdx, food)}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-between p-2 rounded-lg bg-card hover:bg-orange-500/10 transition-colors text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl group-hover:scale-110 transition-transform">
                                {getFoodEmoji(food.name)}
                              </span>
                              <div>
                                <span className="text-sm">{food.name}</span>
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({food.quantity}{food.unit})
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{food.calories} kcal</span>
                              <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </motion.button>
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
        <FoodSubstitutionModal
          isOpen={substitutionModal.isOpen}
          onClose={() => setSubstitutionModal({ isOpen: false, mealIndex: 0, food: null })}
          currentFood={substitutionModal.food}
          onSubstitute={handleSubstitution}
          mealFoods={day.meals[substitutionModal.mealIndex]?.foods || []}
          targetMacros={day.macros}
          allergies={allergies}
        />
      )}

      {/* Substitution Feedback */}
      <SubstitutionFeedback
        isVisible={feedback.visible}
        oldFood={feedback.oldFood}
        newFood={feedback.newFood}
        calorieChange={feedback.calorieChange}
        onComplete={() => setFeedback(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
};
