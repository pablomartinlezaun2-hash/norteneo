import { motion } from 'framer-motion';
import { Waves, Clock, Flame, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SwimmingSection = () => {
  const workouts = [
    {
      id: 1,
      name: 'Técnica de Crol',
      duration: '45 min',
      calories: '400-500',
      description: 'Enfocado en mejorar la técnica de brazada y respiración bilateral.',
      sets: [
        '400m calentamiento variado',
        '4x100m crol técnico (descanso 20s)',
        '4x50m patada con tabla (descanso 15s)',
        '4x50m brazos con pull buoy (descanso 15s)',
        '200m vuelta a la calma'
      ]
    },
    {
      id: 2,
      name: 'Resistencia',
      duration: '60 min',
      calories: '600-700',
      description: 'Entrenamiento de resistencia aeróbica en el agua.',
      sets: [
        '300m calentamiento',
        '5x200m ritmo constante (descanso 30s)',
        '4x100m progresivo (descanso 20s)',
        '300m vuelta a la calma'
      ]
    },
    {
      id: 3,
      name: 'Intervalos',
      duration: '50 min',
      calories: '500-600',
      description: 'Series de alta intensidad para mejorar velocidad.',
      sets: [
        '400m calentamiento',
        '8x50m sprint (descanso 30s)',
        '4x100m ritmo fuerte (descanso 45s)',
        '4x25m máxima velocidad (descanso 20s)',
        '200m vuelta a la calma'
      ]
    }
  ];

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
            <Waves className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Natación</h2>
            <p className="text-sm text-muted-foreground">Entrenamientos en piscina</p>
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
              <CardTitle className="text-lg font-semibold text-foreground">
                {workout.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{workout.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {workout.duration}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Flame className="w-4 h-4" />
                  {workout.calories} kcal
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Target className="w-4 h-4 text-primary" />
                  Series
                </div>
                <ul className="space-y-1.5 pl-6">
                  {workout.sets.map((set, i) => (
                    <li key={i} className="text-sm text-muted-foreground list-disc">
                      {set}
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
