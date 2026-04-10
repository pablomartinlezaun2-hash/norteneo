/**
 * Session Plan Manager — NEO
 *
 * Manages base plan, recommended plan, and active plan states.
 * Tracks recommendation history with timestamps.
 * Pure reducer logic, no DB calls.
 */

import type { Recommendation, ExerciseContext, SessionContext } from '@/lib/autoregulation/recommendationEngine';

// ─── Types ────────────────────────────────────────────────────────

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'none';

export interface ExercisePlan {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  rep_range: string;
  rir: number;
  is_modified: boolean;
  modification_type?: 'added_set' | 'removed_set' | 'increased_rir' | 'substituted';
  original_exercise_name?: string;
}

export interface SessionPlan {
  session_id: string;
  exercises: ExercisePlan[];
}

export interface RecommendationHistoryEntry {
  id: string;
  recommendation: Recommendation;
  status: RecommendationStatus;
  responded_at: string | null;
  phase: 'pre_session' | 'mid_session';
  readiness_score: number;
}

export interface SessionPlanState {
  /** Original unmodified plan */
  basePlan: SessionPlan;
  /** Plan with pending recommendations applied (preview) */
  recommendedPlan: SessionPlan | null;
  /** The plan currently being executed */
  activePlan: SessionPlan;
  /** Full history of recommendations for this session */
  history: RecommendationHistoryEntry[];
  /** Whether mid-session recommendations are showing */
  midSessionPending: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────

export type SessionPlanAction =
  | { type: 'INIT'; basePlan: SessionPlan }
  | { type: 'SET_RECOMMENDED'; recommendations: Recommendation[]; readinessScore: number; phase: 'pre_session' | 'mid_session' }
  | { type: 'ACCEPT_RECOMMENDATION'; historyId: string }
  | { type: 'REJECT_RECOMMENDATION'; historyId: string }
  | { type: 'ACCEPT_ALL_PENDING' }
  | { type: 'REJECT_ALL_PENDING' }
  | { type: 'COMMIT_RESPONSES' }
  | { type: 'CLEAR_MID_SESSION' };

// ─── Helpers ──────────────────────────────────────────────────────

function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function applyRecommendationToPlan(plan: SessionPlan, rec: Recommendation): SessionPlan {
  const p = rec.recommendation_payload;
  const exercises = [...plan.exercises];

  switch (rec.recommendation_type) {
    case 'ADD_SET': {
      return {
        ...plan,
        exercises: exercises.map(ex =>
          ex.exercise_id === rec.exercise_id
            ? { ...ex, sets: Number(p.recommended_sets), is_modified: true, modification_type: 'added_set' as const }
            : ex
        ),
      };
    }

    case 'REMOVE_SET': {
      return {
        ...plan,
        exercises: exercises.map(ex =>
          ex.exercise_id === rec.exercise_id
            ? { ...ex, sets: Number(p.recommended_sets), is_modified: true, modification_type: 'removed_set' as const }
            : ex
        ),
      };
    }

    case 'INCREASE_RIR': {
      return {
        ...plan,
        exercises: exercises.map(ex =>
          ex.exercise_id === rec.exercise_id
            ? { ...ex, rir: Number(p.recommended_rir), is_modified: true, modification_type: 'increased_rir' as const }
            : ex
        ),
      };
    }

    case 'SUBSTITUTE_EXERCISE': {
      return {
        ...plan,
        exercises: exercises.map(ex =>
          ex.exercise_id === rec.exercise_id
            ? {
                ...ex,
                exercise_id: String(p.substitute_exercise_id),
                exercise_name: String(p.substitute_exercise_name),
                sets: Number(p.keep_sets),
                rep_range: String(p.keep_rep_range),
                rir: Number(p.keep_rir),
                is_modified: true,
                modification_type: 'substituted' as const,
                original_exercise_name: String(p.original_exercise_name),
              }
            : ex
        ),
      };
    }

    case 'RESTRUCTURE_SESSION': {
      const kept = (p.kept_exercises as Array<{ exercise_id: string; exercise_name: string; recommended_sets: number; recommended_rir: number; keep_rep_range: string }>) ?? [];
      const newExercises: ExercisePlan[] = kept.map(k => ({
        exercise_id: k.exercise_id,
        exercise_name: k.exercise_name,
        sets: k.recommended_sets,
        rep_range: k.keep_rep_range,
        rir: k.recommended_rir,
        is_modified: true,
        modification_type: 'removed_set' as const,
      }));
      return { ...plan, exercises: newExercises };
    }

    case 'KEEP_PLAN':
    default:
      return plan;
  }
}

function buildRecommendedPlan(basePlan: SessionPlan, acceptedRecs: Recommendation[]): SessionPlan {
  let plan = { ...basePlan, exercises: basePlan.exercises.map(e => ({ ...e })) };
  for (const rec of acceptedRecs) {
    plan = applyRecommendationToPlan(plan, rec);
  }
  return plan;
}

// ─── Reducer ──────────────────────────────────────────────────────

export function sessionPlanReducer(state: SessionPlanState, action: SessionPlanAction): SessionPlanState {
  switch (action.type) {
    case 'INIT': {
      const cleanPlan: SessionPlan = {
        ...action.basePlan,
        exercises: action.basePlan.exercises.map(e => ({ ...e, is_modified: false })),
      };
      return {
        basePlan: cleanPlan,
        recommendedPlan: null,
        activePlan: cleanPlan,
        history: [],
        midSessionPending: false,
      };
    }

    case 'SET_RECOMMENDED': {
      const newEntries: RecommendationHistoryEntry[] = action.recommendations
        .filter(r => r.recommendation_type !== 'KEEP_PLAN')
        .map(rec => ({
          id: generateId(),
          recommendation: rec,
          status: 'pending' as RecommendationStatus,
          responded_at: null,
          phase: action.phase,
          readiness_score: action.readinessScore,
        }));

      // Build preview with all pending recs applied
      const previewPlan = buildRecommendedPlan(
        state.activePlan,
        newEntries.map(e => e.recommendation)
      );

      return {
        ...state,
        history: [...state.history, ...newEntries],
        recommendedPlan: newEntries.length > 0 ? previewPlan : null,
        midSessionPending: action.phase === 'mid_session',
      };
    }

    case 'ACCEPT_RECOMMENDATION': {
      const now = new Date().toISOString();
      const history = state.history.map(h =>
        h.id === action.historyId ? { ...h, status: 'accepted' as RecommendationStatus, responded_at: now } : h
      );

      // Rebuild active plan from base + all accepted recs
      const acceptedRecs = history
        .filter(h => h.status === 'accepted')
        .map(h => h.recommendation);
      const activePlan = buildRecommendedPlan(state.basePlan, acceptedRecs);

      // Recompute recommended preview from active + remaining pending
      const pendingRecs = history
        .filter(h => h.status === 'pending')
        .map(h => h.recommendation);
      const recommendedPlan = pendingRecs.length > 0
        ? buildRecommendedPlan(activePlan, pendingRecs)
        : null;

      return { ...state, history, activePlan, recommendedPlan };
    }

    case 'REJECT_RECOMMENDATION': {
      const now = new Date().toISOString();
      const history = state.history.map(h =>
        h.id === action.historyId ? { ...h, status: 'rejected' as RecommendationStatus, responded_at: now } : h
      );

      // Recompute recommended preview from active + remaining pending
      const pendingRecs = history
        .filter(h => h.status === 'pending')
        .map(h => h.recommendation);
      const acceptedRecs = history
        .filter(h => h.status === 'accepted')
        .map(h => h.recommendation);
      const activePlan = buildRecommendedPlan(state.basePlan, acceptedRecs);
      const recommendedPlan = pendingRecs.length > 0
        ? buildRecommendedPlan(activePlan, pendingRecs)
        : null;

      return { ...state, history, activePlan, recommendedPlan };
    }

    case 'ACCEPT_ALL_PENDING': {
      const now = new Date().toISOString();
      const history = state.history.map(h =>
        h.status === 'pending' ? { ...h, status: 'accepted' as RecommendationStatus, responded_at: now } : h
      );
      const acceptedRecs = history
        .filter(h => h.status === 'accepted')
        .map(h => h.recommendation);
      const activePlan = buildRecommendedPlan(state.basePlan, acceptedRecs);
      return { ...state, history, activePlan, recommendedPlan: null, midSessionPending: false };
    }

    case 'REJECT_ALL_PENDING': {
      const now = new Date().toISOString();
      const history = state.history.map(h =>
        h.status === 'pending' ? { ...h, status: 'rejected' as RecommendationStatus, responded_at: now } : h
      );
      return { ...state, history, recommendedPlan: null, midSessionPending: false };
    }

    case 'COMMIT_RESPONSES': {
      return { ...state, recommendedPlan: null, midSessionPending: false };
    }

    case 'CLEAR_MID_SESSION': {
      return { ...state, midSessionPending: false, recommendedPlan: null };
    }

    default:
      return state;
  }
}

// ─── Selectors ────────────────────────────────────────────────────

export function getPendingRecommendations(state: SessionPlanState): RecommendationHistoryEntry[] {
  return state.history.filter(h => h.status === 'pending');
}

export function getAcceptedRecommendations(state: SessionPlanState): RecommendationHistoryEntry[] {
  return state.history.filter(h => h.status === 'accepted');
}

export function getRejectedRecommendations(state: SessionPlanState): RecommendationHistoryEntry[] {
  return state.history.filter(h => h.status === 'rejected');
}

export function hasUnrespondedRecommendations(state: SessionPlanState): boolean {
  return state.history.some(h => h.status === 'pending');
}

export function getSessionSummary(state: SessionPlanState) {
  return {
    total_recommendations: state.history.length,
    accepted: state.history.filter(h => h.status === 'accepted').length,
    rejected: state.history.filter(h => h.status === 'rejected').length,
    pending: state.history.filter(h => h.status === 'pending').length,
    plan_was_modified: state.history.some(h => h.status === 'accepted'),
    modifications: state.history
      .filter(h => h.status === 'accepted')
      .map(h => ({
        type: h.recommendation.recommendation_type,
        exercise_id: h.recommendation.exercise_id,
        phase: h.phase,
      })),
  };
}

// ─── Session context → Plan conversion ────────────────────────────

export function sessionContextToBasePlan(ctx: SessionContext): SessionPlan {
  return {
    session_id: ctx.session_id,
    exercises: ctx.exercises.map(ex => ({
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise_name,
      sets: ex.planned_sets,
      rep_range: ex.planned_rep_range,
      rir: ex.planned_rir,
      is_modified: false,
    })),
  };
}
