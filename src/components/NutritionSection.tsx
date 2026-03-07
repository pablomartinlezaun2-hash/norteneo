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

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

// Each tab content enters with a unique cinematic style
const tabTransitions: Record<NutritionTab, { initial: any; animate: any }> = {
  log: {
    initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)', filter: 'blur(3px)' },
    animate: { opacity: 1, clipPath: 'inset(0 0% 0 0)', filter: 'blur(0px)' },
  },
  goals: {
    initial: { opacity: 0, scale: 0.92, filter: 'blur(5px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  },
  supplements: {
    initial: { opacity: 0, x: 30, filter: 'blur(4px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  },
  recipes: {
    initial: { opacity: 0, y: 20, scale: 0.96, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  },
  designer: {
    initial: { opacity: 0, scale: 0.9, filter: 'blur(6px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  },
};

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

  const currentTransition = tabTransitions[activeTab];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Tab bar with layoutId sliding indicator */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4">
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors duration-200",
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                whileTap={{ scale: 0.96 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nutritionTabBg"
                    className="absolute inset-0 rounded-lg gradient-primary shadow-sm"
                    transition={{ duration: 0.28, ease: premiumEase }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content — cinematic transition per tab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={currentTransition.initial}
          animate={currentTransition.animate}
          exit={{ opacity: 0, filter: 'blur(3px)' }}
          transition={{ duration: 0.45, ease: premiumEase }}
        >
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
              <motion.div
                initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.15, duration: 0.4, ease: premiumEase }}
              >
                <FoodLogSection foodLogs={foodLogs} foodCatalog={foodCatalog} goals={goals} dailyTotals={dailyTotals} selectedDate={selectedDate} onDateChange={setSelectedDate} onAddFood={addFoodLog} onDeleteLog={deleteFoodLog} />
              </motion.div>
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
    </motion.div>
  );
};
