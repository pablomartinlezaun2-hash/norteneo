import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, TrendingUp, Activity, BarChart3, Zap, ChevronDown, ChevronUp, CalendarDays, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePerformanceEngine, type ExercisePerformance } from '@/hooks/usePerformanceEngine';
import { getPointColor, exportToCSV, type ChartPointData } from '@/lib/performanceEngine';

type DetailFilter = '2d' | '4d' | '1w' | '1m' | '3m' | 'all' | 'custom';

const FILTER_DAYS: Record<DetailFilter, number | null> = {
  '2d': 2, '4d': 4, '1w': 7, '1m': 30, '3m': 90, 'all': null, 'custom': null,
};

const FILTER_LABELS: Record<DetailFilter, string> = {
  '2d': '2 días', '4d': '4 días', '1w': '1 sem', '1m': '1 mes', '3m': '3 meses', 'all': 'Todo', 'custom': 'Personalizado',
};

/* ── Enhanced progression chart using PerformanceEngine ── */
const ExerciseProgressionChart = ({ points }: { points: ChartPointData[] }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showMode, setShowMode] = useState<'est1rm' | 'weight'>('est1rm');

  if (points.length < 2) {
    return <p className="text-[10px] text-muted-foreground/60 mt-2 italic">Datos insuficientes para gráfica</p>;
  }

  const last16 = points.slice(-16);
  const values = last16.map(p => showMode === 'est1rm' ? p.est_1rm_set : p.best_weight);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const paddedMin = minV - range * 0.15;
  const paddedMax = maxV + range * 0.15;
  const paddedRange = paddedMax - paddedMin;

  const W = 320, H = 140, padX = 40, padY = 16;
  const chartW = W - padX * 2, chartH = H - padY * 2;

  const pts = last16.map((p, i) => ({
    x: padX + (last16.length === 1 ? chartW / 2 : (i / (last16.length - 1)) * chartW),
    y: padY + chartH - (((showMode === 'est1rm' ? p.est_1rm_set : p.best_weight) - paddedMin) / paddedRange) * chartH,
    point: p, i,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');

  const ticks = 5;
  const yLabels = Array.from({ length: ticks }, (_, i) => {
    const val = paddedMin + (i / (ticks - 1)) * paddedRange;
    return { val: Math.round(val * 10) / 10, y: padY + chartH - (i / (ticks - 1)) * chartH };
  });

  return (
    <div className="mt-3 pt-3 border-t border-border/20">
      {/* Toggle: est1RM vs weight */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex-1">
          {showMode === 'est1rm' ? 'Progresión est. 1RM' : 'Progresión peso'}
        </p>
        <button
          onClick={() => setShowMode(m => m === 'est1rm' ? 'weight' : 'est1rm')}
          className="text-[9px] px-2 py-1 rounded-md bg-secondary/50 text-muted-foreground hover:bg-secondary/80 transition-colors"
        >
          {showMode === 'est1rm' ? 'Ver peso' : 'Ver est. 1RM'}
        </button>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 180 }}>
          {yLabels.map((t, i) => (
            <g key={i}>
              <line x1={padX} y1={t.y} x2={W - padX} y2={t.y} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="3,3" opacity={0.4} />
              <text x={padX - 4} y={t.y + 3} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={8} opacity={0.6}>{t.val}</text>
            </g>
          ))}
          <polyline points={polyline} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p) => (
            <g key={p.i}>
              <circle cx={p.x} cy={p.y} r={hoveredIdx === p.i ? 6 : 4}
                fill={p.point.color} stroke="hsl(var(--background))" strokeWidth={2}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIdx(p.i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onTouchStart={() => setHoveredIdx(p.i)}
              />
            </g>
          ))}
        </svg>
        {/* X dates */}
        <div className="flex justify-between px-10 -mt-1">
          {last16.length <= 8 ? last16.map((p, i) => (
            <span key={i} className="text-[7px] text-muted-foreground/50">{p.date.slice(5)}</span>
          )) : (
            <>
              <span className="text-[7px] text-muted-foreground/50">{last16[0]?.date?.slice(5)}</span>
              <span className="text-[7px] text-muted-foreground/50">{last16[Math.floor(last16.length / 2)]?.date?.slice(5)}</span>
              <span className="text-[7px] text-muted-foreground/50">{last16[last16.length - 1]?.date?.slice(5)}</span>
            </>
          )}
        </div>
        {/* Tooltip */}
        {hoveredIdx !== null && pts[hoveredIdx] && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${(pts[hoveredIdx].x / W) * 100}%`,
              top: `${(pts[hoveredIdx].y / H) * 100}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-xl text-[10px] whitespace-nowrap">
              <p className="font-semibold text-foreground">{pts[hoveredIdx].point.date}</p>
              <p className="text-primary font-bold">
                {pts[hoveredIdx].point.best_weight} kg × {pts[hoveredIdx].point.best_reps}
              </p>
              <p className="text-muted-foreground">
                est. 1RM: <span className="font-semibold text-foreground">{pts[hoveredIdx].point.est_1rm_set.toFixed(1)} kg</span>
              </p>
              <p className="text-muted-foreground">
                IEM sesión: {pts[hoveredIdx].point.session_iem.toFixed(1)}
              </p>
              {pts[hoveredIdx].point.best_rir !== null && (
                <p className="text-muted-foreground">
                  RIR: {pts[hoveredIdx].point.best_rir}
                  {pts[hoveredIdx].point.rir_estimated && <span className="text-amber-500 ml-1">(est.)</span>}
                </p>
              )}
              <p className={`font-medium ${pts[hoveredIdx].point.pct_change > 0 ? 'text-green-500' : pts[hoveredIdx].point.pct_change < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                vs baseline: {(pts[hoveredIdx].point.pct_change * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Exercise card with expandable chart ── */
const ExerciseItem = ({ ex, chartPoints }: { ex: ExercisePerformance; chartPoints: ChartPointData[] }) => {
  const [expanded, setExpanded] = useState(false);
  const lastDateFormatted = ex.lastDate ? formatRelativeDate(ex.lastDate) : 'Sin datos';
  const latestPctStr = ex.latestPctChange !== 0
    ? `${ex.latestPctChange > 0 ? '+' : ''}${(ex.latestPctChange * 100).toFixed(1)}%`
    : '';

  return (
    <div className="rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{ex.exerciseName}</p>
              {latestPctStr && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  ex.latestPctChange > 0 ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                }`}>
                  {latestPctStr}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {ex.totalSets} series · {ex.totalReps} reps · est.1RM {ex.bestEst1rm.toFixed(1)}kg · {lastDateFormatted}
            </p>
          </div>
          {/* Alert badges */}
          {ex.alerts.length > 0 && (
            <div className="flex gap-1">
              {ex.alerts.map((a, j) => (
                <span key={j} className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                  a.severity === 'error' ? 'bg-red-500/15 text-red-500' :
                  a.severity === 'warn' ? 'bg-amber-500/15 text-amber-500' :
                  'bg-green-500/15 text-green-500'
                }`}>
                  {a.type === 'improvement' ? '↑' : a.type === 'regression' ? '↓' : a.type === 'stagnation' ? '=' : '⚠'}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors min-h-[44px] w-full justify-center rounded-lg bg-primary/5 hover:bg-primary/10"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Ocultar gráfica' : 'Ver gráfica'}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3">
          <ExerciseProgressionChart points={chartPoints} />
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

  const { computeMusclePerformances, getExerciseChartPoints, loading } = usePerformanceEngine();

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

  const musclePerf = useMemo(() => {
    if (!id) return null;
    const muscles = computeMusclePerformances(dateRange.start, dateRange.end);
    return muscles.get(id) || null;
  }, [id, computeMusclePerformances, dateRange]);

  const handleExport = useCallback(() => {
    if (!musclePerf) return;
    const rows: Record<string, any>[] = [];
    for (const ex of musclePerf.exercises) {
      for (const s of ex.sessions) {
        rows.push({
          muscle: musclePerf.muscleName,
          exercise: ex.exerciseName,
          date: s.sessionDate,
          est_1rm: s.session_est_1rm,
          session_iem: s.session_iem,
          baseline: s.baseline,
          pct_change: s.pct_change,
          sets: s.sets.length,
          best_weight: s.bestWeight,
          best_reps: s.bestReps,
        });
      }
    }
    exportToCSV(rows, `muscle_${musclePerf.muscleName}_performance`);
  }, [musclePerf]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!musclePerf) {
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

  const totalReps = musclePerf.exercises.reduce((a, b) => a + b.totalReps, 0);
  const bestEst1rm = musclePerf.exercises.length > 0
    ? Math.max(...musclePerf.exercises.map(e => e.bestEst1rm))
    : 0;
  const fatigue = musclePerf.fatigue;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 border-b border-border/30 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex-1">{musclePerf.muscleName}</h1>
          <button onClick={handleExport} className="p-2 rounded-xl hover:bg-secondary/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Exportar CSV">
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
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

        {/* Fatigue indicator — Neo Fatigue 2.0 exponential model */}
        <div className="rounded-xl p-3 border border-border/30 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4" style={{ color: fatigue.color }} />
            <span className="text-xs font-semibold text-foreground">Estado de recuperación</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto" style={{ background: `${fatigue.color}20`, color: fatigue.color }}>
              {fatigue.label}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary/50 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${fatigue.recovery_pct}%`, background: fatigue.color }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {fatigue.recovery_pct}% recuperado · {fatigue.hours_since_last < 999 ? `Hace ${fatigue.hours_since_last}h` : 'Sin datos'}
            {fatigue.hours_remaining > 0 && ` · ~${fatigue.hours_remaining}h restantes`}
          </p>
          <p className="text-[9px] text-muted-foreground/60 mt-1">
            Modelo: decaimiento exponencial (k={fatigue.recovery_group})
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Dumbbell, label: 'Series totales', value: musclePerf.totalSets },
            { icon: TrendingUp, label: 'Mejor est. 1RM', value: `${bestEst1rm.toFixed(1)}` },
            { icon: Activity, label: 'IEM total', value: `${musclePerf.totalIEM.toFixed(0)}` },
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
            Ejercicios realizados ({musclePerf.exercises.length})
          </h2>
          <div className="space-y-3">
            {musclePerf.exercises.map(ex => (
              <ExerciseItem
                key={ex.exerciseId}
                ex={ex}
                chartPoints={getExerciseChartPoints(ex.exerciseId, dateRange.start, dateRange.end)}
              />
            ))}
          </div>
        </div>

        {musclePerf.exercises.length === 0 && (
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
