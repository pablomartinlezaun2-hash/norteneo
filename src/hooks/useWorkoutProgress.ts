import { useState, useEffect } from 'react';

const STORAGE_KEY = 'workout-progress';

export interface WorkoutProgress {
  completedSessions: string[]; // Array of session IDs with timestamps
  totalCompleted: number;
}

export const useWorkoutProgress = () => {
  const [progress, setProgress] = useState<WorkoutProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return { completedSessions: [], totalCompleted: 0 };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const markSessionComplete = (sessionId: string) => {
    const timestamp = new Date().toISOString();
    const sessionWithTimestamp = `${sessionId}_${timestamp}`;
    
    setProgress(prev => ({
      completedSessions: [...prev.completedSessions, sessionWithTimestamp],
      totalCompleted: prev.totalCompleted + 1
    }));
  };

  const getCyclesCompleted = () => {
    return Math.floor(progress.totalCompleted / 4);
  };

  const getProgressInCurrentCycle = () => {
    return progress.totalCompleted % 4;
  };

  const resetProgress = () => {
    setProgress({ completedSessions: [], totalCompleted: 0 });
  };

  return {
    progress,
    markSessionComplete,
    getCyclesCompleted,
    getProgressInCurrentCycle,
    resetProgress
  };
};
