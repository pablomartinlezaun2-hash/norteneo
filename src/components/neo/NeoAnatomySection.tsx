import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Target, 
  Activity, 
  Eye,
  Bone,
  User,
  RotateCcw
} from 'lucide-react';
import { RealisticHumanModel } from './RealisticHumanModel';
import { AnatomicalDetailModal } from './AnatomicalDetailModal';
import { MuscleContractionViewer } from './MuscleContractionViewer';
import { ANATOMICAL_MUSCLES, ViewMode, getUniqueMuscles } from '@/data/anatomyData';
import { SetLog } from '@/types/database';
import { subDays, isAfter, startOfWeek, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';

interface NeoAnatomySectionProps {
  setLogs: SetLog[];
  exercises: Array<{ id: string; name: string; sessionName: string }>;
}

// Map exercise names to anatomical muscle IDs
const mapExerciseToMuscles = (exerciseName: string): string[] => {
  const name = exerciseName.toLowerCase();
  const mappings: Record<string, string[]> = {
    'press banca': ['pectoralis-major-sternal', 'pectoralis-major-clavicular', 'triceps-brachii', 'deltoid-anterior'],
    'press inclinado': ['pectoralis-major-clavicular', 'deltoid-anterior', 'triceps-brachii'],
    'press declinado': ['pectoralis-major-abdominal', 'pectoralis-major-sternal', 'triceps-brachii'],
    'aperturas': ['pectoralis-major-sternal'],
    'cruces': ['pectoralis-major-sternal', 'pectoralis-major-clavicular'],
    'fondos': ['pectoralis-major-abdominal', 'triceps-brachii'],
    'dominadas': ['latissimus-dorsi', 'biceps-brachii', 'brachialis'],
    'jalón': ['latissimus-dorsi', 'biceps-brachii'],
    'remo': ['latissimus-dorsi', 'trapezius-middle', 'biceps-brachii'],
    'peso muerto': ['erector-spinae', 'gluteus-maximus', 'biceps-femoris', 'semitendinosus'],
    'press militar': ['deltoid-anterior', 'deltoid-lateral', 'triceps-brachii'],
    'elevaciones laterales': ['deltoid-lateral'],
    'elevaciones frontales': ['deltoid-anterior'],
    'pájaros': ['deltoid-posterior', 'trapezius-middle'],
    'curl bíceps': ['biceps-brachii', 'brachialis'],
    'curl martillo': ['brachialis', 'biceps-brachii'],
    'extensiones tríceps': ['triceps-brachii'],
    'press francés': ['triceps-brachii'],
    'sentadillas': ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'gluteus-maximus'],
    'prensa': ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'gluteus-maximus'],
    'extensiones': ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis'],
    'curl femoral': ['biceps-femoris', 'semitendinosus'],
    'peso muerto rumano': ['biceps-femoris', 'semitendinosus', 'gluteus-maximus', 'erector-spinae'],
    'hip thrust': ['gluteus-maximus', 'gluteus-medius', 'biceps-femoris'],
    'gemelos': ['gastrocnemius'],
    'crunch': ['rectus-abdominis'],
    'plancha': ['rectus-abdominis', 'obliquus-externus'],
    'russian twist': ['obliquus-externus'],
  };

  for (const [key, muscles] of Object.entries(mappings)) {
    if (name.includes(key)) return muscles;
  }

  // Default keyword matching
  if (name.includes('pecho') || name.includes('chest')) return ['pectoralis-major-sternal'];
  if (name.includes('espalda') || name.includes('back')) return ['latissimus-dorsi'];
  if (name.includes('hombro') || name.includes('shoulder')) return ['deltoid-lateral'];
  if (name.includes('bíceps')) return ['biceps-brachii'];
  if (name.includes('tríceps')) return ['triceps-brachii'];
  if (name.includes('pierna') || name.includes('leg')) return ['rectus-femoris'];
  if (name.includes('glúteo')) return ['gluteus-maximus'];
  if (name.includes('abdominal') || name.includes('core')) return ['rectus-abdominis'];

  return [];
};

export const NeoAnatomySection = ({ setLogs, exercises }: NeoAnatomySectionProps) => {
  const { t } = useTranslation();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('muscles');
  const [isRotating, setIsRotating] = useState(true);

  // Calculate series per muscle
  const muscleSeriesData = useMemo(() => {
    const data: Record<string, number> = {};
    
    setLogs.forEach(log => {
      const exercise = exercises.find(ex => ex.id === log.exercise_id);
      if (exercise) {
        const muscles = mapExerciseToMuscles(exercise.name);
        muscles.forEach(muscleId => {
          data[muscleId] = (data[muscleId] || 0) + 1;
        });
      }
    });

    return data;
  }, [setLogs, exercises]);

  // Calculate series by time period
  const getSeriesDataByPeriod = useMemo(() => {
    if (!selectedMuscle) return { weekly: 0, monthly: 0, last30: 0, session: 0 };
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const thirtyDaysAgo = subDays(now, 30);

    let weekly = 0, monthly = 0, last30 = 0, session = 0;

    setLogs.forEach(log => {
      const exercise = exercises.find(ex => ex.id === log.exercise_id);
      if (!exercise) return;

      const muscles = mapExerciseToMuscles(exercise.name);
      if (!muscles.includes(selectedMuscle)) return;

      const logDate = new Date(log.logged_at);
      if (isAfter(logDate, weekStart)) weekly++;
      if (isAfter(logDate, monthStart)) monthly++;
      if (isAfter(logDate, thirtyDaysAgo)) last30++;
      session++;
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

  const uniqueMuscles = getUniqueMuscles();

  const viewModes: { mode: ViewMode; icon: typeof Eye; label: string }[] = [
    { mode: 'muscles', icon: Activity, label: 'Músculos' },
    { mode: 'skeleton', icon: Bone, label: 'Esqueleto' },
    { mode: 'skin', icon: User, label: 'Piel' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3"
        >
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Anatomía 3D</span>
        </motion.div>
        <h2 className="text-xl font-bold text-foreground">Modelo Neo</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Toca un músculo para ver información detallada
        </p>
      </div>

      {/* View Mode Selector */}
      <div className="flex justify-center gap-2">
        {viewModes.map(({ mode, icon: Icon, label }) => (
          <Button
            key={mode}
            variant={viewMode === mode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(mode)}
            className="gap-2"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* 3D Model Canvas */}
      <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-muted/30 to-muted/50 border border-border">
        <Canvas
          camera={{ position: [0, 0.3, 2.2], fov: 45 }}
          shadows
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-3, 3, -3]} intensity={0.4} />
          <pointLight position={[0, 2, 2]} intensity={0.3} />
          
          <RealisticHumanModel
            selectedMuscle={selectedMuscle}
            onMuscleSelect={handleMuscleSelect}
            muscleSeriesData={muscleSeriesData}
            viewMode={viewMode}
            isRotating={isRotating}
          />
          
          <OrbitControls
            enablePan={false}
            minDistance={1.2}
            maxDistance={4}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.2}
            autoRotate={isRotating && viewMode === 'muscles'}
            autoRotateSpeed={0.3}
          />
          
          <Environment preset="studio" />
        </Canvas>

        {/* Rotation toggle */}
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsRotating(!isRotating)}
        >
          <RotateCcw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        </Button>
      </div>

      {/* Muscle Legend */}
      <div className="gradient-card rounded-2xl p-4 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Músculos ({uniqueMuscles.length})
        </h3>
        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto scrollbar-hide">
          {uniqueMuscles.slice(0, 20).map((muscle) => {
            const baseId = muscle.id.replace(/-left$/, '');
            const seriesCount = muscleSeriesData[baseId] || 0;
            
            return (
              <button
                key={muscle.id}
                onClick={() => handleMuscleSelect(baseId)}
                className={`flex items-center gap-2 p-2 rounded-xl transition-all text-left ${
                  selectedMuscle === baseId
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-muted/50 hover:bg-muted border border-transparent'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: muscle.color }}
                />
                <span className="text-xs font-medium text-foreground truncate flex-1">
                  {muscle.name}
                </span>
                {seriesCount > 0 && (
                  <span className="text-xs text-primary font-semibold">
                    {seriesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {selectedMuscle && (
        <>
          <AnatomicalDetailModal
            muscleId={selectedMuscle}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onView3D={handleView3D}
            seriesData={getSeriesDataByPeriod}
          />
          
          <MuscleContractionViewer
            muscleId={selectedMuscle}
            isOpen={show3DViewer}
            onClose={() => setShow3DViewer(false)}
          />
        </>
      )}
    </motion.div>
  );
};
