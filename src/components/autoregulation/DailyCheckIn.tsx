import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Moon, Zap, Brain, Activity, Flame, Heart } from 'lucide-react';
import type { DailyCheckInInput } from '@/lib/autoregulation/scoring';

interface DailyCheckInProps {
  onSubmit: (data: DailyCheckInInput) => void;
  onSkip: () => void;
}

interface CheckInField {
  key: keyof DailyCheckInInput;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  isHours?: boolean;
  labels?: [string, string];
}

const FIELDS: CheckInField[] = [
  { key: 'sleep_hours', label: 'Horas de sueño', icon: <Moon className="w-4 h-4" />, min: 2, max: 10, step: 0.5, isHours: true },
  { key: 'sleep_quality', label: 'Calidad de sueño', icon: <Moon className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Mala', 'Excelente'] },
  { key: 'general_energy', label: 'Energía general', icon: <Zap className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Baja', 'Alta'] },
  { key: 'mental_stress', label: 'Estrés mental', icon: <Brain className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Bajo', 'Alto'] },
  { key: 'general_soreness', label: 'Dolor muscular', icon: <Activity className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Ninguno', 'Severo'] },
  { key: 'motivation', label: 'Motivación', icon: <Flame className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Baja', 'Alta'] },
  { key: 'joint_discomfort', label: 'Molestia articular', icon: <Heart className="w-4 h-4" />, min: 1, max: 10, step: 1, labels: ['Ninguna', 'Severa'] },
];

export function DailyCheckIn({ onSubmit, onSkip }: DailyCheckInProps) {
  const [values, setValues] = useState<DailyCheckInInput>({
    sleep_hours: 7, sleep_quality: 6, general_energy: 6,
    mental_stress: 4, general_soreness: 3, motivation: 6, joint_discomfort: 2,
  });

  const handleChange = (key: keyof DailyCheckInInput, val: number) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Check-in diario</h2>
        <p className="text-sm text-muted-foreground">¿Cómo te sientes hoy?</p>
      </div>

      <div className="space-y-5">
        {FIELDS.map(f => (
          <Card key={f.key} className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {f.icon}
                  {f.label}
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {f.isHours ? `${values[f.key]}h` : `${values[f.key]}/10`}
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
        <Button className="flex-1" onClick={() => onSubmit(values)}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
