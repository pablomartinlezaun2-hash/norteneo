import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Dumbbell, Search, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVolumeData } from '@/hooks/useVolumeData';

/* ── Types ── */
interface ChartItem {
  id: string;
  name: string;
  color: string;
  sets: number;
  percent: number;
  value: number;
}

/* ── Neon palette — assigned by index ── */
const PALETTE = [
  { color: 'hsl(185 100% 45%)', darkColor: 'hsl(185 100% 50%)' },
  { color: 'hsl(320 100% 55%)', darkColor: 'hsl(320 100% 58%)' },
  { color: 'hsl(200 100% 55%)', darkColor: 'hsl(200 100% 60%)' },
  { color: 'hsl(100 90% 55%)', darkColor: 'hsl(100 90% 60%)' },
  { color: 'hsl(265 100% 65%)', darkColor: 'hsl(265 100% 70%)' },
  { color: 'hsl(35 100% 55%)', darkColor: 'hsl(35 100% 60%)' },
  { color: 'hsl(210 100% 60%)', darkColor: 'hsl(210 100% 65%)' },
  { color: 'hsl(330 90% 55%)', darkColor: 'hsl(330 90% 60%)' },
  { color: 'hsl(50 90% 50%)', darkColor: 'hsl(50 90% 55%)' },
  { color: 'hsl(280 80% 60%)', darkColor: 'hsl(280 80% 65%)' },
  { color: 'hsl(170 80% 45%)', darkColor: 'hsl(170 80% 55%)' },
  { color: 'hsl(15 90% 55%)', darkColor: 'hsl(15 90% 60%)' },
  { color: 'hsl(190 100% 50%)', darkColor: 'hsl(190 100% 55%)' },
  { color: 'hsl(340 85% 55%)', darkColor: 'hsl(340 85% 58%)' },
  { color: 'hsl(95 85% 50%)', darkColor: 'hsl(95 85% 55%)' },
  { color: 'hsl(250 90% 65%)', darkColor: 'hsl(250 90% 70%)' },
  { color: 'hsl(160 80% 45%)', darkColor: 'hsl(160 80% 55%)' },
  { color: 'hsl(185 80% 50%)', darkColor: 'hsl(185 80% 55%)' },
];

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
  item: ChartItem;
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
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
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
const CX = DONUT_SIZE / 2;
const CY = DONUT_SIZE / 2;
const OUTER_R = DONUT_SIZE * 0.82 / 2;
const TOOLTIP_OFFSET = 18;

function computeTooltipPosition(
  chartData: { value: number }[],
  index: number
): { x: number; y: number; side: 'left' | 'right' | 'top' | 'bottom' } {
  const total = chartData.reduce((a, b) => a + b.value, 0);
  if (total === 0) return { x: CX, y: 0, side: 'top' };

  let startAngle = 90;
  for (let i = 0; i < index; i++) {
    startAngle -= (chartData[i].value / total) * 360;
  }
  const segAngle = (chartData[index].value / total) * 360;
  const midAngle = startAngle - segAngle / 2;

  const rad = (midAngle * Math.PI) / 180;
  const tipR = OUTER_R + TOOLTIP_OFFSET;
  const rawX = CX + tipR * Math.cos(rad);
  const rawY = CY - tipR * Math.sin(rad);

  const normAngle = ((midAngle % 360) + 360) % 360;
  let side: 'left' | 'right' | 'top' | 'bottom';
  if (normAngle >= 45 && normAngle < 135) side = 'top';
  else if (normAngle >= 135 && normAngle < 225) side = 'left';
  else if (normAngle >= 225 && normAngle < 315) side = 'bottom';
  else side = 'right';

  return { x: rawX, y: rawY, side };
}

/* ── External Tooltip — simple, no AnimatePresence key flicker ── */
const ExternalTooltip = memo(({
  data,
  position,
  onConsultar,
}: {
  data: ChartItem;
  position: { x: number; y: number; side: 'left' | 'right' | 'top' | 'bottom' };
  onConsultar: () => void;
}) => {
  let transform = '';
  switch (position.side) {
    case 'right': transform = 'translate(4px, -50%)'; break;
    case 'left': transform = 'translate(calc(-100% - 4px), -50%)'; break;
    case 'top': transform = 'translate(-50%, calc(-100% - 4px))'; break;
    case 'bottom': transform = 'translate(-50%, 4px)'; break;
  }

  return (
    <div
      className="absolute pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-150"
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
        {data.id !== '_others' && (
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
    </div>
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
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const reduced = prefersReducedMotion();

  const { getMuscleVolume, unmappedCount, loading: volumeLoading } = useVolumeData();

  // Close pinned tooltip on click outside or Escape
  useEffect(() => {
    if (pinnedIndex === null) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPinnedIndex(null);
        setHoverIndex(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinnedIndex(null);
        setHoverIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
      document.removeEventListener('keydown', handleKey);
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

  // Compute date range from filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (filter === 'last') {
      return { start: todayStr, end: todayStr, isLast: true };
    }
    const days = filter === 'custom' ? customDays : FILTER_DAYS[filter]!;
    const cutoff = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
    return { start: cutoff, end: todayStr, isLast: false };
  }, [filter, customDays]);

  const chartData = useMemo((): ChartItem[] => {
    const totals = getMuscleVolume(dateRange.start, dateRange.end);
    const totalSets = [...totals.values()].reduce((a, b) => a + b.sets, 0);
    if (totalSets === 0) return [];

    let colorIndex = 0;
    const all: ChartItem[] = [...totals.entries()]
      .map(([muscleId, data]) => {
        const p = PALETTE[colorIndex % PALETTE.length];
        colorIndex++;
        return {
          id: muscleId,
          name: data.name,
          color: isDark ? p.darkColor : p.color,
          sets: data.sets,
          percent: Math.round((data.sets / totalSets) * 1000) / 10,
          value: data.sets,
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
  }, [getMuscleVolume, dateRange, isDark]);

  const totalSets = useMemo(() => chartData.reduce((a, b) => a + b.sets, 0), [chartData]);

  // Active index: pinned takes priority over hover
  const visibleIndex = pinnedIndex !== null ? pinnedIndex : hoverIndex;
  const tooltipPos = useMemo(() => {
    if (visibleIndex === null || visibleIndex >= chartData.length) return null;
    return computeTooltipPosition(chartData, visibleIndex);
  }, [visibleIndex, chartData]);

  // Hover handlers (only when nothing pinned)
  const handlePieEnter = useCallback((_: any, index: number) => {
    if (pinnedIndex === null) setHoverIndex(index);
  }, [pinnedIndex]);

  const handlePieLeave = useCallback(() => {
    if (pinnedIndex === null) setHoverIndex(null);
  }, [pinnedIndex]);

  // Single click: pin tooltip immediately
  const handlePieClick = useCallback((_: any, index: number) => {
    if (pinnedIndex === index) {
      setPinnedIndex(null);
    } else {
      setPinnedIndex(index);
      setHoverIndex(index);
    }
  }, [pinnedIndex]);

  // "Consultar datos" navigates directly
  const handleConsultar = useCallback(() => {
    if (pinnedIndex !== null && chartData[pinnedIndex] && chartData[pinnedIndex].id !== '_others') {
      navigate(`/muscle/${chartData[pinnedIndex].id}`);
    }
  }, [pinnedIndex, chartData, navigate]);

  const handleFilterChange = useCallback((v: string) => {
    setFilter(v as TimeFilter);
    setPinnedIndex(null);
    setHoverIndex(null);
  }, []);

  const handleCustomDaysChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDays(Math.max(1, Number(e.target.value)));
  }, []);

  // Legend handlers — stable refs
  const handleLegendHover = useCallback((i: number) => {
    if (pinnedIndex === null) setHoverIndex(i);
  }, [pinnedIndex]);
  const handleLegendLeave = useCallback(() => {
    if (pinnedIndex === null) setHoverIndex(null);
  }, [pinnedIndex]);
  const handleLegendClick = useCallback((i: number) => {
    const item = chartData[i];
    if (!item) return;
    // If it's a real muscle, navigate directly
    if (item.id !== '_others') {
      navigate(`/muscle/${item.id}`);
    }
  }, [chartData, navigate]);

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

  const highlightIndex = pinnedIndex !== null ? pinnedIndex : hoverIndex;

  return (
    <div
      ref={containerRef}
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

      {/* Unmapped exercises warning */}
      {unmappedCount > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            {unmappedCount} ejercicio{unmappedCount > 1 ? 's' : ''} sin mapeo de músculo
          </p>
        </div>
      )}

      {/* Loading state */}
      {volumeLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground mt-3">Cargando datos...</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full border-2 border-border/30 flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">{t('volumeChart.empty')}</p>
        </div>
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
              style={{ perspective: '900px' }}
            >
              <div
                style={{
                  transform: 'rotateX(15deg) translateZ(0)',
                  transformStyle: 'preserve-3d',
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
                          className="cursor-pointer outline-none"
                          tabIndex={0}
                          onKeyDown={(e: any) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handlePieClick(null, i);
                            }
                            if (e.key === 'Escape') setPinnedIndex(null);
                          }}
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Center label — always visible */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10" style={{ marginTop: '-6px' }}>
              <AnimatedCounter value={totalSets} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-medium mt-0.5" style={{ color: 'var(--chart-subtitle)' }}>
                sets
              </span>
              <span className="text-[9px] mt-0.5 truncate max-w-[90px] text-center" style={{ color: 'var(--legend-muted)' }}>
                {filterLabel}
              </span>
            </div>

            {/* External tooltip — NO AnimatePresence to avoid flicker */}
            {visibleIndex !== null && tooltipPos && chartData[visibleIndex] && (
              <ExternalTooltip
                data={chartData[visibleIndex]}
                position={tooltipPos}
                onConsultar={handleConsultar}
              />
            )}
          </div>

          {/* Legend */}
          <div className="flex-1 max-h-56 overflow-y-auto scrollbar-hide space-y-1 pr-1" role="list" aria-label="Muscle volume distribution">
            <AnimatePresence mode="popLayout">
              {chartData.map((d, i) => (
                <LegendItem
                  key={d.id}
                  item={d}
                  isActive={highlightIndex === i}
                  onHover={() => handleLegendHover(i)}
                  onLeave={handleLegendLeave}
                  onClick={() => handleLegendClick(i)}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
