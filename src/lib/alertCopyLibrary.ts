/**
 * Alert copy library — prewritten explanations and recommendations
 * per severity level for the Performance Alerts panel.
 */

export type AlertSeverity =
  | 'stable'
  | 'positive_level_1'
  | 'positive_level_2'
  | 'positive_level_3'
  | 'positive_outlier'
  | 'negative_level_1'
  | 'negative_level_2'
  | 'negative_level_3'
  | 'negative_outlier';

export interface AlertGuidance {
  explanation: string;
  recommendation: string;
}

interface AlertCopyLibrary {
  explanations: string[];
  recommendations: string[];
}

const ALERT_COPY: Record<AlertSeverity, AlertCopyLibrary> = {
  stable: {
    explanations: [
      'El rendimiento está dentro de la variación normal entre sesiones.',
      'No se observan cambios relevantes respecto a tu referencia reciente.',
      'La sesión se mantiene dentro de un rango de rendimiento estable.',
      'La variación detectada es pequeña y compatible con la fluctuación normal del entrenamiento.',
    ],
    recommendations: [
      'Mantén la ejecución actual y busca consistencia en las próximas sesiones.',
      'No hagas ajustes grandes si el rendimiento sigue en este rango.',
      'Prioriza repetir una técnica estable y un tempo homogéneo.',
      'Sigue acumulando sesiones comparables antes de modificar la carga.',
    ],
  },
  positive_level_1: {
    explanations: [
      'Se observa una mejora real del rendimiento respecto a tu referencia reciente.',
      'Puede deberse a una ejecución más consistente y mejor control del esfuerzo.',
      'La sesión muestra una progresión clara dentro de un margen razonable.',
      'El rendimiento ha mejorado de forma visible sin salirse de un rango habitual.',
    ],
    recommendations: [
      'Mantén las mismas referencias técnicas en la próxima sesión.',
      'Consolida este nivel antes de aumentar demasiado la exigencia.',
      'Busca repetir la misma calidad de ejecución en la próxima exposición.',
      'Si la técnica ha sido sólida, puedes valorar una progresión pequeña y controlada.',
    ],
  },
  positive_level_2: {
    explanations: [
      'La mejora es claramente superior a la variación normal entre sesiones.',
      'Puede deberse a una mejor estabilidad, mejor control técnico o una mejor gestión del esfuerzo.',
      'El rendimiento ha aumentado de forma marcada respecto a tu baseline reciente.',
      'Se detecta una progresión sólida que merece seguimiento en la próxima sesión.',
    ],
    recommendations: [
      'Intenta repetir exactamente la misma ejecución antes de seguir progresando.',
      'Consolida este rendimiento una sesión más antes de aumentar la carga.',
      'Mantén la técnica, el tempo y el rango comparables para validar la mejora.',
      'Si vuelves a rendir en este nivel, puedes usarlo como nueva referencia.',
    ],
  },
  positive_level_3: {
    explanations: [
      'La mejora es poco común entre sesiones consecutivas.',
      'Puede deberse a una sesión especialmente favorable o a una ejecución más eficiente.',
      'El cambio está por encima de lo habitual y conviene validarlo en la próxima exposición.',
      'Se detecta una mejora poco frecuente que podría no representar todavía una nueva referencia estable.',
    ],
    recommendations: [
      'Confirma este rendimiento en la próxima sesión antes de seguir progresando.',
      'Verifica que técnica, rango y tempo hayan sido comparables.',
      'Prioriza repetir las mismas condiciones antes de subir la exigencia.',
      'No tomes esta mejora como nueva baseline hasta repetirla con consistencia.',
    ],
  },
  positive_outlier: {
    explanations: [
      'El cambio es excepcional y poco frecuente entre sesiones comparables.',
      'Puede deberse a una mejora muy marcada, pero también a diferencias de ejecución o contexto.',
      'La magnitud del cambio sugiere revisar si la sesión fue plenamente comparable.',
      'Se detecta una mejora muy fuera de lo común que conviene validar antes de consolidarla.',
    ],
    recommendations: [
      'Comprueba que el registro, la técnica y el rango sean comparables.',
      'Valida este resultado en la próxima sesión antes de ajustar el plan.',
      'No progreses de forma agresiva sin confirmar este cambio.',
      'Repite las mismas condiciones de ejecución y descanso para verificar el dato.',
    ],
  },
  negative_level_1: {
    explanations: [
      'Se observa una caída real del rendimiento respecto a tu referencia reciente.',
      'Puede deberse a una ligera pérdida de estabilidad o a una menor consistencia técnica.',
      'La sesión ha quedado por debajo de tu nivel habitual de forma moderada.',
      'El descenso detectado es claro, aunque todavía compatible con una mala sesión puntual.',
    ],
    recommendations: [
      'Mantén una posición estable durante todo el set.',
      'Repite el mismo tempo en todas las repeticiones.',
      'Evita acelerar las últimas repeticiones si eso compromete la técnica.',
      'Prioriza una ejecución homogénea antes de modificar la carga.',
    ],
  },
  negative_level_2: {
    explanations: [
      'La caída es claramente superior a la variación normal entre sesiones.',
      'Puede deberse a fatiga acumulada, menor control técnico o peor gestión del esfuerzo.',
      'La sesión muestra un retroceso relevante respecto a tu baseline reciente.',
      'Se detecta una pérdida de rendimiento que merece atención en la próxima exposición.',
    ],
    recommendations: [
      'Reduce la variabilidad técnica y repite una ejecución más homogénea.',
      'Mantén un tempo constante repetición tras repetición.',
      'Revisa estabilidad, trayectoria y control del movimiento.',
      'No progreses la carga hasta recuperar una ejecución sólida.',
    ],
  },
  negative_level_3: {
    explanations: [
      'La caída es poco común entre sesiones consecutivas.',
      'Puede deberse a fatiga elevada, mala recuperación o diferencias claras en la ejecución.',
      'El descenso está por encima de lo habitual y conviene revisar el contexto.',
      'Se detecta una caída poco frecuente que no debería interpretarse como normal sin validar la siguiente sesión.',
    ],
    recommendations: [
      'Prioriza recuperar una ejecución estable antes de volver a progresar.',
      'Comprueba que el rango y el tempo sean comparables a sesiones previas.',
      'Reduce la dispersión entre repeticiones y evita cambios técnicos dentro del set.',
      'Revisa descanso, recuperación y consistencia del registro.',
    ],
  },
  negative_outlier: {
    explanations: [
      'El cambio es muy fuera de lo común para sesiones comparables.',
      'Puede deberse a un error de registro, condiciones no comparables o fatiga muy alta.',
      'La magnitud de la caída sugiere revisar el contexto antes de sacar conclusiones.',
      'Se detecta un descenso excepcional que no debería asumirse como tendencia sin confirmación.',
    ],
    recommendations: [
      'Revisa el registro y confirma que la sesión sea comparable.',
      'Comprueba carga, técnica, rango y consistencia antes de ajustar el plan.',
      'No modifiques la planificación solo con este dato si no se confirma.',
      'Busca una sesión de validación con ejecución estable y condiciones similares.',
    ],
  },
};

/**
 * Simple stable hash from a string to produce a deterministic index.
 */
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getAlertSeverity(deltaPercent: number): AlertSeverity {
  if (deltaPercent >= 12) return 'positive_outlier';
  if (deltaPercent >= 8.5) return 'positive_level_3';
  if (deltaPercent >= 6) return 'positive_level_2';
  if (deltaPercent >= 4) return 'positive_level_1';
  if (deltaPercent <= -12) return 'negative_outlier';
  if (deltaPercent <= -8.5) return 'negative_level_3';
  if (deltaPercent <= -6) return 'negative_level_2';
  if (deltaPercent <= -4) return 'negative_level_1';
  return 'stable';
}

/**
 * Returns an explanation + recommendation for a given severity.
 * Uses exerciseId to produce deterministic but varied copy.
 */
export function getAlertGuidance(
  severity: AlertSeverity,
  exerciseId: string,
): AlertGuidance {
  const library = ALERT_COPY[severity];
  const seed = stableHash(exerciseId);
  // Use different offsets for explanation vs recommendation to avoid pairing the same indices
  const explanation = library.explanations[seed % library.explanations.length];
  const recommendation = library.recommendations[(seed + 2) % library.recommendations.length];
  return { explanation, recommendation };
}
