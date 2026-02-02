import { Coffee, Utensils, Cookie, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { CaloriesRingChart } from './CaloriesRingChart';
import { MacroProgressChart } from './MacroProgressChart';
import { MealSection } from './MealSection';
import { FoodItem, FoodLog, NutritionGoals } from '@/hooks/useNutritionData';

interface FoodLogSectionProps {
  foodLogs: FoodLog[];
  foodCatalog: FoodItem[];
  goals: NutritionGoals | null;
  dailyTotals: { calories: number; protein: number; carbs: number; fat: number };
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddFood: (food: FoodItem, mealType: string, quantity: number) => void;
  onDeleteLog: (id: string) => void;
}

export const FoodLogSection = ({
  foodLogs,
  foodCatalog,
  goals,
  dailyTotals,
  selectedDate,
  onDateChange,
  onAddFood,
  onDeleteLog
}: FoodLogSectionProps) => {
  const defaultGoals = {
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 250,
    daily_fat: 70
  };

  const currentGoals = goals || defaultGoals;

  const meals = [
    { id: 'breakfast', title: 'Desayuno', icon: <Coffee className="w-4 h-4" /> },
    { id: 'lunch', title: 'Comida', icon: <Utensils className="w-4 h-4" /> },
    { id: 'snack', title: 'Merienda', icon: <Cookie className="w-4 h-4" /> },
    { id: 'dinner', title: 'Cena', icon: <Moon className="w-4 h-4" /> }
  ];

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateChange(subDays(selectedDate, 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <motion.div
          key={selectedDate.toISOString()}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="font-semibold text-foreground">
            {isToday ? 'Hoy' : format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </motion.div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateChange(addDays(selectedDate, 1))}
          disabled={isToday}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calories ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="gradient-card rounded-2xl border border-border p-6"
      >
        <CaloriesRingChart
          consumed={dailyTotals.calories}
          target={currentGoals.daily_calories}
        />
      </motion.div>

      {/* Macros progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="gradient-card rounded-2xl border border-border p-4 space-y-4"
      >
        <h3 className="font-semibold text-foreground">Macronutrientes</h3>
        <MacroProgressChart
          label="Proteínas"
          current={dailyTotals.protein}
          target={currentGoals.daily_protein}
          color="hsl(142 76% 36%)"
        />
        <MacroProgressChart
          label="Carbohidratos"
          current={dailyTotals.carbs}
          target={currentGoals.daily_carbs}
          color="hsl(211 100% 50%)"
        />
        <MacroProgressChart
          label="Grasas"
          current={dailyTotals.fat}
          target={currentGoals.daily_fat}
          color="hsl(38 92% 50%)"
        />
      </motion.div>

      {/* Meals */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Comidas del día</h3>
        {meals.map((meal, index) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.05 }}
          >
            <MealSection
              title={meal.title}
              icon={meal.icon}
              mealType={meal.id}
              logs={foodLogs}
              foods={foodCatalog}
              onAddFood={(food, quantity) => onAddFood(food, meal.id, quantity)}
              onDeleteLog={onDeleteLog}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
