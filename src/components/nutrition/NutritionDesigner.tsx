import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowRight, RefreshCw, Calculator, Activity, 
  Flame, Beef, Wheat, Droplets, ChefHat, Calendar,
  User, Ruler, Weight, Footprints, Dumbbell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { NeoLogo } from '@/components/NeoLogo';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NutritionDesignerProps {
  onClose: () => void;
  onPlanCreated?: (plan: WeeklyDietPlan) => void;
}

interface UserMetabolism {
  age: number;
  sex: 'hombre' | 'mujer';
  weight: number; // kg
  height: number; // cm
  activityLevel: number; // 1.2 - 1.9
  dailySteps: number;
  trainingMinutes: number;
  trainingType: 'fuerza' | 'cardio' | 'mixto';
  goal: 'perder' | 'mantener' | 'ganar';
}

interface DailyMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DayMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: string[];
}

interface DayPlan {
  day: string;
  isTrainingDay: boolean;
  totalCalories: number;
  meals: DayMeal[];
  macros: DailyMacros;
}

interface WeeklyDietPlan {
  basalMetabolism: number;
  tdee: number;
  targetCalories: number;
  macroDistribution: DailyMacros;
  days: DayPlan[];
}

type Step = 
  | 'welcome'
  | 'personal-data'
  | 'activity-data'
  | 'goal'
  | 'calculating'
  | 'results'
  | 'weekly-plan';

const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentario', desc: 'Poco o ningún ejercicio' },
  { value: 1.375, label: 'Ligero', desc: '1-3 días/semana' },
  { value: 1.55, label: 'Moderado', desc: '3-5 días/semana' },
  { value: 1.725, label: 'Activo', desc: '6-7 días/semana' },
  { value: 1.9, label: 'Muy activo', desc: 'Atleta o trabajo físico' },
];

const TRAINING_TYPES = [
  { value: 'fuerza', label: 'Fuerza', icon: Dumbbell, color: 'text-red-500' },
  { value: 'cardio', label: 'Cardio', icon: Activity, color: 'text-blue-500' },
  { value: 'mixto', label: 'Mixto', icon: RefreshCw, color: 'text-purple-500' },
];

const GOALS = [
  { value: 'perder', label: 'Perder grasa', multiplier: 0.8, color: 'from-red-500 to-orange-500' },
  { value: 'mantener', label: 'Mantener peso', multiplier: 1, color: 'from-blue-500 to-cyan-500' },
  { value: 'ganar', label: 'Ganar músculo', multiplier: 1.1, color: 'from-green-500 to-emerald-500' },
];

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const NutritionDesigner = ({ onClose, onPlanCreated }: NutritionDesignerProps) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<Step>('welcome');
  const [metabolism, setMetabolism] = useState<UserMetabolism>({
    age: 30,
    sex: 'hombre',
    weight: 75,
    height: 175,
    activityLevel: 1.55,
    dailySteps: 8000,
    trainingMinutes: 60,
    trainingType: 'mixto',
    goal: 'mantener'
  });
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyDietPlan | null>(null);
  const [trainingDays, setTrainingDays] = useState<boolean[]>([true, false, true, false, true, false, false]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    const timer = setTimeout(() => setStep('personal-data'), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate Basal Metabolic Rate (Mifflin-St Jeor)
  const calculateBMR = (): number => {
    const { weight, height, age, sex } = metabolism;
    if (sex === 'hombre') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  // Calculate TDEE with steps and training
  const calculateTDEE = (bmr: number): number => {
    const { activityLevel, dailySteps, trainingMinutes, trainingType } = metabolism;
    
    // Base TDEE
    let tdee = bmr * activityLevel;
    
    // Add calories from extra steps (above 5000 baseline)
    const extraSteps = Math.max(0, dailySteps - 5000);
    tdee += extraSteps * 0.04; // ~0.04 kcal per step
    
    // Add training calories
    let caloriesPerMinute = 6; // Default
    if (trainingType === 'fuerza') caloriesPerMinute = 5;
    if (trainingType === 'cardio') caloriesPerMinute = 8;
    if (trainingType === 'mixto') caloriesPerMinute = 6.5;
    
    tdee += (trainingMinutes * caloriesPerMinute * trainingDays.filter(Boolean).length) / 7;
    
    return Math.round(tdee);
  };

  // Calculate macros based on goal
  const calculateMacros = (targetCalories: number, isTrainingDay: boolean): DailyMacros => {
    const { goal, weight, trainingType } = metabolism;
    
    // Adjust calories for training days
    const dayCalories = isTrainingDay ? targetCalories + 200 : targetCalories - 100;
    
    // Protein: 1.8-2.2g per kg
    let proteinMultiplier = 2;
    if (goal === 'perder') proteinMultiplier = 2.2;
    if (goal === 'ganar') proteinMultiplier = 2;
    const protein = Math.round(weight * proteinMultiplier);
    
    // Fat: 25-35% of calories
    const fatPercent = goal === 'perder' ? 0.30 : 0.25;
    const fat = Math.round((dayCalories * fatPercent) / 9);
    
    // Carbs: remaining calories
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const carbs = Math.round((dayCalories - proteinCalories - fatCalories) / 4);
    
    return {
      calories: Math.round(dayCalories),
      protein,
      carbs: Math.max(50, carbs), // Minimum 50g carbs
      fat
    };
  };

  // Generate meal plan for a day
  const generateDayMeals = (macros: DailyMacros, isTrainingDay: boolean): DayMeal[] => {
    const meals: DayMeal[] = [];
    
    // Distribution: Breakfast 25%, Lunch 35%, Snack 15%, Dinner 25%
    const mealDistributions = [
      { name: 'Desayuno', percent: 0.25 },
      { name: 'Comida', percent: 0.35 },
      { name: 'Merienda', percent: 0.15 },
      { name: 'Cena', percent: 0.25 },
    ];
    
    if (isTrainingDay) {
      mealDistributions.push({ name: 'Post-entreno', percent: 0 }); // Extra snack
    }
    
    const foodSuggestions: Record<string, string[]> = {
      'Desayuno': [
        'Avena con frutos rojos y proteína',
        'Tostadas integrales con aguacate y huevos',
        'Yogur griego con granola y fruta',
        'Tortilla de claras con espinacas',
        'Smoothie de proteína con plátano'
      ],
      'Comida': [
        'Pollo a la plancha con arroz y verduras',
        'Salmón con patata dulce y brócoli',
        'Ternera magra con quinoa y ensalada',
        'Pavo con pasta integral y salsa de tomate',
        'Atún con legumbres y vegetales'
      ],
      'Merienda': [
        'Batido de proteína con fruta',
        'Frutos secos y queso fresco',
        'Tortitas de arroz con crema de cacahuete',
        'Yogur con nueces',
        'Hummus con palitos de zanahoria'
      ],
      'Cena': [
        'Pescado blanco con verduras al vapor',
        'Ensalada completa con proteína',
        'Revuelto de huevos con champiñones',
        'Pollo al horno con espárragos',
        'Tortilla francesa con ensalada'
      ],
      'Post-entreno': [
        'Batido de proteína con plátano',
        'Pan con pavo y aguacate',
        'Yogur griego con miel'
      ]
    };
    
    mealDistributions.forEach(({ name, percent }) => {
      const mealMacros = {
        calories: Math.round(macros.calories * (percent || 0.1)),
        protein: Math.round(macros.protein * (percent || 0.15)),
        carbs: Math.round(macros.carbs * (percent || 0.1)),
        fat: Math.round(macros.fat * (percent || 0.1)),
      };
      
      const foods = foodSuggestions[name] || [];
      const randomFoods = foods.sort(() => Math.random() - 0.5).slice(0, 2);
      
      meals.push({
        name,
        ...mealMacros,
        foods: randomFoods
      });
    });
    
    return meals;
  };

  // Generate full weekly plan
  const generateWeeklyPlan = () => {
    const bmr = calculateBMR();
    const tdee = calculateTDEE(bmr);
    const goalData = GOALS.find(g => g.value === metabolism.goal);
    const targetCalories = Math.round(tdee * (goalData?.multiplier || 1));
    
    const baseMacros = calculateMacros(targetCalories, false);
    
    const days: DayPlan[] = DAYS_OF_WEEK.map((day, index) => {
      const isTrainingDay = trainingDays[index];
      const dayMacros = calculateMacros(targetCalories, isTrainingDay);
      const meals = generateDayMeals(dayMacros, isTrainingDay);
      
      return {
        day,
        isTrainingDay,
        totalCalories: dayMacros.calories,
        meals,
        macros: dayMacros
      };
    });
    
    return {
      basalMetabolism: Math.round(bmr),
      tdee,
      targetCalories,
      macroDistribution: baseMacros,
      days
    };
  };

  const handleCalculate = async () => {
    setStep('calculating');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const plan = generateWeeklyPlan();
    setWeeklyPlan(plan);
    setStep('results');
  };

  const handleViewWeeklyPlan = () => {
    setStep('weekly-plan');
  };

  const handleSavePlan = () => {
    if (weeklyPlan) {
      onPlanCreated?.(weeklyPlan);
      toast.success('¡Plan nutricional guardado!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col max-h-[85vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="flex items-center gap-2">
          <NeoLogo size="sm" className="bg-white/20" />
          <div>
            <h3 className="font-semibold text-sm">NEO Nutrición</h3>
            <p className="text-[10px] opacity-80">Diseña tu dieta personalizada</p>
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ChefHat className="w-12 h-12 mx-auto text-orange-500 mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2">¡Diseña tu dieta! 🍽️</h2>
              <p className="text-muted-foreground text-sm">
                Calcularemos tu metabolismo y crearemos un plan semanal
              </p>
            </motion.div>
          )}

          {/* Personal Data */}
          {step === 'personal-data' && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Datos personales
                </h3>
                
                <div className="space-y-4">
                  {/* Sex selection */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Sexo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['hombre', 'mujer'].map((sex) => (
                        <button
                          key={sex}
                          onClick={() => setMetabolism(prev => ({ ...prev, sex: sex as 'hombre' | 'mujer' }))}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                            metabolism.sex === sex
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
                      <span>Edad</span>
                      <span className="font-medium text-foreground">{metabolism.age} años</span>
                    </label>
                    <Slider
                      value={[metabolism.age]}
                      onValueChange={([age]) => setMetabolism(prev => ({ ...prev, age }))}
                      min={16}
                      max={80}
                      step={1}
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Weight className="w-4 h-4" /> Peso
                      </span>
                      <span className="font-medium text-foreground">{metabolism.weight} kg</span>
                    </label>
                    <Slider
                      value={[metabolism.weight]}
                      onValueChange={([weight]) => setMetabolism(prev => ({ ...prev, weight }))}
                      min={40}
                      max={150}
                      step={1}
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Ruler className="w-4 h-4" /> Altura
                      </span>
                      <span className="font-medium text-foreground">{metabolism.height} cm</span>
                    </label>
                    <Slider
                      value={[metabolism.height]}
                      onValueChange={([height]) => setMetabolism(prev => ({ ...prev, height }))}
                      min={140}
                      max={220}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                onClick={() => setStep('activity-data')}
              >
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Activity Data */}
          {step === 'activity-data' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  Nivel de actividad
                </h3>
                
                <div className="space-y-4">
                  {/* Activity Level */}
                  <div className="space-y-2">
                    {ACTIVITY_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setMetabolism(prev => ({ ...prev, activityLevel: level.value }))}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          metabolism.activityLevel === level.value
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-border hover:border-orange-500/50'
                        }`}
                      >
                        <p className="font-medium text-sm">{level.label}</p>
                        <p className="text-xs text-muted-foreground">{level.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Daily Steps */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Footprints className="w-4 h-4" /> Pasos diarios
                      </span>
                      <span className="font-medium text-foreground">{metabolism.dailySteps.toLocaleString()}</span>
                    </label>
                    <Slider
                      value={[metabolism.dailySteps]}
                      onValueChange={([dailySteps]) => setMetabolism(prev => ({ ...prev, dailySteps }))}
                      min={2000}
                      max={20000}
                      step={500}
                    />
                  </div>

                  {/* Training Minutes */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-4 h-4" /> Minutos de entreno
                      </span>
                      <span className="font-medium text-foreground">{metabolism.trainingMinutes} min</span>
                    </label>
                    <Slider
                      value={[metabolism.trainingMinutes]}
                      onValueChange={([trainingMinutes]) => setMetabolism(prev => ({ ...prev, trainingMinutes }))}
                      min={0}
                      max={180}
                      step={15}
                    />
                  </div>

                  {/* Training Type */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Tipo de entreno</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TRAINING_TYPES.map(({ value, label, icon: Icon, color }) => (
                        <button
                          key={value}
                          onClick={() => setMetabolism(prev => ({ ...prev, trainingType: value as 'fuerza' | 'cardio' | 'mixto' }))}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            metabolism.trainingType === value
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-border hover:border-orange-500/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                          <p className="text-xs font-medium">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Training Days */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Días de entreno</label>
                    <div className="flex gap-1">
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const newDays = [...trainingDays];
                            newDays[index] = !newDays[index];
                            setTrainingDays(newDays);
                          }}
                          className={`flex-1 aspect-square rounded-lg text-xs font-bold transition-all ${
                            trainingDays[index]
                              ? 'bg-orange-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                onClick={() => setStep('goal')}
              >
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Goal */}
          {step === 'goal' && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-semibold mb-4">¿Cuál es tu objetivo? 🎯</h3>
                
                <div className="space-y-2">
                  {GOALS.map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => setMetabolism(prev => ({ ...prev, goal: value as 'perder' | 'mantener' | 'ganar' }))}
                      className={`w-full p-4 rounded-xl border transition-all ${
                        metabolism.goal === value
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-border hover:border-orange-500/50'
                      }`}
                    >
                      <div className={`h-1 rounded-full bg-gradient-to-r ${color} mb-2`} />
                      <p className="font-medium">{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                onClick={handleCalculate}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calcular mi plan
              </Button>
            </motion.div>
          )}

          {/* Calculating */}
          {step === 'calculating' && (
            <motion.div
              key="calculating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 mx-auto mb-4"
              >
                <Calculator className="w-12 h-12 text-orange-500" />
              </motion.div>
              <p className="text-sm font-medium">Calculando tu metabolismo...</p>
              <p className="text-xs text-muted-foreground mt-2">
                Analizando TMB, TDEE y macronutrientes
              </p>
            </motion.div>
          )}

          {/* Results */}
          {step === 'results' && weeklyPlan && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Metabolism cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-3 text-white">
                  <p className="text-xs opacity-80">Metabolismo Basal</p>
                  <p className="text-2xl font-bold">{weeklyPlan.basalMetabolism}</p>
                  <p className="text-xs opacity-80">kcal/día</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-xl p-3 text-white">
                  <p className="text-xs opacity-80">Gasto Total (TDEE)</p>
                  <p className="text-2xl font-bold">{weeklyPlan.tdee}</p>
                  <p className="text-xs opacity-80">kcal/día</p>
                </div>
              </div>

              {/* Target */}
              <div className="bg-card rounded-xl p-4 border-2 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Tu objetivo diario</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500">
                    {metabolism.goal === 'perder' ? '-20%' : metabolism.goal === 'ganar' ? '+10%' : 'Mantener'}
                  </span>
                </div>
                <p className="text-3xl font-bold text-orange-500">{weeklyPlan.targetCalories} kcal</p>
              </div>

              {/* Macros */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-semibold mb-3">Distribución de macros</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-1">
                      <Beef className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-lg font-bold text-green-500">{weeklyPlan.macroDistribution.protein}g</p>
                    <p className="text-xs text-muted-foreground">Proteína</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-1">
                      <Wheat className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-lg font-bold text-blue-500">{weeklyPlan.macroDistribution.carbs}g</p>
                    <p className="text-xs text-muted-foreground">Carbos</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center mb-1">
                      <Droplets className="w-6 h-6 text-yellow-500" />
                    </div>
                    <p className="text-lg font-bold text-yellow-500">{weeklyPlan.macroDistribution.fat}g</p>
                    <p className="text-xs text-muted-foreground">Grasas</p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                onClick={handleViewWeeklyPlan}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver plan semanal
              </Button>
            </motion.div>
          )}

          {/* Weekly Plan */}
          {step === 'weekly-plan' && weeklyPlan && (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="text-center mb-2">
                <h3 className="font-bold">Tu plan semanal</h3>
                <p className="text-xs text-muted-foreground">Adaptado a tus días de entreno</p>
              </div>

              {weeklyPlan.days.map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card rounded-xl border p-3 ${
                    day.isTrainingDay ? 'border-orange-500/50 bg-orange-500/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{day.day}</span>
                      {day.isTrainingDay && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500 text-white">
                          🏋️ Entreno
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-orange-500">{day.totalCalories} kcal</span>
                  </div>
                  
                  <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {day.macros.protein}g P
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {day.macros.carbs}g C
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      {day.macros.fat}g G
                    </span>
                  </div>

                  <div className="space-y-1">
                    {day.meals.slice(0, 4).map((meal) => (
                      <div key={meal.name} className="flex justify-between text-xs bg-muted/50 rounded-lg px-2 py-1.5">
                        <span className="font-medium">{meal.name}</span>
                        <span className="text-muted-foreground">{meal.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button 
                  variant="outline"
                  onClick={() => setStep('results')}
                >
                  Volver
                </Button>
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                  onClick={handleSavePlan}
                >
                  Guardar plan
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
    </motion.div>
  );
};
