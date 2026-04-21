/**
 * useCoachInterventionEvents — Recolecta eventos relevantes de un atleta para
 * que el coach pueda convertirlos en mensajes escritos (Fase 1).
 *
 * Fuentes:
 *   1. coach_intervention_events ya persistidos
 *   2. Detección on-the-fly desde:
 *      - performance_alerts (set_validation:* + alertas globales)
 *      - coach_performance_alerts
 *      - athlete_metrics (sleep_hours)
 *      - fatigue_state (global_fatigue)
 *      - nutrition_daily / food_logs vs nutrition_goals
 *      - adherence_logs (microcycle_adherence)
 *
 * Nota: para no duplicar, el hook devuelve también la lista de eventos
 * derivados con un "fingerprint" para ser materializados (insert) cuando
 * el coach decida actuar sobre uno.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  EVENT_TYPE_LABEL,
  type InterventionEventType,
  type InterventionTemplateInput,
} from "@/lib/coachCopy";

export type InterventionStatus = "pending" | "drafted" | "sent" | "dismissed";
export type InterventionSeverity = "low" | "medium" | "high";

export interface CoachInterventionEvent {
  /** id real (si ya está en BD) o id sintético (`virtual:...`) si es derivado. */
  id: string;
  isPersisted: boolean;
  coach_id: string | null;
  athlete_id: string;
  event_type: InterventionEventType;
  severity: InterventionSeverity;
  summary: string;
  metadata: InterventionTemplateInput & Record<string, any>;
  source_alert_id: string | null;
  source_table: string | null;
  status: InterventionStatus;
  generated_message: string | null;
  sent_message_id: string | null;
  sent_at: string | null;
  created_at: string; // ISO
  /** Fecha de referencia del evento subyacente (puede no coincidir con created_at). */
  occurred_at: string;
}

const SEVERITY_RANK: Record<InterventionSeverity, number> = { high: 3, medium: 2, low: 1 };

function syntheticId(parts: (string | number | null | undefined)[]) {
  return "virtual:" + parts.filter(Boolean).join("|");
}

async function fetchCoachProfileId(authUid: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from("profiles")
    .select("id")
    .eq("user_id", authUid)
    .maybeSingle();
  return data?.id ?? null;
}

async function fetchAthleteAuthUid(athleteProfileId: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from("profiles")
    .select("user_id")
    .eq("id", athleteProfileId)
    .maybeSingle();
  return data?.user_id ?? null;
}

export function useCoachInterventionEvents(athleteProfileId: string | null) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CoachInterventionEvent[]>([]);
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user || !athleteProfileId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coachId = await fetchCoachProfileId(user.id);
      setCoachProfileId(coachId);
      const athleteUid = await fetchAthleteAuthUid(athleteProfileId);

      // 1) Persisted events
      const { data: persistedRaw } = await (supabase as any)
        .from("coach_intervention_events")
        .select("*")
        .eq("athlete_id", athleteProfileId)
        .order("created_at", { ascending: false })
        .limit(100);

      const persisted: CoachInterventionEvent[] = (persistedRaw ?? []).map((r: any) => ({
        id: r.id,
        isPersisted: true,
        coach_id: r.coach_id,
        athlete_id: r.athlete_id,
        event_type: r.event_type,
        severity: r.severity,
        summary: r.summary,
        metadata: r.metadata ?? {},
        source_alert_id: r.source_alert_id,
        source_table: r.source_table,
        status: r.status,
        generated_message: r.generated_message,
        sent_message_id: r.sent_message_id,
        sent_at: r.sent_at,
        created_at: r.created_at,
        occurred_at: r.created_at,
      }));

      const fingerprintsTaken = new Set<string>(
        persisted
          .filter((e) => e.source_alert_id)
          .map((e) => `${e.event_type}|${e.source_alert_id}`),
      );

      const derived: CoachInterventionEvent[] = [];

      if (athleteUid) {
        const sinceDate = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
        const sinceTs = new Date(Date.now() - 14 * 86400000).toISOString();

        const [
          perfAlertsRes,
          coachAlertsRes,
          metricsRes,
          fatigueRes,
          nutritionRes,
          goalsRes,
          adhRes,
        ] = await Promise.all([
          (supabase as any)
            .from("performance_alerts")
            .select("id, alert_type, severity, metadata, created_at")
            .eq("user_id", athleteUid)
            .gte("created_at", sinceTs)
            .order("created_at", { ascending: false })
            .limit(50),
          (supabase as any)
            .from("coach_performance_alerts")
            .select("id, alert_type, alert_title, alert_message, severity, date, is_active")
            .eq("user_id", athleteProfileId)
            .eq("is_active", true)
            .gte("date", sinceDate)
            .order("date", { ascending: false })
            .limit(30),
          (supabase as any)
            .from("athlete_metrics")
            .select("id, date, sleep_hours")
            .eq("user_id", athleteProfileId)
            .gte("date", sinceDate)
            .order("date", { ascending: false })
            .limit(7),
          (supabase as any)
            .from("fatigue_state")
            .select("id, date, global_fatigue, alert_level")
            .eq("user_id", athleteProfileId)
            .gte("date", sinceDate)
            .order("date", { ascending: false })
            .limit(3),
          (supabase as any)
            .from("nutrition_daily")
            .select("id, date, protein_actual, protein_target, calories_actual, calories_target")
            .eq("user_id", athleteProfileId)
            .gte("date", sinceDate)
            .order("date", { ascending: false })
            .limit(7),
          (supabase as any)
            .from("nutrition_goals")
            .select("daily_protein, daily_calories")
            .eq("user_id", athleteUid)
            .order("updated_at", { ascending: false })
            .limit(1),
          (supabase as any)
            .from("adherence_logs")
            .select("date, total_adherence, microcycle_adherence")
            .eq("user_id", athleteProfileId)
            .gte("date", sinceDate)
            .order("date", { ascending: false })
            .limit(7),
        ]);

        // ── performance_alerts (set validation, etc.) ──
        for (const a of perfAlertsRes.data ?? []) {
          const meta = a.metadata ?? {};
          const exerciseName = meta.exercise_name ?? meta.exerciseName ?? null;
          const mapped = mapPerfAlert(a.alert_type as string, meta);
          if (!mapped) continue;
          const fp = `${mapped.event_type}|${a.id}`;
          if (fingerprintsTaken.has(fp)) continue;
          fingerprintsTaken.add(fp);
          derived.push({
            id: syntheticId(["perf", a.id]),
            isPersisted: false,
            coach_id: coachId,
            athlete_id: athleteProfileId,
            event_type: mapped.event_type,
            severity: mapped.severity ?? mapSeverity(a.severity),
            summary: mapped.summary(exerciseName, meta),
            metadata: { ...meta, exerciseName },
            source_alert_id: a.id,
            source_table: "performance_alerts",
            status: "pending",
            generated_message: null,
            sent_message_id: null,
            sent_at: null,
            created_at: a.created_at,
            occurred_at: a.created_at,
          });
        }

        // ── coach_performance_alerts (legacy global alerts) ──
        for (const a of coachAlertsRes.data ?? []) {
          const fp = `coach_alert|${a.id}`;
          if (fingerprintsTaken.has(fp)) continue;
          fingerprintsTaken.add(fp);
          // Try to infer event type from alert_type/title
          const mapped = mapCoachAlert(a.alert_type, a.alert_title, a.alert_message);
          if (!mapped) continue;
          derived.push({
            id: syntheticId(["coach-alert", a.id]),
            isPersisted: false,
            coach_id: coachId,
            athlete_id: athleteProfileId,
            event_type: mapped.event_type,
            severity: mapSeverity(a.severity),
            summary: a.alert_title ?? a.alert_message ?? EVENT_TYPE_LABEL[mapped.event_type],
            metadata: { detail: a.alert_message },
            source_alert_id: a.id,
            source_table: "coach_performance_alerts",
            status: "pending",
            generated_message: null,
            sent_message_id: null,
            sent_at: null,
            created_at: a.date + "T00:00:00.000Z",
            occurred_at: a.date,
          });
        }

        // ── Sleep ──
        const lastSleep = (metricsRes.data ?? []).find((m: any) => m.sleep_hours != null);
        if (lastSleep && lastSleep.sleep_hours < 6.5) {
          const fp = `low_sleep|metric:${lastSleep.id}`;
          if (!fingerprintsTaken.has(fp)) {
            fingerprintsTaken.add(fp);
            derived.push({
              id: syntheticId(["sleep", lastSleep.id]),
              isPersisted: false,
              coach_id: coachId,
              athlete_id: athleteProfileId,
              event_type: "low_sleep",
              severity: lastSleep.sleep_hours < 5 ? "high" : "medium",
              summary: `Anoche durmió ${Number(lastSleep.sleep_hours).toFixed(1)} h`,
              metadata: { hours: Number(lastSleep.sleep_hours) },
              source_alert_id: lastSleep.id,
              source_table: "athlete_metrics",
              status: "pending",
              generated_message: null,
              sent_message_id: null,
              sent_at: null,
              created_at: lastSleep.date + "T00:00:00.000Z",
              occurred_at: lastSleep.date,
            });
          }
        }

        // ── Fatigue ──
        const lastFatigue = (fatigueRes.data ?? [])[0];
        if (lastFatigue && lastFatigue.global_fatigue != null && lastFatigue.global_fatigue >= 70) {
          const fp = `high_fatigue|fatigue:${lastFatigue.id}`;
          if (!fingerprintsTaken.has(fp)) {
            fingerprintsTaken.add(fp);
            derived.push({
              id: syntheticId(["fatigue", lastFatigue.id]),
              isPersisted: false,
              coach_id: coachId,
              athlete_id: athleteProfileId,
              event_type: "high_fatigue",
              severity: lastFatigue.global_fatigue >= 85 ? "high" : "medium",
              summary: `Fatiga global ${Math.round(lastFatigue.global_fatigue)}%`,
              metadata: { fatigue: Number(lastFatigue.global_fatigue) },
              source_alert_id: lastFatigue.id,
              source_table: "fatigue_state",
              status: "pending",
              generated_message: null,
              sent_message_id: null,
              sent_at: null,
              created_at: lastFatigue.date + "T00:00:00.000Z",
              occurred_at: lastFatigue.date,
            });
          }
        }

        // ── Nutrition (today) ──
        const goal = goalsRes.data?.[0];
        const nut = (nutritionRes.data ?? [])[0];
        if (nut) {
          const proteinTarget = nut.protein_target ?? goal?.daily_protein ?? null;
          const proteinActual = nut.protein_actual ?? null;
          if (proteinTarget && proteinActual != null) {
            const gap = proteinTarget - proteinActual;
            if (gap > 25) {
              const fp = `low_protein|nutrition:${nut.id}`;
              if (!fingerprintsTaken.has(fp)) {
                fingerprintsTaken.add(fp);
                derived.push({
                  id: syntheticId(["protein", nut.id]),
                  isPersisted: false,
                  coach_id: coachId,
                  athlete_id: athleteProfileId,
                  event_type: "low_protein",
                  severity: gap > 50 ? "high" : "medium",
                  summary: `Proteína ${Math.round(proteinActual)}/${Math.round(proteinTarget)} g (faltan ${Math.round(gap)} g)`,
                  metadata: { proteinGap: gap },
                  source_alert_id: nut.id,
                  source_table: "nutrition_daily",
                  status: "pending",
                  generated_message: null,
                  sent_message_id: null,
                  sent_at: null,
                  created_at: nut.date + "T00:00:00.000Z",
                  occurred_at: nut.date,
                });
              }
            }
          }
          const calTarget = nut.calories_target ?? goal?.daily_calories ?? null;
          const calActual = nut.calories_actual ?? null;
          if (calTarget && calActual != null) {
            const diff = calActual - calTarget;
            const pct = Math.abs(diff) / calTarget;
            if (pct > 0.15) {
              const fp = `calorie_off|nutrition:${nut.id}`;
              if (!fingerprintsTaken.has(fp)) {
                fingerprintsTaken.add(fp);
                derived.push({
                  id: syntheticId(["calories", nut.id]),
                  isPersisted: false,
                  coach_id: coachId,
                  athlete_id: athleteProfileId,
                  event_type: "calorie_off_target",
                  severity: pct > 0.3 ? "high" : "medium",
                  summary: `Calorías ${Math.round(calActual)}/${Math.round(calTarget)} (${diff > 0 ? "+" : ""}${Math.round(diff)} kcal)`,
                  metadata: { caloriesGap: diff },
                  source_alert_id: nut.id,
                  source_table: "nutrition_daily",
                  status: "pending",
                  generated_message: null,
                  sent_message_id: null,
                  sent_at: null,
                  created_at: nut.date + "T00:00:00.000Z",
                  occurred_at: nut.date,
                });
              }
            }
          }
        }

        // ── Adherence (microcycle) ──
        const lastAdh = (adhRes.data ?? []).find((r: any) => r.microcycle_adherence != null || r.total_adherence != null);
        if (lastAdh) {
          const value = lastAdh.microcycle_adherence ?? lastAdh.total_adherence;
          if (value != null && value < 60) {
            const fp = `low_adherence|adh:${lastAdh.date}`;
            if (!fingerprintsTaken.has(fp)) {
              fingerprintsTaken.add(fp);
              derived.push({
                id: syntheticId(["adh", lastAdh.date]),
                isPersisted: false,
                coach_id: coachId,
                athlete_id: athleteProfileId,
                event_type: "low_adherence",
                severity: value < 40 ? "high" : "medium",
                summary: `Adherencia ${Math.round(value)}% últimos días`,
                metadata: { adherencePct: value },
                source_alert_id: null,
                source_table: "adherence_logs",
                status: "pending",
                generated_message: null,
                sent_message_id: null,
                sent_at: null,
                created_at: lastAdh.date + "T00:00:00.000Z",
                occurred_at: lastAdh.date,
              });
            }
          } else if (value != null && value >= 90) {
            const fp = `progress|adh:${lastAdh.date}`;
            if (!fingerprintsTaken.has(fp)) {
              fingerprintsTaken.add(fp);
              derived.push({
                id: syntheticId(["progress", lastAdh.date]),
                isPersisted: false,
                coach_id: coachId,
                athlete_id: athleteProfileId,
                event_type: "progress_milestone",
                severity: "low",
                summary: `Adherencia ${Math.round(value)}% — semana excelente`,
                metadata: { detail: `adherencia ${Math.round(value)}%` },
                source_alert_id: null,
                source_table: "adherence_logs",
                status: "pending",
                generated_message: null,
                sent_message_id: null,
                sent_at: null,
                created_at: lastAdh.date + "T00:00:00.000Z",
                occurred_at: lastAdh.date,
              });
            }
          }
        }
      }

      const merged = [...persisted, ...derived].sort((a, b) => {
        // sent/dismissed al final, luego por severidad, luego por fecha
        const aActive = a.status === "pending" || a.status === "drafted" ? 1 : 0;
        const bActive = b.status === "pending" || b.status === "drafted" ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
        if (sev !== 0) return sev;
        return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
      });

      setEvents(merged);
    } catch (e: any) {
      console.error("[useCoachInterventionEvents]", e);
      setError(e?.message ?? "Error cargando eventos");
    } finally {
      setLoading(false);
    }
  }, [user, athleteProfileId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  /** Materializa un evento derivado (insert) o actualiza uno persistido. */
  const upsertEvent = useCallback(
    async (event: CoachInterventionEvent, patch: Partial<CoachInterventionEvent>): Promise<{ id: string | null; error: string | null }> => {
      if (!coachProfileId) return { id: null, error: "No coach profile" };

      if (event.isPersisted) {
        const { error } = await (supabase as any)
          .from("coach_intervention_events")
          .update({
            generated_message: patch.generated_message ?? event.generated_message,
            status: patch.status ?? event.status,
            sent_message_id: patch.sent_message_id ?? event.sent_message_id,
            sent_at: patch.sent_at ?? event.sent_at,
          })
          .eq("id", event.id);
        return { id: event.id, error: error?.message ?? null };
      }

      const { data, error } = await (supabase as any)
        .from("coach_intervention_events")
        .insert({
          coach_id: coachProfileId,
          athlete_id: event.athlete_id,
          event_type: event.event_type,
          severity: event.severity,
          summary: event.summary,
          metadata: event.metadata,
          source_alert_id: event.source_alert_id,
          source_table: event.source_table,
          status: patch.status ?? "drafted",
          generated_message: patch.generated_message ?? event.generated_message,
        })
        .select()
        .single();

      return { id: data?.id ?? null, error: error?.message ?? null };
    },
    [coachProfileId],
  );

  const dismissEvent = useCallback(
    async (event: CoachInterventionEvent) => {
      if (!coachProfileId) return { error: "No coach profile" };
      if (!event.isPersisted) {
        // Persist as dismissed
        const { error } = await (supabase as any)
          .from("coach_intervention_events")
          .insert({
            coach_id: coachProfileId,
            athlete_id: event.athlete_id,
            event_type: event.event_type,
            severity: event.severity,
            summary: event.summary,
            metadata: event.metadata,
            source_alert_id: event.source_alert_id,
            source_table: event.source_table,
            status: "dismissed",
            dismissed_at: new Date().toISOString(),
          });
        if (!error) await refetch();
        return { error: error?.message ?? null };
      }
      const { error } = await (supabase as any)
        .from("coach_intervention_events")
        .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
        .eq("id", event.id);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [coachProfileId, refetch],
  );

  return { events, loading, error, refetch, coachProfileId, upsertEvent, dismissEvent };
}

// ── helpers ──

function mapSeverity(s: string | null | undefined): InterventionSeverity {
  if (s === "high" || s === "strong" || s === "critical") return "high";
  if (s === "low" || s === "info") return "low";
  return "medium";
}

interface MappedAlert {
  event_type: InterventionEventType;
  severity?: InterventionSeverity;
  summary: (exerciseName: string | null, meta: any) => string;
}

function mapPerfAlert(alertType: string, meta: any): MappedAlert | null {
  // set_validation:* prefixes
  if (alertType.startsWith("set_validation:")) {
    const kind = alertType.split(":")[1];
    if (kind === "out_of_range" || kind === "reps_below_range" || kind === "reps_above_range") {
      return {
        event_type: "reps_out_of_range",
        summary: (ex) => `Reps fuera de rango${ex ? ` en ${ex}` : ""}`,
      };
    }
    if (kind === "missing_set" || kind === "incomplete_exercise") {
      return {
        event_type: "missing_set",
        summary: (ex) => `Serie faltante${ex ? ` en ${ex}` : ""}`,
      };
    }
    if (kind === "load_drop") {
      return {
        event_type: "load_drop",
        summary: (ex, m) => `Caída de carga${m?.delta_pct ? ` ${Math.round(Math.abs(m.delta_pct))}%` : ""}${ex ? ` en ${ex}` : ""}`,
      };
    }
  }
  if (alertType === "performance_drop" || alertType === "negative_outlier" || alertType === "strong_negative") {
    return {
      event_type: "performance_drop",
      severity: "high",
      summary: (ex) => `Caída de rendimiento${ex ? ` en ${ex}` : ""}`,
    };
  }
  if (alertType === "positive_outlier" || alertType === "strong_positive") {
    return {
      event_type: "progress_milestone",
      severity: "low",
      summary: (ex) => `Progreso destacado${ex ? ` en ${ex}` : ""}`,
    };
  }
  return null;
}

function mapCoachAlert(
  alertType: string | null,
  title: string | null,
  _message: string | null,
): { event_type: InterventionEventType } | null {
  const haystack = `${alertType ?? ""} ${title ?? ""}`.toLowerCase();
  if (haystack.includes("sleep") || haystack.includes("sueño")) return { event_type: "low_sleep" };
  if (haystack.includes("fatig")) return { event_type: "high_fatigue" };
  if (haystack.includes("protein")) return { event_type: "low_protein" };
  if (haystack.includes("calor")) return { event_type: "calorie_off_target" };
  if (haystack.includes("adher")) return { event_type: "low_adherence" };
  if (haystack.includes("load") || haystack.includes("carga")) return { event_type: "load_drop" };
  if (haystack.includes("rendim") || haystack.includes("perform")) return { event_type: "performance_drop" };
  return null;
}
