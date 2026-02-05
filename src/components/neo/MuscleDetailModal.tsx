import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Activity, Calendar, Clock, Play, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MUSCLE_GROUPS, MuscleGroup } from '@/data/muscleData';
import { cn } from '@/lib/utils';
import { SetLog } from '@/types/database';
import { subDays, isAfter, startOfWeek, startOfMonth } from 'date-fns';

type TimeFilter = 'weekly' | 'monthly' | 'last30' | 'session';

interface MuscleDetailModalProps {
  muscleId: string;
  isOpen: boolean;
  onClose: () => void;
  onView3D: () => void;
  seriesData: {
    weekly: number;
    monthly: number;
    last30: number;
    session: number;
  };
}

export const MuscleDetailModal = ({ 
  muscleId, 
  isOpen, 
  onClose, 
  onView3D,
  seriesData 
}: MuscleDetailModalProps) => {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('weekly');
  
  const muscle = MUSCLE_GROUPS.find(m => m.id === muscleId);
  
  if (!muscle) return null;

  const timeFilters: { id: TimeFilter; label: string }[] = [
    { id: 'weekly', label: t('neo.weekly') },
    { id: 'monthly', label: t('neo.monthly') },
    { id: 'last30', label: t('neo.lastDays', { days: 30 }) },
    { id: 'session', label: t('neo.bySession') },
  ];

  const currentSeries = seriesData[timeFilter];
  const maxSeries = 25;
  const progress = Math.min((currentSeries / maxSeries) * 100, 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-background rounded-t-3xl max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${muscle.color}20` }}
                  >
                    <Activity className="w-6 h-6" style={{ color: muscle.color }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {t(muscle.nameKey)}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('neo.biomechanics')}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Time Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {timeFilters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={timeFilter === filter.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeFilter(filter.id)}
                    className={cn(
                      "flex-shrink-0",
                      timeFilter === filter.id && "gradient-primary glow-primary"
                    )}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Series Count */}
              <div className="gradient-card rounded-2xl p-5 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('neo.series')}
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {currentSeries}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: muscle.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentSeries} / {maxSeries} series recomendadas
                </p>
              </div>

              {/* Biomechanics Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  {t('neo.function')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(muscle.descKey)}
                </p>
              </div>

              {/* Subgroups */}
              {muscle.subgroups && muscle.subgroups.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('neo.movements')}
                  </h4>
                  <div className="grid gap-2">
                    {muscle.subgroups.map((subgroup) => (
                      <div
                        key={subgroup.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: muscle.color }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {t(subgroup.nameKey)}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {t(subgroup.descKey)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 3D Button */}
              <Button
                onClick={onView3D}
                className="w-full h-12 gradient-primary text-primary-foreground glow-primary"
              >
                <Play className="w-5 h-5 mr-2" />
                {t('neo.view3D')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
