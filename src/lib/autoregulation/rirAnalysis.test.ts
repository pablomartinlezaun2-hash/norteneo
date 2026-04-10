import { describe, it, expect } from 'vitest';
import {
  analyzeRirAdherence,
  getIntensityAdherenceLevel,
  detectDeviationPattern,
  rirAnalysisToPerformanceInputs,
  type SetLogInput,
} from './rirAnalysis';

const mkSet = (overrides: Partial<SetLogInput> = {}): SetLogInput => ({
  set_number: 1, weight: 100, reps: 8,
  target_rir: 0, actual_rir: 0, is_warmup: false,
  ...overrides,
});

describe('analyzeRirAdherence', () => {
  it('perfect adherence: all sets on target', () => {
    const sets = [mkSet({ set_number: 1 }), mkSet({ set_number: 2 }), mkSet({ set_number: 3 })];
    const a = analyzeRirAdherence(sets);
    expect(a.total_working_sets).toBe(3);
    expect(a.sets_on_target_rir).toBe(3);
    expect(a.intensity_adherence_ratio).toBe(1.0);
    expect(a.avg_rir_deviation).toBe(0);
    expect(a.high_deviation_set_count).toBe(0);
  });

  it('excludes warmup sets', () => {
    const sets = [
      mkSet({ set_number: 1, is_warmup: true }),
      mkSet({ set_number: 2 }),
    ];
    const a = analyzeRirAdherence(sets);
    expect(a.total_working_sets).toBe(1);
  });

  it('excludes sets with null actual_rir', () => {
    const sets = [
      mkSet({ set_number: 1, actual_rir: null }),
      mkSet({ set_number: 2, actual_rir: 0 }),
    ];
    const a = analyzeRirAdherence(sets);
    expect(a.total_working_sets).toBe(1);
  });

  it('correctly classifies below-target intensity (actual_rir > target)', () => {
    const sets = [
      mkSet({ set_number: 1, target_rir: 0, actual_rir: 2, deviation_reason: 'DID_NOT_FEEL_WELL' }),
      mkSet({ set_number: 2, target_rir: 0, actual_rir: 1 }),
      mkSet({ set_number: 3, target_rir: 0, actual_rir: 0 }),
    ];
    const a = analyzeRirAdherence(sets);
    expect(a.sets_on_target_rir).toBe(1);
    expect(a.sets_below_target_intensity).toBe(2);
    expect(a.sets_above_target_intensity).toBe(0);
    expect(a.intensity_adherence_ratio).toBeCloseTo(1 / 3);
    expect(a.avg_rir_deviation).toBe(1); // (2+1+0)/3
    expect(a.high_deviation_set_count).toBe(1); // only the 2-dev set
    expect(a.deviation_reason_counts.DID_NOT_FEEL_WELL).toBe(1);
  });

  it('correctly classifies above-target intensity (actual_rir < target)', () => {
    const sets = [
      mkSet({ set_number: 1, target_rir: 2, actual_rir: 0 }),
    ];
    const a = analyzeRirAdherence(sets);
    expect(a.sets_above_target_intensity).toBe(1);
    expect(a.avg_rir_deviation).toBe(2);
    expect(a.high_deviation_set_count).toBe(1);
  });

  it('empty input returns safe defaults', () => {
    const a = analyzeRirAdherence([]);
    expect(a.total_working_sets).toBe(0);
    expect(a.intensity_adherence_ratio).toBe(1.0);
    expect(a.avg_rir_deviation).toBe(0);
  });
});

describe('getIntensityAdherenceLevel', () => {
  it('PERFECT when ratio high and avg_dev low', () => {
    const a = analyzeRirAdherence([mkSet(), mkSet({ set_number: 2 }), mkSet({ set_number: 3 })]);
    expect(getIntensityAdherenceLevel(a)).toBe('PERFECT');
  });

  it('LOW when most sets deviate', () => {
    const sets = [
      mkSet({ set_number: 1, actual_rir: 3 }),
      mkSet({ set_number: 2, actual_rir: 2 }),
      mkSet({ set_number: 3, actual_rir: 3 }),
    ];
    const a = analyzeRirAdherence(sets);
    expect(getIntensityAdherenceLevel(a)).toBe('LOW');
  });

  it('INSUFFICIENT with no data', () => {
    const a = analyzeRirAdherence([]);
    expect(getIntensityAdherenceLevel(a)).toBe('INSUFFICIENT');
  });
});

describe('detectDeviationPattern', () => {
  it('pain_driven when pain reasons dominate', () => {
    const sets = [
      mkSet({ set_number: 1, actual_rir: 2, deviation_reason: 'PAIN_OR_DISCOMFORT' }),
      mkSet({ set_number: 2, actual_rir: 3, deviation_reason: 'PAIN_OR_DISCOMFORT' }),
      mkSet({ set_number: 3, actual_rir: 1, deviation_reason: 'OTHER' }),
    ];
    const a = analyzeRirAdherence(sets);
    const p = detectDeviationPattern(a);
    expect(p.pattern).toBe('pain_driven');
  });

  it('technique_issues when unstable technique dominates', () => {
    const sets = [
      mkSet({ set_number: 1, actual_rir: 2, deviation_reason: 'TECHNIQUE_UNSTABLE' }),
      mkSet({ set_number: 2, actual_rir: 2, deviation_reason: 'TECHNIQUE_UNSTABLE' }),
    ];
    const a = analyzeRirAdherence(sets);
    const p = detectDeviationPattern(a);
    expect(p.pattern).toBe('technique_issues');
  });

  it('none when adherence is good', () => {
    const sets = [mkSet(), mkSet({ set_number: 2 })];
    const a = analyzeRirAdherence(sets);
    const p = detectDeviationPattern(a);
    expect(p.pattern).toBe('none');
  });
});

describe('rirAnalysisToPerformanceInputs', () => {
  it('maps correctly', () => {
    const sets = [
      mkSet({ set_number: 1, actual_rir: 1 }),
      mkSet({ set_number: 2, actual_rir: 0 }),
    ];
    const a = analyzeRirAdherence(sets);
    const p = rirAnalysisToPerformanceInputs(a);
    expect(p.intensity_adherence_ratio).toBe(0.5);
    expect(p.avg_rir_deviation).toBe(0.5);
  });
});
