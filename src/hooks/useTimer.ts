import { useState, useRef, useCallback } from 'react';

interface TimerState {
  time: number;
  isRunning: boolean;
  mode: 'stopwatch' | 'countdown';
}

export const useTimer = (initialCountdown: number = 120) => {
  const [state, setState] = useState<TimerState>({
    time: 0,
    isRunning: false,
    mode: 'stopwatch',
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTarget = useRef(initialCountdown);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startStopwatch = useCallback(() => {
    clearTimer();
    setState({ time: 0, isRunning: true, mode: 'stopwatch' });
    
    intervalRef.current = setInterval(() => {
      setState(prev => ({ ...prev, time: prev.time + 1 }));
    }, 1000);
  }, [clearTimer]);

  const startCountdown = useCallback((seconds?: number) => {
    clearTimer();
    const target = seconds ?? countdownTarget.current;
    countdownTarget.current = target;
    setState({ time: target, isRunning: true, mode: 'countdown' });
    
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.time <= 1) {
          clearTimer();
          // Play sound when countdown finishes
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleigAAABg');
            audio.play().catch(() => {});
          } catch {}
          return { ...prev, time: 0, isRunning: false };
        }
        return { ...prev, time: prev.time - 1 };
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setState(prev => ({ ...prev, isRunning: false }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (state.time === 0) return;
    
    setState(prev => ({ ...prev, isRunning: true }));
    
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.mode === 'countdown') {
          if (prev.time <= 1) {
            clearTimer();
            return { ...prev, time: 0, isRunning: false };
          }
          return { ...prev, time: prev.time - 1 };
        } else {
          return { ...prev, time: prev.time + 1 };
        }
      });
    }, 1000);
  }, [state.time, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setState({ time: 0, isRunning: false, mode: 'stopwatch' });
  }, [clearTimer]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    time: state.time,
    formattedTime: formatTime(state.time),
    isRunning: state.isRunning,
    mode: state.mode,
    startStopwatch,
    startCountdown,
    pause,
    resume,
    reset,
  };
};
