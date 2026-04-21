/**
 * Política de audio premium del coach.
 *
 * Define qué eventos están RECOMENDADOS para enviar audio (los que aportan
 * valor humano real). El coach puede generar audio para cualquier evento,
 * pero el panel sugiere audio solo en estos:
 *
 *   - sueño bajo + mal rendimiento
 *   - caída clara de rendimiento
 *   - fatiga acumulada
 *   - mala adherencia repetida
 *   - semana complicada
 *   - felicitación importante por progreso
 *
 * Ver mem://features/coach/intervention-copy-rule.md
 */

import type { InterventionEventType } from "./coachCopy";

const RECOMMENDED: Set<InterventionEventType> = new Set([
  "low_sleep",
  "performance_drop",
  "high_fatigue",
  "low_adherence",
  "progress_milestone",
]);

export function isAudioRecommendedFor(eventType: InterventionEventType): boolean {
  return RECOMMENDED.has(eventType);
}

export const AUDIO_VOICE_HINT =
  "Tono calmado, cercano. Como un coach real hablando, no un asistente.";
