import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Clock, Star, Brain, Eye, Bell, Trash2, ChevronDown, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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

export const SleepLogSection = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

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
      .limit(30);

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
      user_id: user.id,
      logged_date: logDate,
      bedtime,
      wake_time: wakeTime,
      total_hours: totalHours,
      quality,
      deep_sleep_minutes: deepMinutes === '' ? null : deepMinutes,
      light_sleep_minutes: lightMinutes === '' ? null : lightMinutes,
      rem_sleep_minutes: remMinutes === '' ? null : remMinutes,
      awakenings,
      notes: notes || null,
    };

    const { error } = await supabase.from('sleep_logs').upsert(payload, { onConflict: 'user_id,logged_date' });

    if (error) {
      toast.error('Error al guardar el registro de sueño');
      console.error(error);
    } else {
      toast.success('Registro de sueño guardado');
      setShowForm(false);
      resetForm();
      fetchLogs();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sleep_logs').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Registro eliminado');
      fetchLogs();
    }
  };

  const resetForm = () => {
    setLogDate(format(new Date(), 'yyyy-MM-dd'));
    setBedtime('23:00');
    setWakeTime('07:00');
    setQuality(3);
    setDeepMinutes('');
    setLightMinutes('');
    setRemMinutes('');
    setAwakenings(0);
    setNotes('');
  };

  const formatHours = (h: number | null) => {
    if (!h) return '--';
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins > 0 ? mins + 'm' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{t('sleep.title')}</h3>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1.5"
        >
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
                {/* Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('sleep.date')}</Label>
                  <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
                </div>

                {/* Bedtime & Wake */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5" /> {t('sleep.bedtime')}
                    </Label>
                    <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5" /> {t('sleep.wakeTime')}
                    </Label>
                    <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                  </div>
                </div>

                {/* Calculated total */}
                <div className="text-center py-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">{t('sleep.totalSleep')}: </span>
                  <span className="text-lg font-bold text-foreground">
                    {formatHours(calculateTotalHours(bedtime, wakeTime))}
                  </span>
                </div>

                {/* Quality slider */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" /> {t('sleep.quality')}
                  </Label>
                  <Slider
                    value={[quality]}
                    onValueChange={(v) => setQuality(v[0])}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <p className={cn("text-sm font-medium text-center", qualityColors[quality])}>
                    {qualityLabels[quality]}
                  </p>
                </div>

                {/* Sleep phases (optional) */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" /> {t('sleep.phases')} <span className="text-muted-foreground/60">({t('sleep.optional')})</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">{t('sleep.deep')}</span>
                      <Input
                        type="number"
                        placeholder="min"
                        value={deepMinutes}
                        onChange={(e) => setDeepMinutes(e.target.value ? Number(e.target.value) : '')}
                        min={0}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">{t('sleep.light')}</span>
                      <Input
                        type="number"
                        placeholder="min"
                        value={lightMinutes}
                        onChange={(e) => setLightMinutes(e.target.value ? Number(e.target.value) : '')}
                        min={0}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">REM</span>
                      <Input
                        type="number"
                        placeholder="min"
                        value={remMinutes}
                        onChange={(e) => setRemMinutes(e.target.value ? Number(e.target.value) : '')}
                        min={0}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Awakenings */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {t('sleep.awakenings')}
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[awakenings]}
                      onValueChange={(v) => setAwakenings(v[0])}
                      min={0}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-6 text-center text-foreground">{awakenings}</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('sleep.notes')}</Label>
                  <Textarea
                    placeholder={t('sleep.notesPlaceholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); resetForm(); }}>
                    {t('sleep.cancel')}
                  </Button>
                  <Button className="flex-1" onClick={handleSave} disabled={saving}>
                    {saving ? t('sleep.saving') : t('sleep.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
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
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1.5">
                      {/* Date + quality */}
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

                      {/* Time range + total */}
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

                      {/* Phases row */}
                      {(log.deep_sleep_minutes || log.light_sleep_minutes || log.rem_sleep_minutes) && (
                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                          {log.deep_sleep_minutes != null && <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">{t('sleep.deep')} {log.deep_sleep_minutes}m</span>}
                          {log.light_sleep_minutes != null && <span className="bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded">{t('sleep.light')} {log.light_sleep_minutes}m</span>}
                          {log.rem_sleep_minutes != null && <span className="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">REM {log.rem_sleep_minutes}m</span>}
                          {log.awakenings != null && log.awakenings > 0 && (
                            <span className="bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">{log.awakenings} {t('sleep.awakeningsShort')}</span>
                          )}
                        </div>
                      )}

                      {log.notes && (
                        <p className="text-xs text-muted-foreground/70 italic">{log.notes}</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
