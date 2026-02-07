import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Loader2, ArrowRight, Beef, Fish, Egg, Apple, Salad, Milk } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FoodItem, MacroTargets } from './types';

interface FoodData {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  unit: string;
  servingSize: number;
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy';
  icon: typeof Beef;
  allergens?: string[];
}

// Food database with minimal icons
const FOOD_DATABASE: FoodData[] = [
  // Proteins
  { name: 'Pechuga de pollo', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, unit: 'g', servingSize: 150, category: 'protein', icon: Beef },
  { name: 'Ternera magra', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, unit: 'g', servingSize: 150, category: 'protein', icon: Beef },
  { name: 'Salmón', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, unit: 'g', servingSize: 150, category: 'protein', icon: Fish },
  { name: 'Atún en lata', caloriesPer100g: 130, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 0.8, unit: 'g', servingSize: 100, category: 'protein', icon: Fish },
  { name: 'Huevos enteros', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, unit: 'unidades', servingSize: 120, category: 'protein', allergens: ['huevo'], icon: Egg },
  { name: 'Claras de huevo', caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, unit: 'g', servingSize: 150, category: 'protein', allergens: ['huevo'], icon: Egg },
  { name: 'Pavo', caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1, unit: 'g', servingSize: 150, category: 'protein', icon: Beef },
  { name: 'Merluza', caloriesPer100g: 82, proteinPer100g: 17, carbsPer100g: 0, fatPer100g: 1, unit: 'g', servingSize: 200, category: 'protein', icon: Fish },
  { name: 'Tofu', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8, unit: 'g', servingSize: 150, category: 'protein', allergens: ['soja'], icon: Salad },
  
  // Carbs
  { name: 'Arroz blanco', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, unit: 'g', servingSize: 80, category: 'carb', icon: Salad },
  { name: 'Arroz integral', caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9, unit: 'g', servingSize: 80, category: 'carb', icon: Salad },
  { name: 'Patata', caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1, unit: 'g', servingSize: 200, category: 'carb', icon: Salad },
  { name: 'Boniato', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, unit: 'g', servingSize: 200, category: 'carb', icon: Salad },
  { name: 'Pasta integral', caloriesPer100g: 124, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 0.5, unit: 'g', servingSize: 80, category: 'carb', allergens: ['gluten'], icon: Salad },
  { name: 'Pan integral', caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4, unit: 'g', servingSize: 60, category: 'carb', allergens: ['gluten'], icon: Salad },
  { name: 'Avena', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7, unit: 'g', servingSize: 50, category: 'carb', allergens: ['gluten'], icon: Salad },
  { name: 'Quinoa', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9, unit: 'g', servingSize: 80, category: 'carb', icon: Salad },
  
  // Fats
  { name: 'Aceite de oliva', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, unit: 'ml', servingSize: 15, category: 'fat', icon: Salad },
  { name: 'Aguacate', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, unit: 'g', servingSize: 100, category: 'fat', icon: Salad },
  { name: 'Almendras', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, unit: 'g', servingSize: 30, category: 'fat', allergens: ['frutos secos'], icon: Salad },
  { name: 'Nueces', caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65, unit: 'g', servingSize: 30, category: 'fat', allergens: ['frutos secos'], icon: Salad },
  
  // Dairy
  { name: 'Yogur griego', caloriesPer100g: 97, proteinPer100g: 9, carbsPer100g: 4, fatPer100g: 5, unit: 'g', servingSize: 150, category: 'dairy', allergens: ['lactosa'], icon: Milk },
  { name: 'Queso fresco batido', caloriesPer100g: 70, proteinPer100g: 12, carbsPer100g: 4, fatPer100g: 0.2, unit: 'g', servingSize: 200, category: 'dairy', allergens: ['lactosa'], icon: Milk },
  { name: 'Leche desnatada', caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1, unit: 'ml', servingSize: 250, category: 'dairy', allergens: ['lactosa'], icon: Milk },
  
  // Vegetables
  { name: 'Brócoli', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, unit: 'g', servingSize: 150, category: 'vegetable', icon: Salad },
  { name: 'Espinacas', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, unit: 'g', servingSize: 100, category: 'vegetable', icon: Salad },
  { name: 'Pimientos', caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3, unit: 'g', servingSize: 100, category: 'vegetable', icon: Salad },
  { name: 'Tomate', caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, unit: 'g', servingSize: 150, category: 'vegetable', icon: Salad },
  
  // Fruits
  { name: 'Plátano', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, unit: 'g', servingSize: 120, category: 'fruit', icon: Apple },
  { name: 'Manzana', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, unit: 'g', servingSize: 180, category: 'fruit', icon: Apple },
  { name: 'Fresas', caloriesPer100g: 33, proteinPer100g: 0.7, carbsPer100g: 8, fatPer100g: 0.3, unit: 'g', servingSize: 150, category: 'fruit', icon: Apple },
];

// Category labels and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  protein: { label: 'Proteína', color: 'bg-emerald-500/10 text-emerald-600' },
  carb: { label: 'Carbohidrato', color: 'bg-blue-500/10 text-blue-600' },
  fat: { label: 'Grasa', color: 'bg-amber-500/10 text-amber-600' },
  dairy: { label: 'Lácteo', color: 'bg-purple-500/10 text-purple-600' },
  vegetable: { label: 'Verdura', color: 'bg-green-500/10 text-green-600' },
  fruit: { label: 'Fruta', color: 'bg-pink-500/10 text-pink-600' }
};

interface MinimalFoodSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFood: FoodItem;
  onSubstitute: (newFood: FoodItem, adjustedMealFoods: FoodItem[]) => void;
  mealFoods: FoodItem[];
  targetMacros: MacroTargets;
  allergies: string[];
}

export const MinimalFoodSubstitutionModal = ({
  isOpen,
  onClose,
  currentFood,
  onSubstitute,
  mealFoods,
  targetMacros,
  allergies
}: MinimalFoodSubstitutionModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Detect category of current food
  const detectCategory = (food: FoodItem): FoodData['category'] => {
    const foodLower = food.name.toLowerCase();
    if (foodLower.includes('pollo') || foodLower.includes('ternera') || foodLower.includes('salmón') || 
        foodLower.includes('atún') || foodLower.includes('huevo') || foodLower.includes('pavo') ||
        foodLower.includes('merluza') || foodLower.includes('tofu')) {
      return 'protein';
    }
    if (foodLower.includes('arroz') || foodLower.includes('patata') || foodLower.includes('pasta') ||
        foodLower.includes('pan') || foodLower.includes('avena') || foodLower.includes('quinoa') ||
        foodLower.includes('boniato')) {
      return 'carb';
    }
    if (foodLower.includes('aceite') || foodLower.includes('aguacate') || foodLower.includes('almendras') ||
        foodLower.includes('nueces')) {
      return 'fat';
    }
    if (foodLower.includes('yogur') || foodLower.includes('queso') || foodLower.includes('leche')) {
      return 'dairy';
    }
    if (foodLower.includes('brócoli') || foodLower.includes('espinacas') || foodLower.includes('pimientos') ||
        foodLower.includes('tomate')) {
      return 'vegetable';
    }
    return 'fruit';
  };

  const currentCategory = detectCategory(currentFood);

  // Filter alternatives
  const alternatives = useMemo(() => {
    let filtered = FOOD_DATABASE.filter(f => f.category === currentCategory);
    
    if (allergies.length > 0) {
      filtered = filtered.filter(food => {
        if (!food.allergens) return true;
        return !food.allergens.some(allergen => 
          allergies.some(allergy => 
            allergen.toLowerCase().includes(allergy.toLowerCase()) ||
            allergy.toLowerCase().includes(allergen.toLowerCase())
          )
        );
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered = filtered.filter(f => f.name.toLowerCase() !== currentFood.name.toLowerCase());
    
    return filtered.slice(0, 5);
  }, [currentCategory, allergies, searchTerm, currentFood.name]);

  // Calculate adjusted meal
  const calculateAdjustedMeal = (newFoodData: FoodData): FoodItem[] => {
    const primaryMacro = currentCategory === 'protein' ? 'protein' : currentCategory === 'carb' ? 'carbs' : 'fat';
    let targetMacroValue = currentFood[primaryMacro as keyof Pick<FoodItem, 'protein' | 'carbs' | 'fat'>];
    
    const macroPer100g = primaryMacro === 'protein' ? newFoodData.proteinPer100g :
                         primaryMacro === 'carbs' ? newFoodData.carbsPer100g : newFoodData.fatPer100g;
    
    const newQuantity = Math.round((targetMacroValue / macroPer100g) * 100);
    
    const newFood: FoodItem = {
      name: newFoodData.name,
      quantity: newQuantity,
      unit: newFoodData.unit,
      calories: Math.round((newFoodData.caloriesPer100g * newQuantity) / 100),
      protein: Math.round((newFoodData.proteinPer100g * newQuantity) / 100),
      carbs: Math.round((newFoodData.carbsPer100g * newQuantity) / 100),
      fat: Math.round((newFoodData.fatPer100g * newQuantity) / 100),
    };
    
    const adjustedFoods = mealFoods.map(f => 
      f.name === currentFood.name ? newFood : f
    );
    
    return adjustedFoods;
  };

  const handleSelectFood = async (food: FoodData) => {
    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const adjustedFoods = calculateAdjustedMeal(food);
    const newFood = adjustedFoods.find(f => f.name === food.name)!;
    
    setIsCalculating(false);
    onSubstitute(newFood, adjustedFoods);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-background border border-border rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden apple-shadow"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h3 className="font-semibold">Sustituir alimento</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentFood.name} • {currentFood.quantity}{currentFood.unit}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alternativa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/30 border-0 focus-visible:ring-1"
              />
            </div>

            {/* Category badge */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium",
                CATEGORY_CONFIG[currentCategory].color
              )}>
                {CATEGORY_CONFIG[currentCategory].label}
              </span>
              <span className="text-xs text-muted-foreground">
                {alternatives.length} alternativas
              </span>
            </div>

            {/* Alternatives list */}
            <div className="space-y-2">
              {alternatives.map((food, index) => {
                const Icon = food.icon;
                return (
                  <motion.button
                    key={food.name}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectFood(food)}
                    disabled={isCalculating}
                    className={cn(
                      "w-full p-3 rounded-xl border border-border text-left transition-all",
                      "hover:border-primary/50 hover:bg-primary/5",
                      "flex items-center gap-3 group"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {food.caloriesPer100g} kcal • {food.proteinPer100g}g P • {food.carbsPer100g}g C • {food.fatPer100g}g G
                        <span className="opacity-60 ml-1">/100{food.unit}</span>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </motion.button>
                );
              })}
            </div>

            {alternatives.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No se encontraron alternativas</p>
              </div>
            )}
          </div>

          {/* Loading overlay */}
          {isCalculating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/80 flex items-center justify-center"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Recalculando...</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
