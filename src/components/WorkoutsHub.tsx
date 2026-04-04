import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Waves, Footprints, ChevronDown, Bookmark, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GymSection } from './GymSection';
import { SwimmingSection } from './SwimmingSection';
import { RunningSection } from './RunningSection';
import { MyWorkoutsSection } from './MyWorkoutsSection';
import { MesocycleList } from './planning';

type AccordionSection = 'gym' | 'swimming' | 'running' | 'saved' | 'microcycles' | null;

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

// Cinematic reveal variant — each card uses a different entry style
const cardVariants = [
  // Gimnasio: laser horizontal reveal (clipPath)
  {
    initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)', filter: 'blur(4px)' },
    animate: { opacity: 1, clipPath: 'inset(0 0% 0 0)', filter: 'blur(0px)' },
  },
  // Natación: zoom-in from distance
  {
    initial: { opacity: 0, scale: 0.88, filter: 'blur(6px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  },
  // Running: slide from right with focus
  {
    initial: { opacity: 0, x: 40, filter: 'blur(5px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  },
  // Mis Entrenamientos: fade up with scale
  {
    initial: { opacity: 0, y: 20, scale: 0.95, filter: 'blur(3px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  },
  // Microciclos: diagonal slide
  {
    initial: { opacity: 0, x: -30, y: 15, filter: 'blur(4px)' },
    animate: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' },
  },
];

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
    {
      id: 'microcycles' as const,
      labelKey: 'workoutsHub.microcycles',
      icon: Layers,
      gradient: 'from-amber-500 to-orange-400',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-500',
      component: <MesocycleList />
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Title — laser reveal from left */}
      <div className="text-center mb-6">
        <motion.h2
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
          animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 0.6, ease: premiumEase, delay: 0.1 }}
          className="text-2xl font-bold text-foreground"
        >
          {t('workoutsHub.title')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, ease: premiumEase, delay: 0.35 }}
          className="text-sm text-muted-foreground mt-1"
        >
          {t('workoutsHub.subtitle')}
        </motion.p>
      </div>

      {/* Cards — each with unique cinematic entry */}
      <div className="space-y-3">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          const variant = cardVariants[index];

          return (
            <motion.div
              key={section.id}
              initial={variant.initial}
              animate={variant.animate}
              transition={{
                duration: 0.55,
                ease: premiumEase,
                delay: 0.4 + index * 0.18,
              }}
              className="overflow-hidden rounded-2xl"
            >
              {/* Header — tap to expand */}
              <motion.button
                onClick={() => toggleSection(section.id)}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "w-full p-4 min-h-[56px] flex items-center justify-between transition-colors duration-300",
                  isExpanded
                    ? `bg-gradient-to-r ${section.gradient} text-white rounded-t-2xl`
                    : "bg-card border border-border hover:border-primary/30 rounded-2xl"
                )}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className={cn(
                      "p-3 rounded-xl transition-colors duration-300",
                      isExpanded ? "bg-white/20" : section.bgColor
                    )}
                    animate={isExpanded ? { scale: [1, 1.06, 1] } : {}}
                    transition={{ duration: 0.35 }}
                  >
                    <Icon className={cn("w-6 h-6 transition-colors duration-300", isExpanded ? "text-white" : section.textColor)} />
                  </motion.div>
                  <div className="text-left">
                    <h3 className={cn(
                      "font-semibold text-lg transition-colors duration-300",
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
                  <ChevronDown className={cn("w-5 h-5 transition-colors duration-300", isExpanded ? "text-white" : "text-muted-foreground")} />
                </motion.div>
              </motion.button>

              {/* Expanded content — zoom-focus reveal */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.36, ease: premiumEase }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.4, delay: 0.08, ease: premiumEase }}
                      className="bg-card border border-t-0 border-border rounded-b-2xl p-4"
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
