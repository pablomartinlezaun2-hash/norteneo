import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, Target, Pill, ChefHat, Sparkles, BarChart3, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNutritionData } from '@/hooks/useNutritionData';
import { FoodLogSection } from './nutrition/FoodLogSection';
import { NutritionGoalsSection } from './nutrition/NutritionGoalsSection';
import { SupplementsSection } from './nutrition/SupplementsSection';
import { RecipesSection } from './nutrition/RecipesSection';
import { NutritionAssistantPro } from './nutrition/NutritionAssistantPro';
import { NutritionStatusSection } from './nutrition/NutritionStatusSection';
import { SleepLogSection } from './nutrition/SleepLogSection';
import { CollapsibleSection } from './CollapsibleSection';
import { useTranslation } from 'react-i18next';

type NutritionTab = 'log' | 'goals' | 'supplements' | 'recipes' | 'designer' | 'sleep';

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

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
    { id: 'sleep' as const, label: t('nutritionTabs.sleep'), icon: Moon },
    { id: 'designer' as const, label: t('nutritionTabs.designer'), icon: Sparkles }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Tab bar */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-2xl py-2.5 -mx-5 px-5">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={isActive ? 'neo-tab-active' : 'neo-tab'}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease }}
        >
          {activeTab === 'log' && (
            <div className="space-y-3">
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
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3, ease }}
              >
                <FoodLogSection foodLogs={foodLogs} foodCatalog={foodCatalog} goals={goals} dailyTotals={dailyTotals} selectedDate={selectedDate} onDateChange={setSelectedDate} onAddFood={addFoodLog} onDeleteLog={deleteFoodLog} />
              </motion.div>
            </div>
          )}
          {activeTab === 'goals' && <NutritionGoalsSection goals={goals} onUpdateGoals={updateGoals} />}
          {activeTab === 'supplements' && <SupplementsSection supplements={supplements} supplementLogs={supplementLogs} onAddSupplement={addSupplement} onDeleteSupplement={deleteSupplement} onToggleTaken={toggleSupplementTaken} />}
          {activeTab === 'recipes' && <RecipesSection recipes={recipes} />}
          {activeTab === 'sleep' && <SleepLogSection />}
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
    </motion.div>
  );
};
