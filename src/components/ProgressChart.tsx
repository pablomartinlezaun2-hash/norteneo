import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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

/* ── Refined muscle palette — muted, sophisticated tones ── */
const MUSCLES: MuscleData[] = [
  { id: 'pectoral', name: 'Pectoral', color: 'hsl(0 55% 55%)', darkColor: 'hsl(0 50% 60%)' },
  { id: 'deltAnterior', name: 'Deltoide Anterior', color: 'hsl(20 60% 52%)', darkColor: 'hsl(20 55% 58%)' },
  { id: 'deltMedial', name: 'Deltoide Medial', color: 'hsl(36 65% 50%)', darkColor: 'hsl(36 55% 56%)' },
  { id: 'deltPosterior', name: 'Deltoide Posterior', color: 'hsl(48 60% 48%)', darkColor: 'hsl(48 50% 55%)' },
  { id: 'dorsal', name: 'Dorsal', color: 'hsl(160 45% 42%)', darkColor: 'hsl(160 40% 50%)' },
  { id: 'upperBack', name: 'Espalda Alta', color: 'hsl(172 45% 45%)', darkColor: 'hsl(172 40% 52%)' },
  { id: 'lumbar', name: 'Lumbar', color: 'hsl(187 50% 44%)', darkColor: 'hsl(187 45% 52%)' },
  { id: 'erectors', name: 'Erectores', color: 'hsl(199 60% 45%)', darkColor: 'hsl(199 55% 54%)' },
  { id: 'quads', name: 'Cuádriceps', color: 'hsl(217 55% 52%)', darkColor: 'hsl(217 50% 60%)' },
  { id: 'hamstrings', name: 'Isquios', color: 'hsl(239 45% 55%)', darkColor: 'hsl(239 40% 62%)' },
  { id: 'abductor', name: 'Abductor', color: 'hsl(259 42% 54%)', darkColor: 'hsl(259 38% 60%)' },
  { id: 'adductor', name: 'Aductor', color: 'hsl(280 38% 52%)', darkColor: 'hsl(280 34% 58%)' },
  { id: 'calves', name: 'Gemelos', color: 'hsl(300 35% 50%)', darkColor: 'hsl(300 30% 56%)' },
  { id: 'tibialis', name: 'Tibial', color: 'hsl(320 42% 50%)', darkColor: 'hsl(320 38% 56%)' },
  { id: 'abs', name: 'Recto abdominal', color: 'hsl(340 45% 50%)', darkColor: 'hsl(340 40% 56%)' },
  { id: 'obliques', name: 'Oblicuos', color: 'hsl(350 48% 48%)', darkColor: 'hsl(350 42% 55%)' },
  { id: 'biceps', name: 'Bíceps', color: 'hsl(142 45% 42%)', darkColor: 'hsl(142 40% 50%)' },
  { id: 'triceps', name: 'Tríceps', color: 'hsl(162 45% 40%)', darkColor: 'hsl(162 40% 48%)' },
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

/* ── Custom Tooltip ── */
const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, sets, percent } = payload[0].payload;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl px-4 py-3 shadow-2xl"
    >
      <p className="font-semibold text-foreground text-sm">{name}</p>
      <p className="text-muted-foreground text-xs mt-0.5">{sets} sets · {percent}%</p>
    </motion.div>
  );
};

/* ── Animated number ── */
const AnimatedNumber = ({ value }: { value: number }) => {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="text-3xl font-bold text-foreground tracking-tight"
    >
      {value}
    </motion.span>
  );
};

/* ── Component ── */
interface ProgressChartProps {
  totalCompleted?: number;
  cyclesCompleted?: number;
  progressInCycle?: number;
}

export const ProgressChart = (_props: ProgressChartProps) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TimeFilter>('2w');
  const [customDays, setCustomDays] = useState(7);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const filterOptions: { value: TimeFilter; label: string }[] = [
    { value: 'last', label: t('volumeChart.lastWorkout') },
    { value: '2d', label: t('volumeChart.last2Days') },
    { value: '5d', label: t('volumeChart.last5Days') },
    { value: '2w', label: t('volumeChart.last2Weeks') },
    { value: '1m', label: t('volumeChart.lastMonth') },
    { value: 'custom', label: t('volumeChart.custom') },
  ];

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

    return MUSCLES
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
  }, [filter, customDays, isDark]);

  const totalSets = chartData.reduce((a, b) => a + b.sets, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl p-5 overflow-hidden"
      style={{
        boxShadow: isDark
          ? '0 4px 40px -8px hsl(0 0% 0% / 0.5), inset 0 1px 0 0 hsl(0 0% 100% / 0.04)'
          : '0 4px 30px -6px hsl(0 0% 0% / 0.08), inset 0 1px 0 0 hsl(0 0% 100% / 0.7)',
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-br from-primary/[0.02] to-transparent" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {t('volumeChart.title')}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Distribución por grupo muscular</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as TimeFilter)}>
          <SelectTrigger className="w-[150px] h-8 text-xs rounded-xl bg-muted/40 border-border/30 backdrop-blur-sm hover:bg-muted/60 transition-colors">
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
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mb-5"
          >
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">{t('volumeChart.days')}:</label>
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={e => setCustomDays(Math.max(1, Number(e.target.value)))}
                className="w-16 h-8 rounded-xl border border-border/30 bg-muted/30 text-center text-xs text-foreground backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
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
          {/* Donut with 3D perspective */}
          <div className="relative mx-auto md:mx-0 w-52 h-52 flex-shrink-0">
            {/* 3D shadow underneath */}
            <div
              className="absolute inset-4 rounded-full pointer-events-none"
              style={{
                background: isDark
                  ? 'radial-gradient(ellipse at 50% 100%, hsl(0 0% 0% / 0.4), transparent 70%)'
                  : 'radial-gradient(ellipse at 50% 100%, hsl(0 0% 0% / 0.06), transparent 70%)',
                transform: 'translateY(8px) scaleY(0.3)',
                filter: 'blur(6px)',
              }}
            />
            {/* 3D perspective wrapper */}
            <motion.div
              className="relative w-full h-full"
              style={{
                perspective: '600px',
              }}
              initial={{ rotateX: 0 }}
              animate={{ rotateX: 8 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateX: 8 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <ResponsiveContainer width="100%" height={208}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={3}
                      label={false}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      strokeWidth={0}
                      onMouseEnter={(_, i) => setHoveredId(chartData[i]?.id || null)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {chartData.map(d => (
                        <Cell
                          key={d.id}
                          fill={d.color}
                          stroke="transparent"
                          style={{
                            filter: hoveredId === d.id
                              ? `drop-shadow(0 0 8px ${d.color})`
                              : 'none',
                            opacity: hoveredId && hoveredId !== d.id ? 0.5 : 1,
                            transition: 'all 0.3s ease',
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </motion.div>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-4px' }}>
              <AnimatedNumber value={totalSets} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium mt-0.5">
                sets
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 max-h-56 overflow-y-auto scrollbar-hide space-y-1.5 pr-1">
            <AnimatePresence mode="popLayout">
              {chartData.map((d, i) => (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.035, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setHoveredId(d.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 cursor-default"
                  style={{
                    background: hoveredId === d.id
                      ? isDark ? 'hsl(0 0% 100% / 0.04)' : 'hsl(0 0% 0% / 0.03)'
                      : 'transparent',
                    transform: hoveredId === d.id ? 'translateY(-1px)' : 'translateY(0)',
                    boxShadow: hoveredId === d.id
                      ? isDark
                        ? '0 4px 16px -4px hsl(0 0% 0% / 0.3)'
                        : '0 4px 16px -4px hsl(0 0% 0% / 0.06)'
                      : 'none',
                  }}
                >
                  {/* Color indicator */}
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: d.color,
                      boxShadow: hoveredId === d.id ? `0 0 10px ${d.color}` : 'none',
                    }}
                  />
                  {/* Name */}
                  <span className="text-xs text-foreground/80 flex-1 truncate group-hover:text-foreground transition-colors duration-200">
                    {d.name}
                  </span>
                  {/* Sets count */}
                  <span className="text-[10px] text-muted-foreground/70 font-medium tabular-nums">
                    {d.sets}
                  </span>
                  {/* Percentage */}
                  <motion.span
                    key={`${d.id}-${d.percent}`}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-semibold text-foreground/90 w-12 text-right tabular-nums tracking-tight"
                  >
                    {d.percent}%
                  </motion.span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};
