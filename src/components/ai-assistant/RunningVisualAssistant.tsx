import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, RefreshCw, Timer, Activity, Footprints, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OnboardingButtons } from './OnboardingButtons';
import type { UserProfile } from './types';

interface RunningVisualAssistantProps {
  onClose: () => void;
  onWorkoutSaved?: () => void;
}

interface RunningExercise {
  id: string;
  name: string;
  description: string;
  distance: string;
  pace: string;
  type: string;
  intensity: 'baja' | 'media' | 'alta';
  focus: string;
}

type ConversationStep = 
  | 'welcome'
  | 'level'
  | 'goal'
  | 'generating'
  | 'exercises'
  | 'routine-summary'
  | 'complete';

const RUNNING_EXERCISES: RunningExercise[] = [
  {
    id: 'run-1',
    name: 'Calentamiento progresivo',
    description: 'Trote suave para activar el cuerpo',
    distance: '1km',
    pace: '6:30/km',
    type: 'Calentamiento',
    intensity: 'baja',
    focus: 'Activación'
  },
  {
    id: 'run-2',
    name: 'Intervalos cortos',
    description: 'Sprints explosivos con recuperación',
    distance: '8x400m',
    pace: '4:00/km',
    type: 'Intervalos',
    intensity: 'alta',
    focus: 'Velocidad'
  },
  {
    id: 'run-3',
    name: 'Tempo run',
    description: 'Ritmo sostenido al umbral',
    distance: '5km',
    pace: '5:00/km',
    type: 'Tempo',
    intensity: 'alta',
    focus: 'Umbral'
  },
  {
    id: 'run-4',
    name: 'Rodaje aeróbico',
    description: 'Ritmo cómodo conversacional',
    distance: '8km',
    pace: '5:45/km',
    type: 'Rodaje',
    intensity: 'media',
    focus: 'Base aeróbica'
  },
  {
    id: 'run-5',
    name: 'Fartlek libre',
    description: 'Cambios de ritmo por sensaciones',
    distance: '6km',
    pace: 'Variable',
    type: 'Fartlek',
    intensity: 'media',
    focus: 'Versatilidad'
  },
  {
    id: 'run-6',
    name: 'Series en cuestas',
    description: 'Potencia y fuerza de piernas',
    distance: '8x150m',
    pace: 'Máximo',
    type: 'Cuestas',
    intensity: 'alta',
    focus: 'Fuerza'
  },
  {
    id: 'run-7',
    name: 'Carrera larga',
    description: 'Mejora resistencia y economía',
    distance: '15km',
    pace: '6:00/km',
    type: 'Largo',
    intensity: 'media',
    focus: 'Resistencia'
  },
  {
    id: 'run-8',
    name: 'Progresivo negativo',
    description: 'Aumenta ritmo gradualmente',
    distance: '8km',
    pace: '6:00→4:30/km',
    type: 'Progresivo',
    intensity: 'media',
    focus: 'Ritmo'
  },
  {
    id: 'run-9',
    name: 'Series 1000m',
    description: 'Trabajo de VO2max',
    distance: '5x1000m',
    pace: '4:30/km',
    type: 'Series',
    intensity: 'alta',
    focus: 'VO2max'
  },
  {
    id: 'run-10',
    name: 'Recuperación activa',
    description: 'Trote muy suave regenerativo',
    distance: '3km',
    pace: '7:00/km',
    type: 'Recuperación',
    intensity: 'baja',
    focus: 'Recuperación'
  }
];

const generateRunningRoutine = (
  goal: string | null, 
  level: string | null
): RunningExercise[] => {
  let exercises: RunningExercise[] = [];
  
  exercises.push(RUNNING_EXERCISES[0]); // Warmup
  
  switch (goal) {
    case 'resistencia':
      exercises.push(
        RUNNING_EXERCISES[6], // Carrera larga
        RUNNING_EXERCISES[3], // Rodaje
        RUNNING_EXERCISES[4]  // Fartlek
      );
      break;
    case 'fuerza':
      exercises.push(
        RUNNING_EXERCISES[5], // Cuestas
        RUNNING_EXERCISES[1], // Intervalos
        RUNNING_EXERCISES[8]  // Series 1000
      );
      break;
    case 'hipertrofia':
      exercises.push(
        RUNNING_EXERCISES[5], // Cuestas
        RUNNING_EXERCISES[2], // Tempo
        RUNNING_EXERCISES[8]  // Series 1000
      );
      break;
    default: // tonificacion
      exercises.push(
        RUNNING_EXERCISES[4], // Fartlek
        RUNNING_EXERCISES[7], // Progresivo
        RUNNING_EXERCISES[3]  // Rodaje
      );
  }
  
  exercises.push(RUNNING_EXERCISES[9]); // Cooldown
  
  // Adjust based on level
  if (level === 'principiante') {
    exercises = exercises.map(ex => ({
      ...ex,
      distance: ex.distance.includes('x') 
        ? ex.distance.replace(/(\d+)x/, (_, n) => `${Math.max(3, Math.floor(parseInt(n) * 0.5))}x`)
        : ex.distance.replace(/(\d+)km/, (_, n) => `${Math.max(1, Math.floor(parseInt(n) * 0.5))}km`)
    }));
  } else if (level === 'avanzado') {
    exercises = exercises.map(ex => ({
      ...ex,
      distance: ex.distance.includes('x')
        ? ex.distance.replace(/(\d+)x/, (_, n) => `${Math.floor(parseInt(n) * 1.25)}x`)
        : ex.distance.replace(/(\d+)km/, (_, n) => `${Math.floor(parseInt(n) * 1.25)}km`)
    }));
  }
  
  return exercises;
};

export const RunningVisualAssistant = ({ onClose, onWorkoutSaved }: RunningVisualAssistantProps) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<ConversationStep>('welcome');
  const [profile, setProfile] = useState<UserProfile>({
    level: null,
    goal: null,
    sex: null,
  });
  const [suggestedExercises, setSuggestedExercises] = useState<RunningExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<RunningExercise[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [step, suggestedExercises]);

  useEffect(() => {
    const timer = setTimeout(() => setStep('level'), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLevelSelect = (level: string) => {
    setProfile(prev => ({ ...prev, level: level as UserProfile['level'] }));
    setTimeout(() => setStep('goal'), 300);
  };

  const handleGoalSelect = (goal: string) => {
    setProfile(prev => ({ ...prev, goal: goal as UserProfile['goal'] }));
    generateExercises(profile.level, goal);
  };

  const generateExercises = async (level: string | null, goal: string) => {
    setStep('generating');
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const exercises = generateRunningRoutine(goal, level);
    setSuggestedExercises(exercises);
    
    setIsGenerating(false);
    setStep('exercises');
  };

  const handleAddExercise = (exercise: RunningExercise) => {
    if (!selectedExercises.find(ex => ex.id === exercise.id)) {
      setSelectedExercises(prev => [...prev, exercise]);
      toast.success(`${exercise.name} añadido`);
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const handleFinish = () => {
    if (selectedExercises.length === 0) {
      setSelectedExercises(suggestedExercises);
    }
    setStep('routine-summary');
  };

  const handleSaveRoutine = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar');
      return;
    }

    const exercises = selectedExercises.length > 0 ? selectedExercises : suggestedExercises;
    if (exercises.length === 0) return;

    setIsSaving(true);
    
    try {
      const routineName = `Running ${profile.goal || 'personalizado'} - ${new Date().toLocaleDateString()}`;
      
      const { data: program, error: programError } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          name: routineName,
          description: `${profile.level} • ${profile.goal} • ${exercises.length} bloques`,
          is_active: false,
        })
        .select()
        .single();

      if (programError) throw programError;

      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          program_id: program.id,
          name: routineName,
          short_name: 'Running',
          order_index: 0,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const exercisesToInsert = exercises.map((ex, index) => ({
        session_id: session.id,
        name: ex.name,
        series: 1,
        reps: ex.distance,
        rest: ex.pace,
        technique: ex.type,
        order_index: index,
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;

      toast.success('¡Sesión de running guardada! 🏃');
      setStep('complete');
      onWorkoutSaved?.();
    } catch (error) {
      console.error('Error saving routine:', error);
      toast.error('Error al guardar la rutina');
    } finally {
      setIsSaving(false);
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'alta': return 'bg-red-500/20 text-red-400';
      case 'media': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-green-500/20 text-green-400';
    }
  };

  const calculateTotalDistance = (exercises: RunningExercise[]) => {
    let total = 0;
    exercises.forEach(ex => {
      const kmMatch = ex.distance.match(/(\d+)km/);
      const mMatch = ex.distance.match(/(\d+)x(\d+)m/);
      if (kmMatch) {
        total += parseInt(kmMatch[1]);
      } else if (mMatch) {
        total += (parseInt(mMatch[1]) * parseInt(mMatch[2])) / 1000;
      }
    });
    return Math.round(total * 10) / 10;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col max-h-[80vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">NEO Running</h3>
            <p className="text-[10px] opacity-80">Tu coach de running</p>
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

      {/* Content area */}
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
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Footprints className="w-12 h-12 mx-auto text-green-500 mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2">¡A rodar! 🏃</h2>
              <p className="text-muted-foreground text-sm">
                Vamos a crear tu sesión de running perfecta
              </p>
            </motion.div>
          )}

          {/* Level selection */}
          {step === 'level' && (
            <motion.div
              key="level"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-sm font-medium mb-3">¿Cuál es tu nivel? 🎽</p>
                <OnboardingButtons type="level" onSelect={handleLevelSelect} selected={profile.level} />
              </div>
            </motion.div>
          )}

          {/* Goal selection */}
          {step === 'goal' && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-sm font-medium mb-3">¿Qué quieres mejorar? 🎯</p>
                <OnboardingButtons type="goal" onSelect={handleGoalSelect} selected={profile.goal} />
              </div>
            </motion.div>
          )}

          {/* Generating */}
          {step === 'generating' && (
            <motion.div
              key="generating"
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
                <RefreshCw className="w-12 h-12 text-green-500" />
              </motion.div>
              <p className="text-sm font-medium">Diseñando tu sesión...</p>
              <p className="text-xs text-muted-foreground mt-1">
                {profile.level} • {profile.goal}
              </p>
            </motion.div>
          )}

          {/* Exercises display */}
          {step === 'exercises' && (
            <motion.div
              key="exercises"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Stats summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-500/10 rounded-xl p-3 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto text-green-500 mb-1" />
                  <p className="text-lg font-bold text-green-500">
                    {calculateTotalDistance(suggestedExercises)}km
                  </p>
                  <p className="text-[10px] text-muted-foreground">Distancia</p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                  <Timer className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                  <p className="text-lg font-bold text-emerald-500">45-75</p>
                  <p className="text-[10px] text-muted-foreground">Minutos</p>
                </div>
                <div className="bg-lime-500/10 rounded-xl p-3 text-center">
                  <Activity className="w-5 h-5 mx-auto text-lime-500 mb-1" />
                  <p className="text-lg font-bold text-lime-500">{suggestedExercises.length}</p>
                  <p className="text-[10px] text-muted-foreground">Bloques</p>
                </div>
              </div>

              {/* Exercise cards */}
              <div className="space-y-2">
                {suggestedExercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-card rounded-xl border p-3 ${
                      selectedExercises.some(ex => ex.id === exercise.id)
                        ? 'border-green-500 bg-green-500/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{exercise.name}</h4>
                        <p className="text-xs text-muted-foreground">{exercise.description}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${getIntensityColor(exercise.intensity)}`}>
                        {exercise.intensity}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-foreground">{exercise.distance}</span>
                      </span>
                      <span>•</span>
                      <span>{exercise.pace}</span>
                      <span>•</span>
                      <span>{exercise.type}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">
                        {exercise.focus}
                      </span>
                      <Button
                        size="sm"
                        variant={selectedExercises.some(ex => ex.id === exercise.id) ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => {
                          if (selectedExercises.some(ex => ex.id === exercise.id)) {
                            handleRemoveExercise(exercise.id);
                          } else {
                            handleAddExercise(exercise);
                          }
                        }}
                      >
                        {selectedExercises.some(ex => ex.id === exercise.id) ? 'Añadido ✓' : 'Añadir'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Finish button */}
              <Button 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white"
                onClick={handleFinish}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {selectedExercises.length > 0 
                  ? `Continuar con ${selectedExercises.length} bloques`
                  : 'Usar sesión completa'
                }
              </Button>
            </motion.div>
          )}

          {/* Routine summary */}
          {step === 'routine-summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
                <h3 className="font-bold text-lg mb-1">Tu sesión de running</h3>
                <p className="text-sm opacity-80">{profile.level} • {profile.goal}</p>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/20 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold">
                      {calculateTotalDistance(selectedExercises.length > 0 ? selectedExercises : suggestedExercises)}km
                    </p>
                    <p className="text-xs opacity-80">Distancia</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold">
                      {(selectedExercises.length > 0 ? selectedExercises : suggestedExercises).length}
                    </p>
                    <p className="text-xs opacity-80">Bloques</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {(selectedExercises.length > 0 ? selectedExercises : suggestedExercises).map((ex, i) => (
                  <div key={ex.id} className="flex items-center gap-2 text-sm bg-card rounded-lg p-2 border border-border">
                    <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-medium">{ex.name}</span>
                    <span className="text-muted-foreground text-xs">{ex.distance}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white"
                onClick={handleSaveRoutine}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Footprints className="w-4 h-4 mr-2" />
                )}
                Guardar sesión
              </Button>
            </motion.div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-6xl mb-4"
              >
                🏃
              </motion.div>
              <h2 className="text-xl font-bold mb-2">¡A rodar!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Tu sesión está lista en Mis Entrenamientos
              </p>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
    </motion.div>
  );
};
