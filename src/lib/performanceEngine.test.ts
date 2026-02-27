import { describe, it, expect } from 'vitest';
import {
  calculateSetMetrics,
  aggregateSessionExercise,
  calculateBaseline,
  calculateRunningLoad,
  calculateSwimmingLoad,
  calculateFatigue,
  detectAlerts,
  getPointColor,
  DEFAULT_CONFIG,
} from '@/lib/performanceEngine';

describe('PerformanceEngine', () => {
  describe('calculateSetMetrics', () => {
    it('computes est_1RM correctly with Epley (example 1: 80kg × 10, RIR 0)', () => {
      const result = calculateSetMetrics(80, 10, 0);
      // RTF = 10+0 = 10; est_1RM = 80*(1+10/30) = 80*1.333... = 106.67
      expect(result.rtf).toBe(10);
      expect(result.est_1rm_set).toBeCloseTo(106.67, 1);
    });

    it('computes est_1RM correctly (example 2: 80kg × 13, RIR 2)', () => {
      const result = calculateSetMetrics(80, 13, 2);
      // RTF = 13+2 = 15; est_1RM = 80*(1+15/30) = 80*1.5 = 120
      expect(result.rtf).toBe(15);
      expect(result.est_1rm_set).toBe(120);
    });

    it('uses rir_default when RIR is null', () => {
      const result = calculateSetMetrics(100, 5, null);
      // RTF = 5+0 = 5; est_1RM = 100*(1+5/30) = 100*1.1667 = 116.67
      expect(result.rir).toBe(0);
      expect(result.est_1rm_set).toBeCloseTo(116.67, 1);
    });

    it('computes IEM_set correctly', () => {
      const result = calculateSetMetrics(80, 10, 0);
      // IEM = 106.67 * (10 / max(1,10)) = 106.67
      expect(result.iem_set).toBeCloseTo(106.67, 1);
    });
  });

  describe('aggregateSessionExercise', () => {
    it('aggregates multiple sets in a session', () => {
      const result = aggregateSessionExercise('ex1', '2026-01-01', [
        { weight: 80, reps: 10, rir: 0 },
        { weight: 80, reps: 8, rir: 1 },
        { weight: 85, reps: 6, rir: 2 },
      ]);
      expect(result.sets.length).toBe(3);
      expect(result.session_est_1rm).toBeGreaterThan(0);
      expect(result.session_iem).toBeGreaterThan(0);
      // session_est_1rm should be MAX of individual est_1rms
      const maxIndividual = Math.max(...result.sets.map(s => s.est_1rm_set));
      expect(result.session_est_1rm).toBe(maxIndividual);
    });

    it('excludes warmup sets', () => {
      const result = aggregateSessionExercise('ex1', '2026-01-01', [
        { weight: 40, reps: 10, rir: null, is_warmup: true },
        { weight: 80, reps: 10, rir: 0, is_warmup: false },
      ]);
      expect(result.sets.length).toBe(1);
    });
  });

  describe('calculateBaseline', () => {
    it('computes pct_change as improvement', () => {
      // Previous sessions had max est1rm of 106.67
      // Current session has 120
      const result = calculateBaseline(120, [100, 106.67, 105, 108]);
      expect(result.baseline).toBeCloseTo(108, 0);
      expect(result.pct_change).toBeGreaterThan(0);
    });

    it('handles empty history', () => {
      const result = calculateBaseline(100, []);
      expect(result.baseline).toBe(100);
      expect(result.pct_change).toBe(0);
    });
  });

  describe('calculateRunningLoad', () => {
    it('computes running load correctly (60min, 0.6 intensity, tempo)', () => {
      const result = calculateRunningLoad(60, 0.6, 'tempo');
      // TRIMP = 60*0.6 = 36; D_factor = 1.2; load = 43.2
      expect(result.trimp).toBe(36);
      expect(result.running_load).toBeCloseTo(43.2, 1);
      // quad_load = 43.2 * 0.40 = 17.28
      expect(result.muscle_loads.quadriceps).toBeCloseTo(17.28, 1);
    });
  });

  describe('calculateSwimmingLoad', () => {
    it('computes swimming load', () => {
      const result = calculateSwimmingLoad(45, 0.7, 1.2);
      expect(result.swim_load).toBeCloseTo(37.8, 1);
    });
  });

  describe('calculateFatigue', () => {
    it('returns 100% recovery when no training date', () => {
      const result = calculateFatigue('pectoral', null);
      expect(result.recovery_pct).toBe(100);
      expect(result.color).toBe('#10B981');
    });

    it('returns low recovery for recent training', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      const result = calculateFatigue('pectoral', twoHoursAgo);
      expect(result.recovery_pct).toBeLessThan(60);
    });
  });

  describe('detectAlerts', () => {
    it('detects improvement', () => {
      const sessions = [100, 101, 102, 105, 108, 112];
      const alerts = detectAlerts('ex1', 'Bench Press', sessions, 0);
      const improvement = alerts.find(a => a.type === 'improvement');
      expect(improvement).toBeDefined();
    });

    it('returns empty for insufficient data', () => {
      const alerts = detectAlerts('ex1', 'Bench Press', [100, 102], 0);
      expect(alerts.length).toBe(0);
    });
  });

  describe('getPointColor', () => {
    it('returns green for positive', () => {
      expect(getPointColor(0.05)).toBe('#10B981');
    });
    it('returns red for negative', () => {
      expect(getPointColor(-0.05)).toBe('#EF4444');
    });
    it('returns gray for neutral', () => {
      expect(getPointColor(0)).toBe('#6B7280');
    });
  });
});
