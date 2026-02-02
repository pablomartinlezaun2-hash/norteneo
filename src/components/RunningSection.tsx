import { motion } from 'framer-motion';
import { Footprints, Clock, Flame, Route, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const RunningSection = () => {
  const workouts = [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
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
      id: 4,
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Footprints className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Running</h2>
            <p className="text-sm text-muted-foreground">Entrenamientos de carrera</p>
          </div>
        </div>
      </motion.div>

      {workouts.map((workout, index) => (
        <motion.div
          key={workout.id}
          variants={itemVariants}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="gradient-card border-border overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {workout.name}
                </CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntensityColor(workout.intensity)}`}>
                  <Zap className="w-3 h-3 inline mr-1" />
                  {workout.intensity}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{workout.description}</p>
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
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};
