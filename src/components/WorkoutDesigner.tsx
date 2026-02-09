import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Waves, Footprints, ChevronDown, Sparkles, BookOpen, PenTool, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GymWorkoutBuilder } from './GymWorkoutBuilder';
import { SwimmingWorkoutBuilder } from './SwimmingWorkoutBuilder';
import { RunningWorkoutBuilder } from './RunningWorkoutBuilder';
import { EducationalSection } from './EducationalSection';
import { ExerciseCatalog } from './ExerciseCatalog';
import { CollapsibleSection } from './CollapsibleSection';

type WorkoutType = 'gym' | 'swimming' | 'running';

const workoutTypes = [
  {
    id: 'gym' as const,
    title: 'Gimnasio',
    icon: Dumbbell,
    gradient: 'from-primary to-primary/70',
    description: 'Crea tu rutina de fuerza personalizada'
  },
  {
    id: 'swimming' as const,
    title: 'Natación',
    icon: Waves,
    gradient: 'from-blue-500 to-cyan-400',
    description: 'Diseña tu entrenamiento de natación'
  },
  {
    id: 'running' as const,
    title: 'Running',
    icon: Footprints,
    gradient: 'from-green-500 to-emerald-400',
    description: 'Planifica tus sesiones de carrera'
  }
];

export const WorkoutDesigner = () => {
  const [showDesigner, setShowDesigner] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [expandedType, setExpandedType] = useState<WorkoutType | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const handleExpandType = (type: WorkoutType) => {
    if (expandedType === type) {
      setExpandedType(null);
      setShowBuilder(false);
    } else {
      setExpandedType(type);
      setShowBuilder(false);
      setTimeout(() => setShowBuilder(true), 600);
    }
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Diseña tu entreno perfecto</span>
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Diseñar Entrenamientos</h1>
        <p className="text-muted-foreground text-sm">
          Selecciona el tipo de entrenamiento que quieres crear
        </p>
      </div>

      {/* 1. Diseñar Entrenamiento */}
      <CollapsibleSection
        isOpen={showDesigner}
        onToggle={() => {
          setShowDesigner(!showDesigner);
          if (showDesigner) {
            setExpandedType(null);
            setShowBuilder(false);
          }
        }}
        icon={PenTool}
        title="Diseñar Entrenamiento"
        subtitle="Gimnasio, natación o running"
        gradient="from-primary to-primary/70"
        delay={0.2}
      >
        <div className="p-4 space-y-3">
          {workoutTypes.map((type) => {
            const Icon = type.icon;
            const isExpanded = expandedType === type.id;

            return (
              <div key={type.id}>
                <motion.button
                  onClick={() => handleExpandType(type.id)}
                  className={cn(
                    "w-full p-3 rounded-lg border transition-all duration-300",
                    "flex items-center justify-between",
                    isExpanded
                      ? "bg-gradient-to-r " + type.gradient + " text-white border-transparent"
                      : "bg-card border-border hover:border-primary/50"
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isExpanded ? "bg-white/20" : "bg-primary/10"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        isExpanded ? "text-white" : "text-primary"
                      )} />
                    </div>
                    <div className="text-left">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        isExpanded ? "text-white" : "text-foreground"
                      )}>
                        {type.title}
                      </h4>
                      <p className={cn(
                        "text-xs",
                        isExpanded ? "text-white/80" : "text-muted-foreground"
                      )}>
                        {type.description}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className={cn(
                      "w-4 h-4",
                      isExpanded ? "text-white" : "text-muted-foreground"
                    )} />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3">
                        <AnimatePresence mode="wait">
                          {!showBuilder ? (
                            <motion.div
                              key="intro"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="text-center py-8 px-4"
                            >
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring" }}
                                className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                              >
                                <Sparkles className="w-8 h-8 text-primary" />
                              </motion.div>
                              <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-muted-foreground text-sm"
                              >
                                Preparando tu lienzo de entrenamiento...
                              </motion.p>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="builder"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4 }}
                            >
                              {type.id === 'gym' && <GymWorkoutBuilder />}
                              {type.id === 'swimming' && <SwimmingWorkoutBuilder />}
                              {type.id === 'running' && <RunningWorkoutBuilder />}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* 2. Ejercicios (Catálogo) */}
      <CollapsibleSection
        isOpen={showExercises}
        onToggle={() => setShowExercises(!showExercises)}
        icon={Dumbbell}
        title="Ejercicios"
        subtitle="Explora ejercicios por grupo muscular"
        gradient="from-orange-500 to-amber-400"
        delay={0.3}
      >
        <div className="bg-card border-b border-border p-4">
          <ExerciseCatalog />
        </div>
      </CollapsibleSection>

      {/* 3. Teoría & Fundamentación */}
      <CollapsibleSection
        isOpen={showTheory}
        onToggle={() => setShowTheory(!showTheory)}
        icon={BookOpen}
        title="Teoría & Fundamentación"
        subtitle="Aprende sobre técnica, nutrición y entrenamiento"
        gradient="from-blue-500 to-cyan-400"
        delay={0.4}
      >
        <div className="bg-card border-b border-border p-4">
          <EducationalSection />
        </div>
      </CollapsibleSection>
    </motion.div>
  );
};
