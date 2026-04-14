import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Waves, Footprints, ChevronRight, Bookmark, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GymSection } from './GymSection';
import { SwimmingSection } from './SwimmingSection';
import { RunningSection } from './RunningSection';
import { MyWorkoutsSection } from './MyWorkoutsSection';
import { MesocycleList } from './planning';

type AccordionSection = 'gym' | 'swimming' | 'running' | 'saved' | 'microcycles' | null;

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export const WorkoutsHub = () => {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<AccordionSection>(null);

  const toggleSection = (section: AccordionSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const sections = [
    { id: 'gym' as const, labelKey: 'workoutsHub.gym', icon: Dumbbell, desc: 'Fuerza · Periodización · Series', component: <GymSection /> },
    { id: 'swimming' as const, labelKey: 'workoutsHub.swimming', icon: Waves, desc: 'Intervalos · Técnica · Distancia', component: <SwimmingSection /> },
    { id: 'running' as const, labelKey: 'workoutsHub.running', icon: Footprints, desc: 'Ritmo · Cadencia · Progresión', component: <RunningSection /> },
    { id: 'saved' as const, labelKey: 'workoutsHub.saved', icon: Bookmark, desc: 'Rutinas guardadas', component: <MyWorkoutsSection /> },
    { id: 'microcycles' as const, labelKey: 'workoutsHub.microcycles', icon: Layers, desc: 'Planificación periódica', component: <MesocycleList /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* Section header */}
      <div className="mb-4">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="section-headline text-foreground"
        >
          {t('workoutsHub.title')}
        </motion.h2>
      </div>

      {/* Module list */}
      <div className="space-y-2.5">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease, delay: 0.06 + index * 0.05 }}
              className={cn(
                "overflow-hidden transition-all duration-300",
                isExpanded ? "neo-surface-elevated" : "neo-module-card"
              )}
            >
              <motion.button
                onClick={() => toggleSection(section.id)}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
                    isExpanded ? "bg-foreground" : "bg-surface-2"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-colors duration-300",
                      isExpanded ? "text-background" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-left">
                    <span className="text-[17px] font-semibold text-foreground block leading-tight">
                      {t(section.labelKey)}
                    </span>
                    <span className="text-[13px] text-muted-foreground mt-0.5 block">
                      {section.desc}
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.25, ease }}
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease }}
                    className="overflow-hidden"
                  >
                    <div className="h-px mx-4" style={{ background: 'hsl(var(--border) / 0.3)' }} />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.06, ease }}
                      className="p-4"
                    >
                      {section.component}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
