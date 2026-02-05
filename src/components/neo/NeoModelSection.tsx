import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, Target } from 'lucide-react';
import { NeoModel3D } from './NeoModel3D';
import { MuscleDetailModal } from './MuscleDetailModal';
import { Muscle3DViewer } from './Muscle3DViewer';
import { MUSCLE_GROUPS, getMuscleGroupsForExercise } from '@/data/muscleData';
import { SetLog } from '@/types/database';
import { subDays, isAfter, startOfWeek, startOfMonth } from 'date-fns';

interface NeoModelSectionProps {
  setLogs: SetLog[];
  exercises: Array<{ id: string; name: string; sessionName: string }>;
}

export const NeoModelSection = ({ setLogs, exercises }: NeoModelSectionProps) => {
  const { t } = useTranslation();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);

  // Calculate series per muscle group
  const muscleSeriesData = useMemo(() => {
    const data: Record<string, number> = {};
    
    // Initialize all muscles to 0
    MUSCLE_GROUPS.forEach(muscle => {
      data[muscle.id] = 0;
    });

    // Count series for each exercise and map to muscles
    setLogs.forEach(log => {
      const exercise = exercises.find(ex => ex.id === log.exercise_id);
      if (exercise) {
        const muscles = getMuscleGroupsForExercise(exercise.name);
        muscles.forEach(muscleId => {
          // Only count main muscle groups, not subgroups
          const mainMuscle = MUSCLE_GROUPS.find(m => m.id === muscleId);
          if (mainMuscle) {
            data[muscleId] = (data[muscleId] || 0) + 1;
          }
        });
      }
    });

    return data;
  }, [setLogs, exercises]);

  // Calculate series by time period for selected muscle
  const getSeriesDataByPeriod = useMemo(() => {
    if (!selectedMuscle) return { weekly: 0, monthly: 0, last30: 0, session: 0 };
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const thirtyDaysAgo = subDays(now, 30);

    let weekly = 0;
    let monthly = 0;
    let last30 = 0;
    let session = 0;

    setLogs.forEach(log => {
      const exercise = exercises.find(ex => ex.id === log.exercise_id);
      if (!exercise) return;

      const muscles = getMuscleGroupsForExercise(exercise.name);
      if (!muscles.includes(selectedMuscle)) return;

      const logDate = new Date(log.logged_at);

      if (isAfter(logDate, weekStart)) weekly++;
      if (isAfter(logDate, monthStart)) monthly++;
      if (isAfter(logDate, thirtyDaysAgo)) last30++;
      session++; // Count all for session view
    });

    return { weekly, monthly, last30, session };
  }, [selectedMuscle, setLogs, exercises]);

  const handleMuscleSelect = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setShowDetailModal(true);
  };

  const handleView3D = () => {
    setShowDetailModal(false);
    setShow3DViewer(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
        >
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">{t('neo.title')}</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Modelo Neo</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('neo.selectMuscle')}
        </p>
      </div>

      {/* 3D Model */}
      <NeoModel3D
        selectedMuscle={selectedMuscle}
        onMuscleSelect={handleMuscleSelect}
        muscleSeriesData={muscleSeriesData}
      />

      {/* Muscle Legend */}
      <div className="gradient-card rounded-2xl p-4 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Grupos musculares
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {MUSCLE_GROUPS.map((muscle) => (
            <button
              key={muscle.id}
              onClick={() => handleMuscleSelect(muscle.id)}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                selectedMuscle === muscle.id
                  ? 'bg-primary/20 border border-primary/30'
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: muscle.color }}
              />
              <span className="text-xs font-medium text-foreground truncate">
                {t(muscle.nameKey)}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {muscleSeriesData[muscle.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {selectedMuscle && (
        <>
          <MuscleDetailModal
            muscleId={selectedMuscle}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onView3D={handleView3D}
            seriesData={getSeriesDataByPeriod}
          />
          
          <Muscle3DViewer
            muscleId={selectedMuscle}
            isOpen={show3DViewer}
            onClose={() => setShow3DViewer(false)}
          />
        </>
      )}
    </motion.div>
  );
};
