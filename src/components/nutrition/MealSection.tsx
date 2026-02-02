import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FoodSearchInput } from './FoodSearchInput';
import { FoodItem, FoodLog } from '@/hooks/useNutritionData';

interface MealSectionProps {
  title: string;
  icon: React.ReactNode;
  mealType: string;
  logs: FoodLog[];
  foods: FoodItem[];
  onAddFood: (food: FoodItem, quantity: number) => void;
  onDeleteLog: (id: string) => void;
}

export const MealSection = ({
  title,
  icon,
  mealType,
  logs,
  foods,
  onAddFood,
  onDeleteLog
}: MealSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const mealLogs = logs.filter(log => log.meal_type === mealType);
  const totalCalories = mealLogs.reduce((sum, log) => sum + log.calories, 0);

  return (
    <div className="gradient-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="gradient-primary rounded-lg p-2 text-primary-foreground">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {mealLogs.length} alimentos · {totalCalories} kcal
            </p>
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Food list */}
              {mealLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{log.food_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.quantity}g · P: {log.protein}g · C: {log.carbs}g · G: {log.fat}g
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{log.calories} kcal</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteLog(log.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}

              {/* Add food */}
              {showSearch ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FoodSearchInput
                    foods={foods}
                    onSelect={(food, quantity) => {
                      onAddFood(food, quantity);
                      setShowSearch(false);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowSearch(false)}
                  >
                    Cancelar
                  </Button>
                </motion.div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setShowSearch(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir alimento
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
