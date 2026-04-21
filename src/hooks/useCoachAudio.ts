/**
 * useCoachAudioMessage — Cliente para crear, generar y enviar audios del coach.
 *
 * Flujo:
 *   1. createDraft(script, intervention)  → INSERT coach_audio_messages (pending)
 *   2. generateScript(event, baseText)    → invoca edge function coach-audio-script
 *   3. synthesize(audioId)                → invoca coach-audio-tts (rellena storage_path)
 *   4. sendToAthlete(audio, event)        → crea mensaje en chat con context_type='audio'
 *                                            + actualiza coach_audio_messages.sent_at
 *                                            + actualiza coach_intervention_events
 *   5. getSignedUrl(audioId)              → URL firmada para reproducción
 *   6. markListened(audioId)              → marca listened_at (atleta)
 */

import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  CoachInterventionEvent,
} from "./useCoachInterventionEvents";
import type { InterventionEventType } from "@/lib/coachCopy";

export interface CoachAudioRow {
  id: string;
  coach_id: string;
  athlete_id: string;
  intervention_event_id: string | null;
  coach_message_id: string | null;
  voice_id: string;
  model_id: string;
  script: string;
  storage_path: string | null;
  duration_seconds: number | null;
  status: "pending" | "generating" | "ready" | "sent" | "failed";
  error_message: string | null;
  listened_at: string | null;
  sent_at: string | null;
  created_at: string;
}

// Voz por defecto en cliente (solo es un placeholder; el TTS real usa
// ELEVENLABS_VOICE_ID del proyecto, la misma voz del briefing de rendimiento).
const FALLBACK_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George (sólo si el secret no está configurado)

export function useCoachAudio(coachProfileId: string | null) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Crea un registro pending con el script inicial. */
  const createDraft = useCallback(
    async (params: {
      athleteProfileId: string;
      script: string;
      interventionEventId: string | null;
    }): Promise<CoachAudioRow | null> => {
      if (!coachProfileId) return null;
      setError(null);
      const { data, error: err } = await (supabase as any)
        .from("coach_audio_messages")
        .insert({
          coach_id: coachProfileId,
          athlete_id: params.athleteProfileId,
          intervention_event_id: params.interventionEventId,
          script: params.script,
          voice_id: FALLBACK_VOICE_ID,
          model_id: "eleven_multilingual_v2",
          status: "pending",
        })
        .select()
        .single();
      if (err) {
        setError(err.message);
        return null;
      }
      return data as CoachAudioRow;
    },
    [coachProfileId],
  );

  /** Genera el script de voz desde un evento via Lovable AI. */
  const generateScript = useCallback(
    async (event: CoachInterventionEvent, athleteFirstName: string | null, baseText?: string | null): Promise<string | null> => {
      setError(null);
      const { data, error: err } = await supabase.functions.invoke("coach-audio-script", {
        body: {
          athleteFirstName,
          eventType: event.event_type,
          eventSummary: event.summary,
          metadata: event.metadata,
          baseText: baseText ?? null,
        },
      });
      if (err) {
        setError(err.message);
        return null;
      }
      const script = (data as any)?.script;
      if (!script || typeof script !== "string") {
        setError("Script vacío");
        return null;
      }
      return script;
    },
    [],
  );

  /** Actualiza el script editado por el coach. */
  const updateScript = useCallback(async (audioId: string, script: string) => {
    const { error: err } = await (supabase as any)
      .from("coach_audio_messages")
      .update({ script })
      .eq("id", audioId);
    if (err) setError(err.message);
    return { error: err?.message ?? null };
  }, []);

  /** Llama a ElevenLabs vía edge function. */
  const synthesize = useCallback(async (audioId: string): Promise<{ ok: boolean; signedUrl: string | null; durationSeconds: number | null }> => {
    setBusyId(audioId);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("coach-audio-tts", {
        body: { audioId },
      });
      if (err) {
        setError(err.message);
        return { ok: false, signedUrl: null, durationSeconds: null };
      }
      const payload = data as any;
      return {
        ok: payload?.status === "ready" || payload?.status === "sent",
        signedUrl: payload?.signed_url ?? null,
        durationSeconds: payload?.duration_seconds ?? null,
      };
    } finally {
      setBusyId(null);
    }
  }, []);

  /** Pide URL firmada para reproducir. */
  const getSignedUrl = useCallback(async (audioId: string): Promise<string | null> => {
    const { data, error: err } = await supabase.functions.invoke("coach-audio-url", {
      body: { audioId },
    });
    if (err) {
      setError(err.message);
      return null;
    }
    return (data as any)?.signed_url ?? null;
  }, []);

  /** Envía el audio al chat: crea coach_messages con context_type='audio'. */
  const sendToAthlete = useCallback(
    async (params: {
      audio: CoachAudioRow;
      eventType: InterventionEventType;
      eventSummary: string;
    }): Promise<{ messageId: string | null; error: string | null }> => {
      if (!coachProfileId) return { messageId: null, error: "Sin coach" };
      setError(null);
      const { audio } = params;

      // 1) conversación
      let conversationId: string | null = null;
      const { data: existing } = await (supabase as any)
        .from("coach_conversations")
        .select("id")
        .eq("athlete_id", audio.athlete_id)
        .eq("coach_id", coachProfileId)
        .maybeSingle();
      if (existing) conversationId = existing.id;
      else {
        const { data: created, error: convErr } = await (supabase as any)
          .from("coach_conversations")
          .insert({ athlete_id: audio.athlete_id, coach_id: coachProfileId })
          .select()
          .single();
        if (convErr) return { messageId: null, error: convErr.message };
        conversationId = created.id;
      }
      if (!conversationId) return { messageId: null, error: "Sin conversación" };

      // 2) mensaje de chat
      const { data: msg, error: msgErr } = await (supabase as any)
        .from("coach_messages")
        .insert({
          conversation_id: conversationId,
          athlete_id: audio.athlete_id,
          coach_id: coachProfileId,
          sender_id: coachProfileId,
          sender_role: "coach",
          message: audio.script, // se mantiene el script como texto accesible
          context_type: "audio",
          metadata: {
            audio_id: audio.id,
            event_type: params.eventType,
            event_summary: params.eventSummary,
            duration_seconds: audio.duration_seconds,
            kind: "intervention_audio",
          },
        })
        .select()
        .single();
      if (msgErr) return { messageId: null, error: msgErr.message };

      // 3) actualizar registros
      await (supabase as any)
        .from("coach_audio_messages")
        .update({
          coach_message_id: msg.id,
          status: "sent",
          sent_at: msg.created_at,
        })
        .eq("id", audio.id);

      await (supabase as any)
        .from("coach_conversations")
        .update({
          last_message_at: msg.created_at,
          last_message_preview: "🎙️ Audio del coach",
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      // 4) cerrar evento de intervención
      if (audio.intervention_event_id) {
        await (supabase as any)
          .from("coach_intervention_events")
          .update({
            status: "sent",
            sent_message_id: msg.id,
            sent_at: msg.created_at,
            generated_message: audio.script,
          })
          .eq("id", audio.intervention_event_id);
      }

      return { messageId: msg.id, error: null };
    },
    [coachProfileId],
  );

  /** Marca el audio como escuchado (atleta). */
  const markListened = useCallback(async (audioId: string) => {
    await (supabase as any)
      .from("coach_audio_messages")
      .update({ listened_at: new Date().toISOString() })
      .eq("id", audioId)
      .is("listened_at", null);
  }, []);

  return {
    busyId,
    error,
    createDraft,
    generateScript,
    updateScript,
    synthesize,
    getSignedUrl,
    sendToAthlete,
    markListened,
  };
}
