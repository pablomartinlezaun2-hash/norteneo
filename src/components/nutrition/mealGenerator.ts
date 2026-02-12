// Advanced Meal Generator

import type { MacroTargets, MealPlan, FoodItem, ActivityType } from './types';

// Food database with macro info per 100g
interface FoodData {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  unit: string;
  servingSize: number; // typical serving in grams
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy';
  allergens?: string[];
}

const FOOD_DATABASE: FoodData[] = [
  // Proteins (from real training nutrition plans)
  { name: 'Pechuga de pollo', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, unit: 'g', servingSize: 180, category: 'protein' },
  { name: 'Ternera magra', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, unit: 'g', servingSize: 150, category: 'protein' },
  { name: 'Salmón', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, unit: 'g', servingSize: 150, category: 'protein' },
  { name: 'Atún en lata', caloriesPer100g: 130, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 0.8, unit: 'g', servingSize: 100, category: 'protein' },
  { name: 'Huevos enteros', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, unit: 'unidades', servingSize: 120, category: 'protein', allergens: ['huevo'] },
  { name: 'Claras de huevo', caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, unit: 'g', servingSize: 150, category: 'protein', allergens: ['huevo'] },
  { name: 'Pavo', caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1, unit: 'g', servingSize: 150, category: 'protein' },
  { name: 'Merluza', caloriesPer100g: 82, proteinPer100g: 17, carbsPer100g: 0, fatPer100g: 1, unit: 'g', servingSize: 200, category: 'protein' },
  { name: 'Gambas', caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, unit: 'g', servingSize: 150, category: 'protein', allergens: ['marisco'] },
  { name: 'Jamón serrano', caloriesPer100g: 241, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 13, unit: 'g', servingSize: 100, category: 'protein' },
  { name: 'Lomo embuchado', caloriesPer100g: 186, proteinPer100g: 33, carbsPer100g: 0, fatPer100g: 6, unit: 'g', servingSize: 100, category: 'protein' },
  
  // Carbs (aligned with real meal plans)
  { name: 'Arroz blanco', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, unit: 'g', servingSize: 100, category: 'carb' },
  { name: 'Arroz integral', caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9, unit: 'g', servingSize: 100, category: 'carb' },
  { name: 'Patata', caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1, unit: 'g', servingSize: 200, category: 'carb' },
  { name: 'Boniato', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, unit: 'g', servingSize: 200, category: 'carb' },
  { name: 'Pasta', caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1, unit: 'g', servingSize: 180, category: 'carb', allergens: ['gluten'] },
  { name: 'Pan blanco', caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, unit: 'g', servingSize: 100, category: 'carb', allergens: ['gluten'] },
  { name: 'Pan integral', caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4, unit: 'g', servingSize: 60, category: 'carb', allergens: ['gluten'] },
  { name: 'Avena', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7, unit: 'g', servingSize: 100, category: 'carb', allergens: ['gluten'] },
  { name: 'Corn flakes', caloriesPer100g: 378, proteinPer100g: 7, carbsPer100g: 84, fatPer100g: 0.9, unit: 'g', servingSize: 100, category: 'carb', allergens: ['gluten'] },
  { name: 'Crema de arroz', caloriesPer100g: 370, proteinPer100g: 7, carbsPer100g: 80, fatPer100g: 1, unit: 'g', servingSize: 100, category: 'carb' },
  { name: 'Harina de avena', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7, unit: 'g', servingSize: 60, category: 'carb', allergens: ['gluten'] },
  { name: 'Quinoa', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9, unit: 'g', servingSize: 80, category: 'carb' },
  { name: 'Legumbres cocidas', caloriesPer100g: 110, proteinPer100g: 7, carbsPer100g: 18, fatPer100g: 0.5, unit: 'g', servingSize: 150, category: 'carb' },
  
  // Fats
  { name: 'AOVE', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, unit: 'ml', servingSize: 5, category: 'fat' },
  { name: 'Aguacate', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, unit: 'g', servingSize: 100, category: 'fat' },
  { name: 'Almendras', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, unit: 'g', servingSize: 30, category: 'fat', allergens: ['frutos secos'] },
  { name: 'Nueces', caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65, unit: 'g', servingSize: 15, category: 'fat', allergens: ['frutos secos'] },
  { name: 'Crema de cacahuete', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, unit: 'g', servingSize: 20, category: 'fat', allergens: ['frutos secos'] },
  { name: 'Chocolate 85%', caloriesPer100g: 580, proteinPer100g: 10, carbsPer100g: 22, fatPer100g: 46, unit: 'g', servingSize: 10, category: 'fat' },
  
  // Dairy
  { name: 'Yogur griego', caloriesPer100g: 97, proteinPer100g: 9, carbsPer100g: 4, fatPer100g: 5, unit: 'g', servingSize: 150, category: 'dairy', allergens: ['lactosa'] },
  { name: 'Queso fresco batido', caloriesPer100g: 70, proteinPer100g: 12, carbsPer100g: 4, fatPer100g: 0.2, unit: 'g', servingSize: 200, category: 'dairy', allergens: ['lactosa'] },
  { name: 'Leche desnatada', caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1, unit: 'ml', servingSize: 300, category: 'dairy', allergens: ['lactosa'] },
  { name: 'Queso cottage', caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3, unit: 'g', servingSize: 150, category: 'dairy', allergens: ['lactosa'] },
  
  // Vegetables
  { name: 'Brócoli', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, unit: 'g', servingSize: 150, category: 'vegetable' },
  { name: 'Espinacas', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, unit: 'g', servingSize: 100, category: 'vegetable' },
  { name: 'Pimientos', caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3, unit: 'g', servingSize: 100, category: 'vegetable' },
  { name: 'Tomate', caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, unit: 'g', servingSize: 150, category: 'vegetable' },
  { name: 'Calabacín', caloriesPer100g: 17, proteinPer100g: 1.2, carbsPer100g: 3.1, fatPer100g: 0.3, unit: 'g', servingSize: 150, category: 'vegetable' },
  { name: 'Champiñones', caloriesPer100g: 22, proteinPer100g: 3.1, carbsPer100g: 3.3, fatPer100g: 0.3, unit: 'g', servingSize: 100, category: 'vegetable' },
  
  // Fruits
  { name: 'Plátano', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, unit: 'g', servingSize: 120, category: 'fruit' },
  { name: 'Manzana', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, unit: 'g', servingSize: 200, category: 'fruit' },
  { name: 'Fresas', caloriesPer100g: 33, proteinPer100g: 0.7, carbsPer100g: 8, fatPer100g: 0.3, unit: 'g', servingSize: 200, category: 'fruit' },
  { name: 'Arándanos', caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3, unit: 'g', servingSize: 200, category: 'fruit' },
  { name: 'Frutos rojos mix', caloriesPer100g: 40, proteinPer100g: 0.8, carbsPer100g: 10, fatPer100g: 0.3, unit: 'g', servingSize: 200, category: 'fruit' },
];

// Meal templates
const MEAL_TEMPLATES = {
  desayuno: {
    protein: 0.2,
    carbs: 0.25,
    fat: 0.25,
    time: '08:00'
  },
  mediaManana: {
    protein: 0.1,
    carbs: 0.1,
    fat: 0.1,
    time: '11:00'
  },
  comida: {
    protein: 0.35,
    carbs: 0.35,
    fat: 0.3,
    time: '14:00'
  },
  merienda: {
    protein: 0.1,
    carbs: 0.1,
    fat: 0.15,
    time: '17:00'
  },
  cena: {
    protein: 0.25,
    carbs: 0.2,
    fat: 0.2,
    time: '21:00'
  },
  postEntreno: {
    protein: 0.15,
    carbs: 0.2,
    fat: 0.05,
    time: '19:00'
  }
};

// Get meal distribution based on number of meals
const getMealDistribution = (numMeals: number, isTrainingDay: boolean): { name: string; template: typeof MEAL_TEMPLATES.desayuno }[] => {
  const distributions: Record<number, { name: string; template: typeof MEAL_TEMPLATES.desayuno }[]> = {
    3: [
      { name: 'Desayuno', template: { protein: 0.25, carbs: 0.3, fat: 0.3, time: '08:00' } },
      { name: 'Comida', template: { protein: 0.4, carbs: 0.4, fat: 0.35, time: '14:00' } },
      { name: 'Cena', template: { protein: 0.35, carbs: 0.3, fat: 0.35, time: '21:00' } },
    ],
    4: [
      { name: 'Desayuno', template: MEAL_TEMPLATES.desayuno },
      { name: 'Comida', template: MEAL_TEMPLATES.comida },
      { name: isTrainingDay ? 'Post-Entreno' : 'Merienda', template: MEAL_TEMPLATES.merienda },
      { name: 'Cena', template: MEAL_TEMPLATES.cena },
    ],
    5: [
      { name: 'Desayuno', template: MEAL_TEMPLATES.desayuno },
      { name: 'Comida', template: MEAL_TEMPLATES.comida },
      { name: isTrainingDay ? 'Post-Entreno' : 'Merienda', template: { protein: 0.15, carbs: 0.15, fat: 0.1, time: '17:00' } },
      { name: 'Cena', template: MEAL_TEMPLATES.cena },
      { name: 'Pre-Cama', template: { protein: 0.15, carbs: 0.1, fat: 0.15, time: '23:00' } },
    ],
    6: [
      { name: 'Desayuno', template: MEAL_TEMPLATES.desayuno },
      { name: 'Media Mañana', template: MEAL_TEMPLATES.mediaManana },
      { name: 'Comida', template: MEAL_TEMPLATES.comida },
      { name: isTrainingDay ? 'Post-Entreno' : 'Merienda', template: MEAL_TEMPLATES.merienda },
      { name: 'Cena', template: MEAL_TEMPLATES.cena },
      { name: 'Pre-Cama', template: { protein: 0.1, carbs: 0.08, fat: 0.1, time: '23:00' } },
    ],
  };
  
  return distributions[numMeals] || distributions[5];
};

// Filter foods by allergies
const filterByAllergies = (foods: FoodData[], allergies: string[]): FoodData[] => {
  if (allergies.length === 0) return foods;
  
  return foods.filter(food => {
    if (!food.allergens) return true;
    return !food.allergens.some(allergen => 
      allergies.some(allergy => 
        allergen.toLowerCase().includes(allergy.toLowerCase()) ||
        allergy.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  });
};

// Generate foods for a meal based on target macros
const generateMealFoods = (
  targetMacros: { protein: number; carbs: number; fat: number },
  allergies: string[]
): FoodItem[] => {
  const availableFoods = filterByAllergies(FOOD_DATABASE, allergies);
  const foods: FoodItem[] = [];
  
  let remainingProtein = targetMacros.protein;
  let remainingCarbs = targetMacros.carbs;
  let remainingFat = targetMacros.fat;
  
  // Add protein source
  const proteins = availableFoods.filter(f => f.category === 'protein');
  if (proteins.length > 0 && remainingProtein > 10) {
    const protein = proteins[Math.floor(Math.random() * proteins.length)];
    const servingMultiplier = Math.min(2, remainingProtein / (protein.proteinPer100g * protein.servingSize / 100));
    const quantity = Math.round(protein.servingSize * servingMultiplier);
    
    foods.push({
      name: protein.name,
      quantity,
      unit: protein.unit,
      calories: Math.round((protein.caloriesPer100g * quantity) / 100),
      protein: Math.round((protein.proteinPer100g * quantity) / 100),
      carbs: Math.round((protein.carbsPer100g * quantity) / 100),
      fat: Math.round((protein.fatPer100g * quantity) / 100),
    });
    
    remainingProtein -= (protein.proteinPer100g * quantity) / 100;
    remainingCarbs -= (protein.carbsPer100g * quantity) / 100;
    remainingFat -= (protein.fatPer100g * quantity) / 100;
  }
  
  // Add carb source
  const carbs = availableFoods.filter(f => f.category === 'carb');
  if (carbs.length > 0 && remainingCarbs > 15) {
    const carb = carbs[Math.floor(Math.random() * carbs.length)];
    const servingMultiplier = Math.min(2.5, remainingCarbs / (carb.carbsPer100g * carb.servingSize / 100));
    const quantity = Math.round(carb.servingSize * servingMultiplier);
    
    foods.push({
      name: carb.name,
      quantity,
      unit: carb.unit,
      calories: Math.round((carb.caloriesPer100g * quantity) / 100),
      protein: Math.round((carb.proteinPer100g * quantity) / 100),
      carbs: Math.round((carb.carbsPer100g * quantity) / 100),
      fat: Math.round((carb.fatPer100g * quantity) / 100),
    });
    
    remainingCarbs -= (carb.carbsPer100g * quantity) / 100;
    remainingFat -= (carb.fatPer100g * quantity) / 100;
  }
  
  // Add vegetable
  const vegetables = availableFoods.filter(f => f.category === 'vegetable');
  if (vegetables.length > 0) {
    const vegetable = vegetables[Math.floor(Math.random() * vegetables.length)];
    
    foods.push({
      name: vegetable.name,
      quantity: vegetable.servingSize,
      unit: vegetable.unit,
      calories: Math.round((vegetable.caloriesPer100g * vegetable.servingSize) / 100),
      protein: Math.round((vegetable.proteinPer100g * vegetable.servingSize) / 100),
      carbs: Math.round((vegetable.carbsPer100g * vegetable.servingSize) / 100),
      fat: Math.round((vegetable.fatPer100g * vegetable.servingSize) / 100),
    });
  }
  
  // Add fat source if needed
  const fats = availableFoods.filter(f => f.category === 'fat');
  if (fats.length > 0 && remainingFat > 5) {
    const fat = fats[Math.floor(Math.random() * fats.length)];
    const quantity = fat.servingSize;
    
    foods.push({
      name: fat.name,
      quantity,
      unit: fat.unit,
      calories: Math.round((fat.caloriesPer100g * quantity) / 100),
      protein: Math.round((fat.proteinPer100g * quantity) / 100),
      carbs: Math.round((fat.carbsPer100g * quantity) / 100),
      fat: Math.round((fat.fatPer100g * quantity) / 100),
    });
  }
  
  return foods;
};

// Main meal generation function
export const generateDayMeals = (
  macros: MacroTargets,
  numMeals: number,
  isTrainingDay: boolean,
  allergies: string[]
): MealPlan[] => {
  const distribution = getMealDistribution(numMeals, isTrainingDay);
  
  return distribution.map(({ name, template }) => {
    const mealMacros = {
      protein: Math.round(macros.protein * template.protein),
      carbs: Math.round(macros.carbs * template.carbs),
      fat: Math.round(macros.fat * template.fat),
    };
    
    const foods = generateMealFoods(mealMacros, allergies);
    
    // Calculate actual totals from generated foods
    const totals = foods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    return {
      name,
      time: template.time,
      ...totals,
      foods,
    };
  });
};

// Get alternative foods for a category
export const getAlternatives = (category: FoodData['category'], allergies: string[]): FoodData[] => {
  return filterByAllergies(
    FOOD_DATABASE.filter(f => f.category === category),
    allergies
  );
};
