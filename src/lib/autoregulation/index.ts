export {
  positiveScore,
  negativeScore,
  sleepHoursScore,
  timeAvailabilityScore,
  computeDailyScore,
  computePreWorkoutScore,
  computePerformanceScore,
  computeFatigueScore,
  computeReadinessScore,
  getReadinessState,
  checkVetoRules,
  performanceVsBaselineScore,
  dropoffScore,
  planCompletionScore,
  intensityAdherenceScore,
  rirDeviationScore,
} from './scoring';

export type {
  DailyCheckInInput,
  PreWorkoutCheckInInput,
  PerformanceInput,
  FatigueInput,
  ReadinessInput,
  ReadinessState,
  VetoInput,
  VetoResult,
} from './scoring';

export {
  computeRecommendations,
} from './recommendationEngine';

export type {
  RecommendationType,
  Recommendation,
  ExerciseContext,
  SessionContext,
  EngineInput,
  EngineOutput,
} from './recommendationEngine';

export {
  analyzeRirAdherence,
  getIntensityAdherenceLevel,
  detectDeviationPattern,
  rirAnalysisToPerformanceInputs,
} from './rirAnalysis';

export type {
  DeviationReason,
  SetLogInput,
  RirAnalysis,
  SetDeviation,
  IntensityAdherenceLevel,
  DeviationPattern,
} from './rirAnalysis';
