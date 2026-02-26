import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, TrendingUp, Activity, BarChart3, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useVolumeData } from '@/hooks/useVolumeData';
import { useAllSetLogs } from '@/hooks/useAllSetLogs';

type DetailFilter = '1w' | '2w' | '1m' | '3m' | 'all';

const FILTER_DAYS: Record<DetailFilter, number | null> = {
  '1w': 7, '2w': 14, '1m': 30, '3m': 90, 'all': null,
};

const FILTER_LABELS: Record<DetailFilter, string> = {
  '1w': '1 sem', '2w': '2 sem', '1m': '1 mes', '3m': '3 meses', 'all': 'Todo',
};

/* ── Fatigue calculation (same logic as NeoFatigueMap) ── */
type RecoveryGroup = 'large' | 'medium' | 'fast';

const RECOVERY_HOURS: Record<RecoveryGroup, number> = { large: 72, medium: 48, fast: 24 };

const MUSCLE_RECOVERY_GROUP: Record<string, RecoveryGroup> = {
  'cuádriceps': 'large', 'quadriceps': 'large', 'cuadriceps': 'large',
  'isquiotibiales': 'large', 'hamstrings': 'large', 'isquios': 'large',
  'dorsal': 'large', 'espalda': 'large', 'back': 'large', 'lats': 'large',
  'pectoral': 'large', 'pecho': 'large', 'chest': 'large',
  'glúteos': 'large', 'gluteos': 'large', 'glutes': 'large', 'glúteo mayor': 'large',
  'trapecio': 'large', 'traps': 'large',
  'abductor': 'large', 'aductor': 'large', 'adductor': 'large',
  'bíceps': 'medium', 'biceps': 'medium',
  'tríceps': 'medium', 'triceps': 'medium',
  'gemelos': 'medium', 'calves': 'medium', 'pantorrillas': 'medium',
  'antebrazo': 'medium', 'forearm': 'medium', 'forearms': 'medium',
  'lumbar': 'medium', 'lower back': 'medium', 'erector': 'medium',
  'deltoides': 'fast', 'hombros': 'fast', 'shoulders': 'fast', 'delts': 'fast',
  'abdominales': 'fast', 'abdomen': 'fast', 'abs': 'fast', 'core': 'fast',
  'oblicuos': 'fast', 'obliques': 'fast',
};

function getRecoveryGroup(muscleName: string): RecoveryGroup {
  const n = muscleName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, group] of Object.entries(MUSCLE_RECOVERY_GROUP)) {
    if (n.includes(key)) return group;
  }
  return 'medium'; // default
}

function computeFatigue(muscleName: string, lastTrainedDate: string | null): {
  percent: number; color: string; label: string; hoursAgo: number;
} {
  if (!lastTrainedDate) return { percent: 100, color: '#10B981', label: 'Recuperado', hoursAgo: 999 };

  const group = getRecoveryGroup(muscleName);
  const totalHours = RECOVERY_HOURS[group];
  const hoursAgo = (Date.now() - new Date(lastTrainedDate).getTime()) / 3_600_000;
  const percent = Math.min(100, Math.round((hoursAgo / totalHours) * 100));

  let color = '#10B981'; // green
  let label = 'Recuperado';
  if (percent < 33) { color = '#EF4444'; label = 'Fatigado'; }
  else if (percent < 67) { color = '#F97316'; label = 'Recuperándose'; }
  else if (percent < 100) { color = '#EAB308'; label = 'Casi listo'; }

  return { percent, color, label, hoursAgo: Math.round(hoursAgo) };
}

/* ── Mini bar chart for exercise progression ── */
const ExerciseProgressionChart = ({ logs }: { logs: { date: string; sets: number; weight: number; reps: number }[] }) => {
  if (logs.length < 2) return null;

  const last10 = logs.slice(-10);
  const maxVol = Math.max(...last10.map(l => l.weight * l.reps), 1);

  return (
    <div className="mt-2 pt-2 border-t border-border/20">
      <p className="text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Progresión volumen</p>
      <div className="flex items-end gap-[3px] h-10">
        {last10.map((log, j) => {
          const vol = log.weight * log.reps;
          const h = (vol / maxVol) * 100;
          const isLast = j === last10.length - 1;
          return (
            <div key={j} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(h, 8)}%`,
                  background: isLast
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--primary) / 0.35)',
                  minHeight: '3px',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-muted-foreground/60">{last10[0]?.date?.slice(5)}</span>
        <span className="text-[8px] text-muted-foreground/60">{last10[last10.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
};

const MuscleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<DetailFilter>('1m');

  const { getMuscleDetail, loading } = useVolumeData();
  const { logs: allSetLogs } = useAllSetLogs();

  const dateRange = useMemo(() => {
    const now = new Date();
    const days = FILTER_DAYS[filter];
    if (!days) return { start: undefined, end: undefined };
    const start = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];
    return { start, end };
  }, [filter]);

  const muscleData = useMemo(() => {
    if (!id) return null;
    return getMuscleDetail(id, dateRange.start, dateRange.end);
  }, [id, getMuscleDetail, dateRange]);

  // Compute fatigue from the most recent set_log date for this muscle (unfiltered)
  const fatigue = useMemo(() => {
    if (!muscleData) return null;
    // Get the all-time detail to find last training date
    const allTimeData = getMuscleDetail(id!, undefined, undefined);
    const lastDate = allTimeData?.exercises.reduce((latest, ex) => {
      return ex.lastDate > latest ? ex.lastDate : latest;
    }, '') || null;
    return computeFatigue(muscleData.name, lastDate);
  }, [muscleData, id, getMuscleDetail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!muscleData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2 text-sm">No hay datos para este músculo</p>
          <p className="text-muted-foreground/60 text-xs mb-4">Registra ejercicios para ver tu progreso aquí</p>
          <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">Volver</button>
        </div>
      </div>
    );
  }

  const totalReps = muscleData.exercises.reduce((a, b) => a + b.totalReps, 0);
  const bestWeight = Math.max(...muscleData.exercises.map(e => e.maxWeight), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-3 border-b border-border/30 bg-background/85 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground tracking-tight">{muscleData.name}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Period filter */}
        <div className="flex gap-2">
          {(Object.keys(FILTER_LABELS) as DetailFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Fatigue indicator */}
        {fatigue && (
          <div className="rounded-xl p-3 border border-border/30 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: fatigue.color }} />
              <span className="text-xs font-semibold text-foreground">Estado de recuperación</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto" style={{
                background: `${fatigue.color}20`,
                color: fatigue.color,
              }}>
                {fatigue.label}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${fatigue.percent}%`, background: fatigue.color }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {fatigue.percent}% recuperado · {fatigue.hoursAgo < 999 ? `Hace ${fatigue.hoursAgo}h` : 'Sin datos recientes'}
            </p>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Dumbbell, label: 'Series totales', value: muscleData.totalSets },
            { icon: TrendingUp, label: 'Mejor peso (kg)', value: bestWeight },
            { icon: Activity, label: 'Reps totales', value: totalReps },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl p-3 border border-border/30 bg-card/60 backdrop-blur-sm"
            >
              <stat.icon className="w-4 h-4 text-muted-foreground mb-1.5" />
              <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Exercise list with progression charts */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Ejercicios realizados ({muscleData.exercises.length})
          </h2>
          <div className="space-y-2">
            {muscleData.exercises.map((ex, i) => {
              const lastDateFormatted = ex.lastDate
                ? formatRelativeDate(ex.lastDate)
                : 'Sin datos';

              return (
                <div
                  key={ex.exerciseId}
                  className="rounded-xl p-3 border border-border/30 bg-card/60 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{ex.exerciseName}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {ex.totalSets} series · {ex.totalReps} reps · {ex.maxWeight}kg PR · {lastDateFormatted}
                      </p>
                    </div>
                    {/* Mini sparkline */}
                    {ex.logs.length > 1 && (
                      <div className="flex items-end gap-px h-6 flex-shrink-0">
                        {ex.logs.slice(-8).map((log, j) => {
                          const maxSets = Math.max(...ex.logs.slice(-8).map(l => l.sets));
                          const h = maxSets > 0 ? (log.sets / maxSets) * 100 : 50;
                          return (
                            <div
                              key={j}
                              className="w-1 rounded-t-sm bg-primary"
                              style={{
                                height: `${Math.max(h, 15)}%`,
                                opacity: 0.3 + (h / 100) * 0.7,
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Per-exercise progression chart */}
                  <ExerciseProgressionChart logs={ex.logs} />
                </div>
              );
            })}
          </div>
        </div>

        {muscleData.exercises.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No hay ejercicios registrados para este periodo</p>
          </div>
        )}
      </div>
    </div>
  );
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
  return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
}

export default MuscleDetail;
