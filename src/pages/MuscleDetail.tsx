import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useVolumeData } from '@/hooks/useVolumeData';

type DetailFilter = '1w' | '2w' | '1m' | '3m' | 'all';

const FILTER_DAYS: Record<DetailFilter, number | null> = {
  '1w': 7,
  '2w': 14,
  '1m': 30,
  '3m': 90,
  'all': null,
};

const FILTER_LABELS: Record<DetailFilter, string> = {
  '1w': '1 sem',
  '2w': '2 sem',
  '1m': '1 mes',
  '3m': '3 meses',
  'all': 'Todo',
};

const MuscleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<DetailFilter>('1m');

  const { getMuscleDetail, loading } = useVolumeData();

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 px-4 py-3 border-b border-border/30"
        style={{
          background: 'hsl(var(--background) / 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
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
      </motion.div>

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

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Dumbbell, label: 'Series totales', value: muscleData.totalSets },
            { icon: TrendingUp, label: 'Mejor peso (kg)', value: bestWeight },
            { icon: Activity, label: 'Reps totales', value: totalReps },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl p-3 border border-border/30 bg-card/60"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <stat.icon className="w-4 h-4 text-muted-foreground mb-1.5" />
              <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Exercise list — real data */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Ejercicios realizados ({muscleData.exercises.length})
          </h2>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {muscleData.exercises.map((ex, i) => {
                const lastDateFormatted = ex.lastDate
                  ? formatRelativeDate(ex.lastDate)
                  : 'Sin datos';

                return (
                  <motion.div
                    key={ex.exerciseId}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="rounded-xl p-3 border border-border/30 bg-card/60"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{ex.exerciseName}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {ex.totalSets} series · {ex.totalReps} reps · {ex.maxWeight}kg PR · {lastDateFormatted}
                        </p>
                      </div>
                      {/* Mini sparkline from real logs */}
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
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

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
