import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Dumbbell, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ── Types ── */
interface MuscleData {
  id: string;
  name: string;
  color: string;
  darkColor: string;
}

interface WorkoutSet {
  date: string;
  muscleId: string;
  sets: number;
}

/* ── Neon palette — cyber fitness premium ── */
const MUSCLES: MuscleData[] = [
  { id: 'pectoral', name: 'Pectoral', color: 'hsl(185 100% 45%)', darkColor: 'hsl(185 100% 50%)' },
  { id: 'deltAnterior', name: 'Deltoide Anterior', color: 'hsl(320 100% 55%)', darkColor: 'hsl(320 100% 58%)' },
  { id: 'deltMedial', name: 'Deltoide Medial', color: 'hsl(200 100% 55%)', darkColor: 'hsl(200 100% 60%)' },
  { id: 'deltPosterior', name: 'Deltoide Posterior', color: 'hsl(100 90% 55%)', darkColor: 'hsl(100 90% 60%)' },
  { id: 'dorsal', name: 'Dorsal', color: 'hsl(265 100% 65%)', darkColor: 'hsl(265 100% 70%)' },
  { id: 'upperBack', name: 'Espalda Alta', color: 'hsl(185 80% 50%)', darkColor: 'hsl(185 80% 55%)' },
  { id: 'lumbar', name: 'Lumbar', color: 'hsl(35 100% 55%)', darkColor: 'hsl(35 100% 60%)' },
  { id: 'erectors', name: 'Erectores', color: 'hsl(160 80% 45%)', darkColor: 'hsl(160 80% 55%)' },
  { id: 'quads', name: 'Cuádriceps', color: 'hsl(210 100% 60%)', darkColor: 'hsl(210 100% 65%)' },
  { id: 'hamstrings', name: 'Isquios', color: 'hsl(330 90% 55%)', darkColor: 'hsl(330 90% 60%)' },
  { id: 'abductor', name: 'Abductor', color: 'hsl(50 90% 50%)', darkColor: 'hsl(50 90% 55%)' },
  { id: 'adductor', name: 'Aductor', color: 'hsl(280 80% 60%)', darkColor: 'hsl(280 80% 65%)' },
  { id: 'calves', name: 'Gemelos', color: 'hsl(170 80% 45%)', darkColor: 'hsl(170 80% 55%)' },
  { id: 'tibialis', name: 'Tibial', color: 'hsl(15 90% 55%)', darkColor: 'hsl(15 90% 60%)' },
  { id: 'abs', name: 'Recto abdominal', color: 'hsl(190 100% 50%)', darkColor: 'hsl(190 100% 55%)' },
  { id: 'obliques', name: 'Oblicuos', color: 'hsl(340 85% 55%)', darkColor: 'hsl(340 85% 58%)' },
  { id: 'biceps', name: 'Bíceps', color: 'hsl(95 85% 50%)', darkColor: 'hsl(95 85% 55%)' },
  { id: 'triceps', name: 'Tríceps', color: 'hsl(250 90% 65%)', darkColor: 'hsl(250 90% 70%)' },
];

/* ── Mock data (~100 sets across 14 days) ── */
const generateMockData = (): WorkoutSet[] => {
  const now = new Date();
  const sets: WorkoutSet[] = [];
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const today = fmt(now);
  sets.push({ date: today, muscleId: 'dorsal', sets: 3 });
  sets.push({ date: today, muscleId: 'upperBack', sets: 3 });
  sets.push({ date: today, muscleId: 'biceps', sets: 4 });

  const d1 = fmt(new Date(now.getTime() - 86400000));
  sets.push({ date: d1, muscleId: 'pectoral', sets: 4 });
  sets.push({ date: d1, muscleId: 'deltAnterior', sets: 3 });
  sets.push({ date: d1, muscleId: 'triceps', sets: 4 });

  const d3 = fmt(new Date(now.getTime() - 3 * 86400000));
  sets.push({ date: d3, muscleId: 'quads', sets: 5 });
  sets.push({ date: d3, muscleId: 'hamstrings', sets: 4 });
  sets.push({ date: d3, muscleId: 'calves', sets: 3 });
  sets.push({ date: d3, muscleId: 'abs', sets: 3 });

  const d5 = fmt(new Date(now.getTime() - 5 * 86400000));
  sets.push({ date: d5, muscleId: 'dorsal', sets: 4 });
  sets.push({ date: d5, muscleId: 'erectors', sets: 3 });
  sets.push({ date: d5, muscleId: 'biceps', sets: 3 });

  const d7 = fmt(new Date(now.getTime() - 7 * 86400000));
  sets.push({ date: d7, muscleId: 'pectoral', sets: 4 });
  sets.push({ date: d7, muscleId: 'deltMedial', sets: 3 });
  sets.push({ date: d7, muscleId: 'deltPosterior', sets: 3 });
  sets.push({ date: d7, muscleId: 'triceps', sets: 4 });

  const d10 = fmt(new Date(now.getTime() - 10 * 86400000));
  sets.push({ date: d10, muscleId: 'quads', sets: 5 });
  sets.push({ date: d10, muscleId: 'hamstrings', sets: 4 });
  sets.push({ date: d10, muscleId: 'abductor', sets: 3 });
  sets.push({ date: d10, muscleId: 'adductor', sets: 3 });
  sets.push({ date: d10, muscleId: 'calves', sets: 3 });

  const d12 = fmt(new Date(now.getTime() - 12 * 86400000));
  sets.push({ date: d12, muscleId: 'lumbar', sets: 3 });
  sets.push({ date: d12, muscleId: 'obliques', sets: 3 });
  sets.push({ date: d12, muscleId: 'abs', sets: 3 });
  sets.push({ date: d12, muscleId: 'tibialis', sets: 3 });

  return sets;
};

const MOCK_DATA = generateMockData();

type TimeFilter = 'last' | '2d' | '5d' | '2w' | '1m' | 'custom';

const FILTER_DAYS: Record<Exclude<TimeFilter, 'custom'>, number | null> = {
  last: 0,
  '2d': 2,
  '5d': 5,
  '2w': 14,
  '1m': 30,
};

const MAX_SEGMENTS = 8;

/* ── Reduced motion check ── */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Animated counter ── */
const AnimatedCounter = memo(({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    if (prefersReducedMotion()) { setDisplay(value); return; }
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 500;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: 'var(--chart-number)' }}>
      {display}
    </span>
  );
});
AnimatedCounter.displayName = 'AnimatedCounter';

/* ── Legend Item ── */
const LegendItem = memo(({
  item,
  isActive,
  onHover,
  onLeave,
  onClick,
  index,
}: {
  item: { id: string; name: string; color: string; sets: number; percent: number };
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  index: number;
}) => {
  const reduced = prefersReducedMotion();
  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: -6 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.2, 0.9, 0.25, 1] }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
      style={{
        background: isActive ? 'var(--legend-hover-bg)' : 'transparent',
        transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'background 0.25s, transform 0.25s',
      }}
      role="listitem"
      aria-label={`${item.name}: ${item.sets} sets, ${item.percent}%`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{
          backgroundColor: item.color,
          boxShadow: isActive ? `0 0 8px ${item.color}` : 'none',
          transition: 'box-shadow 0.3s',
        }}
      />
      <span className="text-xs flex-1 truncate" style={{ color: 'var(--legend-text)', transition: 'color 0.2s' }}>
        {item.name}
      </span>
      <span className="text-[10px] tabular-nums" style={{ color: 'var(--legend-muted)' }}>
        {item.sets}
      </span>
      <span className="text-xs font-semibold w-12 text-right tabular-nums tracking-tight" style={{ color: 'var(--legend-percent)' }}>
        {item.percent}%
      </span>
    </motion.div>
  );
});
LegendItem.displayName = 'LegendItem';

/* ── Compute tooltip position outside the donut ── */
const DONUT_SIZE = 208;
const CX = DONUT_SIZE / 2; // 104
const CY = DONUT_SIZE / 2; // 104
const OUTER_R = DONUT_SIZE * 0.82 / 2; // ~85
const TOOLTIP_OFFSET = 18;

function computeTooltipPosition(
  chartData: { value: number }[],
  index: number
): { x: number; y: number; side: 'left' | 'right' | 'top' | 'bottom' } {
  const total = chartData.reduce((a, b) => a + b.value, 0);
  if (total === 0) return { x: CX, y: 0, side: 'top' };

  // Calculate midAngle for the segment
  let startAngle = 90; // Recharts starts at 90deg (top)
  for (let i = 0; i < index; i++) {
    startAngle -= (chartData[i].value / total) * 360;
  }
  const segAngle = (chartData[index].value / total) * 360;
  const midAngle = startAngle - segAngle / 2;

  // Convert to radians
  const rad = (midAngle * Math.PI) / 180;
  const tipR = OUTER_R + TOOLTIP_OFFSET;
  const rawX = CX + tipR * Math.cos(rad);
  const rawY = CY - tipR * Math.sin(rad);

  // Determine side for alignment
  const normAngle = ((midAngle % 360) + 360) % 360;
  let side: 'left' | 'right' | 'top' | 'bottom';
  if (normAngle >= 45 && normAngle < 135) side = 'top';
  else if (normAngle >= 135 && normAngle < 225) side = 'left';
  else if (normAngle >= 225 && normAngle < 315) side = 'bottom';
  else side = 'right';

  return { x: rawX, y: rawY, side };
}

/* ── External Tooltip ── */
const ExternalTooltip = memo(({
  data,
  position,
  isPinned,
  onConsultar,
}: {
  data: { name: string; sets: number; percent: number; color: string; id: string };
  position: { x: number; y: number; side: 'left' | 'right' | 'top' | 'bottom' };
  isPinned: boolean;
  onConsultar: () => void;
}) => {
  const reduced = prefersReducedMotion();

  // Translate so tooltip doesn't overlap the anchor point
  let transform = '';
  switch (position.side) {
    case 'right': transform = 'translate(4px, -50%)'; break;
    case 'left': transform = 'translate(calc(-100% - 4px), -50%)'; break;
    case 'top': transform = 'translate(-50%, calc(-100% - 4px))'; break;
    case 'bottom': transform = 'translate(-50%, 4px)'; break;
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.15, ease: [0.2, 0.9, 0.25, 1] }}
      className="absolute pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform,
        zIndex: 50,
      }}
      role="tooltip"
      aria-label={`${data.name}: ${data.sets} sets, ${data.percent}%`}
    >
      <div
        className="rounded-xl px-3.5 py-2.5 border min-w-[140px]"
        style={{
          background: 'var(--tooltip-bg)',
          borderColor: 'var(--tooltip-border)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: `0 0 20px ${data.color}22, 0 4px 16px rgba(0,0,0,0.15)`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: data.color, boxShadow: `0 0 8px ${data.color}` }}
          />
          <p className="font-semibold text-foreground text-xs tracking-tight">{data.name}</p>
        </div>
        <p className="text-muted-foreground text-[11px]">{data.sets} sets · {data.percent}%</p>
        {isPinned && data.id !== '_others' && (
          <button
            onClick={(e) => { e.stopPropagation(); onConsultar(); }}
            className="mt-2 flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-2.5 py-1.5 w-full justify-center transition-all"
            style={{
              background: `${data.color}18`,
              color: data.color,
              border: `1px solid ${data.color}30`,
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = `${data.color}30`; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = `${data.color}18`; }}
          >
            <Search className="w-3 h-3" />
            Consultar datos
          </button>
        )}
      </div>
    </motion.div>
  );
});
ExternalTooltip.displayName = 'ExternalTooltip';

/* ── Main Component ── */
interface ProgressChartProps {
  totalCompleted?: number;
  cyclesCompleted?: number;
  progressInCycle?: number;
}

export const ProgressChart = (_props: ProgressChartProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TimeFilter>('2w');
  const [customDays, setCustomDays] = useState(7);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const reduced = prefersReducedMotion();

  // Close pinned tooltip on click outside
  useEffect(() => {
    if (pinnedIndex === null) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPinnedIndex(null);
        setActiveIndex(null);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [pinnedIndex]);

  const filterOptions = useMemo(() => [
    { value: 'last' as TimeFilter, label: t('volumeChart.lastWorkout') },
    { value: '2d' as TimeFilter, label: t('volumeChart.last2Days') },
    { value: '5d' as TimeFilter, label: t('volumeChart.last5Days') },
    { value: '2w' as TimeFilter, label: t('volumeChart.last2Weeks') },
    { value: '1m' as TimeFilter, label: t('volumeChart.lastMonth') },
    { value: 'custom' as TimeFilter, label: t('volumeChart.custom') },
  ], [t]);

  const chartData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let filtered: WorkoutSet[];

    if (filter === 'last') {
      const dates = [...new Set(MOCK_DATA.map(s => s.date))].sort().reverse();
      const lastDate = dates[0] || todayStr;
      filtered = MOCK_DATA.filter(s => s.date === lastDate);
    } else {
      const days = filter === 'custom' ? customDays : FILTER_DAYS[filter]!;
      const cutoff = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
      filtered = MOCK_DATA.filter(s => s.date >= cutoff);
    }

    const totals = new Map<string, number>();
    filtered.forEach(s => totals.set(s.muscleId, (totals.get(s.muscleId) || 0) + s.sets));

    const totalSets = [...totals.values()].reduce((a, b) => a + b, 0);
    if (totalSets === 0) return [];

    const all = MUSCLES
      .filter(m => totals.has(m.id))
      .map(m => {
        const sets = totals.get(m.id)!;
        return {
          id: m.id,
          name: m.name,
          color: isDark ? m.darkColor : m.color,
          sets,
          percent: Math.round((sets / totalSets) * 1000) / 10,
          value: sets,
        };
      })
      .sort((a, b) => b.sets - a.sets);

    if (all.length <= MAX_SEGMENTS) return all;

    const top = all.slice(0, MAX_SEGMENTS);
    const rest = all.slice(MAX_SEGMENTS);
    const otherSets = rest.reduce((a, b) => a + b.sets, 0);
    const otherPercent = Math.round((otherSets / totalSets) * 1000) / 10;
    top.push({
      id: '_others',
      name: 'Otros',
      color: isDark ? 'hsl(220 15% 40%)' : 'hsl(220 15% 65%)',
      sets: otherSets,
      percent: otherPercent,
      value: otherSets,
    });
    return top;
  }, [filter, customDays, isDark]);

  const totalSets = useMemo(() => chartData.reduce((a, b) => a + b.sets, 0), [chartData]);

  // Tooltip position memoized for active/pinned index
  const visibleIndex = pinnedIndex !== null ? pinnedIndex : activeIndex;
  const tooltipPos = useMemo(() => {
    if (visibleIndex === null || visibleIndex >= chartData.length) return null;
    return computeTooltipPosition(chartData, visibleIndex);
  }, [visibleIndex, chartData]);

  const handlePieEnter = useCallback((_: any, index: number) => {
    if (pinnedIndex === null) setActiveIndex(index);
  }, [pinnedIndex]);

  const handlePieLeave = useCallback(() => {
    if (pinnedIndex === null) setActiveIndex(null);
  }, [pinnedIndex]);

  const handlePieClick = useCallback((_: any, index: number) => {
    if (pinnedIndex === index) {
      // Second click on same segment → navigate
      const item = chartData[index];
      if (item && item.id !== '_others') {
        navigate(`/muscle/${item.id}`);
      }
    } else {
      setPinnedIndex(index);
      setActiveIndex(index);
    }
  }, [pinnedIndex, chartData, navigate]);

  const handleConsultar = useCallback(() => {
    if (pinnedIndex !== null && chartData[pinnedIndex]) {
      navigate(`/muscle/${chartData[pinnedIndex].id}`);
    }
  }, [pinnedIndex, chartData, navigate]);

  const handleFilterChange = useCallback((v: string) => {
    setFilter(v as TimeFilter);
    setActiveIndex(null);
    setPinnedIndex(null);
  }, []);

  const handleCustomDaysChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDays(Math.max(1, Number(e.target.value)));
  }, []);

  const handleLegendHover = useCallback((i: number) => () => {
    if (pinnedIndex === null) setActiveIndex(i);
  }, [pinnedIndex]);
  const handleLegendLeave = useCallback(() => {
    if (pinnedIndex === null) setActiveIndex(null);
  }, [pinnedIndex]);
  const handleLegendClick = useCallback((i: number) => () => {
    if (pinnedIndex === i) {
      const item = chartData[i];
      if (item && item.id !== '_others') navigate(`/muscle/${item.id}`);
    } else {
      setPinnedIndex(i);
      setActiveIndex(i);
    }
  }, [pinnedIndex, chartData, navigate]);

  const cssVars = useMemo(() => {
    if (isDark) {
      return {
        '--chart-bg': 'rgba(11, 18, 32, 0.6)',
        '--chart-border': 'rgba(255, 255, 255, 0.05)',
        '--chart-number': '#E6EDF7',
        '--chart-subtitle': '#6E7C93',
        '--tooltip-bg': 'rgba(11, 18, 32, 0.92)',
        '--tooltip-border': 'rgba(255, 255, 255, 0.1)',
        '--legend-hover-bg': 'rgba(255, 255, 255, 0.04)',
        '--legend-text': '#9FB0C6',
        '--legend-muted': '#6E7C93',
        '--legend-percent': '#E6EDF7',
        '--donut-shadow': 'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.5), transparent 70%)',
      } as Record<string, string>;
    }
    return {
      '--chart-bg': 'rgba(244, 247, 251, 0.7)',
      '--chart-border': 'rgba(0, 0, 0, 0.04)',
      '--chart-number': '#0F1724',
      '--chart-subtitle': '#64748B',
      '--tooltip-bg': 'rgba(255, 255, 255, 0.95)',
      '--tooltip-border': 'rgba(0, 0, 0, 0.08)',
      '--legend-hover-bg': 'rgba(0, 0, 0, 0.03)',
      '--legend-text': '#475569',
      '--legend-muted': '#64748B',
      '--legend-percent': '#0F1724',
      '--donut-shadow': 'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.08), transparent 70%)',
    } as Record<string, string>;
  }, [isDark]);

  const filterLabel = useMemo(() => {
    const opt = filterOptions.find(o => o.value === filter);
    return opt?.label || '';
  }, [filter, filterOptions]);

  const highlightIndex = pinnedIndex !== null ? pinnedIndex : activeIndex;

  return (
    <motion.div
      ref={containerRef}
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.2, 0.9, 0.25, 1] }}
      className="relative rounded-2xl overflow-visible"
      style={{
        ...cssVars,
        background: 'var(--chart-bg)',
        border: '1px solid var(--chart-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '1.25rem',
      }}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {t('volumeChart.title')}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--chart-subtitle)' }}>
            Distribución por grupo muscular
          </p>
        </div>
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs rounded-xl border-border/30 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50 rounded-xl z-[999]">
            {filterOptions.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-xs rounded-lg">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom days input */}
      <AnimatePresence>
        {filter === 'custom' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.9, 0.25, 1] }}
            className="overflow-hidden mb-5"
          >
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">{t('volumeChart.days')}:</label>
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={handleCustomDaysChange}
                className="w-16 h-8 rounded-xl border border-border/30 bg-secondary/40 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {chartData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-20 h-20 rounded-full border-2 border-border/30 flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">{t('volumeChart.empty')}</p>
        </motion.div>
      ) : (
        <div className="relative flex flex-col md:flex-row md:items-start gap-6">
          {/* Donut with 3D effect */}
          <div className="relative mx-auto md:mx-0 w-52 h-52 flex-shrink-0">
            {/* 3D shadow */}
            <div
              className="absolute inset-4 rounded-full pointer-events-none"
              style={{
                background: 'var(--donut-shadow)',
                transform: 'translateY(10px) scaleY(0.25)',
                filter: 'blur(8px)',
              }}
            />
            {/* 3D perspective wrapper */}
            <div
              className="relative w-full h-full"
              style={{
                perspective: '900px',
                willChange: 'transform',
              }}
            >
              <div
                style={{
                  transform: 'rotateX(15deg) translateZ(0)',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                }}
              >
                <ResponsiveContainer width="100%" height={DONUT_SIZE}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={2.5}
                      label={false}
                      animationBegin={0}
                      animationDuration={reduced ? 0 : 600}
                      animationEasing="ease-out"
                      isAnimationActive={!reduced}
                      strokeWidth={0}
                      onMouseEnter={handlePieEnter}
                      onMouseLeave={handlePieLeave}
                      onClick={handlePieClick}
                    >
                      {chartData.map((d, i) => (
                        <Cell
                          key={d.id}
                          fill={d.color}
                          stroke="transparent"
                          aria-label={`${d.name}: ${d.percent}%`}
                          className="cursor-pointer"
                          tabIndex={0}
                          onKeyDown={(e: any) => { if (e.key === 'Enter') handlePieClick(null, i); }}
                          style={{
                            filter: highlightIndex === i
                              ? `drop-shadow(0 0 10px ${d.color})`
                              : 'none',
                            opacity: highlightIndex !== null && highlightIndex !== i ? 0.45 : 1,
                            transform: highlightIndex === i ? 'scale(1.04)' : 'scale(1)',
                            transformOrigin: 'center',
                            transition: 'filter 0.3s, opacity 0.3s, transform 0.3s',
                          }}
                        />
                      ))}
                    </Pie>
                    {/* No Recharts Tooltip — using external */}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Center label — always visible, z-index below external tooltip but above chart */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10" style={{ marginTop: '-6px' }}>
              <AnimatedCounter value={totalSets} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-medium mt-0.5" style={{ color: 'var(--chart-subtitle)' }}>
                sets
              </span>
              <span className="text-[9px] mt-0.5 truncate max-w-[90px] text-center" style={{ color: 'var(--legend-muted)' }}>
                {filterLabel}
              </span>
            </div>

            {/* External tooltip — positioned outside donut, z-index above center */}
            <AnimatePresence>
              {visibleIndex !== null && tooltipPos && chartData[visibleIndex] && (
                <ExternalTooltip
                  key={visibleIndex}
                  data={chartData[visibleIndex]}
                  position={tooltipPos}
                  isPinned={pinnedIndex !== null}
                  onConsultar={handleConsultar}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="flex-1 max-h-56 overflow-y-auto scrollbar-hide space-y-1 pr-1" role="list" aria-label="Muscle volume distribution">
            <AnimatePresence mode="popLayout">
              {chartData.map((d, i) => (
                <LegendItem
                  key={d.id}
                  item={d}
                  isActive={highlightIndex === i}
                  onHover={handleLegendHover(i)}
                  onLeave={handleLegendLeave}
                  onClick={handleLegendClick(i)}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};
