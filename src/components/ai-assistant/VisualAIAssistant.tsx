import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NeoLogo } from '../NeoLogo';

// Components
import { OnboardingButtons } from './OnboardingButtons';
import { OptionalDataForm } from './OptionalDataForm';
import { ExerciseCardVisual } from './ExerciseCardVisual';
import { MuscleHighlight3D } from './MuscleHighlight3D';
import { ProgressVisual, AchievementBadge } from './ProgressVisual';
import { QuickActions, NutritionSuggestions, RoutineActions } from './QuickActions';
import { RoutineSummary } from './RoutineSummary';
import { exerciseDatabase, generateRoutine, getExercisesByMuscle } from './exerciseDatabase';

// Types
import type { UserProfile, ExerciseCard, ChatMessage } from './types';

interface VisualAIAssistantProps {
  workoutType: 'gym' | 'swimming' | 'running';
  onClose: () => void;
  onWorkoutSaved?: () => void;
}

type ConversationStep = 
  | 'welcome'
  | 'level'
  | 'goal'
  | 'sex'
  | 'optional-data'
  | 'generating'
  | 'exercises'
  | 'routine-summary'
  | 'complete';

export const VisualAIAssistant = ({ workoutType, onClose, onWorkoutSaved }: VisualAIAssistantProps) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State
  const [step, setStep] = useState<ConversationStep>('welcome');
  const [profile, setProfile] = useState<UserProfile>({
    level: null,
    goal: null,
    sex: null,
  });
  const [selectedExercises, setSelectedExercises] = useState<ExerciseCard[]>([]);
  const [suggestedExercises, setSuggestedExercises] = useState<ExerciseCard[]>([]);
  const [highlightedMuscles, setHighlightedMuscles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quickInput, setQuickInput] = useState('');

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [step, suggestedExercises]);

  // Start the flow after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => setStep('level'), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle level selection
  const handleLevelSelect = (level: string) => {
    setProfile(prev => ({ ...prev, level: level as UserProfile['level'] }));
    setTimeout(() => setStep('goal'), 300);
  };

  // Handle goal selection
  const handleGoalSelect = (goal: string) => {
    setProfile(prev => ({ ...prev, goal: goal as UserProfile['goal'] }));
    setTimeout(() => setStep('sex'), 300);
  };

  // Handle sex selection
  const handleSexSelect = (sex: string) => {
    setProfile(prev => ({ ...prev, sex: sex as UserProfile['sex'] }));
    setTimeout(() => setStep('optional-data'), 300);
  };

  // Handle optional data
  const handleOptionalData = (data: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...data }));
    generateExercises({ ...profile, ...data });
  };

  // Skip optional data
  const handleSkipOptional = () => {
    generateExercises(profile);
  };

  // Generate exercises based on profile
  const generateExercises = async (userProfile: UserProfile) => {
    setStep('generating');
    setIsGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const exercises = generateRoutine(
      userProfile.goal || 'hipertrofia',
      userProfile.level || 'intermedio',
      [], // All muscle groups
      userProfile.equipment || [],
      userProfile.injuries || []
    );
    
    setSuggestedExercises(exercises);
    
    // Highlight muscles from suggested exercises
    const muscles = [...new Set(exercises.flatMap(ex => ex.muscleGroups))];
    setHighlightedMuscles(muscles);
    
    setIsGenerating(false);
    setStep('exercises');
  };

  // Add exercise to routine
  const handleAddExercise = (exercise: ExerciseCard) => {
    if (!selectedExercises.find(ex => ex.id === exercise.id)) {
      setSelectedExercises(prev => [...prev, exercise]);
      toast.success(`${exercise.name} añadido`);
    }
  };

  // Get alternative exercise
  const handleGetAlternative = (exerciseId: string) => {
    const currentIndex = suggestedExercises.findIndex(ex => ex.id === exerciseId);
    const current = suggestedExercises[currentIndex];
    
    if (current) {
      // Find alternative for same muscle group
      const alternatives = getExercisesByMuscle(current.primaryMuscle)
        .filter(ex => ex.id !== exerciseId && !suggestedExercises.find(s => s.id === ex.id));
      
      if (alternatives.length > 0) {
        const newExercise = alternatives[Math.floor(Math.random() * alternatives.length)];
        setSuggestedExercises(prev => 
          prev.map((ex, i) => i === currentIndex ? newExercise : ex)
        );
        toast.info(`Alternativa: ${newExercise.name}`);
      } else {
        toast.info('No hay más alternativas disponibles');
      }
    }
  };

  // View muscle in 3D
  const handleViewMuscle = (muscle: string) => {
    setHighlightedMuscles([muscle]);
  };

  // Finish and show summary
  const handleFinish = () => {
    if (selectedExercises.length === 0) {
      setSelectedExercises(suggestedExercises);
    }
    setStep('routine-summary');
  };

  // Save routine to database
  const handleSaveRoutine = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar');
      return;
    }

    const exercises = selectedExercises.length > 0 ? selectedExercises : suggestedExercises;
    if (exercises.length === 0) return;

    setIsSaving(true);
    
    try {
      // Create training program
      const routineName = `Rutina ${profile.goal || 'personalizada'} - ${new Date().toLocaleDateString()}`;
      
      const { data: program, error: programError } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          name: routineName,
          description: `${profile.level} • ${profile.goal} • ${exercises.length} ejercicios`,
          is_active: false,
        })
        .select()
        .single();

      if (programError) throw programError;

      // Create workout session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          program_id: program.id,
          name: routineName,
          short_name: profile.goal?.substring(0, 8) || 'Rutina',
          order_index: 0,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add exercises
      const exercisesToInsert = exercises.map((ex, index) => ({
        session_id: session.id,
        name: ex.name,
        series: ex.series,
        reps: ex.reps,
        rest: ex.rest,
        order_index: index,
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;

      toast.success('¡Rutina guardada con éxito! 🎉');
      setStep('complete');
      onWorkoutSaved?.();
    } catch (error) {
      console.error('Error saving routine:', error);
      toast.error('Error al guardar la rutina');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick action handler
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'generate':
        generateExercises(profile);
        break;
      case 'save-routine':
        handleSaveRoutine();
        break;
      default:
        toast.info(`Acción: ${actionId}`);
    }
  };

  // Handle quick input
  const handleQuickInputSubmit = () => {
    if (!quickInput.trim()) return;
    
    // Parse quick commands
    const input = quickInput.toLowerCase();
    if (input.includes('pecho') || input.includes('chest')) {
      const exercises = getExercisesByMuscle('Pecho').slice(0, 3);
      setSuggestedExercises(exercises);
      setHighlightedMuscles(['Pecho']);
    } else if (input.includes('espalda') || input.includes('back')) {
      const exercises = getExercisesByMuscle('Espalda').slice(0, 3);
      setSuggestedExercises(exercises);
      setHighlightedMuscles(['Espalda']);
    } else if (input.includes('pierna') || input.includes('legs')) {
      const exercises = [...getExercisesByMuscle('Cuádriceps'), ...getExercisesByMuscle('Isquiotibiales')].slice(0, 4);
      setSuggestedExercises(exercises);
      setHighlightedMuscles(['Cuádriceps', 'Isquiotibiales', 'Glúteos']);
    }
    
    setQuickInput('');
    setStep('exercises');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col max-h-[80vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-foreground text-background">
        <div className="flex items-center gap-2">
          <NeoLogo size="sm" className="bg-background text-foreground" />
          <div>
            <h3 className="font-semibold text-sm">NEO Coach</h3>
            <p className="text-[10px] opacity-70">Tu entrenador personal</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-background hover:bg-background/20 h-8 w-8"
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
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2">¡Bienvenido a NEO! 💪</h2>
              <p className="text-muted-foreground text-sm">
                Vamos a crear tu rutina perfecta
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
                <p className="text-sm font-medium mb-3">¿Cuál es tu nivel? 🎯</p>
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
                <p className="text-sm font-medium mb-3">¿Cuál es tu objetivo? 🎯</p>
                <OnboardingButtons type="goal" onSelect={handleGoalSelect} selected={profile.goal} />
              </div>
            </motion.div>
          )}

          {/* Sex selection */}
          {step === 'sex' && (
            <motion.div
              key="sex"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-sm font-medium mb-3">¿Cómo te identificas?</p>
                <OnboardingButtons type="sex" onSelect={handleSexSelect} selected={profile.sex} />
              </div>
            </motion.div>
          )}

          {/* Optional data */}
          {step === 'optional-data' && (
            <motion.div
              key="optional"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-sm font-medium mb-2">Personaliza tu experiencia 📊</p>
                <p className="text-xs text-muted-foreground mb-3">Opcional pero recomendado</p>
              </div>
              <OptionalDataForm onSubmit={handleOptionalData} onSkip={handleSkipOptional} />
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
                <RefreshCw className="w-12 h-12 text-primary" />
              </motion.div>
              <p className="text-sm font-medium">Generando tu rutina perfecta...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Analizando {profile.level} • {profile.goal}
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
              {/* 3D Muscle highlight */}
              {highlightedMuscles.length > 0 && (
                <MuscleHighlight3D muscles={highlightedMuscles} />
              )}

              {/* Exercise cards grid */}
              <div className="grid grid-cols-2 gap-3">
                {suggestedExercises.map(exercise => (
                  <ExerciseCardVisual
                    key={exercise.id}
                    exercise={exercise}
                    onAdd={() => handleAddExercise(exercise)}
                    onAlternative={() => handleGetAlternative(exercise.id)}
                    onViewMuscle={handleViewMuscle}
                    isAdded={selectedExercises.some(ex => ex.id === exercise.id)}
                  />
                ))}
              </div>

              {/* Nutrition suggestions */}
              {profile.goal && (
                <NutritionSuggestions 
                  goal={profile.goal} 
                  onSelect={(s) => toast.info(`Nutrición: ${s}`)} 
                />
              )}

              {/* Finish button */}
              <div className="flex justify-center pt-2">
                <Button 
                  className="gradient-primary px-8"
                  onClick={handleFinish}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {selectedExercises.length > 0 
                    ? `Continuar con ${selectedExercises.length} ejercicios`
                    : 'Usar rutina completa'
                  }
                </Button>
              </div>
            </motion.div>
          )}

          {/* Routine summary */}
          {step === 'routine-summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RoutineSummary
                name={`Rutina ${profile.goal} - ${profile.level}`}
                exercises={selectedExercises.length > 0 ? selectedExercises : suggestedExercises}
                estimatedMinutes={45}
                onSave={handleSaveRoutine}
                isSaving={isSaving}
              />
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
                🎉
              </motion.div>
              <h2 className="text-xl font-bold mb-2">¡Rutina guardada!</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Encuentra tu nueva rutina en "Mis Rutinas"
              </p>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick input (shown during exercises step) */}
      {step === 'exercises' && (
        <div className="p-3 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickInputSubmit()}
              placeholder="Escribe un músculo (ej: pecho, espalda)..."
              className="flex-1 text-sm"
            />
            <Button
              onClick={handleQuickInputSubmit}
              disabled={!quickInput.trim()}
              size="icon"
              className="gradient-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
