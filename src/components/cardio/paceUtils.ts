/**
 * Pace calculation utilities for running and swimming.
 * 
 * Core formula: pace = (time_seconds / distance_m) × unit_m
 * Example: 200m in 180s → pace per 100m = (180/200)*100 = 90s → 1:30/100m
 */

export interface PaceUnitOption {
  label: string;
  value: number; // meters
}

export const RUNNING_PACE_UNITS: PaceUnitOption[] = [
  { label: '100 m', value: 100 },
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
];

export const SWIMMING_PACE_UNITS: PaceUnitOption[] = [
  { label: '100 m', value: 100 },
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
];

export const DEFAULT_PACE_UNIT = {
  running: 1000,
  swimming: 100,
};

/**
 * Calculate pace in seconds per unit distance.
 * Returns undefined if distance or time is 0/missing.
 */
export const calculatePace = (
  timeSeconds: number,
  distanceMeters: number,
  unitMeters: number
): number | undefined => {
  if (!distanceMeters || distanceMeters <= 0 || !timeSeconds || timeSeconds <= 0) {
    return undefined;
  }
  return (timeSeconds / distanceMeters) * unitMeters;
};

/**
 * Convert a pace from one unit to another.
 * E.g., 330s/km → pace per 100m = 330 * (100/1000) = 33s/100m
 */
export const convertPace = (
  paceSecondsPerUnit: number,
  fromUnitM: number,
  toUnitM: number
): number => {
  if (!fromUnitM || fromUnitM <= 0) return paceSecondsPerUnit;
  return paceSecondsPerUnit * (toUnitM / fromUnitM);
};

/**
 * Format seconds as mm:ss
 */
export const formatPace = (totalSeconds: number): string => {
  const min = Math.floor(totalSeconds / 60);
  const sec = Math.round(totalSeconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

/**
 * Format seconds as mm:ss.xx (with decimals)
 */
export const formatPaceDetailed = (totalSeconds: number): string => {
  const min = Math.floor(totalSeconds / 60);
  const remaining = totalSeconds - min * 60;
  const sec = Math.floor(remaining);
  const decimals = Math.round((remaining - sec) * 100);
  if (decimals > 0) {
    return `${min}:${sec.toString().padStart(2, '0')}.${decimals.toString().padStart(2, '0')}`;
  }
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

/**
 * Format seconds as hh:mm:ss or mm:ss
 */
export const formatDuration = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Format unit label for display
 */
export const formatUnitLabel = (unitM: number): string => {
  if (unitM >= 1000) return `${unitM / 1000} km`;
  return `${unitM} m`;
};

/**
 * Generate CSV content from session data
 */
export const generateCSV = (
  rows: {
    id: string;
    name: string;
    sport: string;
    distance_m: number;
    time_s: number;
    pace_calculated_s: number | undefined;
    unit_selected: number;
  }[]
): string => {
  const header = 'ejercicio_id,nombre,deporte,distancia_m,tiempo_s,ritmo_calculado_s_por_unidad,unidad_seleccionada\n';
  const body = rows
    .map(r =>
      `${r.id},${r.name},${r.sport},${r.distance_m},${r.time_s},${r.pace_calculated_s ?? ''},${r.unit_selected}`
    )
    .join('\n');
  return header + body;
};

/**
 * Download a string as a file
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
