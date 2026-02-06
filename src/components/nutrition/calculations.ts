// Advanced Nutrition Calculations

import type { 
  UserNutritionProfile, 
  DayActivity, 
  MacroTargets,
  NutritionGoal,
  ActivityType 
} from './types';

// Mifflin-St Jeor BMR Calculation
export const calculateBMR = (profile: UserNutritionProfile): number => {
  const { weight, height, age, sex } = profile;
  if (sex === 'hombre') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
};

// Calories burned per activity type (per minute)
const ACTIVITY_CALORIES: Record<ActivityType, number> = {
  gym: 6.5,      // Strength training ~6-7 kcal/min
  swimming: 9,   // Swimming ~8-10 kcal/min
  running: 10,   // Running ~9-11 kcal/min
  rest: 0
};

// Calculate calories from activities
export const calculateActivityCalories = (day: DayActivity): number => {
  let total = 0;
  day.activities.forEach(activity => {
    const duration = day.durations[activity] || 0;
    total += duration * ACTIVITY_CALORIES[activity];
  });
  return Math.round(total);
};

// Calculate calories from steps (0.04 kcal per step above baseline)
export const calculateStepsCalories = (steps: number): number => {
  const extraSteps = Math.max(0, steps - 5000);
  return Math.round(extraSteps * 0.04);
};

// Calculate TDEE for a specific day
export const calculateDayTDEE = (
  bmr: number,
  activityCalories: number,
  stepsCalories: number
): number => {
  // Base activity factor for daily living (1.2 for sedentary)
  const baseTDEE = bmr * 1.2;
  return Math.round(baseTDEE + activityCalories + stepsCalories);
};

// Get caloric adjustment based on goal and day type
export const getCalorieAdjustment = (
  goal: NutritionGoal,
  activities: ActivityType[],
  isRestDay: boolean
): number => {
  const hasMultipleActivities = activities.filter(a => a !== 'rest').length > 1;
  const hasTripleActivity = activities.filter(a => a !== 'rest').length >= 3;
  
  switch (goal) {
    case 'volumen':
      if (hasTripleActivity) return 450;
      if (hasMultipleActivities) return 400;
      if (isRestDay) return 250;
      return 350;
    
    case 'perdida':
      if (isRestDay) return -400;
      if (hasMultipleActivities) return -250;
      return -350;
    
    case 'mantenimiento':
    default:
      return 0;
  }
};

// Calculate macros based on goal, weight, and day type
export const calculateMacros = (
  profile: UserNutritionProfile,
  targetCalories: number,
  isRestDay: boolean
): MacroTargets => {
  const { goal, weight } = profile;
  
  let proteinPerKg: number;
  let fatPerKg: number;
  
  switch (goal) {
    case 'volumen':
      proteinPerKg = isRestDay ? 1.9 : 2.0;
      fatPerKg = isRestDay ? 1.1 : 1.0;
      break;
    case 'perdida':
      proteinPerKg = isRestDay ? 2.0 : 2.2;
      fatPerKg = isRestDay ? 0.9 : 0.7;
      break;
    case 'mantenimiento':
    default:
      proteinPerKg = 2.0;
      fatPerKg = 0.9;
  }
  
  const protein = Math.round(weight * proteinPerKg);
  const fat = Math.round(weight * fatPerKg);
  
  // Carbs fill the remaining calories
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const remainingCals = targetCalories - proteinCals - fatCals;
  const carbs = Math.max(50, Math.round(remainingCals / 4));
  
  // Recalculate actual calories
  const actualCalories = (protein * 4) + (carbs * 4) + (fat * 9);
  
  return {
    calories: actualCalories,
    protein,
    carbs,
    fat
  };
};

// Get activity type color
export const getActivityColor = (activity: ActivityType): string => {
  switch (activity) {
    case 'gym': return 'bg-red-500';
    case 'swimming': return 'bg-blue-500';
    case 'running': return 'bg-green-500';
    case 'rest': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

// Get activity icon name
export const getActivityIcon = (activity: ActivityType): string => {
  switch (activity) {
    case 'gym': return '🏋️';
    case 'swimming': return '🏊';
    case 'running': return '🏃';
    case 'rest': return '😴';
    default: return '📅';
  }
};

// Get activity label
export const getActivityLabel = (activity: ActivityType): string => {
  switch (activity) {
    case 'gym': return 'Gimnasio';
    case 'swimming': return 'Natación';
    case 'running': return 'Running';
    case 'rest': return 'Descanso';
    default: return activity;
  }
};
