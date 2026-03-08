import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Star, Brain, Eye, Trash2, Plus, X, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, CartesianGrid } from 'recharts';

interface SleepLog {
  id: string;
  logged_date: string;
  bedtime: string | null;
  wake_time: string | null;
  total_hours: number | null;
  quality: number | null;
  deep_sleep_minutes: number | null;
  light_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
  awakenings: number | null;
  notes: string | null;
}

const qualityLabels = ['', '⚡ Muy malo', '😴 Malo', '😐 Normal', '😊 Bueno', '🌟 Excelente'];
const qualityColors = ['', 'text-destructive', 'text-orange-500', 'text-yellow-500', 'text-emerald-500', 'text-primary'];

const formatHours = (h: number | null) => {
  if (!h) return '--';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins > 0 ? mins + 'm' : ''}`;
};

/* ───── Day Detail Modal ───── */
const SleepDayDetail = ({ log, onClose }: { log: SleepLog; onClose: () => void }) => {
  const { t } = useTranslation();
  const totalMin = (log.deep_sleep_minutes || 0) + (log.light_sleep_minutes || 0) + (log.rem_sleep_minutes || 0);
  const hasPhases = totalMin > 0;

  const highlights: { icon: React.ReactNode; label: string; color: string }[] = [];

  // Duration highlight
  const h = log.total_hours || 0;
  if (h >= 7.5 && h <= 9) highlights.push({ icon: <Moon className="w-3.5 h-3.5" />, label: `${formatHours(h)} — Duración óptima`, color: 'text-emerald-500' });
  else if (h < 6) highlights.push({ icon: <AlertTriangle className="w-3.5 h-3.5" />, label: `${formatHours(h)} — Sueño insuficiente`, color: 'text-destructive' });
  else highlights.push({ icon: <Moon className="w-3.5 h-3.5" />, label: `${formatHours(h)} — Duración aceptable`, color: 'text-yellow-500' });

  // Quality highlight
  if (log.quality) {
    if (log.quality >= 4) highlights.push({ icon: <Star className="w-3.5 h-3.5" />, label: `Calidad ${log.quality}/5 — ${qualityLabels[log.quality]}`, color: 'text-emerald-500' });
    else if (log.quality <= 2) highlights.push({ icon: <Star className="w-3.5 h-3.5" />, label: `Calidad ${log.quality}/5 — ${qualityLabels[log.quality]}`, color: 'text-destructive' });
    else highlights.push({ icon: <Star className="w-3.5 h-3.5" />, label: `Calidad ${log.quality}/5 — ${qualityLabels[log.quality]}`, color: 'text-yellow-500' });
  }

  // Awakenings
  if (log.awakenings != null) {
    if (log.awakenings === 0) highlights.push({ icon: <Eye className="w-3.5 h-3.5" />, label: 'Sin despertares — Sueño continuo', color: 'text-emerald-500' });
    else if (log.awakenings <= 2) highlights.push({ icon: <Eye className="w-3.5 h-3.5" />, label: `${log.awakenings} despertares — Leve fragmentación`, color: 'text-yellow-500' });
    else highlights.push({ icon: <Eye className="w-3.5 h-3.5" />, label: `${log.awakenings} despertares — Sueño fragmentado`, color: 'text-destructive' });
  }

  // Deep sleep
  if (log.deep_sleep_minutes != null) {
    if (log.deep_sleep_minutes >= 90) highlights.push({ icon: <Brain className="w-3.5 h-3.5" />, label: `Profundo ${log.deep_sleep_minutes}m — Excelente recuperación`, color: 'text-emerald-500' });
    else if (log.deep_sleep_minutes >= 60) highlights.push({ icon: <Brain className="w-3.5 h-3.5" />, label: `Profundo ${log.deep_sleep_minutes}m — Buena recuperación`, color: 'text-yellow-500' });
    else highlights.push({ icon: <Brain className="w-3.5 h-3.5" />, label: `Profundo ${log.deep_sleep_minutes}m — Recuperación baja`, color: 'text-destructive' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-primary/20 bg-card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-foreground capitalize">
            {format(new Date(log.logged_date + 'T12:00:00'), 'EEEE d MMMM', { locale: es })}
          </p>
          {log.bedtime && log.wake_time && (
            <p className="text-xs text-muted-foreground mt-0.5">
              🌙 {log.bedtime.slice(0, 5)} → ☀️ {log.wake_time.slice(0, 5)}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Highlights */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Puntos clave</p>
        {highlights.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.25 }}
            className="flex items-center gap-2.5 py-1.5"
          >
            <span className={cn(h.color)}>{h.icon}</span>
            <span className={cn("text-sm font-medium", h.color)}>{h.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Phase breakdown bar */}
      {hasPhases && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Composición del sueño</p>
          <div className="h-4 rounded-full overflow-hidden flex bg-secondary">
            {log.deep_sleep_minutes != null && log.deep_sleep_minutes > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(log.deep_sleep_minutes / totalMin) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-indigo-500 h-full"
              />
            )}
            {log.light_sleep_minutes != null && log.light_sleep_minutes > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(log.light_sleep_minutes / totalMin) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-sky-400 h-full"
              />
            )}
            {log.rem_sleep_minutes != null && log.rem_sleep_minutes > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(log.rem_sleep_minutes / totalMin) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-purple-500 h-full"
              />
            )}
          </div>
          <div className="flex gap-3 text-[10px]">
            {log.deep_sleep_minutes != null && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" />Profundo {log.deep_sleep_minutes}m</span>}
            {log.light_sleep_minutes != null && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />Ligero {log.light_sleep_minutes}m</span>}
            {log.rem_sleep_minutes != null && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />REM {log.rem_sleep_minutes}m</span>}
          </div>
        </div>
      )}

      {/* Notes */}
      {log.notes && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground italic">{log.notes}</p>
        </div>
      )}
    </motion.div>
  );
};

/* ───── Custom Tooltip ───── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-popover border border-border p-2.5 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.dataKey === 'hours' ? `${p.value}h` : `${p.value}/5`}
        </p>
      ))}
    </div>
  );
};

/* ═════════ MAIN COMPONENT ═════════ */

export const SleepLogSection = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SleepLog | null>(null);
  const [chartRange, setChartRange] = useState<7 | 14 | 30>(14);

  // Form state
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [deepMinutes, setDeepMinutes] = useState<number | ''>('');
  const [lightMinutes, setLightMinutes] = useState<number | ''>('');
  const [remMinutes, setRemMinutes] = useState<number | ''>('');
  const [awakenings, setAwakenings] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_date', { ascending: false })
      .limit(60);

    if (!error) setLogs((data as SleepLog[]) || []);
    setLoading(false);
  };

  const calculateTotalHours = (bed: string, wake: string): number => {
    const [bH, bM] = bed.split(':').map(Number);
    const [wH, wM] = wake.split(':').map(Number);
    let diff = (wH * 60 + wM) - (bH * 60 + bM);
    if (diff <= 0) diff += 24 * 60;
    return Math.round((diff / 60) * 100) / 100;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const totalHours = calculateTotalHours(bedtime, wakeTime);
    const payload = {
      user_id: user.id, logged_date: logDate, bedtime, wake_time: wakeTime,
      total_hours: totalHours, quality,
      deep_sleep_minutes: deepMinutes === '' ? null : deepMinutes,
      light_sleep_minutes: lightMinutes === '' ? null : lightMinutes,
      rem_sleep_minutes: remMinutes === '' ? null : remMinutes,
      awakenings, notes: notes || null,
    };
    const { error } = await supabase.from('sleep_logs').upsert(payload, { onConflict: 'user_id,logged_date' });
    if (error) { toast.error('Error al guardar'); console.error(error); }
    else { toast.success('Registro guardado'); setShowForm(false); resetForm(); fetchLogs(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sleep_logs').delete().eq('id', id);
    if (!error) { toast.success('Eliminado'); fetchLogs(); if (selectedLog?.id === id) setSelectedLog(null); }
    else toast.error('Error al eliminar');
  };

  const resetForm = () => {
    setLogDate(format(new Date(), 'yyyy-MM-dd'));
    setBedtime('23:00'); setWakeTime('07:00'); setQuality(3);
    setDeepMinutes(''); setLightMinutes(''); setRemMinutes('');
    setAwakenings(0); setNotes('');
  };

  /* ── Chart data ── */
  const chartData = useMemo(() => {
    const filtered = logs
      .slice(0, chartRange)
      .map(log => ({
        date: format(new Date(log.logged_date + 'T12:00:00'), 'dd/MM', { locale: es }),
        hours: log.total_hours ? Math.round(log.total_hours * 10) / 10 : null,
        quality: log.quality,
        logRef: log,
      }))
      .reverse();
    return filtered;
  }, [logs, chartRange]);

  const avgHours = useMemo(() => {
    const valid = chartData.filter(d => d.hours != null);
    if (valid.length === 0) return 0;
    return Math.round((valid.reduce((s, d) => s + (d.hours || 0), 0) / valid.length) * 10) / 10;
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{t('sleep.title')}</h3>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {t('sleep.addLog')}
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('sleep.date')}</Label>
                  <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Moon className="w-3.5 h-3.5" /> {t('sleep.bedtime')}</Label>
                    <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Sun className="w-3.5 h-3.5" /> {t('sleep.wakeTime')}</Label>
                    <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                  </div>
                </div>
                <div className="text-center py-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">{t('sleep.totalSleep')}: </span>
                  <span className="text-lg font-bold text-foreground">{formatHours(calculateTotalHours(bedtime, wakeTime))}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {t('sleep.quality')}</Label>
                  <Slider value={[quality]} onValueChange={(v) => setQuality(v[0])} min={1} max={5} step={1} />
                  <p className={cn("text-sm font-medium text-center", qualityColors[quality])}>{qualityLabels[quality]}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> {t('sleep.phases')} <span className="text-muted-foreground/60">({t('sleep.optional')})</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1"><span className="text-[10px] text-muted-foreground">{t('sleep.deep')}</span><Input type="number" placeholder="min" value={deepMinutes} onChange={(e) => setDeepMinutes(e.target.value ? Number(e.target.value) : '')} min={0} className="h-9 text-sm" /></div>
                    <div className="space-y-1"><span className="text-[10px] text-muted-foreground">{t('sleep.light')}</span><Input type="number" placeholder="min" value={lightMinutes} onChange={(e) => setLightMinutes(e.target.value ? Number(e.target.value) : '')} min={0} className="h-9 text-sm" /></div>
                    <div className="space-y-1"><span className="text-[10px] text-muted-foreground">REM</span><Input type="number" placeholder="min" value={remMinutes} onChange={(e) => setRemMinutes(e.target.value ? Number(e.target.value) : '')} min={0} className="h-9 text-sm" /></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {t('sleep.awakenings')}</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[awakenings]} onValueChange={(v) => setAwakenings(v[0])} min={0} max={10} step={1} className="flex-1" />
                    <span className="text-sm font-mono w-6 text-center text-foreground">{awakenings}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('sleep.notes')}</Label>
                  <Textarea placeholder={t('sleep.notesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); resetForm(); }}>{t('sleep.cancel')}</Button>
                  <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? t('sleep.saving') : t('sleep.save')}</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Trend Chart ═══ */}
      {logs.length >= 2 && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Tendencia de sueño</span>
              </div>
              <div className="flex gap-1">
                {([7, 14, 30] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors',
                      chartRange === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            </div>

            {/* Average badge */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Media:</span>
              <span className={cn("font-bold", avgHours >= 7 ? 'text-emerald-500' : avgHours >= 6 ? 'text-yellow-500' : 'text-destructive')}>
                {avgHours}h
              </span>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  onClick={(e: any) => {
                    if (e?.activePayload?.[0]?.payload?.logRef) {
                      setSelectedLog(e.activePayload[0].payload.logRef);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis yAxisId="hours" domain={[0, 12]} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis yAxisId="quality" orientation="right" domain={[0, 5]} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine yAxisId="hours" y={8} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.4} />
                  <defs>
                    <linearGradient id="sleepHoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area yAxisId="hours" type="monotone" dataKey="hours" fill="url(#sleepHoursGrad)" stroke="none" />
                  <Line yAxisId="hours" type="monotone" dataKey="hours" name="Horas" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, cursor: 'pointer', fill: 'hsl(var(--primary))' }} activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }} connectNulls />
                  <Line yAxisId="quality" type="monotone" dataKey="quality" name="Calidad" stroke="hsl(38 92% 50%)" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, cursor: 'pointer', fill: 'hsl(38 92% 50%)' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary rounded" />Horas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-500 rounded" style={{ borderBottom: '1px dashed' }} />Calidad</span>
              <span className="flex items-center gap-1"><span className="w-3 h-px border-b border-dashed border-primary" />Objetivo 8h</span>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">Pulsa un punto de la gráfica para ver el resumen del día</p>
          </CardContent>
        </Card>
      )}

      {/* ═══ Selected Day Detail ═══ */}
      <AnimatePresence>
        {selectedLog && (
          <SleepDayDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </AnimatePresence>

      {/* ═══ History List ═══ */}
      {logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Moon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{t('sleep.noLogs')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('sleep.noLogsHint')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Historial</p>
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <Card
                className={cn("overflow-hidden cursor-pointer transition-colors hover:border-primary/30", selectedLog?.id === log.id && "border-primary/40 bg-primary/5")}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground capitalize">
                          {format(new Date(log.logged_date + 'T12:00:00'), 'EEE d MMM', { locale: es })}
                        </span>
                        {log.quality && (
                          <span className={cn("text-xs font-medium", qualityColors[log.quality])}>
                            {qualityLabels[log.quality]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {log.bedtime && log.wake_time && (
                          <span className="flex items-center gap-1">
                            <Moon className="w-3 h-3" /> {log.bedtime.slice(0, 5)} → <Sun className="w-3 h-3" /> {log.wake_time.slice(0, 5)}
                          </span>
                        )}
                        {log.total_hours && (
                          <span className="font-medium text-foreground">{formatHours(log.total_hours)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", selectedLog?.id === log.id && "rotate-90")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
