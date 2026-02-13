import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, AlertTriangle, X, Minus, ChevronLeft, ChevronRight, Download, Settings, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NutritionGoals } from '@/hooks/useNutritionData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  diff: number;
  complies: boolean; // ±150 kcal
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
  if (pct >= 80) return 'hsl(38 92% 50%)'; // orange
  return 'hsl(var(--destructive))';
};

const getAccuracyIcon = (pct: number) => {
  if (pct >= 100) return <Check className="w-3 h-3" />;
  if (pct >= 80) return <AlertTriangle className="w-3 h-3" />;
  return <X className="w-3 h-3" />;
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
  const [daysToShow, setDaysToShow] = useState(14);
  const [page, setPage] = useState(0);

  const DAYS_PER_PAGE = 7;

  const defaultGoals = {
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 250,
    daily_fat: 70,
  };
  const g = goals || defaultGoals;

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setLoading(true);
      const startDate = format(subDays(new Date(), daysToShow - 1), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('food_logs')
        .select('logged_date, calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .gte('logged_date', startDate)
        .lte('logged_date', endDate);

      if (error) {
        console.error('Error fetching nutrition history:', error);
        setLoading(false);
        return;
      }

      // Aggregate by day
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
  }, [user, daysToShow, refreshTrigger]);

  const dayStatuses: DayStatus[] = useMemo(() => {
    const result: DayStatus[] = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = dayLogs.find(d => d.date === date);
      const hasData = !!log && (log.calories > 0 || log.protein > 0 || log.carbs > 0 || log.fat > 0);

      const consumed = log || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const diff = consumed.calories - g.daily_calories;
      const accP = calcAccuracy(consumed.protein, g.daily_protein);
      const accC = calcAccuracy(consumed.carbs, g.daily_carbs);
      const accF = calcAccuracy(consumed.fat, g.daily_fat);
      const accK = calcAccuracy(consumed.calories, g.daily_calories);
      const accGlobal = (accP + accC + accF + accK) / 4;

      result.push({
        date,
        caloriesTarget: g.daily_calories,
        caloriesConsumed: Math.round(consumed.calories),
        diff: Math.round(diff),
        complies: Math.abs(diff) <= 150,
        proteinTarget: g.daily_protein,
        proteinConsumed: Math.round(consumed.protein * 10) / 10,
        carbsTarget: g.daily_carbs,
        carbsConsumed: Math.round(consumed.carbs * 10) / 10,
        fatTarget: g.daily_fat,
        fatConsumed: Math.round(consumed.fat * 10) / 10,
        accuracyProtein: accP * 100,
        accuracyCarbs: accC * 100,
        accuracyFat: accF * 100,
        accuracyCalories: accK * 100,
        accuracyGlobal: accGlobal * 100,
        hasData,
      });
    }
    return result;
  }, [dayLogs, daysToShow, g]);

  // Pagination
  const totalPages = Math.ceil(dayStatuses.length / DAYS_PER_PAGE);
  const visibleDays = dayStatuses.slice(page * DAYS_PER_PAGE, (page + 1) * DAYS_PER_PAGE);

  // Export CSV
  const exportCSV = () => {
    const headers = 'Fecha,Cal Obj,Cal Cons,Diff,Estado,Prot Obj,Prot Cons,%Prot,Carbs Obj,Carbs Cons,%Carbs,Grasa Obj,Grasa Cons,%Grasa,%Global\n';
    const rows = dayStatuses.map(d =>
      `${d.date},${d.caloriesTarget},${d.caloriesConsumed},${d.diff},${d.complies ? 'Cumple' : 'No cumple'},${d.proteinTarget},${d.proteinConsumed},${d.accuracyProtein.toFixed(1)},${d.carbsTarget},${d.carbsConsumed},${d.accuracyCarbs.toFixed(1)},${d.fatTarget},${d.fatConsumed},${d.accuracyFat.toFixed(1)},${d.accuracyGlobal.toFixed(1)}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutricion_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-foreground">Estado nutricional</h3>
        <p className="text-xs text-muted-foreground">Resumen diario y precisión de macros / calorías</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {[7, 14, 30].map(d => (
          <button
            key={d}
            onClick={() => { setDaysToShow(d); setPage(0); }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
              daysToShow === d
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {d} días
          </button>
        ))}
      </div>

      {/* ── Daily calorie status heatmap ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Estado por día (±150 kcal)</h4>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 grid grid-cols-7 gap-1.5">
            <TooltipProvider delayDuration={200}>
              {visibleDays.map((day, i) => {
                const dayLabel = format(new Date(day.date + 'T12:00:00'), 'EEE', { locale: es });
                const dayNum = format(new Date(day.date + 'T12:00:00'), 'd');
                return (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => onNavigateToDay(new Date(day.date + 'T12:00:00'))}
                        className={cn(
                          "flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all border",
                          !day.hasData
                            ? "bg-muted/50 border-transparent"
                            : day.complies
                              ? "bg-success/10 border-success/30"
                              : "bg-destructive/10 border-destructive/30"
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground capitalize">{dayLabel}</span>
                        <span className="text-xs font-semibold text-foreground">{dayNum}</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          !day.hasData ? "bg-muted-foreground/30" : day.complies ? "bg-success" : "bg-destructive"
                        )} />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs space-y-1 max-w-[200px]">
                      <p className="font-semibold">{format(new Date(day.date + 'T12:00:00'), "d MMM yyyy", { locale: es })}</p>
                      {!day.hasData ? (
                        <p className="text-muted-foreground">Datos insuficientes</p>
                      ) : (
                        <>
                          <p>Objetivo: {day.caloriesTarget} kcal</p>
                          <p>Consumido: {day.caloriesConsumed} kcal</p>
                          <p className={day.complies ? 'text-success' : 'text-destructive'}>
                            {day.diff > 0 ? '+' : ''}{day.diff} kcal — {day.complies ? 'Dentro del rango' : 'Fuera del rango'}
                          </p>
                        </>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>

          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Accuracy progress per day ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Exactitud de macros + calorías</h4>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {visibleDays.map((day, i) => {
            const pct = day.accuracyGlobal;
            const color = getAccuracyColor(pct);
            const dateStr = format(new Date(day.date + 'T12:00:00'), "EEE d", { locale: es });

            return (
              <TooltipProvider key={day.date} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 group cursor-pointer"
                      onClick={() => onNavigateToDay(new Date(day.date + 'T12:00:00'))}
                    >
                      <span className="text-xs w-12 text-muted-foreground capitalize shrink-0">{dateStr}</span>
                      <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden relative">
                        {day.hasData ? (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.04 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Minus className="w-3 h-3 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <span
                        className="text-xs font-semibold w-12 text-right shrink-0"
                        style={{ color: day.hasData ? color : undefined }}
                      >
                        {day.hasData ? `${pct.toFixed(0)}%` : '—'}
                      </span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs space-y-1.5 max-w-[220px]">
                    <p className="font-semibold">{format(new Date(day.date + 'T12:00:00'), "d MMM yyyy", { locale: es })}</p>
                    {!day.hasData ? (
                      <p className="text-muted-foreground">Datos insuficientes</p>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <p>Proteínas: {day.proteinConsumed}g / {day.proteinTarget}g → {day.accuracyProtein.toFixed(1)}%</p>
                          <p>Hidratos: {day.carbsConsumed}g / {day.carbsTarget}g → {day.accuracyCarbs.toFixed(1)}%</p>
                          <p>Grasas: {day.fatConsumed}g / {day.fatTarget}g → {day.accuracyFat.toFixed(1)}%</p>
                          <p>Calorías: {day.caloriesConsumed} / {day.caloriesTarget} → {day.accuracyCalories.toFixed(1)}%</p>
                        </div>
                        <p className="font-semibold pt-1 border-t border-border" style={{ color: getAccuracyColor(pct) }}>
                          Exactitud global: {pct.toFixed(1)}%
                        </p>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="rounded-xl bg-muted/50 p-3 space-y-2">
        <h4 className="text-xs font-semibold text-foreground">Leyenda</h4>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span>Cumple / 100% exactitud</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(38 92% 50%)' }} />
            <span>80–99% exactitud</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <span>{"<80% / Fuera de rango"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
            <span>Sin datos</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          La exactitud se calcula comparando cada macro y las calorías consumidas vs el objetivo, con peso igual (25% cada uno).
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={onNavigateToGoals}>
          <Settings className="w-3.5 h-3.5" />
          Ajustar objetivos
        </Button>
      </div>
    </div>
  );
};
