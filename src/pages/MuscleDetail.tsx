import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/* ── Muscle metadata (mirrors ProgressChart) ── */
const MUSCLE_INFO: Record<string, { name: string; color: string }> = {
  pectoral: { name: 'Pectoral', color: 'hsl(185 100% 45%)' },
  deltAnterior: { name: 'Deltoide Anterior', color: 'hsl(320 100% 55%)' },
  deltMedial: { name: 'Deltoide Medial', color: 'hsl(200 100% 55%)' },
  deltPosterior: { name: 'Deltoide Posterior', color: 'hsl(100 90% 55%)' },
  dorsal: { name: 'Dorsal', color: 'hsl(265 100% 65%)' },
  upperBack: { name: 'Espalda Alta', color: 'hsl(185 80% 50%)' },
  lumbar: { name: 'Lumbar', color: 'hsl(35 100% 55%)' },
  erectors: { name: 'Erectores', color: 'hsl(160 80% 45%)' },
  quads: { name: 'Cuádriceps', color: 'hsl(210 100% 60%)' },
  hamstrings: { name: 'Isquios', color: 'hsl(330 90% 55%)' },
  abductor: { name: 'Abductor', color: 'hsl(50 90% 50%)' },
  adductor: { name: 'Aductor', color: 'hsl(280 80% 60%)' },
  calves: { name: 'Gemelos', color: 'hsl(170 80% 45%)' },
  tibialis: { name: 'Tibial', color: 'hsl(15 90% 55%)' },
  abs: { name: 'Recto abdominal', color: 'hsl(190 100% 50%)' },
  obliques: { name: 'Oblicuos', color: 'hsl(340 85% 55%)' },
  biceps: { name: 'Bíceps', color: 'hsl(95 85% 50%)' },
  triceps: { name: 'Tríceps', color: 'hsl(250 90% 65%)' },
};

/* ── Mock exercise data per muscle ── */
const MOCK_EXERCISES: Record<string, { name: string; totalSets: number; bestWeight: number; lastSession: string }[]> = {
  pectoral: [
    { name: 'Press Banca', totalSets: 24, bestWeight: 100, lastSession: 'Hace 1 día' },
    { name: 'Press Inclinado', totalSets: 18, bestWeight: 80, lastSession: 'Hace 3 días' },
    { name: 'Aperturas', totalSets: 12, bestWeight: 20, lastSession: 'Hace 5 días' },
  ],
  dorsal: [
    { name: 'Dominadas', totalSets: 20, bestWeight: 15, lastSession: 'Hoy' },
    { name: 'Remo con Barra', totalSets: 16, bestWeight: 80, lastSession: 'Hace 2 días' },
    { name: 'Jalón al Pecho', totalSets: 14, bestWeight: 70, lastSession: 'Hace 5 días' },
  ],
  quads: [
    { name: 'Sentadilla', totalSets: 30, bestWeight: 120, lastSession: 'Hace 3 días' },
    { name: 'Prensa', totalSets: 20, bestWeight: 200, lastSession: 'Hace 3 días' },
    { name: 'Extensiones', totalSets: 12, bestWeight: 50, lastSession: 'Hace 10 días' },
  ],
};

const MuscleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const muscle = id ? MUSCLE_INFO[id] : null;
  const exercises = useMemo(() => {
    if (!id) return [];
    return MOCK_EXERCISES[id] || [
      { name: 'Ejercicio 1', totalSets: 12, bestWeight: 40, lastSession: 'Hace 2 días' },
      { name: 'Ejercicio 2', totalSets: 8, bestWeight: 30, lastSession: 'Hace 5 días' },
    ];
  }, [id]);

  if (!muscle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Músculo no encontrado</p>
          <button onClick={() => navigate(-1)} className="text-primary text-sm">Volver</button>
        </div>
      </div>
    );
  }

  const totalSets = exercises.reduce((a, b) => a + b.totalSets, 0);
  const bestWeight = Math.max(...exercises.map(e => e.bestWeight));

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
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: muscle.color, boxShadow: `0 0 10px ${muscle.color}` }}
            />
            <h1 className="text-lg font-bold text-foreground tracking-tight">{muscle.name}</h1>
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Dumbbell, label: 'Series totales', value: totalSets },
            { icon: TrendingUp, label: 'Mejor peso (kg)', value: bestWeight },
            { icon: Activity, label: 'Ejercicios', value: exercises.length },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl p-3 border border-border/30"
              style={{
                background: 'hsl(var(--card) / 0.6)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <stat.icon className="w-4 h-4 text-muted-foreground mb-1.5" />
              <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Progression placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-4 border border-border/30"
          style={{
            background: 'hsl(var(--card) / 0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Progresión de volumen</h2>
          <div className="h-32 flex items-center justify-center rounded-lg bg-secondary/30">
            <div className="flex items-end gap-1 h-20">
              {[40, 55, 45, 70, 60, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
                  className="w-3 rounded-t-sm"
                  style={{
                    backgroundColor: muscle.color,
                    opacity: 0.4 + (h / 100) * 0.6,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">12 semanas atrás</span>
            <span className="text-[10px] text-muted-foreground">Hoy</span>
          </div>
        </motion.div>

        {/* Exercise list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Ejercicios relacionados</h2>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="rounded-xl p-3 border border-border/30 flex items-center gap-3"
                style={{
                  background: 'hsl(var(--card) / 0.6)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  className="w-1.5 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: muscle.color, opacity: 0.7 }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {ex.totalSets} series · {ex.bestWeight}kg PR · {ex.lastSession}
                  </p>
                </div>
                {/* Mini sparkline */}
                <div className="flex items-end gap-px h-6 flex-shrink-0">
                  {[30, 50, 40, 65, 55, 70, 80].map((h, j) => (
                    <div
                      key={j}
                      className="w-1 rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        backgroundColor: muscle.color,
                        opacity: 0.3 + (h / 100) * 0.7,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MuscleDetail;
