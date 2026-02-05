import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, GripVertical, Save, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RunningVisualAssistant } from './ai-assistant/RunningVisualAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RunningExercise {
  id: string;
  name: string;
  distance: string;
  pace: string;
  type: string;
}

const RUNNING_TYPES = [
  'Rodaje suave',
  'Rodaje medio',
  'Tempo',
  'Intervalos',
  'Series',
  'Fartlek',
  'Cuestas',
  'Recuperación',
  'Carrera larga',
  'Progresivo'
];

const PREDEFINED_WORKOUTS = [
  { name: 'Calentamiento', distance: '1km', pace: '6:00/km', type: 'Rodaje suave' },
  { name: 'Intervalos cortos', distance: '8x400m', pace: '4:30/km', type: 'Intervalos' },
  { name: 'Series medias', distance: '4x1000m', pace: '4:45/km', type: 'Series' },
  { name: 'Tempo run', distance: '5km', pace: '5:00/km', type: 'Tempo' },
  { name: 'Carrera larga', distance: '15km', pace: '5:30/km', type: 'Carrera larga' },
  { name: 'Fartlek', distance: '6km', pace: 'Variable', type: 'Fartlek' },
  { name: 'Recuperación', distance: '3km', pace: '6:30/km', type: 'Recuperación' },
  { name: 'Cuestas', distance: '6x200m', pace: 'Máximo', type: 'Cuestas' },
  { name: 'Progresivo', distance: '8km', pace: '5:30→4:30/km', type: 'Progresivo' },
  { name: 'Vuelta a la calma', distance: '1km', pace: '6:30/km', type: 'Recuperación' },
];

export const RunningWorkoutBuilder = () => {
  const { user } = useAuth();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<RunningExercise[]>([]);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const addExercise = (preset?: typeof PREDEFINED_WORKOUTS[0]) => {
    const newExercise: RunningExercise = {
      id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: preset?.name || '',
      distance: preset?.distance || '',
      pace: preset?.pace || '',
      type: preset?.type || 'Rodaje suave'
    };
    setExercises(prev => [...prev, newExercise]);
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof RunningExercise, value: string) => {
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
      const { data: program, error: programError } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          name: workoutName,
          description: `Sesión de running personalizada con ${exercises.length} bloques`,
          is_active: false,
        })
        .select()
        .single();

      if (programError) throw programError;

      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          program_id: program.id,
          name: workoutName,
          short_name: workoutName.substring(0, 10),
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

      toast.success('¡Sesión de running guardada!');
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
            ¿Cómo quieres diseñar tu sesión?
          </h3>
          <p className="text-sm text-muted-foreground">
            Crea tu entrenamiento de running perfecto
          </p>
        </div>

        <div className="grid gap-3">
          <motion.button
            onClick={() => setShowAIAssistant(true)}
            className="p-4 rounded-xl border border-green-500 bg-green-500/5 hover:bg-green-500/10 transition-colors text-left"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Bot className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Con ayuda del equipo NEO</h4>
                <p className="text-xs text-muted-foreground">
                  Nuestro asistente te ayudará a planificar
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            onClick={() => setShowAIAssistant(false)}
            className="p-4 rounded-xl border border-border hover:border-green-500/50 transition-colors text-left"
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
                  Crea tu sesión con distancias y ritmos
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
      {/* AI Assistant */}
      <AnimatePresence>
        {showAIAssistant && (
          <RunningVisualAssistant
            onClose={() => setShowAIAssistant(false)}
          />
        )}
      </AnimatePresence>

      {/* Builder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Workout Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Nombre de la sesión
          </label>
          <Input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Ej: Intervalos, Rodaje largo, Series..."
          />
        </div>

        {/* Quick Add */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Añadir rápido
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {PREDEFINED_WORKOUTS.slice(0, 5).map((preset, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={() => addExercise(preset)}
                className="text-xs whitespace-nowrap"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Bloques ({exercises.length})
          </label>

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
                  >
                    <div className="bg-card border border-border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <Input
                              value={exercise.name}
                              onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                              placeholder="Nombre del bloque"
                              className="h-8 text-sm font-medium"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeExercise(exercise.id)}
                              className="h-7 w-7 text-destructive hover:text-destructive ml-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground">Distancia</label>
                              <Input
                                value={exercise.distance}
                                onChange={(e) => updateExercise(exercise.id, 'distance', e.target.value)}
                                placeholder="5km"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">Ritmo</label>
                              <Input
                                value={exercise.pace}
                                onChange={(e) => updateExercise(exercise.id, 'pace', e.target.value)}
                                placeholder="5:30/km"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">Tipo</label>
                              <Select
                                value={exercise.type}
                                onValueChange={(value) => updateExercise(exercise.id, 'type', value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {RUNNING_TYPES.map(type => (
                                    <SelectItem key={type} value={type} className="text-xs">
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
              Añade bloques a tu sesión
            </div>
          )}
        </div>

        {/* Add Custom Exercise */}
        <Button variant="outline" className="w-full" onClick={() => addExercise()}>
          <Plus className="w-4 h-4 mr-2" />
          Añadir bloque personalizado
        </Button>

        {/* Save */}
        <Button
          onClick={saveWorkout}
          disabled={saving}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-white hover:opacity-90"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar sesión
        </Button>
      </motion.div>
    </div>
  );
};
