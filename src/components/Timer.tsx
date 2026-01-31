import { useState } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  defaultRestTime?: number;
  className?: string;
}

export const Timer = ({ defaultRestTime = 120, className }: TimerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    formattedTime, 
    isRunning, 
    mode,
    startStopwatch, 
    startCountdown, 
    pause, 
    resume, 
    reset 
  } = useTimer(defaultRestTime);

  const presetTimes = [60, 90, 120, 180];

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "fixed bottom-20 right-4 z-40 gradient-primary rounded-full p-3 shadow-lg glow-primary",
          "transition-all duration-200 hover:scale-105",
          className
        )}
      >
        <TimerIcon className="w-6 h-6 text-primary-foreground" />
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-20 right-4 z-40 bg-card border border-border rounded-2xl p-4 shadow-xl",
      "w-64 animate-slide-up",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {mode === 'stopwatch' ? 'Cronómetro' : 'Descanso'}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          Cerrar
        </button>
      </div>

      {/* Time Display */}
      <div className="text-center mb-4">
        <span className={cn(
          "text-4xl font-bold tabular-nums",
          mode === 'countdown' && isRunning ? "text-primary" : "text-foreground"
        )}>
          {formattedTime}
        </span>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2 mb-4">
        {!isRunning ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={startStopwatch}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-1" />
              Cronómetro
            </Button>
            <Button
              size="sm"
              onClick={resume}
              disabled={formattedTime === '00:00'}
              className="gradient-primary text-primary-foreground"
            >
              <Play className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={pause}
            className="flex-1"
          >
            <Pause className="w-4 h-4 mr-1" />
            Pausar
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={reset}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Preset Rest Times */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Descanso rápido:</span>
        <div className="grid grid-cols-4 gap-1">
          {presetTimes.map(seconds => (
            <button
              key={seconds}
              onClick={() => startCountdown(seconds)}
              className={cn(
                "text-xs py-1.5 px-2 rounded-lg transition-colors",
                "bg-muted hover:bg-primary hover:text-primary-foreground",
                "font-medium"
              )}
            >
              {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
