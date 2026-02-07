import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowRight, ArrowLeft, Calculator, 
  Target, TrendingUp, TrendingDown, Minus,
  User, Ruler, Scale, Calendar, Utensils, AlertCircle,
  Dumbbell, Waves, Activity, Moon, Check, Loader2,
  Beef, Fish, Egg, Apple, Salad, Milk, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { 
  NutritionStep, DietType, NutritionGoal, 
  UserNutritionProfile, DayActivity, ActivityType,
  WeeklyNutritionPlan, DayNutritionPlan, FoodItem
} from './types';
import { 
  calculateBMR, calculateActivityCalories, calculateStepsCalories,
  calculateDayTDEE, getCalorieAdjustment, calculateMacros,
  getActivityIcon
} from './calculations';
import { generateDayMeals } from './mealGenerator';
import { MinimalDayPlanCard } from './MinimalDayPlanCard';
import { MinimalDurationInput } from './MinimalDurationInput';

interface NutritionAssistantProProps {
  onClose: () => void;
  onPlanCreated?: (plan: WeeklyNutritionPlan) => void;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const COMMON_ALLERGIES = ['Gluten', 'Lactosa', 'Huevo', 'Frutos secos', 'Marisco', 'Soja'];

// Minimal activity icons (outline style)
const ACTIVITY_ICONS: Record<ActivityType, typeof Dumbbell> = {
  gym: Dumbbell,
  swimming: Waves,
  running: Activity,
  rest: Moon
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  gym: 'Fuerza',
  swimming: 'Natación',
  running: 'Running',
  rest: 'Descanso'
};

export const NutritionAssistantPro = ({ onClose, onPlanCreated }: NutritionAssistantProProps) => {
  const [step, setStep] = useState<NutritionStep>('welcome');
  const [profile, setProfile] = useState<UserNutritionProfile>({
    dietType: 'ultra',
    goal: 'mantenimiento',
    weight: 75,
    height: 175,
    age: 30,
    sex: 'hombre',
    dailySteps: 8000,
    mealsPerDay: 4,
    allergies: [],
    restrictions: []
  });
  
  const [weeklyActivities, setWeeklyActivities] = useState<DayActivity[]>(
    DAYS.map((day, idx) => ({
      day,
      dayIndex: idx,
      activities: idx === 6 ? ['rest'] : ['gym'],
      durations: { gym: 60, swimming: 0, running: 0, rest: 0 }
    }))
  );
  
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyNutritionPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(-1);

  useEffect(() => {
    const timer = setTimeout(() => setStep('diet-type'), 1200);
    return () => clearTimeout(timer);
  }, []);

  const generatePlan = (): WeeklyNutritionPlan => {
    const bmr = calculateBMR(profile);
    const stepsCalories = calculateStepsCalories(profile.dailySteps);
    
    const days: DayNutritionPlan[] = weeklyActivities.map((dayActivity) => {
      const activityCalories = calculateActivityCalories(dayActivity);
      const tdee = calculateDayTDEE(bmr, activityCalories, stepsCalories);
      const isRestDay = dayActivity.activities.includes('rest') && dayActivity.activities.length === 1;
      const adjustment = getCalorieAdjustment(profile.goal, dayActivity.activities, isRestDay);
      const targetCalories = tdee + adjustment;
      const macros = calculateMacros(profile, targetCalories, isRestDay);
      const meals = generateDayMeals(macros, profile.mealsPerDay, !isRestDay, profile.allergies);
      
      return {
        day: dayActivity.day,
        dayIndex: dayActivity.dayIndex,
        activities: dayActivity.activities,
        isRestDay,
        bmr,
        activityCalories,
        stepsCalories,
        tdee,
        targetCalories,
        adjustment,
        macros,
        meals
      };
    });
    
    const trainingDays = days.filter(d => !d.isRestDay).length;
    const combinedDays = days.filter(d => d.activities.filter(a => a !== 'rest').length > 1).length;
    
    return {
      userProfile: profile,
      weeklyActivity: { days: weeklyActivities },
      bmr,
      averageTDEE: Math.round(days.reduce((sum, d) => sum + d.tdee, 0) / 7),
      weeklyCalories: days.reduce((sum, d) => sum + d.targetCalories, 0),
      days,
      summary: {
        trainingDays,
        restDays: 7 - trainingDays,
        combinedDays,
        avgCaloriesTraining: Math.round(days.filter(d => !d.isRestDay).reduce((sum, d) => sum + d.targetCalories, 0) / Math.max(1, trainingDays)),
        avgCaloriesRest: Math.round(days.filter(d => d.isRestDay).reduce((sum, d) => sum + d.targetCalories, 0) / Math.max(1, 7 - trainingDays))
      }
    };
  };

  const handleCalculate = async () => {
    setStep('calculating');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const plan = generatePlan();
    setWeeklyPlan(plan);
    setStep('results-overview');
  };

  const handleUpdateMeal = useCallback((dayIndex: number, mealIndex: number, newFoods: FoodItem[]) => {
    setWeeklyPlan(prev => {
      if (!prev) return prev;
      
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex] };
      const meals = [...day.meals];
      const meal = { ...meals[mealIndex] };
      
      meal.foods = newFoods;
      
      const totals = newFoods.reduce((acc, f) => ({
        calories: acc.calories + f.calories,
        protein: acc.protein + f.protein,
        carbs: acc.carbs + f.carbs,
        fat: acc.fat + f.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      meal.calories = totals.calories;
      meal.protein = totals.protein;
      meal.carbs = totals.carbs;
      meal.fat = totals.fat;
      
      meals[mealIndex] = meal;
      day.meals = meals;
      
      const dayTotals = meals.reduce((acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      day.macros = {
        calories: dayTotals.calories,
        protein: dayTotals.protein,
        carbs: dayTotals.carbs,
        fat: dayTotals.fat,
      };
      day.targetCalories = dayTotals.calories;
      
      newDays[dayIndex] = day;
      
      return {
        ...prev,
        days: newDays,
        weeklyCalories: newDays.reduce((sum, d) => sum + d.targetCalories, 0),
      };
    });
  }, []);

  const toggleActivity = (dayIndex: number, activity: ActivityType) => {
    setWeeklyActivities(prev => prev.map((day, idx) => {
      if (idx !== dayIndex) return day;
      
      let newActivities = [...day.activities];
      
      if (activity === 'rest') {
        newActivities = ['rest'];
      } else {
        newActivities = newActivities.filter(a => a !== 'rest');
        if (newActivities.includes(activity)) {
          newActivities = newActivities.filter(a => a !== activity);
          if (newActivities.length === 0) newActivities = ['rest'];
        } else {
          newActivities.push(activity);
        }
      }
      
      return { ...day, activities: newActivities };
    }));
  };

  const updateDuration = (dayIndex: number, activity: ActivityType, duration: number) => {
    setWeeklyActivities(prev => prev.map((day, idx) => {
      if (idx !== dayIndex) return day;
      return {
        ...day,
        durations: { ...day.durations, [activity]: duration }
      };
    }));
  };

  const toggleAllergy = (allergy: string) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  const goBack = () => {
    const stepOrder: NutritionStep[] = ['diet-type', 'goal', 'personal-data', 'meals-allergies', 'activity-setup'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  // Chat bubble component
  const ChatBubble = ({ children, isAssistant = true, delay = 0 }: { 
    children: React.ReactNode; 
    isAssistant?: boolean; 
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "rounded-2xl p-4 max-w-[90%]",
        isAssistant 
          ? "bg-secondary/50 self-start mr-auto" 
          : "bg-primary/10 self-end ml-auto"
      )}
    >
      {children}
    </motion.div>
  );

  // Option button component (minimal style)
  const OptionButton = ({ 
    selected, 
    onClick, 
    icon: Icon, 
    label, 
    description,
    badge,
    delay = 0
  }: { 
    selected: boolean; 
    onClick: () => void; 
    icon?: typeof Target;
    label: string;
    description?: string;
    badge?: string;
    delay?: number;
  }) => (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl border-2 text-left transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            selected ? "bg-primary text-primary-foreground" : "bg-secondary"
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{label}</span>
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {selected && (
          <Check className="w-5 h-5 text-primary shrink-0" />
        )}
      </div>
    </motion.button>
  );

  // Progress indicator
  const stepIndex = ['diet-type', 'goal', 'personal-data', 'meals-allergies', 'activity-setup'].indexOf(step);
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / 5) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-background border border-border rounded-2xl overflow-hidden flex flex-col max-h-[90vh] apple-shadow"
    >
      {/* Header - Clean and minimal */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Salad className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Asistente Nutricional</h3>
            {stepIndex >= 0 && (
              <p className="text-xs text-muted-foreground">Paso {stepIndex + 1} de 5</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full hover:bg-secondary"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress bar */}
      {stepIndex >= 0 && (
        <div className="h-0.5 bg-secondary">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <AnimatePresence mode="wait">
          {/* Welcome */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Salad className="w-8 h-8 text-primary" />
              </motion.div>
              <div className="text-center">
                <h2 className="text-xl font-semibold">Planifica tu nutrición</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Diseñaremos un plan adaptado a ti
                </p>
              </div>
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </motion.div>
          )}

          {/* Diet Type */}
          {step === 'diet-type' && (
            <motion.div
              key="diet-type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <ChatBubble>
                <p className="font-medium">¿Qué tipo de planificación prefieres?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Elige según el nivel de detalle que necesitas
                </p>
              </ChatBubble>

              <div className="space-y-3 pt-2">
                <OptionButton
                  selected={profile.dietType === 'ultra'}
                  onClick={() => {
                    setProfile(prev => ({ ...prev, dietType: 'ultra' }));
                    setTimeout(() => setStep('goal'), 200);
                  }}
                  icon={Target}
                  label="Plan Detallado"
                  description="Cálculo diario preciso con actividades combinadas"
                  badge="Recomendado"
                  delay={0.1}
                />
                <OptionButton
                  selected={profile.dietType === 'simple'}
                  onClick={() => {
                    setProfile(prev => ({ ...prev, dietType: 'simple' }));
                    setTimeout(() => setStep('goal'), 200);
                  }}
                  icon={Activity}
                  label="Plan Simple"
                  description="Ajustes semanales generales, más flexible"
                  delay={0.15}
                />
              </div>
            </motion.div>
          )}

          {/* Goal */}
          {step === 'goal' && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <ChatBubble>
                <p className="font-medium">¿Cuál es tu objetivo principal?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ajustaremos las calorías según tu meta
                </p>
              </ChatBubble>

              <div className="space-y-3 pt-2">
                <OptionButton
                  selected={profile.goal === 'volumen'}
                  onClick={() => {
                    setProfile(prev => ({ ...prev, goal: 'volumen' }));
                    setTimeout(() => setStep('personal-data'), 200);
                  }}
                  icon={TrendingUp}
                  label="Ganar masa muscular"
                  description="Superávit calórico controlado"
                  badge="+250-450 kcal"
                  delay={0.1}
                />
                <OptionButton
                  selected={profile.goal === 'mantenimiento'}
                  onClick={() => {
                    setProfile(prev => ({ ...prev, goal: 'mantenimiento' }));
                    setTimeout(() => setStep('personal-data'), 200);
                  }}
                  icon={Minus}
                  label="Mantener peso"
                  description="Balance energético equilibrado"
                  badge="±0 kcal"
                  delay={0.15}
                />
                <OptionButton
                  selected={profile.goal === 'perdida'}
                  onClick={() => {
                    setProfile(prev => ({ ...prev, goal: 'perdida' }));
                    setTimeout(() => setStep('personal-data'), 200);
                  }}
                  icon={TrendingDown}
                  label="Perder grasa"
                  description="Déficit calórico moderado"
                  badge="-350-400 kcal"
                  delay={0.2}
                />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Personal Data */}
          {step === 'personal-data' && (
            <motion.div
              key="personal-data"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <ChatBubble>
                <p className="font-medium">Cuéntame sobre ti</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Estos datos son necesarios para calcular tu metabolismo
                </p>
              </ChatBubble>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl p-5 border border-border space-y-5"
              >
                {/* Sex */}
                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">Sexo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['hombre', 'mujer'] as const).map((sex) => (
                      <button
                        key={sex}
                        onClick={() => setProfile(prev => ({ ...prev, sex }))}
                        className={cn(
                          "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                          profile.sex === sex
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <User className={cn(
                          "w-5 h-5 mx-auto mb-1",
                          profile.sex === sex ? "text-primary" : "text-muted-foreground"
                        )} />
                        {sex === 'hombre' ? 'Hombre' : 'Mujer'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Edad
                    </span>
                    <span className="font-medium text-foreground">{profile.age} años</span>
                  </label>
                  <Slider
                    value={[profile.age]}
                    onValueChange={([age]) => setProfile(prev => ({ ...prev, age }))}
                    min={16}
                    max={80}
                    step={1}
                    className="mt-3"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Scale className="w-4 h-4" /> Peso
                    </span>
                    <span className="font-medium text-foreground">{profile.weight} kg</span>
                  </label>
                  <Slider
                    value={[profile.weight]}
                    onValueChange={([weight]) => setProfile(prev => ({ ...prev, weight }))}
                    min={40}
                    max={150}
                    step={1}
                    className="mt-3"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Altura
                    </span>
                    <span className="font-medium text-foreground">{profile.height} cm</span>
                  </label>
                  <Slider
                    value={[profile.height]}
                    onValueChange={([height]) => setProfile(prev => ({ ...prev, height }))}
                    min={140}
                    max={220}
                    step={1}
                    className="mt-3"
                  />
                </div>

                {/* Daily Steps */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Pasos diarios
                    </span>
                    <span className="font-medium text-foreground">{profile.dailySteps.toLocaleString()}</span>
                  </label>
                  <Slider
                    value={[profile.dailySteps]}
                    onValueChange={([dailySteps]) => setProfile(prev => ({ ...prev, dailySteps }))}
                    min={2000}
                    max={25000}
                    step={500}
                    className="mt-3"
                  />
                </div>
              </motion.div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={goBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => setStep('meals-allergies')}
                >
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Meals & Allergies */}
          {step === 'meals-allergies' && (
            <motion.div
              key="meals-allergies"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <ChatBubble>
                <p className="font-medium">Preferencias alimentarias</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ¿Cuántas comidas al día? ¿Alguna restricción?
                </p>
              </ChatBubble>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl p-5 border border-border space-y-5"
              >
                <div>
                  <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4" /> Número de comidas
                  </label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setProfile(prev => ({ ...prev, mealsPerDay: num }))}
                        className={cn(
                          "flex-1 py-3 rounded-xl border-2 text-lg font-semibold transition-all",
                          profile.mealsPerDay === num
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Alergias o intolerancias
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGIES.map((allergy) => (
                      <button
                        key={allergy}
                        onClick={() => toggleAllergy(allergy)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                          profile.allergies.includes(allergy)
                            ? "bg-destructive/10 border-destructive/50 text-destructive"
                            : "border-border hover:border-destructive/30"
                        )}
                      >
                        {profile.allergies.includes(allergy) && <Check className="w-3 h-3 inline mr-1" />}
                        {allergy}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Selecciona las que apliquen
                  </p>
                </div>
              </motion.div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={goBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => setStep('activity-setup')}
                >
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Activity Setup */}
          {step === 'activity-setup' && (
            <motion.div
              key="activity-setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <ChatBubble>
                <p className="font-medium">Configura tu semana de entrenamiento</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecciona actividades y duración para cada día
                </p>
              </ChatBubble>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                {weeklyActivities.map((day, dayIndex) => (
                  <motion.div 
                    key={day.day} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * dayIndex }}
                    className="bg-card rounded-xl p-3 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{day.day}</span>
                      <div className="flex gap-1">
                        {day.activities.filter(a => a !== 'rest').length > 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Combo
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Activity toggles - minimal icons */}
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {(['gym', 'swimming', 'running', 'rest'] as ActivityType[]).map((activity) => {
                        const Icon = ACTIVITY_ICONS[activity];
                        const isActive = day.activities.includes(activity);
                        return (
                          <button
                            key={activity}
                            onClick={() => toggleActivity(dayIndex, activity)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px]">{ACTIVITY_LABELS[activity]}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Duration inputs */}
                    {day.activities.filter(a => a !== 'rest').length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-border">
                        {day.activities.filter(a => a !== 'rest').map(activity => (
                          <MinimalDurationInput
                            key={activity}
                            activity={activity}
                            value={day.durations[activity]}
                            onChange={(v) => updateDuration(dayIndex, activity, v)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={goBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleCalculate}
                >
                  <Calculator className="w-4 h-4 mr-2" /> Generar plan
                </Button>
              </div>
            </motion.div>
          )}

          {/* Calculating */}
          {step === 'calculating' && (
            <motion.div
              key="calculating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 space-y-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent"
                />
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="font-semibold">Generando tu plan</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {[
                    'Calculando metabolismo basal',
                    'Estimando gasto energético',
                    'Distribuyendo macronutrientes',
                    'Generando comidas'
                  ].map((text, i) => (
                    <motion.div
                      key={text}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.4 }}
                      className="flex items-center gap-2 justify-center"
                    >
                      <Check className="w-4 h-4 text-primary" />
                      <span>{text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Overview */}
          {step === 'results-overview' && weeklyPlan && (
            <motion.div
              key="results-overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-2xl p-4 border border-border"
                >
                  <p className="text-xs text-muted-foreground">Metabolismo Basal</p>
                  <p className="text-2xl font-semibold text-foreground">{weeklyPlan.bmr}</p>
                  <p className="text-xs text-muted-foreground">kcal/día</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-card rounded-2xl p-4 border border-border"
                >
                  <p className="text-xs text-muted-foreground">TDEE Promedio</p>
                  <p className="text-2xl font-semibold text-primary">{weeklyPlan.averageTDEE}</p>
                  <p className="text-xs text-muted-foreground">kcal/día</p>
                </motion.div>
              </div>

              {/* Summary stats */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl p-4 border border-border"
              >
                <h4 className="font-medium mb-3 text-sm">Resumen semanal</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-semibold text-primary">{weeklyPlan.summary.trainingDays}</p>
                    <p className="text-xs text-muted-foreground">Entrenamiento</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-muted-foreground">{weeklyPlan.summary.restDays}</p>
                    <p className="text-xs text-muted-foreground">Descanso</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-primary">{weeklyPlan.summary.combinedDays}</p>
                    <p className="text-xs text-muted-foreground">Combinados</p>
                  </div>
                </div>
              </motion.div>

              {/* Calorie targets by day type */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="bg-card rounded-2xl p-4 border-2 border-primary/30">
                  <p className="text-xs text-muted-foreground">Días de entreno</p>
                  <p className="text-xl font-semibold text-primary">{weeklyPlan.summary.avgCaloriesTraining}</p>
                  <p className="text-xs text-muted-foreground">kcal/día</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground">Días de descanso</p>
                  <p className="text-xl font-semibold text-muted-foreground">{weeklyPlan.summary.avgCaloriesRest || '—'}</p>
                  <p className="text-xs text-muted-foreground">kcal/día</p>
                </div>
              </motion.div>

              {/* Weekly total */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-primary/5 rounded-2xl p-4 border border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total semanal</span>
                  <span className="text-xl font-semibold text-primary">
                    {weeklyPlan.weeklyCalories.toLocaleString()} kcal
                  </span>
                </div>
              </motion.div>

              <Button 
                className="w-full"
                onClick={() => setStep('weekly-plan')}
              >
                Ver plan completo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Weekly Plan */}
          {step === 'weekly-plan' && weeklyPlan && (
            <motion.div
              key="weekly-plan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Plan Semanal</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep('results-overview')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Resumen
                </Button>
              </div>

              <div className="space-y-2">
                {weeklyPlan.days.map((day, idx) => (
                  <MinimalDayPlanCard 
                    key={day.day} 
                    day={day} 
                    expanded={selectedDay === idx}
                    onToggle={() => setSelectedDay(selectedDay === idx ? -1 : idx)}
                    onUpdateMeal={(mealIndex, newFoods) => handleUpdateMeal(idx, mealIndex, newFoods)}
                    allergies={profile.allergies}
                  />
                ))}
              </div>

              <Button 
                className="w-full"
                onClick={() => {
                  onPlanCreated?.(weeklyPlan);
                  onClose();
                }}
              >
                <Check className="w-4 h-4 mr-2" /> Guardar plan
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
