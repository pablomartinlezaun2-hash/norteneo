// Nutrition Assistant Types

export type DietType = 'ultra' | 'simple';
export type NutritionGoal = 'volumen' | 'perdida' | 'mantenimiento';
export type ActivityType = 'gym' | 'swimming' | 'running' | 'rest';
export type ActivityCombination = ActivityType[];

export interface UserNutritionProfile {
  dietType: DietType;
  goal: NutritionGoal;
  weight: number;
  height: number;
  age: number;
  sex: 'hombre' | 'mujer';
  dailySteps: number;
  mealsPerDay: number;
  allergies: string[];
  restrictions: string[];
}

export interface DayActivity {
  day: string;
  dayIndex: number;
  activities: ActivityCombination;
  durations: Record<ActivityType, number>; // minutes per activity
}

export interface WeeklyActivityPlan {
  days: DayActivity[];
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlan {
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: FoodItem[];
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayNutritionPlan {
  day: string;
  dayIndex: number;
  activities: ActivityCombination;
  isRestDay: boolean;
  bmr: number;
  activityCalories: number;
  stepsCalories: number;
  tdee: number;
  targetCalories: number;
  adjustment: number; // +/- kcal superávit/déficit
  macros: MacroTargets;
  meals: MealPlan[];
}

export interface WeeklyNutritionPlan {
  userProfile: UserNutritionProfile;
  weeklyActivity: WeeklyActivityPlan;
  bmr: number;
  averageTDEE: number;
  weeklyCalories: number;
  days: DayNutritionPlan[];
  summary: {
    trainingDays: number;
    restDays: number;
    combinedDays: number;
    avgCaloriesTraining: number;
    avgCaloriesRest: number;
  };
}

export type NutritionStep = 
  | 'welcome'
  | 'diet-type'
  | 'goal'
  | 'personal-data'
  | 'meals-allergies'
  | 'activity-setup'
  | 'calculating'
  | 'results-overview'
  | 'weekly-plan'
  | 'daily-detail';
