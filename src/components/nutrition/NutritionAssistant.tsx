import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowRight, ArrowLeft, Calculator, ChefHat, Crown, Zap,
  Target, TrendingUp, TrendingDown, Minus,
  User, Ruler, Scale, Calendar, Utensils, AlertTriangle,
  Dumbbell, Waves, Activity, Moon, Check, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { NeoLogo } from '@/components/NeoLogo';
import type { 
  NutritionStep, DietType, NutritionGoal, 
  UserNutritionProfile, DayActivity, ActivityType,
  WeeklyNutritionPlan, DayNutritionPlan
} from './types';
import { 
  calculateBMR, calculateActivityCalories, calculateStepsCalories,
  calculateDayTDEE, getCalorieAdjustment, calculateMacros,
  getActivityColor, getActivityIcon, getActivityLabel
} from './calculations';
import { generateDayMeals } from './mealGenerator';
import { DayPlanCard } from './DayPlanCard';
import { MacroRing } from './MacroRing';
import { WeeklyOverview } from './WeeklyOverview';

interface NutritionAssistantProps {
  onClose: () => void;
  onPlanCreated?: (plan: WeeklyNutritionPlan) => void;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const COMMON_ALLERGIES = ['Gluten', 'Lactosa', 'Huevo', 'Frutos secos', 'Marisco', 'Soja'];

export const NutritionAssistant = ({ onClose, onPlanCreated }: NutritionAssistantProps) => {
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
  const [selectedDay, setSelectedDay] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => setStep('diet-type'), 1500);
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
    await new Promise(resolve => setTimeout(resolve, 2500));
    const plan = generatePlan();
    setWeeklyPlan(plan);
    setStep('results-overview');
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="flex items-center gap-2">
          <NeoLogo size="sm" className="bg-white/20" />
          <div>
            <h3 className="font-semibold text-sm">NEO Nutrición Pro</h3>
            <p className="text-[10px] opacity-80">Asistente de dietas personalizado</p>
          </div>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        <AnimatePresence mode="wait">
          {/* Welcome */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-10"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ChefHat className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2">¡Bienvenido a NEO Nutrición!</h2>
              <p className="text-muted-foreground text-sm">
                Diseñaremos tu plan nutricional perfecto
              </p>
            </motion.div>
          )}

          {/* Diet Type Selection */}
          {step === 'diet-type' && (
            <motion.div
              key="diet-type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">¿Qué tipo de dieta quieres?</h2>
                <p className="text-sm text-muted-foreground">Elige tu nivel de planificación</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setProfile(prev => ({ ...prev, dietType: 'ultra' }));
                    setStep('goal');
                  }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    profile.dietType === 'ultra'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-border hover:border-orange-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base">Dieta Ultra</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Planificación diaria completa con cálculo preciso de calorías según actividades combinadas
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-[10px]">Gym + Cardio</Badge>
                        <Badge variant="secondary" className="text-[10px]">Macros exactos</Badge>
                        <Badge variant="secondary" className="text-[10px]">Comidas detalladas</Badge>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setProfile(prev => ({ ...prev, dietType: 'simple' }));
                    setStep('goal');
                  }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    profile.dietType === 'simple'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-border hover:border-orange-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base">Dieta Simple</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Planificación resumida con ajustes semanales generales
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-[10px]">Fácil de seguir</Badge>
                        <Badge variant="secondary" className="text-[10px]">Flexible</Badge>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Goal Selection */}
          {step === 'goal' && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">¿Cuál es tu objetivo?</h2>
                <p className="text-sm text-muted-foreground">Ajustaremos las calorías según tu meta</p>
              </div>

              <div className="grid gap-3">
                {[
                  { value: 'volumen', label: 'Volumen', desc: 'Ganar masa muscular', icon: TrendingUp, color: 'from-green-500 to-emerald-500', adjustment: '+250-450 kcal' },
                  { value: 'mantenimiento', label: 'Mantenimiento', desc: 'Mantener peso actual', icon: Minus, color: 'from-blue-500 to-cyan-500', adjustment: '±0 kcal' },
                  { value: 'perdida', label: 'Pérdida de grasa', desc: 'Definir y perder grasa', icon: TrendingDown, color: 'from-red-500 to-orange-500', adjustment: '-350-400 kcal' },
                ].map(({ value, label, desc, icon: Icon, color, adjustment }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setProfile(prev => ({ ...prev, goal: value as NutritionGoal }));
                      setStep('personal-data');
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      profile.goal === value
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-border hover:border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{label}</h3>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{adjustment}</Badge>
                    </div>
                  </button>
                ))}
              </div>

              <Button variant="ghost" size="sm" onClick={goBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
              </Button>
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
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Datos personales
                </h3>
                
                <div className="space-y-4">
                  {/* Sex */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Sexo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['hombre', 'mujer'] as const).map((sex) => (
                        <button
                          key={sex}
                          onClick={() => setProfile(prev => ({ ...prev, sex }))}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            profile.sex === sex
                              ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                              : 'border-border hover:border-orange-500/50'
                          }`}
                        >
                          {sex === 'hombre' ? '👨 Hombre' : '👩 Mujer'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Edad</span>
                      <span className="font-medium text-foreground">{profile.age} años</span>
                    </label>
                    <Slider
                      value={[profile.age]}
                      onValueChange={([age]) => setProfile(prev => ({ ...prev, age }))}
                      min={16}
                      max={80}
                      step={1}
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Scale className="w-4 h-4" /> Peso</span>
                      <span className="font-medium text-foreground">{profile.weight} kg</span>
                    </label>
                    <Slider
                      value={[profile.weight]}
                      onValueChange={([weight]) => setProfile(prev => ({ ...prev, weight }))}
                      min={40}
                      max={150}
                      step={1}
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Ruler className="w-4 h-4" /> Altura</span>
                      <span className="font-medium text-foreground">{profile.height} cm</span>
                    </label>
                    <Slider
                      value={[profile.height]}
                      onValueChange={([height]) => setProfile(prev => ({ ...prev, height }))}
                      min={140}
                      max={220}
                      step={1}
                    />
                  </div>

                  {/* Daily Steps */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> Pasos diarios</span>
                      <span className="font-medium text-foreground">{profile.dailySteps.toLocaleString()}</span>
                    </label>
                    <Slider
                      value={[profile.dailySteps]}
                      onValueChange={([dailySteps]) => setProfile(prev => ({ ...prev, dailySteps }))}
                      min={2000}
                      max={25000}
                      step={500}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white"
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
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-500" />
                  Número de comidas
                </h3>
                
                <div className="flex gap-2">
                  {[3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setProfile(prev => ({ ...prev, mealsPerDay: num }))}
                      className={`flex-1 py-3 rounded-xl border-2 text-lg font-bold transition-all ${
                        profile.mealsPerDay === num
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-border hover:border-orange-500/50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Alergias e intolerancias
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGIES.map((allergy) => (
                    <Badge
                      key={allergy}
                      variant={profile.allergies.includes(allergy) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        profile.allergies.includes(allergy)
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'hover:border-red-500/50'
                      }`}
                      onClick={() => toggleAllergy(allergy)}
                    >
                      {profile.allergies.includes(allergy) && <Check className="w-3 h-3 mr-1" />}
                      {allergy}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Toca para seleccionar las que apliquen
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white"
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
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold">Configura tu semana</h2>
                <p className="text-sm text-muted-foreground">Selecciona actividades y duración para cada día</p>
              </div>

              <div className="space-y-3">
                {weeklyActivities.map((day, dayIndex) => (
                  <div key={day.day} className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{day.day}</span>
                      <div className="flex gap-1">
                        {day.activities.map(a => (
                          <span key={a} className="text-lg">{getActivityIcon(a)}</span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Activity toggles */}
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {(['gym', 'swimming', 'running', 'rest'] as ActivityType[]).map((activity) => (
                        <button
                          key={activity}
                          onClick={() => toggleActivity(dayIndex, activity)}
                          className={`p-2 rounded-lg text-xs font-medium transition-all ${
                            day.activities.includes(activity)
                              ? `${getActivityColor(activity)} text-white`
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {getActivityIcon(activity)}
                        </button>
                      ))}
                    </div>
                    
                    {/* Duration sliders for active activities */}
                    {day.activities.filter(a => a !== 'rest').map(activity => (
                      <div key={activity} className="flex items-center gap-2 text-xs">
                        <span className="w-16">{getActivityLabel(activity)}</span>
                        <Slider
                          value={[day.durations[activity]]}
                          onValueChange={([v]) => updateDuration(dayIndex, activity, v)}
                          min={15}
                          max={120}
                          step={15}
                          className="flex-1"
                        />
                        <span className="w-12 text-right font-medium">{day.durations[activity]}min</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                  onClick={handleCalculate}
                >
                  <Calculator className="w-4 h-4 mr-2" /> Calcular plan
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
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="inline-block mb-4"
              >
                <RefreshCw className="w-12 h-12 text-orange-500" />
              </motion.div>
              <h3 className="font-bold text-lg mb-2">Generando tu plan...</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  ✓ Calculando metabolismo basal...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  ✓ Estimando TDEE por actividad...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  ✓ Distribuyendo macronutrientes...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                >
                  ✓ Generando comidas personalizadas...
                </motion.p>
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
              {/* BMR & TDEE Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-3 text-white">
                  <p className="text-xs opacity-80">Metabolismo Basal</p>
                  <p className="text-2xl font-bold">{weeklyPlan.bmr}</p>
                  <p className="text-xs opacity-80">kcal/día</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-xl p-3 text-white">
                  <p className="text-xs opacity-80">TDEE Promedio</p>
                  <p className="text-2xl font-bold">{weeklyPlan.averageTDEE}</p>
                  <p className="text-xs opacity-80">kcal/día</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-semibold mb-3">Resumen semanal</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-500/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-green-500">{weeklyPlan.summary.trainingDays}</p>
                    <p className="text-[10px] text-muted-foreground">Días entreno</p>
                  </div>
                  <div className="bg-gray-500/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-500">{weeklyPlan.summary.restDays}</p>
                    <p className="text-[10px] text-muted-foreground">Días descanso</p>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-purple-500">{weeklyPlan.summary.combinedDays}</p>
                    <p className="text-[10px] text-muted-foreground">Días combinados</p>
                  </div>
                </div>
              </div>

              {/* Calories by day type */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card rounded-xl p-3 border-2 border-green-500/50">
                  <p className="text-xs text-muted-foreground">Días de entreno</p>
                  <p className="text-xl font-bold text-green-500">{weeklyPlan.summary.avgCaloriesTraining}</p>
                  <p className="text-xs text-muted-foreground">kcal/día</p>
                </div>
                <div className="bg-card rounded-xl p-3 border-2 border-gray-500/50">
                  <p className="text-xs text-muted-foreground">Días de descanso</p>
                  <p className="text-xl font-bold text-gray-500">{weeklyPlan.summary.avgCaloriesRest || '—'}</p>
                  <p className="text-xs text-muted-foreground">kcal/día</p>
                </div>
              </div>

              {/* Weekly calories */}
              <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-4 border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total semanal</span>
                  <span className="text-2xl font-bold text-orange-500">
                    {weeklyPlan.weeklyCalories.toLocaleString()} kcal
                  </span>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                onClick={() => setStep('weekly-plan')}
              >
                <Calendar className="w-4 h-4 mr-2" /> Ver plan semanal completo
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
                <h3 className="font-bold">Plan Semanal</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep('results-overview')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Resumen
                </Button>
              </div>

              {weeklyPlan.days.map((day, idx) => (
                <DayPlanCard 
                  key={day.day} 
                  day={day} 
                  expanded={selectedDay === idx}
                  onToggle={() => setSelectedDay(selectedDay === idx ? -1 : idx)}
                />
              ))}

              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white"
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
