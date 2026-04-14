import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Waves, Footprints, ChevronRight, Sparkles, BookOpen, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GymWorkoutBuilder } from './GymWorkoutBuilder';
import { SwimmingWorkoutBuilder } from './SwimmingWorkoutBuilder';
import { RunningWorkoutBuilder } from './RunningWorkoutBuilder';
import { EducationalSection } from './EducationalSection';
import { ExerciseCatalog } from './ExerciseCatalog';
import { CollapsibleSection } from './CollapsibleSection';
import { useTranslation } from 'react-i18next';

type WorkoutType = 'gym' | 'swimming' | 'running';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

export const WorkoutDesigner = () => {
  const { t } = useTranslation();
  const [showDesigner, setShowDesigner] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [expandedType, setExpandedType] = useState<WorkoutType | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const workoutTypes = [
    { id: 'gym' as const, title: t('designer.gymTitle'), icon: Dumbbell, description: t('designer.gymDesc') },
    { id: 'swimming' as const, title: t('designer.swimmingTitle'), icon: Waves, description: t('designer.swimmingDesc') },
    { id: 'running' as const, title: t('designer.runningTitle'), icon: Footprints, description: t('designer.runningDesc') },
  ];

  const handleExpandType = (type: WorkoutType) => {
    if (expandedType === type) {
      setExpandedType(null);
      setShowBuilder(false);
    } else {
      setExpandedType(type);
      setShowBuilder(false);
      setTimeout(() => setShowBuilder(true), 400);
    }
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mb-8">
        <h2 className="section-headline text-foreground">{t('designer.designWorkouts')}</h2>
        <p className="section-subheadline mt-2">{t('designer.selectType')}</p>
      </div>

      <CollapsibleSection
        isOpen={showDesigner}
        onToggle={() => { setShowDesigner(!showDesigner); if (showDesigner) { setExpandedType(null); setShowBuilder(false); } }}
        icon={PenTool}
        title={t('designer.designSection')}
        subtitle={t('designer.designSubtitle')}
        gradient="from-primary to-primary/70"
        delay={0.1}
      >
        <div className="space-y-2">
          {workoutTypes.map((type) => {
            const Icon = type.icon;
            const isExpanded = expandedType === type.id;
            return (
              <div key={type.id}>
                <motion.button
                  onClick={() => handleExpandType(type.id)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200",
                    isExpanded ? "bg-foreground text-background" : "hover:bg-muted/60"
                  )}
                  whileTap={{ scale: 0.995 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                      isExpanded ? "bg-background/15" : "bg-muted"
                    )}>
                      <Icon className={cn("w-4 h-4", isExpanded ? "text-background" : "text-muted-foreground")} />
                    </div>
                    <div className="text-left">
                      <h4 className={cn("text-body font-medium", isExpanded ? "text-background" : "text-foreground")}>{type.title}</h4>
                      <p className={cn("text-caption", isExpanded ? "text-background/70" : "text-muted-foreground")}>{type.description}</p>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className={cn("w-4 h-4", isExpanded ? "text-background/60" : "text-muted-foreground")} />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: premiumEase }} className="overflow-hidden">
                      <div className="pt-3">
                        <AnimatePresence mode="wait">
                          {!showBuilder ? (
                            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <p className="text-caption text-muted-foreground">{t('designer.preparingCanvas')}</p>
                            </motion.div>
                          ) : (
                            <motion.div key="builder" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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

      <CollapsibleSection isOpen={showExercises} onToggle={() => setShowExercises(!showExercises)} icon={Dumbbell} title={t('designer.exercisesSection')} subtitle={t('designer.exercisesSubtitle')} gradient="from-orange-500 to-amber-400" delay={0.15}>
        <ExerciseCatalog />
      </CollapsibleSection>

      <CollapsibleSection isOpen={showTheory} onToggle={() => setShowTheory(!showTheory)} icon={BookOpen} title={t('designer.theorySection')} subtitle={t('designer.theorySubtitle')} gradient="from-blue-500 to-cyan-400" delay={0.2}>
        <EducationalSection />
      </CollapsibleSection>
    </motion.div>
  );
};
