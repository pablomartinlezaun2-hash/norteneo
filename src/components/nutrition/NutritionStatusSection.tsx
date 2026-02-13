import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, Download, Settings, Flame, Trophy, Target, Zap, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NutritionGoals } from '@/hooks/useNutritionData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DayStatus {
  date: string;
  caloriesTarget: number;
  caloriesConsumed: number;
  proteinTarget: number;
  proteinConsumed: number;
  carbsTarget: number;
  carbsConsumed: number;
  fatTarget: number;
  fatConsumed: number;
  accuracyProtein: number;
  accuracyCarbs: number;
  accuracyFat: number;
  accuracyCalories: number;
  accuracyGlobal: number;
  hasData: boolean;
}

const calcAccuracy = (consumed: number, target: number): number => {
  if (target === 0) return consumed === 0 ? 1 : 0;
  return Math.max(0, 1 - Math.abs(consumed - target) / target);
};

const getAccuracyColor = (pct: number): string => {
  if (pct >= 90) return 'hsl(var(--success))';
  if (pct >= 80) return 'hsl(38 92% 50%)';
  return 'hsl(var(--destructive))';
};

const getMotivationalMessage = (pct: number): { text: string; icon: typeof Flame } | null => {
  if (pct >= 95) return { text: '¡Increíble! Estás construyendo el físico de tus sueños 💪', icon: Trophy };
  if (pct >= 90) return { text: '¡Excelente precisión! Sigue así, campeón', icon: Star };
  if (pct >= 85) return { text: '¡Casi perfecto! Un poco más y llegas al 90%', icon: Zap };
  if (pct >= 80) return { text: '¡Vas muy bien! Venga, acércate al 90%', icon: Flame };
  if (pct >= 70) return { text: 'Buen progreso, ajusta un poco más tus macros', icon: Target };
  return null;
};

interface NutritionStatusSectionProps {
  goals: NutritionGoals | null;
  onNavigateToGoals: () => void;
  onNavigateToDay: (date: Date) => void;
  refreshTrigger?: number;
}

export const NutritionStatusSection = ({ goals, onNavigateToGoals, onNavigateToDay, refreshTrigger = 0 }: NutritionStatusSectionProps) => {
  const { user } = useAuth();
  const [dayLogs, setDayLogs] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyDays, setHistoryDays] = useState(7);

  const defaultGoals = { daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 70 };
  const g = goals || defaultGoals;

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setLoading(true);
      const days = showHistory ? historyDays : 1;
      const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('food_logs')
        .select('logged_date, calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .gte('logged_date', startDate)
        .lte('logged_date', endDate);

      if (error) { console.error('Error fetching nutrition history:', error); setLoading(false); return; }

      const byDay: Record<string, DayData> = {};
      (data || []).forEach((row: any) => {
        const d = row.logged_date;
        if (!byDay[d]) byDay[d] = { date: d, calories: 0, protein: 0, carbs: 0, fat: 0 };
        byDay[d].calories += Number(row.calories) || 0;
        byDay[d].protein += Number(row.protein) || 0;
        byDay[d].carbs += Number(row.carbs) || 0;
        byDay[d].fat += Number(row.fat) || 0;
      });
      setDayLogs(Object.values(byDay));
      setLoading(false);
    };
    fetchHistory();
  }, [user, showHistory, historyDays, refreshTrigger]);

  const buildDayStatus = (date: string): DayStatus => {
    const log = dayLogs.find(d => d.date === date);
    const hasData = !!log && (log.calories > 0 || log.protein > 0 || log.carbs > 0 || log.fat > 0);
    const consumed = log || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const accP = calcAccuracy(consumed.protein, g.daily_protein);
    const accC = calcAccuracy(consumed.carbs, g.daily_carbs);
    const accF = calcAccuracy(consumed.fat, g.daily_fat);
    const accK = calcAccuracy(consumed.calories, g.daily_calories);
    return {
      date, hasData,
      caloriesTarget: g.daily_calories, caloriesConsumed: Math.round(consumed.calories),
      proteinTarget: g.daily_protein, proteinConsumed: Math.round(consumed.protein * 10) / 10,
      carbsTarget: g.daily_carbs, carbsConsumed: Math.round(consumed.carbs * 10) / 10,
      fatTarget: g.daily_fat, fatConsumed: Math.round(consumed.fat * 10) / 10,
      accuracyProtein: accP * 100, accuracyCarbs: accC * 100, accuracyFat: accF * 100,
      accuracyCalories: accK * 100, accuracyGlobal: (accP + accC + accF + accK) / 4 * 100,
    };
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayStatus = useMemo(() => buildDayStatus(today), [dayLogs, g]);

  const historyStatuses = useMemo(() => {
    if (!showHistory) return [];
    const result: DayStatus[] = [];
    for (let i = historyDays - 1; i >= 1; i--) {
      result.push(buildDayStatus(format(subDays(new Date(), i), 'yyyy-MM-dd')));
    }
    return result;
  }, [dayLogs, showHistory, historyDays, g]);

  const exportCSV = () => {
    const allDays = [...historyStatuses, todayStatus];
    const headers = 'Fecha,Cal Obj,Cal Cons,Prot Obj,Prot Cons,%Prot,Carbs Obj,Carbs Cons,%Carbs,Grasa Obj,Grasa Cons,%Grasa,%Global\n';
    const rows = allDays.map(d =>
      `${d.date},${d.caloriesTarget},${d.caloriesConsumed},${d.proteinTarget},${d.proteinConsumed},${d.accuracyProtein.toFixed(1)},${d.carbsTarget},${d.carbsConsumed},${d.accuracyCarbs.toFixed(1)},${d.fatTarget},${d.fatConsumed},${d.accuracyFat.toFixed(1)},${d.accuracyGlobal.toFixed(1)}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nutricion_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const motivation = todayStatus.hasData ? getMotivationalMessage(todayStatus.accuracyGlobal) : null;

  return (
    <div className="space-y-4 p-4">
      {/* Today's accuracy — main view */}
      <DayAccuracyCard day={todayStatus} label="Hoy" isToday motivation={motivation} />

      {/* History toggle */}
      <div className="space-y-3">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showHistory && "rotate-180")} />
          <span>Ver historial</span>
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-3"
            >
              {/* Period selector */}
              <div className="flex gap-1.5">
                {[7, 10, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setHistoryDays(d)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all",
                      historyDays === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d} días
                  </button>
                ))}
              </div>

              {/* History bars */}
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                {historyStatuses.map((day, i) => {
                  const pct = day.accuracyGlobal;
                  const color = getAccuracyColor(pct);
                  const dateStr = format(new Date(day.date + 'T12:00:00'), "EEE d", { locale: es });
                  return (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => onNavigateToDay(new Date(day.date + 'T12:00:00'))}
                    >
                      <span className="text-[11px] w-10 text-muted-foreground capitalize shrink-0">{dateStr}</span>
                      <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                        {day.hasData ? (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.03 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <span className="text-[9px] text-muted-foreground/50">—</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold w-9 text-right shrink-0" style={{ color: day.hasData ? color : undefined }}>
                        {day.hasData ? `${pct.toFixed(0)}%` : '—'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="text-[11px] gap-1 h-7" onClick={exportCSV}>
                  <Download className="w-3 h-3" /> CSV
                </Button>
                <Button variant="outline" size="sm" className="text-[11px] gap-1 h-7" onClick={onNavigateToGoals}>
                  <Settings className="w-3 h-3" /> Objetivos
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ── Today card sub-component ── */
interface DayAccuracyCardProps {
  day: DayStatus;
  label: string;
  isToday?: boolean;
  motivation: { text: string; icon: typeof Flame } | null;
}

const DayAccuracyCard = ({ day, label, isToday, motivation }: DayAccuracyCardProps) => {
  const pct = day.accuracyGlobal;
  const color = getAccuracyColor(pct);
  const MotivIcon = motivation?.icon;

  if (!day.hasData) {
    return (
      <div className="rounded-xl bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">Sin registros hoy</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Añade alimentos para ver tu exactitud</p>
      </div>
    );
  }

  const macros = [
    { label: 'Prot', consumed: day.proteinConsumed, target: day.proteinTarget, acc: day.accuracyProtein, unit: 'g' },
    { label: 'Carbs', consumed: day.carbsConsumed, target: day.carbsTarget, acc: day.accuracyCarbs, unit: 'g' },
    { label: 'Grasa', consumed: day.fatConsumed, target: day.fatTarget, acc: day.accuracyFat, unit: 'g' },
    { label: 'Kcal', consumed: day.caloriesConsumed, target: day.caloriesTarget, acc: day.accuracyCalories, unit: '' },
  ];

  return (
    <div className="space-y-3">
      {/* Main accuracy ring */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-secondary" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15.5" fill="none"
              strokeWidth="3" strokeLinecap="round"
              stroke={color}
              strokeDasharray={`${Math.min(pct, 100) * 0.974} 100`}
              initial={{ strokeDasharray: '0 100' }}
              animate={{ strokeDasharray: `${Math.min(pct, 100) * 0.974} 100` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-sm font-bold"
              style={{ color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {pct.toFixed(0)}%
            </motion.span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Exactitud {label.toLowerCase()}</p>
          <p className="text-xs text-muted-foreground">
            {day.caloriesConsumed} / {day.caloriesTarget} kcal
          </p>
          {/* Motivational message */}
          <AnimatePresence>
            {motivation && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 mt-1.5"
              >
                {MotivIcon && <MotivIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 leading-tight">
                  {motivation.text}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Macro mini-bars */}
      <div className="grid grid-cols-4 gap-2">
        {macros.map(m => (
          <div key={m.label} className="text-center space-y-1">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: getAccuracyColor(m.acc) }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(m.acc, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
            <p className="text-[10px] font-medium text-foreground">
              {m.consumed}{m.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
