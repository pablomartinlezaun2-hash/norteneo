import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  image?: string;
  allergens?: string[];
}

const FOOD_DATABASE: FoodData[] = [
  // Proteins
  { name: 'Pechuga de pollo', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, unit: 'g', servingSize: 150, category: 'protein', image: '🍗' },
  { name: 'Ternera magra', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, unit: 'g', servingSize: 150, category: 'protein', image: '🥩' },
  { name: 'Salmón', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, unit: 'g', servingSize: 150, category: 'protein', image: '🐟' },
  { name: 'Atún en lata', caloriesPer100g: 130, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 0.8, unit: 'g', servingSize: 100, category: 'protein', image: '🐟' },
  { name: 'Huevos enteros', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, unit: 'unidades', servingSize: 120, category: 'protein', allergens: ['huevo'], image: '🥚' },
  { name: 'Claras de huevo', caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, unit: 'g', servingSize: 150, category: 'protein', allergens: ['huevo'], image: '🥚' },
  { name: 'Pavo', caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1, unit: 'g', servingSize: 150, category: 'protein', image: '🦃' },
  { name: 'Merluza', caloriesPer100g: 82, proteinPer100g: 17, carbsPer100g: 0, fatPer100g: 1, unit: 'g', servingSize: 200, category: 'protein', image: '🐟' },
  { name: 'Gambas', caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, unit: 'g', servingSize: 150, category: 'protein', allergens: ['marisco'], image: '🦐' },
  { name: 'Tofu', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8, unit: 'g', servingSize: 150, category: 'protein', allergens: ['soja'], image: '🧈' },
  { name: 'Tempeh', caloriesPer100g: 193, proteinPer100g: 19, carbsPer100g: 9.4, fatPer100g: 11, unit: 'g', servingSize: 100, category: 'protein', allergens: ['soja'], image: '🫘' },
  
  // Carbs
  { name: 'Arroz blanco', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, unit: 'g', servingSize: 80, category: 'carb', image: '🍚' },
  { name: 'Arroz integral', caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9, unit: 'g', servingSize: 80, category: 'carb', image: '🍚' },
  { name: 'Patata', caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1, unit: 'g', servingSize: 200, category: 'carb', image: '🥔' },
  { name: 'Boniato', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, unit: 'g', servingSize: 200, category: 'carb', image: '🍠' },
  { name: 'Pasta integral', caloriesPer100g: 124, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 0.5, unit: 'g', servingSize: 80, category: 'carb', allergens: ['gluten'], image: '🍝' },
  { name: 'Pan integral', caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4, unit: 'g', servingSize: 60, category: 'carb', allergens: ['gluten'], image: '🍞' },
  { name: 'Avena', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7, unit: 'g', servingSize: 50, category: 'carb', allergens: ['gluten'], image: '🥣' },
  { name: 'Quinoa', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9, unit: 'g', servingSize: 80, category: 'carb', image: '🌾' },
  { name: 'Legumbres cocidas', caloriesPer100g: 110, proteinPer100g: 7, carbsPer100g: 18, fatPer100g: 0.5, unit: 'g', servingSize: 150, category: 'carb', image: '🫘' },
  { name: 'Cuscús', caloriesPer100g: 112, proteinPer100g: 3.8, carbsPer100g: 23, fatPer100g: 0.2, unit: 'g', servingSize: 80, category: 'carb', allergens: ['gluten'], image: '🌾' },
  
  // Fats
  { name: 'Aceite de oliva', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, unit: 'ml', servingSize: 15, category: 'fat', image: '🫒' },
  { name: 'Aguacate', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, unit: 'g', servingSize: 100, category: 'fat', image: '🥑' },
  { name: 'Almendras', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, unit: 'g', servingSize: 30, category: 'fat', allergens: ['frutos secos'], image: '🥜' },
  { name: 'Nueces', caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65, unit: 'g', servingSize: 30, category: 'fat', allergens: ['frutos secos'], image: '🥜' },
  { name: 'Crema de cacahuete', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, unit: 'g', servingSize: 20, category: 'fat', allergens: ['frutos secos'], image: '🥜' },
  { name: 'Semillas de chía', caloriesPer100g: 486, proteinPer100g: 17, carbsPer100g: 42, fatPer100g: 31, unit: 'g', servingSize: 15, category: 'fat', image: '🌱' },
  
  // Dairy
  { name: 'Yogur griego', caloriesPer100g: 97, proteinPer100g: 9, carbsPer100g: 4, fatPer100g: 5, unit: 'g', servingSize: 150, category: 'dairy', allergens: ['lactosa'], image: '🥛' },
  { name: 'Queso fresco batido', caloriesPer100g: 70, proteinPer100g: 12, carbsPer100g: 4, fatPer100g: 0.2, unit: 'g', servingSize: 200, category: 'dairy', allergens: ['lactosa'], image: '🧀' },
  { name: 'Leche desnatada', caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1, unit: 'ml', servingSize: 250, category: 'dairy', allergens: ['lactosa'], image: '🥛' },
  { name: 'Queso cottage', caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3, unit: 'g', servingSize: 150, category: 'dairy', allergens: ['lactosa'], image: '🧀' },
  
  // Vegetables
  { name: 'Brócoli', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, unit: 'g', servingSize: 150, category: 'vegetable', image: '🥦' },
  { name: 'Espinacas', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, unit: 'g', servingSize: 100, category: 'vegetable', image: '🥬' },
  { name: 'Pimientos', caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3, unit: 'g', servingSize: 100, category: 'vegetable', image: '🫑' },
  { name: 'Tomate', caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, unit: 'g', servingSize: 150, category: 'vegetable', image: '🍅' },
  { name: 'Calabacín', caloriesPer100g: 17, proteinPer100g: 1.2, carbsPer100g: 3.1, fatPer100g: 0.3, unit: 'g', servingSize: 150, category: 'vegetable', image: '🥒' },
  { name: 'Champiñones', caloriesPer100g: 22, proteinPer100g: 3.1, carbsPer100g: 3.3, fatPer100g: 0.3, unit: 'g', servingSize: 100, category: 'vegetable', image: '🍄' },
  { name: 'Zanahoria', caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2, unit: 'g', servingSize: 100, category: 'vegetable', image: '🥕' },
  
  // Fruits
  { name: 'Plátano', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, unit: 'g', servingSize: 120, category: 'fruit', image: '🍌' },
  { name: 'Manzana', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, unit: 'g', servingSize: 180, category: 'fruit', image: '🍎' },
  { name: 'Fresas', caloriesPer100g: 33, proteinPer100g: 0.7, carbsPer100g: 8, fatPer100g: 0.3, unit: 'g', servingSize: 150, category: 'fruit', image: '🍓' },
  { name: 'Arándanos', caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3, unit: 'g', servingSize: 100, category: 'fruit', image: '🫐' },
  { name: 'Naranja', caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, unit: 'g', servingSize: 180, category: 'fruit', image: '🍊' },
];

interface FoodSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFood: FoodItem;
  onSubstitute: (newFood: FoodItem, adjustedMealFoods: FoodItem[]) => void;
  mealFoods: FoodItem[];
  targetMacros: MacroTargets;
  allergies: string[];
}

export const FoodSubstitutionModal = ({
  isOpen,
  onClose,
  currentFood,
  onSubstitute,
  mealFoods,
  targetMacros,
  allergies
}: FoodSubstitutionModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Determine the category of the current food
  const detectCategory = (food: FoodItem): FoodData['category'] => {
    const foodLower = food.name.toLowerCase();
    if (foodLower.includes('pollo') || foodLower.includes('ternera') || foodLower.includes('salmón') || 
        foodLower.includes('atún') || foodLower.includes('huevo') || foodLower.includes('pavo') ||
        foodLower.includes('merluza') || foodLower.includes('gambas') || foodLower.includes('tofu')) {
      return 'protein';
    }
    if (foodLower.includes('arroz') || foodLower.includes('patata') || foodLower.includes('pasta') ||
        foodLower.includes('pan') || foodLower.includes('avena') || foodLower.includes('quinoa') ||
        foodLower.includes('legumbres') || foodLower.includes('boniato')) {
      return 'carb';
    }
    if (foodLower.includes('aceite') || foodLower.includes('aguacate') || foodLower.includes('almendras') ||
        foodLower.includes('nueces') || foodLower.includes('cacahuete')) {
      return 'fat';
    }
    if (foodLower.includes('yogur') || foodLower.includes('queso') || foodLower.includes('leche')) {
      return 'dairy';
    }
    if (foodLower.includes('brócoli') || foodLower.includes('espinacas') || foodLower.includes('pimientos') ||
        foodLower.includes('tomate') || foodLower.includes('calabacín') || foodLower.includes('champiñones')) {
      return 'vegetable';
    }
    return 'fruit';
  };

  const currentCategory = detectCategory(currentFood);

  // Filter alternatives based on category and allergies
  const alternatives = useMemo(() => {
    let filtered = FOOD_DATABASE.filter(f => f.category === currentCategory);
    
    // Filter by allergies
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
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Remove current food
    filtered = filtered.filter(f => f.name.toLowerCase() !== currentFood.name.toLowerCase());
    
    return filtered.slice(0, 5);
  }, [currentCategory, allergies, searchTerm, currentFood.name]);

  // Calculate how to adjust other foods to maintain macros
  const calculateAdjustedMeal = (newFoodData: FoodData): FoodItem[] => {
    // Calculate how much of the new food we need to match the original's primary macro
    const primaryMacro = currentCategory === 'protein' ? 'protein' : currentCategory === 'carb' ? 'carbs' : 'fat';
    let targetMacroValue = currentFood[primaryMacro as keyof Pick<FoodItem, 'protein' | 'carbs' | 'fat'>];
    
    // Calculate quantity needed to match the primary macro
    const macroPer100g = primaryMacro === 'protein' ? newFoodData.proteinPer100g :
                         primaryMacro === 'carbs' ? newFoodData.carbsPer100g : newFoodData.fatPer100g;
    
    const newQuantity = Math.round((targetMacroValue / macroPer100g) * 100);
    
    // Create the new food item
    const newFood: FoodItem = {
      name: newFoodData.name,
      quantity: newQuantity,
      unit: newFoodData.unit,
      calories: Math.round((newFoodData.caloriesPer100g * newQuantity) / 100),
      protein: Math.round((newFoodData.proteinPer100g * newQuantity) / 100),
      carbs: Math.round((newFoodData.carbsPer100g * newQuantity) / 100),
      fat: Math.round((newFoodData.fatPer100g * newQuantity) / 100),
    };
    
    // Replace the current food with the new one
    const adjustedFoods = mealFoods.map(f => 
      f.name === currentFood.name ? newFood : f
    );
    
    // Calculate difference in macros
    const currentTotals = mealFoods.reduce((acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    const newTotals = adjustedFoods.reduce((acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    // Adjust carb source to compensate for calorie difference
    const calorieDiff = newTotals.calories - currentTotals.calories;
    if (Math.abs(calorieDiff) > 30) {
      // Find a carb source to adjust
      const carbSourceIndex = adjustedFoods.findIndex(f => {
        const foodData = FOOD_DATABASE.find(fd => fd.name === f.name);
        return foodData?.category === 'carb';
      });
      
      if (carbSourceIndex !== -1) {
        const carbFood = adjustedFoods[carbSourceIndex];
        const carbFoodData = FOOD_DATABASE.find(fd => fd.name === carbFood.name);
        if (carbFoodData) {
          // Adjust quantity to compensate
          const caloriesPerGram = carbFoodData.caloriesPer100g / 100;
          const quantityAdjustment = Math.round(-calorieDiff / caloriesPerGram);
          const newCarbQuantity = Math.max(30, carbFood.quantity + quantityAdjustment);
          
          adjustedFoods[carbSourceIndex] = {
            ...carbFood,
            quantity: newCarbQuantity,
            calories: Math.round((carbFoodData.caloriesPer100g * newCarbQuantity) / 100),
            protein: Math.round((carbFoodData.proteinPer100g * newCarbQuantity) / 100),
            carbs: Math.round((carbFoodData.carbsPer100g * newCarbQuantity) / 100),
            fat: Math.round((carbFoodData.fatPer100g * newCarbQuantity) / 100),
          };
        }
      }
    }
    
    return adjustedFoods;
  };

  const handleSelectFood = async (food: FoodData) => {
    setSelectedFood(food);
    setIsCalculating(true);
    
    // Simulate calculation animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const adjustedFoods = calculateAdjustedMeal(food);
    const newFood = adjustedFoods.find(f => f.name === food.name)!;
    
    setIsCalculating(false);
    onSubstitute(newFood, adjustedFoods);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">Sustituir alimento</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Current food */}
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xs opacity-80 mb-1">Reemplazar:</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {FOOD_DATABASE.find(f => f.name.toLowerCase() === currentFood.name.toLowerCase())?.image || '🍽️'}
                </span>
                <div>
                  <div className="font-semibold">{currentFood.name}</div>
                  <div className="text-xs opacity-80">
                    {currentFood.quantity}{currentFood.unit} • {currentFood.calories} kcal
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar o escribe tu alternativa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>

            {/* Category badge */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Categoría: {
                  currentCategory === 'protein' ? '🍗 Proteína' :
                  currentCategory === 'carb' ? '🍚 Carbohidrato' :
                  currentCategory === 'fat' ? '🥑 Grasa' :
                  currentCategory === 'dairy' ? '🥛 Lácteo' :
                  currentCategory === 'vegetable' ? '🥦 Verdura' : '🍎 Fruta'
                }
              </Badge>
            </div>

            {/* Alternatives */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Alternativas sugeridas:
              </div>
              
              {alternatives.map((food, idx) => (
                <motion.button
                  key={food.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleSelectFood(food)}
                  disabled={isCalculating}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                    selectedFood?.name === food.name 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-border hover:border-orange-500/50 bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <motion.span 
                      className="text-3xl"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {food.image}
                    </motion.span>
                    
                    <div className="flex-1">
                      <div className="font-medium">{food.name}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-600 rounded">
                          P: {food.proteinPer100g}g
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-600 rounded">
                          C: {food.carbsPer100g}g
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 rounded">
                          G: {food.fatPer100g}g
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-bold text-orange-500">
                        {food.caloriesPer100g} kcal
                      </div>
                      <div className="text-[10px] text-muted-foreground">por 100g</div>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.button>
              ))}

              {alternatives.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No se encontraron alternativas</p>
                  <p className="text-sm">Prueba con otro término de búsqueda</p>
                </div>
              )}
            </div>

            {/* Calculating overlay */}
            <AnimatePresence>
              {isCalculating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <RefreshCw className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    </motion.div>
                    <p className="text-sm font-medium">Recalculando macros...</p>
                    <p className="text-xs text-muted-foreground">
                      Ajustando gramos para mantener tu objetivo
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer info */}
          <div className="p-3 bg-muted/50 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="w-3 h-3 text-green-500" />
              <span>Los gramos se ajustarán automáticamente para mantener tus macros</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
