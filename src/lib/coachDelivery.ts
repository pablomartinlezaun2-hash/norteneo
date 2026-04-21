/**
 * coachDelivery — Capa multicanal de intervenciones del coach.
 *
 * Separa el "qué" (asset canónico: texto/audio/vídeo) del "cómo se entrega"
 * (channel + status). La fase 1 (in-app) ya funciona con sus propias tablas;
 * esta capa la duplica de forma no-bloqueante para preparar la fase futura
 * de WhatsApp sin acoplarse al chat interno.
 *
 * Uso típico:
 *   const asset = await createAsset({ kind: 'audio', ... });
 *   await createDelivery({ asset_id: asset.id, channel: 'in_app_audio', ... });
 *   // mañana, para el mismo asset:
 *   await createDelivery({ asset_id: asset.id, channel: 'whatsapp_audio', ... });
 */

import { supabase } from "@/integrations/supabase/client";

// ---------- Tipos canónicos ----------

export type AssetKind = "text" | "audio" | "video";

export type DeliveryChannel =
  | "in_app_message"
  | "in_app_audio"
  | "in_app_video"
  | "whatsapp_text"
  | "whatsapp_audio"
  | "whatsapp_video";

export type DeliveryStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type GenerationStatus = "pending" | "generating" | "ready" | "failed";

export interface CoachMessageAsset {
  id: string;
  coach_id: string;
  athlete_id: string;
  intervention_event_id: string | null;
  kind: AssetKind;
  body_text: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  duration_seconds: number | null;
  voice_id: string | null;
  avatar_id: string | null;
  generation_status: GenerationStatus;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CoachMessageDelivery {
  id: string;
  asset_id: string;
  coach_id: string;
  athlete_id: string;
  intervention_event_id: string | null;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  coach_message_id: string | null;
  coach_audio_message_id: string | null;
  external_provider: string | null;
  external_message_id: string | null;
  external_payload: Record<string, any> | null;
  error_message: string | null;
  retry_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Mapeos útiles ----------

/** Devuelve el canal in-app correspondiente a un tipo de asset. */
export function inAppChannelFor(kind: AssetKind): DeliveryChannel {
  switch (kind) {
    case "text":
      return "in_app_message";
    case "audio":
      return "in_app_audio";
    case "video":
      return "in_app_video";
  }
}

/** Devuelve el canal WhatsApp correspondiente a un tipo de asset. */
export function whatsappChannelFor(kind: AssetKind): DeliveryChannel {
  switch (kind) {
    case "text":
      return "whatsapp_text";
    case "audio":
      return "whatsapp_audio";
    case "video":
      return "whatsapp_video";
  }
}

export function isExternalChannel(channel: DeliveryChannel): boolean {
  return channel.startsWith("whatsapp_");
}

// ---------- Operaciones ----------

export interface CreateAssetInput {
  coach_id: string;
  athlete_id: string;
  kind: AssetKind;
  body_text?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  duration_seconds?: number | null;
  voice_id?: string | null;
  avatar_id?: string | null;
  generation_status?: GenerationStatus;
  intervention_event_id?: string | null;
  metadata?: Record<string, any>;
}

export async function createAsset(
  input: CreateAssetInput,
): Promise<{ asset: CoachMessageAsset | null; error: string | null }> {
  const { data, error } = await (supabase as any)
    .from("coach_message_assets")
    .insert({
      coach_id: input.coach_id,
      athlete_id: input.athlete_id,
      kind: input.kind,
      body_text: input.body_text ?? null,
      storage_bucket: input.storage_bucket ?? null,
      storage_path: input.storage_path ?? null,
      duration_seconds: input.duration_seconds ?? null,
      voice_id: input.voice_id ?? null,
      avatar_id: input.avatar_id ?? null,
      generation_status: input.generation_status ?? "ready",
      intervention_event_id: input.intervention_event_id ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    console.error("[coachDelivery] createAsset error", error);
    return { asset: null, error: error.message };
  }
  return { asset: data as CoachMessageAsset, error: null };
}

export interface CreateDeliveryInput {
  asset_id: string;
  coach_id: string;
  athlete_id: string;
  channel: DeliveryChannel;
  status?: DeliveryStatus;
  coach_message_id?: string | null;
  coach_audio_message_id?: string | null;
  intervention_event_id?: string | null;
  external_provider?: string | null;
  scheduled_at?: string | null;
  /** If true and channel is in_app_*, mark as 'sent' immediately. */
  markSentNow?: boolean;
}

export async function createDelivery(
  input: CreateDeliveryInput,
): Promise<{ delivery: CoachMessageDelivery | null; error: string | null }> {
  const isInApp = !isExternalChannel(input.channel);
  const status: DeliveryStatus =
    input.status ?? (isInApp && input.markSentNow !== false ? "sent" : "queued");
  const sentAt = status === "sent" ? new Date().toISOString() : null;

  const { data, error } = await (supabase as any)
    .from("coach_message_deliveries")
    .insert({
      asset_id: input.asset_id,
      coach_id: input.coach_id,
      athlete_id: input.athlete_id,
      channel: input.channel,
      status,
      coach_message_id: input.coach_message_id ?? null,
      coach_audio_message_id: input.coach_audio_message_id ?? null,
      intervention_event_id: input.intervention_event_id ?? null,
      external_provider: input.external_provider ?? null,
      scheduled_at: input.scheduled_at ?? null,
      sent_at: sentAt,
    })
    .select()
    .single();

  if (error) {
    console.error("[coachDelivery] createDelivery error", error);
    return { delivery: null, error: error.message };
  }
  return { delivery: data as CoachMessageDelivery, error: null };
}

export async function markDeliveryRead(deliveryId: string) {
  const now = new Date().toISOString();
  const { error } = await (supabase as any)
    .from("coach_message_deliveries")
    .update({ status: "read", read_at: now })
    .eq("id", deliveryId);
  return { error: error?.message ?? null };
}

export async function listDeliveriesForAsset(
  assetId: string,
): Promise<CoachMessageDelivery[]> {
  const { data, error } = await (supabase as any)
    .from("coach_message_deliveries")
    .select("*")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[coachDelivery] listDeliveriesForAsset", error);
    return [];
  }
  return (data ?? []) as CoachMessageDelivery[];
}
