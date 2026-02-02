import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footprints, Clock, Flame, Route, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useActivityCompletions } from '@/hooks/useActivityCompletions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const RunningSection = () => {
  const { completions, markComplete, getCompletionCount, getTotalCompletions, getLastCompletion } = useActivityCompletions('running');
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const workouts = [
    {
      id: 'carrera-continua',
      name: 'Carrera Continua',
      duration: '40-50 min',
      distance: '6-8 km',
      calories: '400-500',
      intensity: 'Moderada',
      description: 'Ritmo constante para construir base aeróbica.',
      details: [
        '5 min calentamiento caminando',
        '30-40 min a ritmo conversacional',
        '5 min vuelta a la calma',
        'Ritmo objetivo: 5:30-6:30 min/km'
      ]
    },
    {
      id: 'fartlek',
      name: 'Fartlek',
      duration: '45 min',
      distance: '7-9 km',
      calories: '500-600',
      intensity: 'Media-Alta',
      description: 'Cambios de ritmo para mejorar velocidad y resistencia.',
      details: [
        '10 min trote suave',
        '5x (2 min rápido + 2 min recuperación)',
        '10 min trote suave',
        '5 min vuelta a la calma'
      ]
    },
    {
      id: 'intervalos-pista',
      name: 'Intervalos en Pista',
      duration: '50 min',
      distance: '6-7 km',
      calories: '550-650',
      intensity: 'Alta',
      description: 'Series cortas de alta intensidad para mejorar VO2max.',
      details: [
        '15 min calentamiento (trote + ejercicios)',
        '8x400m al 85-90% (descanso 90s)',
        '10 min vuelta a la calma',
        'Ritmo objetivo 400m: 1:45-2:00'
      ]
    },
    {
      id: 'tempo-run',
      name: 'Tempo Run',
      duration: '45 min',
      distance: '8-10 km',
      calories: '500-600',
      intensity: 'Media-Alta',
      description: 'Ritmo umbral para mejorar el umbral de lactato.',
      details: [
        '10 min calentamiento suave',
        '25 min a ritmo tempo (umbral)',
        '10 min vuelta a la calma',
        'Ritmo tempo: 4:45-5:15 min/km'
      ]
    }
  ];

  const handleComplete = async () => {
    if (!isCompleted || !selectedWorkout) return;

    setCompleting(true);
    const result = await markComplete(selectedWorkout);
    setCompleting(false);

    if (!result.error) {
      setIsCompleted(false);
      setSelectedWorkout(null);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Alta': return 'text-red-500 bg-red-500/10';
      case 'Media-Alta': return 'text-orange-500 bg-orange-500/10';
      case 'Moderada': return 'text-green-500 bg-green-500/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-4"
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Footprints className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Running</h2>
              <p className="text-sm text-muted-foreground">
                {getTotalCompletions()} sesiones completadas
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {workouts.map((workout, index) => {
        const completionCount = getCompletionCount(workout.id);
        const lastCompletion = getLastCompletion(workout.id);
        const isSelected = selectedWorkout === workout.id;

        return (
          <motion.div
            key={workout.id}
            variants={itemVariants}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`gradient-card border-border overflow-hidden transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedWorkout(isSelected ? null : workout.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {workout.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{workout.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionCount > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {completionCount}x
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntensityColor(workout.intensity)}`}>
                      <Zap className="w-3 h-3 inline mr-1" />
                      {workout.intensity}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {workout.duration}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Route className="w-4 h-4" />
                    {workout.distance}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Flame className="w-4 h-4" />
                    {workout.calories} kcal
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Estructura</div>
                  <ul className="space-y-1.5 pl-4">
                    {workout.details.map((detail, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {lastCompletion && (
                  <p className="text-xs text-muted-foreground">
                    Último: {format(new Date(lastCompletion.completed_at), "d 'de' MMMM", { locale: es })}
                  </p>
                )}

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 border-t border-border"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Checkbox 
                          id={`complete-${workout.id}`}
                          checked={isCompleted}
                          onCheckedChange={(checked) => setIsCompleted(checked === true)}
                          onClick={(e) => e.stopPropagation()}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <label 
                          htmlFor={`complete-${workout.id}`}
                          className="text-sm font-medium text-foreground cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          He completado esta sesión
                        </label>
                      </div>
                      
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComplete();
                        }}
                        disabled={!isCompleted || completing}
                        className="w-full gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {completing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Registrar sesión
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {showConfirmation && (
          <motion.div 
            className="fixed bottom-24 left-4 right-4 p-4 bg-success/20 border border-success/30 rounded-xl text-center z-50"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-success font-medium">
              ¡Sesión de running registrada! 🏃‍♂️
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
