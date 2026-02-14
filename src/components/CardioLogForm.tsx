import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Timer, Route, Gauge, Save, Loader2, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardioInterval } from '@/hooks/useCardioLogs';
import { calculatePace, formatPace as formatPaceUtil, formatPaceDetailed, formatUnitLabel, DEFAULT_PACE_UNIT } from './cardio/paceUtils';

interface CardioLogFormProps {
  activityType: 'running' | 'swimming';
  onSave: (
    session: {
      session_name?: string;
      total_distance_m: number;
      total_duration_seconds?: number;
      avg_pace_seconds_per_unit?: number;
      notes?: string;
    },
    intervals: CardioInterval[]
  ) => Promise<{ error: string | null }>;
  onClose: () => void;
}

const parsePace = (pace: string): number | undefined => {
  const parts = pace.split(':');
  if (parts.length !== 2) return undefined;
  const min = parseInt(parts[0]);
  const sec = parseInt(parts[1]);
  if (isNaN(min) || isNaN(sec)) return undefined;
  return min * 60 + sec;
};

export const CardioLogForm = ({ activityType, onSave, onClose }: CardioLogFormProps) => {
  const isRunning = activityType === 'running';
  const defaultPaceUnit = isRunning ? 1000 : 100;

  const [sessionName, setSessionName] = useState('');
  const [mode, setMode] = useState<'continuous' | 'intervals'>('continuous');
  
  // Continuous mode
  const [distance, setDistance] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [durationSec, setDurationSec] = useState('');
  const [pace, setPace] = useState('');
  
  // Intervals mode
  const [intervals, setIntervals] = useState<{
    distance: string;
    paceMin: string;
    paceSec: string;
    restSec: string;
    paceUnit: string;
  }[]>([{ distance: '', paceMin: '', paceSec: '', restSec: '', paceUnit: String(defaultPaceUnit) }]);

  const [saving, setSaving] = useState(false);

  // Auto-calculated pace for continuous mode
  const autoPaceContinuous = useMemo(() => {
    const distM = parseFloat(distance) * (isRunning ? 1000 : 1);
    const durSec = (parseInt(durationMin || '0') * 60) + parseInt(durationSec || '0');
    if (distM > 0 && durSec > 0 && !pace) {
      return calculatePace(durSec, distM, defaultPaceUnit);
    }
    return undefined;
  }, [distance, durationMin, durationSec, pace, isRunning, defaultPaceUnit]);

  const addInterval = () => {
    setIntervals([...intervals, { distance: '', paceMin: '', paceSec: '', restSec: '', paceUnit: String(defaultPaceUnit) }]);
  };

  const removeInterval = (idx: number) => {
    setIntervals(intervals.filter((_, i) => i !== idx));
  };

  const updateInterval = (idx: number, field: string, value: string) => {
    const updated = [...intervals];
    (updated[idx] as any)[field] = value;
    setIntervals(updated);
  };

  const handleSave = async () => {
    setSaving(true);

    if (mode === 'continuous') {
      const distM = parseFloat(distance) * (isRunning ? 1000 : 1);
      const durSec = (parseInt(durationMin || '0') * 60) + parseInt(durationSec || '0');
      const paceSeconds = parsePace(pace);
      // Use manual pace if provided, otherwise auto-calculate
      const finalPace = paceSeconds !== undefined
        ? paceSeconds
        : (distM > 0 && durSec > 0 ? calculatePace(durSec, distM, isRunning ? 1000 : 100) : undefined);

      const result = await onSave(
        {
          session_name: sessionName || (isRunning ? 'Carrera' : 'Natación'),
          total_distance_m: distM,
          total_duration_seconds: durSec > 0 ? durSec : undefined,
          avg_pace_seconds_per_unit: finalPace,
        },
        []
      );
      if (!result.error) onClose();
    } else {
      const ivData: CardioInterval[] = intervals.map((iv, idx) => {
        const distM = parseFloat(iv.distance || '0') * (isRunning ? 1 : 1);
        const paceSec = (parseInt(iv.paceMin || '0') * 60) + parseInt(iv.paceSec || '0');
        return {
          interval_order: idx,
          distance_m: distM,
          pace_seconds_per_unit: paceSec > 0 ? paceSec : undefined,
          pace_unit_m: parseInt(iv.paceUnit) || defaultPaceUnit,
          rest_seconds: parseInt(iv.restSec) || undefined,
          duration_seconds: undefined,
        };
      });

      const totalDist = ivData.reduce((sum, iv) => sum + iv.distance_m, 0);
      const avgPace = ivData.filter(iv => iv.pace_seconds_per_unit).length > 0
        ? ivData.reduce((sum, iv) => sum + (iv.pace_seconds_per_unit || 0), 0) / ivData.filter(iv => iv.pace_seconds_per_unit).length
        : undefined;

      const result = await onSave(
        {
          session_name: sessionName || (isRunning ? 'Series en pista' : 'Series natación'),
          total_distance_m: totalDist,
          avg_pace_seconds_per_unit: avgPace,
        },
        ivData
      );
      if (!result.error) onClose();
    }

    setSaving(false);
  };

  const accentColor = isRunning ? 'text-green-500' : 'text-cyan-500';
  const accentBg = isRunning ? 'bg-green-500/10' : 'bg-cyan-500/10';
  const accentBorder = isRunning ? 'border-green-500/30' : 'border-cyan-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`rounded-2xl border ${accentBorder} ${accentBg} p-5 space-y-4`}
    >
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-bold ${accentColor}`}>
          {isRunning ? '🏃 Registrar Running' : '🏊 Registrar Natación'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Session name */}
      <Input
        placeholder="Nombre de la sesión (opcional)"
        value={sessionName}
        onChange={e => setSessionName(e.target.value)}
        className="bg-background/50"
      />

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'continuous' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('continuous')}
          className={mode === 'continuous' ? (isRunning ? 'bg-green-500 hover:bg-green-600' : 'bg-cyan-500 hover:bg-cyan-600') : ''}
        >
          <Route className="w-3.5 h-3.5 mr-1.5" />
          Continua
        </Button>
        <Button
          variant={mode === 'intervals' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('intervals')}
          className={mode === 'intervals' ? (isRunning ? 'bg-green-500 hover:bg-green-600' : 'bg-cyan-500 hover:bg-cyan-600') : ''}
        >
          <Timer className="w-3.5 h-3.5 mr-1.5" />
          Series/Intervalos
        </Button>
      </div>

      {mode === 'continuous' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Distancia ({isRunning ? 'km' : 'm'})
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder={isRunning ? '5.0' : '2000'}
                value={distance}
                onChange={e => setDistance(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Ritmo (min:seg/{isRunning ? 'km' : '100m'})
              </label>
              <Input
                placeholder={isRunning ? '5:30' : '1:45'}
                value={pace}
                onChange={e => setPace(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Duración</label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min"
                value={durationMin}
                onChange={e => setDurationMin(e.target.value)}
                className="bg-background/50 w-20"
              />
              <span className="text-xs text-muted-foreground">min</span>
              <Input
                type="number"
                placeholder="Seg"
                value={durationSec}
                onChange={e => setDurationSec(e.target.value)}
                className="bg-background/50 w-20"
              />
              <span className="text-xs text-muted-foreground">seg</span>
          </div>
          {/* Auto-calculated pace display */}
          {autoPaceContinuous !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
              <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <div className="text-[10px] text-muted-foreground">
                <span className="font-medium text-foreground">
                  Ritmo calculado: {formatPaceUtil(autoPaceContinuous)}/{isRunning ? 'km' : '100m'}
                </span>
                <span className="block">
                  ({formatPaceDetailed(autoPaceContinuous)}) · Fórmula: (tiempo/distancia) × {formatUnitLabel(defaultPaceUnit)}
                </span>
              </div>
            </div>
          )}
        </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {intervals.map((iv, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="rounded-xl border border-border bg-background/50 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Serie {idx + 1}</span>
                  {intervals.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeInterval(idx)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Distancia ({isRunning ? 'm' : 'm'})</label>
                    <Input
                      type="number"
                      placeholder={isRunning ? '400' : '100'}
                      value={iv.distance}
                      onChange={e => updateInterval(idx, 'distance', e.target.value)}
                      className="bg-background/80 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Ritmo por {isRunning ? iv.paceUnit : iv.paceUnit}m
                    </label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="min"
                        value={iv.paceMin}
                        onChange={e => updateInterval(idx, 'paceMin', e.target.value)}
                        className="bg-background/80 h-8 text-sm w-14"
                      />
                      <span className="text-muted-foreground self-center text-xs">:</span>
                      <Input
                        type="number"
                        placeholder="seg"
                        value={iv.paceSec}
                        onChange={e => updateInterval(idx, 'paceSec', e.target.value)}
                        className="bg-background/80 h-8 text-sm w-14"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Descanso (seg)</label>
                    <Input
                      type="number"
                      placeholder="60"
                      value={iv.restSec}
                      onChange={e => updateInterval(idx, 'restSec', e.target.value)}
                      className="bg-background/80 h-8 text-sm"
                    />
                  </div>
                  {!isRunning && (
                    <div>
                      <label className="text-[10px] text-muted-foreground">Ritmo cada (m)</label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={iv.paceUnit}
                        onChange={e => updateInterval(idx, 'paceUnit', e.target.value)}
                        className="bg-background/80 h-8 text-sm"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button variant="outline" size="sm" onClick={addInterval} className="w-full">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Añadir serie
          </Button>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving}
        className={`w-full font-semibold ${isRunning ? 'bg-green-500 hover:bg-green-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white`}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Guardar sesión
      </Button>
    </motion.div>
  );
};
