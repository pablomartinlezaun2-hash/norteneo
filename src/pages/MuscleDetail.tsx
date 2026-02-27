import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, TrendingUp, Activity, BarChart3, Zap, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useVolumeData } from '@/hooks/useVolumeData';

type DetailFilter = '2d' | '4d' | '1w' | '1m' | '3m' | 'all' | 'custom';

const FILTER_DAYS: Record<DetailFilter, number | null> = {
  '2d': 2, '4d': 4, '1w': 7, '1m': 30, '3m': 90, 'all': null, 'custom': null,
};

const FILTER_LABELS: Record<DetailFilter, string> = {
  '2d': '2 días', '4d': '4 días', '1w': '1 sem', '1m': '1 mes', '3m': '3 meses', 'all': 'Todo', 'custom': 'Personalizado',
};

/* ── Fatigue calculation ── */
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
  return 'medium';
}

function computeFatigue(muscleName: string, lastTrainedDate: string | null) {
  if (!lastTrainedDate) return { percent: 100, color: '#10B981', label: 'Recuperado', hoursAgo: 999 };
  const group = getRecoveryGroup(muscleName);
  const totalHours = RECOVERY_HOURS[group];
  const hoursAgo = (Date.now() - new Date(lastTrainedDate).getTime()) / 3_600_000;
  const percent = Math.min(100, Math.round((hoursAgo / totalHours) * 100));
  let color = '#10B981', label = 'Recuperado';
  if (percent < 33) { color = '#EF4444'; label = 'Fatigado'; }
  else if (percent < 67) { color = '#F97316'; label = 'Recuperándose'; }
  else if (percent < 100) { color = '#EAB308'; label = 'Casi listo'; }
  return { percent, color, label, hoursAgo: Math.round(hoursAgo) };
}

/* ── Progression chart per exercise (line + dots like reference) ── */
const ExerciseProgressionChart = ({ logs }: { logs: { date: string; sets: number; weight: number; reps: number; rir?: number; partialReps?: number }[] }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (logs.length < 2) {
    return <p className="text-[10px] text-muted-foreground/60 mt-2 italic">Datos insuficientes para gráfica</p>;
  }

  const last16 = logs.slice(-16);
  const weights = last16.map(l => l.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;
  const paddedMin = minW - range * 0.15;
  const paddedMax = maxW + range * 0.15;
  const paddedRange = paddedMax - paddedMin;

  const W = 320;
  const H = 140;
  const padX = 36;
  const padY = 16;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const points = last16.map((log, i) => ({
    x: padX + (last16.length === 1 ? chartW / 2 : (i / (last16.length - 1)) * chartW),
    y: padY + chartH - ((log.weight - paddedMin) / paddedRange) * chartH,
    log,
    i,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  // Y-axis ticks
  const ticks = 5;
  const yLabels = Array.from({ length: ticks }, (_, i) => {
    const val = paddedMin + (i / (ticks - 1)) * paddedRange;
    return { val: Math.round(val), y: padY + chartH - (i / (ticks - 1)) * chartH };
  });

  return (
    <div className="mt-3 pt-3 border-t border-border/20">
      <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-medium">Progresión de peso</p>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 180 }}>
          {/* Y grid lines + labels */}
          {yLabels.map((t, i) => (
            <g key={i}>
              <line x1={padX} y1={t.y} x2={W - padX} y2={t.y} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="3,3" opacity={0.4} />
              <text x={padX - 4} y={t.y + 3} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={8} opacity={0.6}>{t.val}</text>
            </g>
          ))}
          {/* Line */}
          <polyline points={polyline} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* Dots */}
          {points.map((p) => (
            <g key={p.i}>
              <circle cx={p.x} cy={p.y} r={hoveredIdx === p.i ? 6 : 4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIdx(p.i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onTouchStart={() => setHoveredIdx(p.i)}
              />
            </g>
          ))}
        </svg>
        {/* X-axis dates */}
        <div className="flex justify-between px-9 -mt-1">
          {last16.length <= 8 ? last16.map((l, i) => (
            <span key={i} className="text-[7px] text-muted-foreground/50">{l.date.slice(5)}</span>
          )) : (
            <>
              <span className="text-[7px] text-muted-foreground/50">{last16[0]?.date?.slice(5)}</span>
              <span className="text-[7px] text-muted-foreground/50">{last16[Math.floor(last16.length / 2)]?.date?.slice(5)}</span>
              <span className="text-[7px] text-muted-foreground/50">{last16[last16.length - 1]?.date?.slice(5)}</span>
            </>
          )}
        </div>
        {/* Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${(points[hoveredIdx].x / W) * 100}%`,
              top: `${(points[hoveredIdx].y / H) * 100}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-xl text-[10px] whitespace-nowrap">
              <p className="font-semibold text-foreground">{points[hoveredIdx].log.date.slice(5)}</p>
              <p className="text-primary font-bold">{points[hoveredIdx].log.weight} kg × {points[hoveredIdx].log.reps}</p>
              {points[hoveredIdx].log.rir != null && <p className="text-muted-foreground">RIR {points[hoveredIdx].log.rir}</p>}
              {(points[hoveredIdx].log.partialReps ?? 0) > 0 && <p className="text-muted-foreground">+{points[hoveredIdx].log.partialReps} parciales</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Exercise card with expandable chart ── */
const ExerciseItem = ({ ex }: { ex: {
  exerciseId: string; exerciseName: string; totalSets: number; totalReps: number; maxWeight: number; lastDate: string;
  logs: { date: string; sets: number; weight: number; reps: number; rir?: number; partialReps?: number }[];
}}) => {
  const [expanded, setExpanded] = useState(false);
  const lastDateFormatted = ex.lastDate ? formatRelativeDate(ex.lastDate) : 'Sin datos';

  return (
    <div className="rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{ex.exerciseName}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
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
                  <div key={j} className="w-1.5 rounded-t-sm bg-primary" style={{ height: `${Math.max(h, 15)}%`, opacity: 0.3 + (h / 100) * 0.7 }} />
                );
              })}
            </div>
          )}
        </div>

        {/* Expand/collapse button */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors min-h-[44px] w-full justify-center rounded-lg bg-primary/5 hover:bg-primary/10"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Ocultar gráfica' : 'Ver gráfica'}
        </button>
      </div>

      {/* Expanded chart */}
      {expanded && (
        <div className="px-3 pb-3">
          <ExerciseProgressionChart logs={ex.logs} />
        </div>
      )}
    </div>
  );
};

/* ── Main page ── */
const MuscleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<DetailFilter>('1m');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { getMuscleDetail, loading } = useVolumeData();

  const dateRange = useMemo(() => {
    if (filter === 'custom') {
      return { start: customStart || undefined, end: customEnd || undefined };
    }
    const now = new Date();
    const days = FILTER_DAYS[filter];
    if (!days) return { start: undefined, end: undefined };
    const start = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];
    return { start, end };
  }, [filter, customStart, customEnd]);

  const muscleData = useMemo(() => {
    if (!id) return null;
    return getMuscleDetail(id, dateRange.start, dateRange.end);
  }, [id, getMuscleDetail, dateRange]);

  // Fatigue: use all-time data for last training date
  const fatigue = useMemo(() => {
    if (!muscleData) return null;
    const allTimeData = getMuscleDetail(id!, undefined, undefined);
    const lastDate = allTimeData?.exercises.reduce((latest, ex) => (ex.lastDate > latest ? ex.lastDate : latest), '') || null;
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
      <div className="sticky top-0 z-20 px-4 py-3 border-b border-border/30 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground tracking-tight">{muscleData.name}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Period filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(FILTER_LABELS) as DetailFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px] ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {filter === 'custom' && (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="h-9 px-2 rounded-lg border border-border/30 bg-secondary/40 text-xs text-foreground" />
            <span className="text-xs text-muted-foreground">a</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="h-9 px-2 rounded-lg border border-border/30 bg-secondary/40 text-xs text-foreground" />
          </div>
        )}

        {/* Fatigue indicator */}
        {fatigue && (
          <div className="rounded-xl p-3 border border-border/30 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: fatigue.color }} />
              <span className="text-xs font-semibold text-foreground">Estado de recuperación</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto" style={{ background: `${fatigue.color}20`, color: fatigue.color }}>
                {fatigue.label}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-secondary/50 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${fatigue.percent}%`, background: fatigue.color }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
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
            <div key={i} className="rounded-xl p-3 border border-border/30 bg-card/60 backdrop-blur-sm">
              <stat.icon className="w-4 h-4 text-muted-foreground mb-1.5" />
              <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Exercise list */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Ejercicios realizados ({muscleData.exercises.length})
          </h2>
          <div className="space-y-3">
            {muscleData.exercises.map(ex => (
              <ExerciseItem key={ex.exerciseId} ex={ex} />
            ))}
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
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
  return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
}

export default MuscleDetail;
