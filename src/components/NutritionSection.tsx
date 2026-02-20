import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, Target, Pill, ChefHat, Sparkles, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNutritionData } from '@/hooks/useNutritionData';
import { FoodLogSection } from './nutrition/FoodLogSection';
import { NutritionGoalsSection } from './nutrition/NutritionGoalsSection';
import { SupplementsSection } from './nutrition/SupplementsSection';
import { RecipesSection } from './nutrition/RecipesSection';
import { NutritionAssistantPro } from './nutrition/NutritionAssistantPro';
import { NutritionStatusSection } from './nutrition/NutritionStatusSection';
import { CollapsibleSection } from './CollapsibleSection';
import { useTranslation } from 'react-i18next';

type NutritionTab = 'log' | 'goals' | 'supplements' | 'recipes' | 'designer';

export const NutritionSection = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<NutritionTab>('log');
  const [showDesigner, setShowDesigner] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  
  const {
    loading, foodCatalog, foodLogs, goals, supplements, supplementLogs, recipes,
    dailyTotals, selectedDate, setSelectedDate, addFoodLog, deleteFoodLog,
    updateGoals, addSupplement, deleteSupplement, toggleSupplementTaken
  } = useNutritionData();

  const tabs = [
    { id: 'log' as const, label: t('nutritionTabs.log'), icon: UtensilsCrossed },
    { id: 'goals' as const, label: t('nutritionTabs.goals'), icon: Target },
    { id: 'supplements' as const, label: t('nutritionTabs.supplements'), icon: Pill },
    { id: 'recipes' as const, label: t('nutritionTabs.recipes'), icon: ChefHat },
    { id: 'designer' as const, label: t('nutritionTabs.designer'), icon: Sparkles }
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
                  isActive ? "gradient-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'log' && (
            <div className="space-y-4">
              <CollapsibleSection
                isOpen={statusOpen}
                onToggle={() => setStatusOpen(!statusOpen)}
                icon={BarChart3}
                title={t('nutritionTabs.nutritionStatus')}
                subtitle={t('nutritionTabs.nutritionStatusSubtitle')}
                gradient="from-emerald-600 to-teal-600"
                delay={0.05}
              >
                <NutritionStatusSection goals={goals} onNavigateToGoals={() => setActiveTab('goals')} onNavigateToDay={(date) => { setSelectedDate(date); setStatusOpen(false); }} refreshTrigger={foodLogs.length} />
              </CollapsibleSection>
              <FoodLogSection foodLogs={foodLogs} foodCatalog={foodCatalog} goals={goals} dailyTotals={dailyTotals} selectedDate={selectedDate} onDateChange={setSelectedDate} onAddFood={addFoodLog} onDeleteLog={deleteFoodLog} />
            </div>
          )}
          {activeTab === 'goals' && <NutritionGoalsSection goals={goals} onUpdateGoals={updateGoals} />}
          {activeTab === 'supplements' && <SupplementsSection supplements={supplements} supplementLogs={supplementLogs} onAddSupplement={addSupplement} onDeleteSupplement={deleteSupplement} onToggleTaken={toggleSupplementTaken} />}
          {activeTab === 'recipes' && <RecipesSection recipes={recipes} />}
          {activeTab === 'designer' && (
            <NutritionAssistantPro
              onClose={() => setActiveTab('log')}
              onPlanCreated={(plan) => {
                const firstDay = plan.days[0];
                if (firstDay) {
                  updateGoals({ daily_calories: firstDay.targetCalories, daily_protein: firstDay.macros.protein, daily_carbs: firstDay.macros.carbs, daily_fat: firstDay.macros.fat });
                }
                setActiveTab('goals');
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};