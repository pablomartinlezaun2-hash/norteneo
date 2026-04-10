import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dumbbell, Wind, Target, AlertTriangle, Flame, Clock } from 'lucide-react';
import type { PreWorkoutCheckInInput } from '@/lib/autoregulation/scoring';

interface PreWorkoutCheckInProps {
  plannedMinutes: number;
  onSubmit: (data: PreWorkoutCheckInInput) => void;
  onSkip: () => void;
}

interface Field {
  key: keyof Omit<PreWorkoutCheckInInput, 'planned_session_minutes'>;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  isMinutes?: boolean;
  labels?: [string, string];
}

export function PreWorkoutCheckIn({ plannedMinutes, onSubmit, onSkip }: PreWorkoutCheckInProps) {
  const [values, setValues] = useState<Omit<PreWorkoutCheckInInput, 'planned_session_minutes'>>({
    expected_strength: 6, general_freshness: 6,
    local_fatigue_target_muscle: 3, specific_pain_or_discomfort: 1,
    willingness_to_push: 6, available_time_minutes: plannedMinutes,
  });

  const fields: Field[] = [
    { key: 'expected_strength', label: 'Fuerza esperada', icon: <Dumbbell className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Baja', 'Alta'] },
    { key: 'general_freshness', label: 'Frescura general', icon: <Wind className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Agotado', 'Fresco'] },
    { key: 'local_fatigue_target_muscle', label: 'Fatiga local (músculo objetivo)', icon: <Target className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Ninguna', 'Mucha'] },
    { key: 'specific_pain_or_discomfort', label: 'Dolor o molestia', icon: <AlertTriangle className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Ninguno', 'Severo'] },
    { key: 'willingness_to_push', label: 'Ganas de entrenar duro', icon: <Flame className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Pocas', 'Muchas'] },
    { key: 'available_time_minutes', label: 'Tiempo disponible', icon: <Clock className="w-4 h-4" />, min: 15, max: 150, step: 5, isMinutes: true },
  ];

  const handleChange = (key: string, val: number) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = () => {
    onSubmit({ ...values, planned_session_minutes: plannedMinutes });
  };

  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Check-in pre-entreno</h2>
        <p className="text-sm text-muted-foreground">
          Sesión planificada: {plannedMinutes} min
        </p>
      </div>

      <div className="space-y-5">
        {fields.map(f => (
          <Card key={f.key} className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {f.icon}
                  {f.label}
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {f.isMinutes ? `${values[f.key]} min` : `${values[f.key]}/10`}
                </span>
              </div>
              <Slider
                min={f.min}
                max={f.max}
                step={f.step}
                value={[values[f.key]]}
                onValueChange={([v]) => handleChange(f.key, v)}
                className="w-full"
              />
              {f.labels && (
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{f.labels[0]}</span>
                  <span>{f.labels[1]}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onSkip}>
          Omitir
        </Button>
        <Button className="flex-1" onClick={handleSubmit}>
          Analizar sesión
        </Button>
      </div>
    </div>
  );
}
