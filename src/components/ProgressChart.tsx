import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Dumbbell, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ── Types ── */
interface MuscleData {
  id: string;
  name: string;
  color: string;
}

interface WorkoutSet {
  date: string;
  muscleId: string;
  sets: number;
}

/* ── Muscle palette ── */
const MUSCLES: MuscleData[] = [
  { id: 'pectoral', name: 'Pectoral', color: 'hsl(0 84% 60%)' },
  { id: 'deltAnterior', name: 'Deltoide Anterior', color: 'hsl(20 90% 56%)' },
  { id: 'deltMedial', name: 'Deltoide Medial', color: 'hsl(36 96% 55%)' },
  { id: 'deltPosterior', name: 'Deltoide Posterior', color: 'hsl(48 96% 53%)' },
  { id: 'dorsal', name: 'Dorsal', color: 'hsl(160 64% 43%)' },
  { id: 'upperBack', name: 'Espalda Alta', color: 'hsl(172 66% 50%)' },
  { id: 'lumbar', name: 'Lumbar', color: 'hsl(187 72% 48%)' },
  { id: 'erectors', name: 'Erectores', color: 'hsl(199 89% 48%)' },
  { id: 'quads', name: 'Cuádriceps', color: 'hsl(217 91% 60%)' },
  { id: 'hamstrings', name: 'Isquios', color: 'hsl(239 84% 67%)' },
  { id: 'abductor', name: 'Abductor', color: 'hsl(259 80% 64%)' },
  { id: 'adductor', name: 'Aductor', color: 'hsl(280 68% 60%)' },
  { id: 'calves', name: 'Gemelos', color: 'hsl(300 64% 58%)' },
  { id: 'tibialis', name: 'Tibial', color: 'hsl(320 72% 55%)' },
  { id: 'abs', name: 'Recto abdominal', color: 'hsl(340 75% 55%)' },
  { id: 'obliques', name: 'Oblicuos', color: 'hsl(350 80% 52%)' },
  { id: 'biceps', name: 'Bíceps', color: 'hsl(142 71% 45%)' },
  { id: 'triceps', name: 'Tríceps', color: 'hsl(162 73% 42%)' },
];

/* ── Mock data (~100 sets across 14 days) ── */
const generateMockData = (): WorkoutSet[] => {
  const now = new Date();
  const sets: WorkoutSet[] = [];
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  // Today (last workout) — 10 sets in 3 muscles
  const today = fmt(now);
  sets.push({ date: today, muscleId: 'dorsal', sets: 3 });
  sets.push({ date: today, muscleId: 'upperBack', sets: 3 });
  sets.push({ date: today, muscleId: 'biceps', sets: 4 });

  // Yesterday
  const d1 = fmt(new Date(now.getTime() - 86400000));
  sets.push({ date: d1, muscleId: 'pectoral', sets: 4 });
  sets.push({ date: d1, muscleId: 'deltAnterior', sets: 3 });
  sets.push({ date: d1, muscleId: 'triceps', sets: 4 });

  // 3 days ago
  const d3 = fmt(new Date(now.getTime() - 3 * 86400000));
  sets.push({ date: d3, muscleId: 'quads', sets: 5 });
  sets.push({ date: d3, muscleId: 'hamstrings', sets: 4 });
  sets.push({ date: d3, muscleId: 'calves', sets: 3 });
  sets.push({ date: d3, muscleId: 'abs', sets: 3 });

  // 5 days ago
  const d5 = fmt(new Date(now.getTime() - 5 * 86400000));
  sets.push({ date: d5, muscleId: 'dorsal', sets: 4 });
  sets.push({ date: d5, muscleId: 'erectors', sets: 3 });
  sets.push({ date: d5, muscleId: 'biceps', sets: 3 });

  // 7 days ago
  const d7 = fmt(new Date(now.getTime() - 7 * 86400000));
  sets.push({ date: d7, muscleId: 'pectoral', sets: 4 });
  sets.push({ date: d7, muscleId: 'deltMedial', sets: 3 });
  sets.push({ date: d7, muscleId: 'deltPosterior', sets: 3 });
  sets.push({ date: d7, muscleId: 'triceps', sets: 4 });

  // 10 days ago
  const d10 = fmt(new Date(now.getTime() - 10 * 86400000));
  sets.push({ date: d10, muscleId: 'quads', sets: 5 });
  sets.push({ date: d10, muscleId: 'hamstrings', sets: 4 });
  sets.push({ date: d10, muscleId: 'abductor', sets: 3 });
  sets.push({ date: d10, muscleId: 'adductor', sets: 3 });
  sets.push({ date: d10, muscleId: 'calves', sets: 3 });

  // 12 days ago
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
    <div className="bg-popover border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-muted-foreground">{sets} sets · {percent}%</p>
    </div>
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
      // Find latest date
      const dates = [...new Set(MOCK_DATA.map(s => s.date))].sort().reverse();
      const lastDate = dates[0] || todayStr;
      filtered = MOCK_DATA.filter(s => s.date === lastDate);
    } else {
      const days = filter === 'custom' ? customDays : FILTER_DAYS[filter]!;
      const cutoff = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
      filtered = MOCK_DATA.filter(s => s.date >= cutoff);
    }

    // Sum by muscle
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
          color: m.color,
          sets,
          percent: Math.round((sets / totalSets) * 1000) / 10,
          value: sets,
        };
      })
      .sort((a, b) => b.sets - a.sets);
  }, [filter, customDays]);

  const totalSets = chartData.reduce((a, b) => a + b.sets, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-card rounded-2xl border border-border p-4 apple-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">{t('volumeChart.title')}</h3>
        <Select value={filter} onValueChange={(v) => setFilter(v as TimeFilter)}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-muted/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-[999]">
            {filterOptions.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
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
            className="overflow-hidden mb-4"
          >
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">{t('volumeChart.days')}:</label>
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={e => setCustomDays(Math.max(1, Number(e.target.value)))}
                className="w-16 h-7 rounded-md border border-border bg-muted/50 text-center text-xs text-foreground"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 rounded-full border-4 border-muted mb-4" />
          <Dumbbell className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('volumeChart.empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Donut */}
          <div className="relative mx-auto md:mx-0 w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={2}
                  label={false}
                  animationBegin={0}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  {chartData.map(d => (
                    <Cell key={d.id} fill={d.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-foreground">{totalSets}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">sets</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 max-h-52 overflow-y-auto scrollbar-hide space-y-1">
            {chartData.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-foreground flex-1 truncate">{d.name}</span>
                <span className="text-[10px] text-muted-foreground">{d.sets} sets</span>
                <span className="text-xs font-semibold text-foreground w-10 text-right">{d.percent}%</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
