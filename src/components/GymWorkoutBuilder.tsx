import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, Trash2, GripVertical, Save, Bot, X, 
  ChevronDown, Search, Check, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { useExerciseCatalog, CatalogExercise } from '@/hooks/useExerciseCatalog';
import { AIWorkoutAssistant } from './AIWorkoutAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  series: number;
  reps: string;
  rest: string;
}

export const GymWorkoutBuilder = () => {
  const { user } = useAuth();
  const { exercises: catalogExercises, muscleGroups, loading } = useExerciseCatalog();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredExercises = catalogExercises.filter(ex => {
    const matchesSearch = !searchQuery || 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = !selectedMuscle || ex.primary_muscle_id === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const addExercise = (catalogEx: CatalogExercise) => {
    const newExercise: WorkoutExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: catalogEx.id,
      name: catalogEx.name,
      series: 3,
      reps: '8-12',
      rest: '90s'
    };
    setExercises(prev => [...prev, newExercise]);
    setShowExerciseSelector(false);
    setSearchQuery('');
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof WorkoutExercise, value: string | number) => {
    setExercises(prev => prev.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const saveWorkout = async () => {
    if (!user || !workoutName.trim() || exercises.length === 0) {
      toast.error('Por favor, añade un nombre y al menos un ejercicio');
      return;
    }

    setSaving(true);
    try {
      // Create a new training program
      const { data: program, error: programError } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          name: workoutName,
          description: `Rutina personalizada con ${exercises.length} ejercicios`,
          is_active: false
        })
        .select()
        .single();

      if (programError) throw programError;

      // Create a workout session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          program_id: program.id,
          name: workoutName,
          short_name: workoutName.substring(0, 10),
          order_index: 0
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add exercises to the session
      const exercisesToInsert = exercises.map((ex, index) => ({
        session_id: session.id,
        name: ex.name,
        series: ex.series,
        reps: ex.reps,
        rest: ex.rest,
        order_index: index
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;

      toast.success('¡Rutina guardada con éxito!');
      setWorkoutName('');
      setExercises([]);
      setShowAIAssistant(null);
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Error al guardar la rutina');
    } finally {
      setSaving(false);
    }
  };

  // Initial choice screen
  if (showAIAssistant === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            ¿Cómo quieres diseñar tu rutina?
          </h3>
          <p className="text-sm text-muted-foreground">
            Puedes hacerlo tú mismo o con ayuda de nuestro equipo de IA
          </p>
        </div>

        <div className="grid gap-3">
          <motion.button
            onClick={() => setShowAIAssistant(true)}
            className="p-4 rounded-xl border border-primary bg-primary/5 hover:bg-primary/10 transition-colors text-left"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Con ayuda del equipo NEO</h4>
                <p className="text-xs text-muted-foreground">
                  Nuestro asistente IA te guiará paso a paso
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            onClick={() => setShowAIAssistant(false)}
            className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors text-left"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Plus className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Diseñar yo mismo</h4>
                <p className="text-xs text-muted-foreground">
                  Selecciona ejercicios del catálogo libremente
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Assistant (optional) */}
      <AnimatePresence>
        {showAIAssistant && (
          <AIWorkoutAssistant
            workoutType="gym"
            onClose={() => setShowAIAssistant(false)}
          />
        )}
      </AnimatePresence>

      {/* Workout Builder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Workout Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Nombre de la rutina
          </label>
          <Input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Ej: Push Day, Full Body..."
            className="w-full"
          />
        </div>

        {/* Exercise List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">
              Ejercicios ({exercises.length})
            </label>
            {!showAIAssistant && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAIAssistant(true)}
                className="text-xs text-primary"
              >
                <Bot className="w-3 h-3 mr-1" />
                Pedir ayuda
              </Button>
            )}
          </div>

          {exercises.length > 0 ? (
            <Reorder.Group
              axis="y"
              values={exercises}
              onReorder={setExercises}
              className="space-y-2"
            >
              <AnimatePresence>
                {exercises.map((exercise, index) => (
                  <Reorder.Item
                    key={exercise.id}
                    value={exercise}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="bg-card border border-border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-foreground">
                              {index + 1}. {exercise.name}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeExercise(exercise.id)}
                              className="h-7 w-7 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground">Series</label>
                              <Input
                                type="number"
                                value={exercise.series}
                                onChange={(e) => updateExercise(exercise.id, 'series', parseInt(e.target.value) || 0)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">Reps</label>
                              <Input
                                value={exercise.reps}
                                onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                                placeholder="8-12"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">Descanso</label>
                              <Input
                                value={exercise.rest}
                                onChange={(e) => updateExercise(exercise.id, 'rest', e.target.value)}
                                placeholder="90s"
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
              Aún no has añadido ejercicios
            </div>
          )}
        </div>

        {/* Add Exercise Button */}
        <Collapsible open={showExerciseSelector} onOpenChange={setShowExerciseSelector}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Añadir ejercicio
              <ChevronDown className={cn(
                "w-4 h-4 ml-auto transition-transform",
                showExerciseSelector && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ejercicio..."
                  className="pl-9"
                />
              </div>

              {/* Muscle Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  size="sm"
                  variant={selectedMuscle === null ? "default" : "outline"}
                  onClick={() => setSelectedMuscle(null)}
                  className="text-xs whitespace-nowrap"
                >
                  Todos
                </Button>
                {muscleGroups.slice(0, 8).map(muscle => (
                  <Button
                    key={muscle.id}
                    size="sm"
                    variant={selectedMuscle === muscle.id ? "default" : "outline"}
                    onClick={() => setSelectedMuscle(muscle.id)}
                    className="text-xs whitespace-nowrap"
                  >
                    {muscle.name}
                  </Button>
                ))}
              </div>

              {/* Exercise List */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {loading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                  </div>
                ) : filteredExercises.length > 0 ? (
                  filteredExercises.map(ex => (
                    <motion.button
                      key={ex.id}
                      onClick={() => addExercise(ex)}
                      className="w-full p-2 rounded-lg hover:bg-primary/10 text-left flex items-center justify-between group transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">{ex.name}</span>
                        {ex.primary_muscle && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {ex.primary_muscle.name}
                          </span>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))
                ) : (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    No se encontraron ejercicios
                  </p>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Save Button */}
        <Button
          onClick={saveWorkout}
          disabled={!workoutName.trim() || exercises.length === 0 || saving}
          className="w-full gradient-primary"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar rutina
        </Button>
      </motion.div>
    </div>
  );
};
