import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ChartPointData } from '@/lib/performanceEngine';

interface PremiumTrendChartProps {
  chartData: (ChartPointData & { trend?: number; isInflection?: boolean })[];
  baseline?: number;
  latestPct: number;
}

const CHART_H = 140;
const CHART_W_RATIO = 1; // will use 100% width
const PAD = { top: 16, right: 12, bottom: 24, left: 36 };

function getTrendLabel(pct: number): { text: string; color: string } {
  if (pct > 0.05) return { text: 'Tendencia ascendente fuerte', color: 'hsl(152, 60%, 54%)' };
  if (pct > 0.01) return { text: 'Tendencia ascendente', color: 'hsl(152, 60%, 54%)' };
  if (pct < -0.05) return { text: 'Caída acelerada', color: 'hsl(0, 72%, 62%)' };
  if (pct < -0.01) return { text: 'Tendencia descendente', color: 'hsl(0, 72%, 62%)' };
  return { text: 'Estabilidad reciente', color: 'hsl(var(--muted-foreground))' };
}

export const PremiumTrendChart = ({ chartData, baseline, latestPct }: PremiumTrendChartProps) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [svgWidth, setSvgWidth] = useState(340);

  const svgRef = useCallback((node: SVGSVGElement | null) => {
    if (!node) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setSvgWidth(e.contentRect.width);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const W = svgWidth;
  const plotW = W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const { yMin, yMax, xScale, yScale, mainPath, areaPath, trendPath, baselineY, yTicks } = useMemo(() => {
    if (chartData.length < 2) return { yMin: 0, yMax: 100, xScale: () => 0, yScale: () => 0, mainPath: '', areaPath: '', trendPath: '', baselineY: 0, yTicks: [] };

    const vals = chartData.map(d => d.est_1rm_set);
    const trendVals = chartData.filter(d => d.trend != null).map(d => d.trend!);
    const allVals = [...vals, ...(baseline ? [baseline] : []), ...trendVals];
    const rawMin = Math.min(...allVals);
    const rawMax = Math.max(...allVals);
    const range = rawMax - rawMin || 10;
    const padY = range * 0.15;
    const yMin = rawMin - padY;
    const yMax = rawMax + padY;

    const xScale = (i: number) => PAD.left + (i / (chartData.length - 1)) * plotW;
    const yScale = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

    // Main line path
    const pts = chartData.map((d, i) => ({ x: xScale(i), y: yScale(d.est_1rm_set) }));
    const mainPath = pts.map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const cpx1 = prev.x + (p.x - prev.x) * 0.4;
      const cpx2 = prev.x + (p.x - prev.x) * 0.6;
      return `C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
    }).join(' ');

    // Area path (for gradient fill under main line)
    const bottomY = PAD.top + plotH;
    const areaPath = mainPath + ` L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`;

    // Trend line path
    let trendPath = '';
    if (chartData.some(d => d.trend != null)) {
      const tPts = chartData.map((d, i) => ({ x: xScale(i), y: yScale(d.trend ?? d.est_1rm_set) }));
      trendPath = tPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }

    const baselineY = baseline ? yScale(baseline) : 0;

    // Y-axis ticks (3 values)
    const tickCount = 3;
    const yTicks = Array.from({ length: tickCount }, (_, i) => {
      const v = yMin + ((yMax - yMin) / (tickCount - 1)) * i;
      return { value: Math.round(v), y: yScale(v) };
    });

    return { yMin, yMax, xScale, yScale, mainPath, areaPath, trendPath, baselineY, yTicks };
  }, [chartData, baseline, plotW, plotH]);

  const trendInfo = getTrendLabel(latestPct);

  const activePoint = activeIdx != null ? chartData[activeIdx] : null;
  const activeCx = activeIdx != null ? xScale(activeIdx) : 0;
  const activeCy = activeIdx != null ? yScale(chartData[activeIdx].est_1rm_set) : 0;

  const handleInteraction = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const x = clientX - rect.left;
    const relX = (x - PAD.left) / plotW;
    const idx = Math.round(relX * (chartData.length - 1));
    if (idx >= 0 && idx < chartData.length) {
      setActiveIdx(idx);
    }
  }, [chartData.length, plotW]);

  if (chartData.length < 2) return null;

  const gradientId = 'premium-area-grad';
  const glowId = 'premium-line-glow';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, hsl(var(--muted) / 0.15) 0%, hsl(var(--background) / 0.4) 100%)',
        border: '1px solid hsl(var(--border) / 0.3)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 80%, hsl(var(--primary) / 0.12) 0%, transparent 70%)`,
        }}
      />

      {/* Insight label */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 relative z-10">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: trendInfo.color }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-[10px] font-medium tracking-wide uppercase" style={{ color: trendInfo.color }}>
            {trendInfo.text}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/40 font-mono tracking-wider">
          1RM est.
        </span>
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        width="100%"
        height={CHART_H}
        className="relative z-10 touch-none"
        onMouseMove={handleInteraction}
        onTouchMove={handleInteraction}
        onMouseLeave={() => setActiveIdx(null)}
        onTouchEnd={() => setActiveIdx(null)}
      >
        <defs>
          {/* Area gradient */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>

          {/* Line glow filter */}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Horizontal grid — 3 ultra-subtle lines */}
        {yTicks.map((t, i) => (
          <motion.line
            key={i}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={t.y}
            y2={t.y}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.06}
            strokeWidth={0.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <motion.text
            key={`yl-${i}`}
            x={PAD.left - 6}
            y={t.y + 3}
            textAnchor="end"
            fill="hsl(var(--muted-foreground))"
            fillOpacity={0.3}
            fontSize={8}
            fontFamily="monospace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
          >
            {t.value}
          </motion.text>
        ))}

        {/* X-axis labels */}
        {chartData.map((d, i) => {
          // Show first, last, and middle labels only to avoid clutter
          const show = i === 0 || i === chartData.length - 1 || (chartData.length > 4 && i === Math.floor(chartData.length / 2));
          if (!show) return null;
          return (
            <motion.text
              key={`xl-${i}`}
              x={xScale(i)}
              y={PAD.top + plotH + 16}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.3}
              fontSize={8}
              fontFamily="monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {format(new Date(d.date), 'dd/MM', { locale: es })}
            </motion.text>
          );
        })}

        {/* Baseline */}
        {baseline && baseline > 0 && (
          <motion.line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={baselineY}
            y2={baselineY}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.12}
            strokeWidth={0.5}
            strokeDasharray="3 8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        )}

        {/* Trend line */}
        {trendPath && (
          <motion.path
            d={trendPath}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={0.8}
            strokeOpacity={0.1}
            strokeDasharray="4 8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
          />
        )}

        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        />

        {/* Main line — glow layer */}
        <motion.path
          d={mainPath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
          opacity={0.4}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Main line — crisp */}
        <motion.path
          d={mainPath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Data points */}
        {chartData.map((d, i) => {
          const cx = xScale(i);
          const cy = yScale(d.est_1rm_set);
          const isActive = activeIdx === i;
          const isLast = i === chartData.length - 1;
          const color = d.color || 'hsl(var(--primary))';

          return (
            <motion.g key={i}>
              {/* Outer ring for last point */}
              {isLast && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill="none"
                  stroke={color}
                  strokeWidth={0.8}
                  strokeOpacity={0.3}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.6 }}
                />
              )}
              {/* Dot */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={isActive ? 4 : isLast ? 3 : 2}
                fill={isActive || isLast ? color : 'hsl(var(--background))'}
                stroke={color}
                strokeWidth={isActive ? 2 : 1.2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.8 + i * 0.08, type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              />
            </motion.g>
          );
        })}

        {/* Active point crosshair + tooltip */}
        <AnimatePresence>
          {activeIdx != null && activePoint && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Vertical line */}
              <line
                x1={activeCx}
                x2={activeCx}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="hsl(var(--primary))"
                strokeOpacity={0.15}
                strokeWidth={0.5}
              />
              {/* Pulse ring */}
              <motion.circle
                cx={activeCx}
                cy={activeCy}
                r={8}
                fill="hsl(var(--primary))"
                fillOpacity={0.08}
                animate={{ r: [6, 10, 6], opacity: [0.1, 0.05, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Floating tooltip */}
      <AnimatePresence>
        {activeIdx != null && activePoint && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-20 pointer-events-none"
            style={{
              left: Math.min(Math.max(activeCx - 72, 8), svgWidth - 152),
              top: 8,
            }}
          >
            <div
              className="rounded-xl px-3 py-2 backdrop-blur-xl"
              style={{
                background: 'hsl(var(--foreground) / 0.92)',
                border: '1px solid hsl(var(--primary) / 0.15)',
              }}
            >
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-bold" style={{ color: 'hsl(var(--background))' }}>
                  {activePoint.est_1rm_set.toFixed(1)}
                </span>
                <span className="text-[9px] font-medium" style={{ color: 'hsl(var(--background) / 0.5)' }}>kg</span>
                {activePoint.pct_change != null && (
                  <span
                    className="text-[10px] font-semibold ml-auto"
                    style={{ color: activePoint.color || 'hsl(var(--primary))' }}
                  >
                    {activePoint.pct_change > 0 ? '+' : ''}{(activePoint.pct_change * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px]" style={{ color: 'hsl(var(--background) / 0.4)' }}>
                  {format(new Date(activePoint.date), 'dd MMM', { locale: es })}
                </span>
                <span className="text-[9px]" style={{ color: 'hsl(var(--background) / 0.3)' }}>·</span>
                <span className="text-[9px]" style={{ color: 'hsl(var(--background) / 0.4)' }}>
                  {activePoint.best_weight}kg × {activePoint.best_reps}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal inline legend */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-0 relative z-10">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-[1.5px] rounded-full bg-primary" />
          <span className="text-[8px] text-muted-foreground/30 font-medium tracking-widest uppercase">1RM</span>
        </span>
        {baseline && baseline > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[0.5px] bg-muted-foreground/20" style={{ borderTop: '1px dashed hsl(var(--muted-foreground) / 0.2)' }} />
            <span className="text-[8px] text-muted-foreground/20 font-medium tracking-widest uppercase">Base</span>
          </span>
        )}
      </div>
    </motion.div>
  );
};
