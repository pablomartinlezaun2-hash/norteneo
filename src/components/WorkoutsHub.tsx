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

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

export const WorkoutsHub = () => {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<AccordionSection>(null);

  const toggleSection = (section: AccordionSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const sections = [
    {
      id: 'gym' as const,
      labelKey: 'workoutsHub.gym',
      icon: Dumbbell,
      component: <GymSection />
    },
    {
      id: 'swimming' as const,
      labelKey: 'workoutsHub.swimming',
      icon: Waves,
      component: <SwimmingSection />
    },
    {
      id: 'running' as const,
      labelKey: 'workoutsHub.running',
      icon: Footprints,
      component: <RunningSection />
    },
    {
      id: 'saved' as const,
      labelKey: 'workoutsHub.saved',
      icon: Bookmark,
      component: <MyWorkoutsSection />
    },
    {
      id: 'microcycles' as const,
      labelKey: 'workoutsHub.microcycles',
      icon: Layers,
      component: <MesocycleList />
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Section header — editorial */}
      <div className="mb-8">
        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: premiumEase }}
          className="section-headline text-foreground"
        >
          {t('workoutsHub.title')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="section-subheadline mt-2"
        >
          {t('workoutsHub.subtitle')}
        </motion.p>
      </div>

      {/* Module cards — clean, one idea per row */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                ease: premiumEase,
                delay: 0.1 + index * 0.06,
              }}
              className="overflow-hidden"
            >
              {/* Row trigger */}
              <motion.button
                onClick={() => toggleSection(section.id)}
                whileTap={{ scale: 0.995 }}
                className={cn(
                  "w-full px-4 py-3.5 flex items-center justify-between transition-all duration-200 rounded-xl",
                  isExpanded
                    ? "bg-foreground text-background"
                    : "hover:bg-muted/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200",
                    isExpanded ? "bg-background/15" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "w-[18px] h-[18px] transition-colors duration-200",
                      isExpanded ? "text-background" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className={cn(
                    "text-body font-medium transition-colors duration-200",
                    isExpanded ? "text-background" : "text-foreground"
                  )}>
                    {t(section.labelKey)}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: premiumEase }}
                >
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-colors duration-200",
                    isExpanded ? "text-background/60" : "text-muted-foreground"
                  )} />
                </motion.div>
              </motion.button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: premiumEase }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.06, ease: premiumEase }}
                      className="neo-surface mt-1 p-4"
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
