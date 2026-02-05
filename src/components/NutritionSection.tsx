import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, Target, Pill, ChefHat, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNutritionData } from '@/hooks/useNutritionData';
import { FoodLogSection } from './nutrition/FoodLogSection';
import { NutritionGoalsSection } from './nutrition/NutritionGoalsSection';
import { SupplementsSection } from './nutrition/SupplementsSection';
import { RecipesSection } from './nutrition/RecipesSection';
import { NutritionDesigner } from './nutrition/NutritionDesigner';

type NutritionTab = 'log' | 'goals' | 'supplements' | 'recipes' | 'designer';

export const NutritionSection = () => {
  const [activeTab, setActiveTab] = useState<NutritionTab>('log');
  const [showDesigner, setShowDesigner] = useState(false);
  
  const {
    loading,
    foodCatalog,
    foodLogs,
    goals,
    supplements,
    supplementLogs,
    recipes,
    dailyTotals,
    selectedDate,
    setSelectedDate,
    addFoodLog,
    deleteFoodLog,
    updateGoals,
    addSupplement,
    deleteSupplement,
    toggleSupplementTaken
  } = useNutritionData();

  const tabs = [
    { id: 'log' as const, label: 'Registro', icon: UtensilsCrossed },
    { id: 'goals' as const, label: 'Objetivos', icon: Target },
    { id: 'supplements' as const, label: 'Suplem.', icon: Pill },
    { id: 'recipes' as const, label: 'Recetas', icon: ChefHat },
    { id: 'designer' as const, label: 'Diseñar', icon: Sparkles }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab navigation */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4">
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all duration-200",
                  isActive 
                    ? "gradient-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'log' && (
            <FoodLogSection
              foodLogs={foodLogs}
              foodCatalog={foodCatalog}
              goals={goals}
              dailyTotals={dailyTotals}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onAddFood={addFoodLog}
              onDeleteLog={deleteFoodLog}
            />
          )}

          {activeTab === 'goals' && (
            <NutritionGoalsSection
              goals={goals}
              onUpdateGoals={updateGoals}
            />
          )}

          {activeTab === 'supplements' && (
            <SupplementsSection
              supplements={supplements}
              supplementLogs={supplementLogs}
              onAddSupplement={addSupplement}
              onDeleteSupplement={deleteSupplement}
              onToggleTaken={toggleSupplementTaken}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipesSection
              recipes={recipes}
            />
          )}

          {activeTab === 'designer' && (
            <NutritionDesigner
              onClose={() => setActiveTab('log')}
              onPlanCreated={(plan) => {
                // Update goals with the calculated values
                updateGoals({
                  daily_calories: plan.targetCalories,
                  daily_protein: plan.macroDistribution.protein,
                  daily_carbs: plan.macroDistribution.carbs,
                  daily_fat: plan.macroDistribution.fat
                });
                setActiveTab('goals');
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
