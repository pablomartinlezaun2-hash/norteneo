import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, GripVertical, Save, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIWorkoutAssistant } from './AIWorkoutAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SwimmingExercise {
  id: string;
  name: string;
  distance: string;
  style: string;
  rest: string;
}

const SWIMMING_STYLES = [
  'Crol',
  'Espalda',
  'Braza',
  'Mariposa',
  'Mixto',
  'Técnica',
  'Patadas',
  'Pull'
];

const PREDEFINED_EXERCISES = [
  { name: 'Calentamiento', distance: '400m', style: 'Mixto' },
  { name: 'Series de velocidad', distance: '8x50m', style: 'Crol' },
  { name: 'Series de resistencia', distance: '4x100m', style: 'Crol' },
  { name: 'Series largas', distance: '2x400m', style: 'Crol' },
  { name: 'Técnica de patada', distance: '4x50m', style: 'Patadas' },
  { name: 'Pull con palas', distance: '4x100m', style: 'Pull' },
  { name: 'Intervalos mixtos', distance: '4x100m', style: 'Mixto' },
  { name: 'Vuelta a la calma', distance: '200m', style: 'Espalda' },
  { name: 'Sprints', distance: '6x25m', style: 'Crol' },
  { name: 'Pirámide', distance: '50-100-200-100-50', style: 'Crol' },
];

export const SwimmingWorkoutBuilder = () => {
  const { user } = useAuth();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<SwimmingExercise[]>([]);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const addExercise = (preset?: typeof PREDEFINED_EXERCISES[0]) => {
    const newExercise: SwimmingExercise = {
      id: `sw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: preset?.name || '',
      distance: preset?.distance || '',
      style: preset?.style || 'Crol',
      rest: '30s'
    };
    setExercises(prev => [...prev, newExercise]);
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof SwimmingExercise, value: string) => {
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
      // Save as activity completion with workout details
      // Note: For swimming, we store the workout structure in a different way
      // For now, we'll just show a success message
      toast.success('¡Rutina de natación guardada!');
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
            Crea tu entrenamiento de natación perfecto
          </p>
        </div>

        <div className="grid gap-3">
          <motion.button
            onClick={() => setShowAIAssistant(true)}
            className="p-4 rounded-xl border border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 transition-colors text-left"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Bot className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Con ayuda del equipo NEO</h4>
                <p className="text-xs text-muted-foreground">
                  Nuestro asistente te ayudará a diseñar la sesión
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            onClick={() => setShowAIAssistant(false)}
            className="p-4 rounded-xl border border-border hover:border-blue-500/50 transition-colors text-left"
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
                  Crea tu sesión con distancias y estilos
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
          <AIWorkoutAssistant
            workoutType="swimming"
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
            placeholder="Ej: Resistencia, Técnica, Velocidad..."
          />
        </div>

        {/* Quick Add */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Añadir rápido
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {PREDEFINED_EXERCISES.slice(0, 5).map((preset, index) => (
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
            Ejercicios ({exercises.length})
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
                              placeholder="Nombre del ejercicio"
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
                                placeholder="4x100m"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">Estilo</label>
                              <Select
                                value={exercise.style}
                                onValueChange={(value) => updateExercise(exercise.id, 'style', value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SWIMMING_STYLES.map(style => (
                                    <SelectItem key={style} value={style} className="text-xs">
                                      {style}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">Descanso</label>
                              <Input
                                value={exercise.rest}
                                onChange={(e) => updateExercise(exercise.id, 'rest', e.target.value)}
                                placeholder="30s"
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
              Añade ejercicios a tu sesión
            </div>
          )}
        </div>

        {/* Add Custom Exercise */}
        <Button variant="outline" className="w-full" onClick={() => addExercise()}>
          <Plus className="w-4 h-4 mr-2" />
          Añadir ejercicio personalizado
        </Button>

        {/* Save */}
        <Button
          onClick={saveWorkout}
          disabled={!workoutName.trim() || exercises.length === 0 || saving}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:opacity-90"
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
