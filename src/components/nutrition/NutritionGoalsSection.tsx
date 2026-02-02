import { useState, useEffect } from 'react';
import { Target, Flame, Beef, Wheat, Droplets, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { NutritionGoals } from '@/hooks/useNutritionData';

interface NutritionGoalsSectionProps {
  goals: NutritionGoals | null;
  onUpdateGoals: (goals: Partial<NutritionGoals>) => void;
}

export const NutritionGoalsSection = ({ goals, onUpdateGoals }: NutritionGoalsSectionProps) => {
  const [calories, setCalories] = useState(goals?.daily_calories || 2000);
  const [protein, setProtein] = useState(goals?.daily_protein || 150);
  const [carbs, setCarbs] = useState(goals?.daily_carbs || 250);
  const [fat, setFat] = useState(goals?.daily_fat || 70);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (goals) {
      setCalories(goals.daily_calories);
      setProtein(goals.daily_protein);
      setCarbs(goals.daily_carbs);
      setFat(goals.daily_fat);
    }
  }, [goals]);

  useEffect(() => {
    const hasChanged = 
      (goals?.daily_calories !== calories) ||
      (goals?.daily_protein !== protein) ||
      (goals?.daily_carbs !== carbs) ||
      (goals?.daily_fat !== fat);
    setHasChanges(hasChanged || !goals);
  }, [calories, protein, carbs, fat, goals]);

  const handleSave = () => {
    onUpdateGoals({
      daily_calories: calories,
      daily_protein: protein,
      daily_carbs: carbs,
      daily_fat: fat
    });
    setHasChanges(false);
  };

  // Calculate macro percentages
  const totalMacroCalories = (protein * 4) + (carbs * 4) + (fat * 9);
  const proteinPercent = Math.round((protein * 4 / totalMacroCalories) * 100) || 0;
  const carbsPercent = Math.round((carbs * 4 / totalMacroCalories) * 100) || 0;
  const fatPercent = Math.round((fat * 9 / totalMacroCalories) * 100) || 0;

  const goalItems = [
    {
      icon: <Flame className="w-5 h-5" />,
      label: 'Calorías diarias',
      value: calories,
      setValue: setCalories,
      min: 1000,
      max: 5000,
      step: 50,
      unit: 'kcal',
      color: 'hsl(var(--primary))'
    },
    {
      icon: <Beef className="w-5 h-5" />,
      label: 'Proteínas',
      value: protein,
      setValue: setProtein,
      min: 50,
      max: 400,
      step: 5,
      unit: 'g',
      color: 'hsl(142 76% 36%)'
    },
    {
      icon: <Wheat className="w-5 h-5" />,
      label: 'Carbohidratos',
      value: carbs,
      setValue: setCarbs,
      min: 50,
      max: 600,
      step: 5,
      unit: 'g',
      color: 'hsl(211 100% 50%)'
    },
    {
      icon: <Droplets className="w-5 h-5" />,
      label: 'Grasas',
      value: fat,
      setValue: setFat,
      min: 20,
      max: 200,
      step: 5,
      unit: 'g',
      color: 'hsl(38 92% 50%)'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="gradient-primary rounded-xl p-3">
          <Target className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Objetivos Nutricionales</h2>
          <p className="text-sm text-muted-foreground">Personaliza tus metas diarias</p>
        </div>
      </div>

      {/* Macro distribution visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-card rounded-2xl border border-border p-4"
      >
        <h3 className="font-semibold text-foreground mb-3">Distribución de macros</h3>
        <div className="h-4 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${proteinPercent}%` }}
            transition={{ duration: 0.5 }}
            className="h-full"
            style={{ backgroundColor: 'hsl(142 76% 36%)' }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${carbsPercent}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full"
            style={{ backgroundColor: 'hsl(211 100% 50%)' }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fatPercent}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full"
            style={{ backgroundColor: 'hsl(38 92% 50%)' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
            Proteínas {proteinPercent}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(211 100% 50%)' }} />
            Carbos {carbsPercent}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(38 92% 50%)' }} />
            Grasas {fatPercent}%
          </span>
        </div>
      </motion.div>

      {/* Goal sliders */}
      <div className="space-y-4">
        {goalItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="gradient-card rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="rounded-lg p-2" 
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                {item.icon}
              </div>
              <span className="font-medium text-foreground">{item.label}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Slider
                value={[item.value]}
                onValueChange={(value) => item.setValue(value[0])}
                min={item.min}
                max={item.max}
                step={item.step}
                className="flex-1"
              />
              <div className="flex items-center gap-1 min-w-[100px]">
                <Input
                  type="number"
                  value={item.value}
                  onChange={(e) => item.setValue(Number(e.target.value))}
                  className="w-20 text-center h-9"
                  min={item.min}
                  max={item.max}
                />
                <span className="text-sm text-muted-foreground">{item.unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hasChanges ? 1 : 0.5 }}
      >
        <Button 
          className="w-full" 
          onClick={handleSave}
          disabled={!hasChanges}
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar objetivos
        </Button>
      </motion.div>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="gradient-primary rounded-2xl p-4 text-primary-foreground"
      >
        <h3 className="font-semibold mb-2">Resumen diario</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="opacity-80">Calorías</span>
            <p className="font-bold text-lg">{calories} kcal</p>
          </div>
          <div>
            <span className="opacity-80">Proteínas</span>
            <p className="font-bold text-lg">{protein}g</p>
          </div>
          <div>
            <span className="opacity-80">Carbohidratos</span>
            <p className="font-bold text-lg">{carbs}g</p>
          </div>
          <div>
            <span className="opacity-80">Grasas</span>
            <p className="font-bold text-lg">{fat}g</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
