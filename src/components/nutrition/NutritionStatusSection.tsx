import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronLeft, ChevronRight, Download, Settings, Flame, Trophy, Target, Zap, Star, Minus, Pill, Check } from 'lucide-react';
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

interface SupplementStatus {
  id: string;
  name: string;
  dosage: string | null;
  taken: boolean;
}

interface DayStatus {
  date: string;
  caloriesTarget: number;
  caloriesConsumed: number;
  diff: number;
  complies: boolean;
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
  if (pct >= 95) return { text: '¡Increíble! Construyendo el físico de tus sueños 💪', icon: Trophy };
  if (pct >= 90) return { text: '¡Excelente precisión! Sigue así', icon: Star };
  if (pct >= 85) return { text: '¡Casi! Un poco más y llegas al 90%', icon: Zap };
  if (pct >= 80) return { text: '¡Vas bien! Venga, acércate al 90%', icon: Flame };
  if (pct >= 70) return { text: 'Buen progreso, ajusta tus macros', icon: Target };
  return null;
};

const buildDayStatus = (date: string, dayLogs: DayData[], g: { daily_calories: number; daily_protein: number; daily_carbs: number; daily_fat: number }): DayStatus => {
  const log = dayLogs.find(d => d.date === date);
  const hasData = !!log && (log.calories > 0 || log.protein > 0 || log.carbs > 0 || log.fat > 0);
  const consumed = log || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const diff = consumed.calories - g.daily_calories;
  const accP = calcAccuracy(consumed.protein, g.daily_protein);
  const accC = calcAccuracy(consumed.carbs, g.daily_carbs);
  const accF = calcAccuracy(consumed.fat, g.daily_fat);
  const accK = calcAccuracy(consumed.calories, g.daily_calories);
  return {
    date, hasData, diff: Math.round(diff), complies: Math.abs(diff) <= 150,
    caloriesTarget: g.daily_calories, caloriesConsumed: Math.round(consumed.calories),
    proteinTarget: g.daily_protein, proteinConsumed: Math.round(consumed.protein * 10) / 10,
    carbsTarget: g.daily_carbs, carbsConsumed: Math.round(consumed.carbs * 10) / 10,
    fatTarget: g.daily_fat, fatConsumed: Math.round(consumed.fat * 10) / 10,
    accuracyProtein: accP * 100, accuracyCarbs: accC * 100, accuracyFat: accF * 100,
    accuracyCalories: accK * 100, accuracyGlobal: (accP + accC + accF + accK) / 4 * 100,
  };
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
  const [page, setPage] = useState(0);
  const [showSupplements, setShowSupplements] = useState(false);
  const [supplementStatuses, setSupplementStatuses] = useState<SupplementStatus[]>([]);

  const DAYS_PER_PAGE = 7;
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

  const today = format(new Date(), 'yyyy-MM-dd');
  const [suppRefresh, setSuppRefresh] = useState(0);

  // Fetch supplements and their logs for today
  useEffect(() => {
    if (!user) return;
    const fetchSupplements = async () => {
      const [{ data: supps }, { data: logs }] = await Promise.all([
        supabase.from('user_supplements').select('id, name, dosage').eq('user_id', user.id).eq('is_active', true),
        supabase.from('supplement_logs').select('id, supplement_id').eq('user_id', user.id).eq('logged_date', today)
      ]);
      const logMap = new Map((logs || []).map((l: any) => [l.supplement_id, l.id]));
      setSupplementStatuses((supps || []).map((s: any) => ({
        id: s.id, name: s.name, dosage: s.dosage, taken: logMap.has(s.id)
      })));
    };
    fetchSupplements();
  }, [user, today, refreshTrigger, suppRefresh]);

  const handleToggleSupplement = async (supplementId: string) => {
    if (!user) return;
    const current = supplementStatuses.find(s => s.id === supplementId);
    if (!current) return;

    // Optimistic update
    setSupplementStatuses(prev => prev.map(s => s.id === supplementId ? { ...s, taken: !s.taken } : s));

    if (current.taken) {
      // Find and delete the log
      const { data: logs } = await supabase
        .from('supplement_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('supplement_id', supplementId)
        .eq('logged_date', today)
        .limit(1);
      if (logs && logs.length > 0) {
        await supabase.from('supplement_logs').delete().eq('id', logs[0].id);
      }
    } else {
      await supabase.from('supplement_logs').insert({
        user_id: user.id,
        supplement_id: supplementId,
        logged_date: today
      });
    }
    setSuppRefresh(r => r + 1);
  };
  const todayStatus = useMemo(() => buildDayStatus(today, dayLogs, g), [dayLogs, g]);

  const historyStatuses = useMemo(() => {
    if (!showHistory) return [];
    const result: DayStatus[] = [];
    for (let i = historyDays - 1; i >= 0; i--) {
      result.push(buildDayStatus(format(subDays(new Date(), i), 'yyyy-MM-dd'), dayLogs, g));
    }
    return result;
  }, [dayLogs, showHistory, historyDays, g]);

  const totalPages = Math.ceil(historyStatuses.length / DAYS_PER_PAGE);
  const visibleDays = historyStatuses.slice(page * DAYS_PER_PAGE, (page + 1) * DAYS_PER_PAGE);

  const motivation = todayStatus.hasData ? getMotivationalMessage(todayStatus.accuracyGlobal) : null;
  const MotivIcon = motivation?.icon;

  const exportCSV = () => {
    const allDays = historyStatuses.length > 0 ? historyStatuses : [todayStatus];
    const headers = 'Fecha,Cal Obj,Cal Cons,Prot Obj,Prot Cons,%Prot,Carbs Obj,Carbs Cons,%Carbs,Grasa Obj,Grasa Cons,%Grasa,%Global\n';
    const rows = allDays.map(d =>
      `${d.date},${d.caloriesTarget},${d.caloriesConsumed},${d.proteinTarget},${d.proteinConsumed},${d.accuracyProtein.toFixed(1)},${d.carbsTarget},${d.carbsConsumed},${d.accuracyCarbs.toFixed(1)},${d.fatTarget},${d.fatConsumed},${d.accuracyFat.toFixed(1)},${d.accuracyGlobal.toFixed(1)}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `nutricion_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const macros = todayStatus.hasData ? [
    { label: 'Prot', consumed: todayStatus.proteinConsumed, target: todayStatus.proteinTarget, acc: todayStatus.accuracyProtein, unit: 'g' },
    { label: 'Carbs', consumed: todayStatus.carbsConsumed, target: todayStatus.carbsTarget, acc: todayStatus.accuracyCarbs, unit: 'g' },
    { label: 'Grasa', consumed: todayStatus.fatConsumed, target: todayStatus.fatTarget, acc: todayStatus.accuracyFat, unit: 'g' },
    { label: 'Kcal', consumed: todayStatus.caloriesConsumed, target: todayStatus.caloriesTarget, acc: todayStatus.accuracyCalories, unit: '' },
  ] : [];

  const pct = todayStatus.accuracyGlobal;
  const color = getAccuracyColor(pct);

  return (
    <div className="space-y-4 p-4">
      {/* ── Today's accuracy: ring + macros ── */}
      {!todayStatus.hasData ? (
        <div className="rounded-xl bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">Sin registros hoy</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Añade alimentos para ver tu exactitud</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Ring + info */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-secondary" strokeWidth="3" />
                <motion.circle
                  cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round"
                  stroke={color}
                  strokeDasharray={`${Math.min(pct, 100) * 0.974} 100`}
                  initial={{ strokeDasharray: '0 100' }}
                  animate={{ strokeDasharray: `${Math.min(pct, 100) * 0.974} 100` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span className="text-sm font-bold" style={{ color }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                >
                  {pct.toFixed(0)}%
                </motion.span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Exactitud hoy</p>
              <p className="text-xs text-muted-foreground">{todayStatus.caloriesConsumed} / {todayStatus.caloriesTarget} kcal</p>
              <AnimatePresence>
                {motivation && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 mt-1.5"
                  >
                    {MotivIcon && <MotivIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 leading-tight">{motivation.text}</span>
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
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: getAccuracyColor(m.acc) }}
                    initial={{ width: 0 }} animate={{ width: `${Math.min(m.acc, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-[10px] font-medium text-foreground">{m.consumed}{m.unit}</p>
              </div>
            ))}
          </div>

          {/* Supplements tracker */}
          {supplementStatuses.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowSupplements(!showSupplements)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Suplementación</span>
                <span className="ml-auto text-[11px] font-semibold text-foreground">
                  {supplementStatuses.filter(s => s.taken).length}/{supplementStatuses.length}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showSupplements && "rotate-180")} />
              </button>
              <AnimatePresence>
                {showSupplements && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5 pt-1">
                      {supplementStatuses.map((s, i) => (
                        <motion.button
                          key={s.id}
                          onClick={() => handleToggleSupplement(s.id)}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all w-full text-left",
                            s.taken
                              ? "bg-success/10 border-success/30"
                              : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            s.taken
                              ? "bg-success border-success"
                              : "border-muted-foreground/30"
                          )}>
                            {s.taken && <Check className="w-3 h-3 text-success-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-medium", s.taken ? "text-success" : "text-foreground")}>
                              {s.name}
                            </p>
                            {s.dosage && (
                              <p className="text-[10px] text-muted-foreground">{s.dosage}</p>
                            )}
                          </div>
                          <span className={cn(
                            "text-[11px] font-bold tabular-nums",
                            s.taken ? "text-success" : "text-muted-foreground"
                          )}>
                            {s.taken ? '1' : '0'} / 1
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ── History toggle ── */}
      <div className="space-y-3">
        <button onClick={() => { setShowHistory(!showHistory); setPage(0); }}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showHistory && "rotate-180")} />
          <span>Ver historial</span>
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden space-y-4"
            >
              {/* Period selector */}
              <div className="flex gap-1.5">
                {[7, 10, 30].map(d => (
                  <button key={d} onClick={() => { setHistoryDays(d); setPage(0); }}
                    className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-all",
                      historyDays === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d} días
                  </button>
                ))}
              </div>

              {/* Day heatmap */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground">Estado por día (±150 kcal)</h4>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <div className="flex-1 grid grid-cols-7 gap-1">
                    <TooltipProvider delayDuration={200}>
                      {visibleDays.map((day, i) => {
                        const dayLabel = format(new Date(day.date + 'T12:00:00'), 'EEE', { locale: es });
                        const dayNum = format(new Date(day.date + 'T12:00:00'), 'd');
                        return (
                          <Tooltip key={day.date}>
                            <TooltipTrigger asChild>
                              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => onNavigateToDay(new Date(day.date + 'T12:00:00'))}
                                className={cn("flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all border",
                                  !day.hasData ? "bg-muted/50 border-transparent"
                                    : day.complies ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
                                )}
                              >
                                <span className="text-[9px] text-muted-foreground capitalize">{dayLabel}</span>
                                <span className="text-[11px] font-semibold text-foreground">{dayNum}</span>
                                <div className={cn("w-1.5 h-1.5 rounded-full",
                                  !day.hasData ? "bg-muted-foreground/30" : day.complies ? "bg-success" : "bg-destructive"
                                )} />
                              </motion.button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs space-y-1 max-w-[200px]">
                              <p className="font-semibold">{format(new Date(day.date + 'T12:00:00'), "d MMM yyyy", { locale: es })}</p>
                              {!day.hasData ? <p className="text-muted-foreground">Sin datos</p> : (
                                <>
                                  <p>Objetivo: {day.caloriesTarget} kcal</p>
                                  <p>Consumido: {day.caloriesConsumed} kcal</p>
                                  <p className={day.complies ? 'text-success' : 'text-destructive'}>
                                    {day.diff > 0 ? '+' : ''}{day.diff} kcal
                                  </p>
                                </>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Accuracy bars */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground">Exactitud de macros</h4>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  <TooltipProvider delayDuration={200}>
                    {visibleDays.map((day, i) => {
                      const dayPct = day.accuracyGlobal;
                      const dayColor = getAccuracyColor(dayPct);
                      const dateStr = format(new Date(day.date + 'T12:00:00'), "EEE d", { locale: es });
                      return (
                        <Tooltip key={day.date}>
                          <TooltipTrigger asChild>
                            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => onNavigateToDay(new Date(day.date + 'T12:00:00'))}
                            >
                              <span className="text-[11px] w-10 text-muted-foreground capitalize shrink-0">{dateStr}</span>
                              <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                                {day.hasData ? (
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(dayPct, 100)}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.03 }}
                                    className="h-full rounded-full" style={{ backgroundColor: dayColor }}
                                  />
                                ) : (
                                  <div className="h-full flex items-center justify-center">
                                    <Minus className="w-3 h-3 text-muted-foreground/40" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[11px] font-semibold w-9 text-right shrink-0"
                                style={{ color: day.hasData ? dayColor : undefined }}
                              >
                                {day.hasData ? `${dayPct.toFixed(0)}%` : '—'}
                              </span>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs space-y-1 max-w-[200px]">
                            <p className="font-semibold">{format(new Date(day.date + 'T12:00:00'), "d MMM yyyy", { locale: es })}</p>
                            {!day.hasData ? <p className="text-muted-foreground">Sin datos</p> : (
                              <>
                                <p>Prot: {day.proteinConsumed}g / {day.proteinTarget}g → {day.accuracyProtein.toFixed(0)}%</p>
                                <p>Carbs: {day.carbsConsumed}g / {day.carbsTarget}g → {day.accuracyCarbs.toFixed(0)}%</p>
                                <p>Grasa: {day.fatConsumed}g / {day.fatTarget}g → {day.accuracyFat.toFixed(0)}%</p>
                                <p>Kcal: {day.caloriesConsumed} / {day.caloriesTarget} → {day.accuracyCalories.toFixed(0)}%</p>
                                <p className="font-semibold pt-1 border-t border-border" style={{ color: dayColor }}>
                                  Global: {dayPct.toFixed(1)}%
                                </p>
                              </>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
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
