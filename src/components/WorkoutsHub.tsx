import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Waves, Footprints, ChevronDown, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GymSection } from './GymSection';
import { SwimmingSection } from './SwimmingSection';
import { RunningSection } from './RunningSection';
import { MyWorkoutsSection } from './MyWorkoutsSection';

type AccordionSection = 'gym' | 'swimming' | 'running' | 'saved' | null;

// Premium easing curve — fast out, subtle settle
const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

export const WorkoutsHub = () => {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<AccordionSection>('gym');

  const toggleSection = (section: AccordionSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const sections = [
    {
      id: 'gym' as const,
      labelKey: 'workoutsHub.gym',
      icon: Dumbbell,
      gradient: 'from-primary to-primary/80',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      component: <GymSection />
    },
    {
      id: 'swimming' as const,
      labelKey: 'workoutsHub.swimming',
      icon: Waves,
      gradient: 'from-cyan-500 to-cyan-400',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-500',
      component: <SwimmingSection />
    },
    {
      id: 'running' as const,
      labelKey: 'workoutsHub.running',
      icon: Footprints,
      gradient: 'from-green-500 to-emerald-400',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500',
      component: <RunningSection />
    },
    {
      id: 'saved' as const,
      labelKey: 'workoutsHub.saved',
      icon: Bookmark,
      gradient: 'from-violet-500 to-purple-400',
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-500',
      component: <MyWorkoutsSection />
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32 }}
      className="space-y-4"
    >
      {/* Header — staggered entry */}
      <div className="text-center mb-6">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: premiumEase, delay: 0.06 }}
          className="text-2xl font-bold text-foreground"
        >
          {t('workoutsHub.title')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: premiumEase, delay: 0.14 }}
          className="text-sm text-muted-foreground mt-1"
        >
          {t('workoutsHub.subtitle')}
        </motion.p>
      </div>

      {/* Accordion Sections — staggered cards */}
      <div className="space-y-3">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                ease: premiumEase,
                delay: 0.2 + index * 0.07
              }}
              className="overflow-hidden rounded-2xl"
            >
              {/* Section Header — premium tap */}
              <motion.button
                onClick={() => toggleSection(section.id)}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.18, ease: premiumEase }}
                className={cn(
                  "w-full p-4 min-h-[56px] flex items-center justify-between transition-colors duration-240",
                  isExpanded
                    ? `bg-gradient-to-r ${section.gradient} text-white rounded-t-2xl`
                    : "bg-card border border-border hover:border-primary/30 rounded-2xl"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl transition-colors duration-240",
                    isExpanded ? "bg-white/20" : section.bgColor
                  )}>
                    <Icon className={cn("w-6 h-6 transition-colors duration-240", isExpanded ? "text-white" : section.textColor)} />
                  </div>
                  <div className="text-left">
                    <h3 className={cn(
                      "font-semibold text-lg transition-colors duration-240",
                      isExpanded ? "text-white" : "text-foreground"
                    )}>
                      {t(section.labelKey)}
                    </h3>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.24, ease: premiumEase }}
                >
                  <ChevronDown className={cn("w-5 h-5 transition-colors duration-240", isExpanded ? "text-white" : "text-muted-foreground")} />
                </motion.div>
              </motion.button>

              {/* Section Content — smooth expand */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.32, ease: premiumEase }}
                    className="overflow-hidden"
                  >
                    <div className="bg-card border border-t-0 border-border rounded-b-2xl p-4">
                      {section.component}
                    </div>
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
