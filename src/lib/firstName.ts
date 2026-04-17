/**
 * firstName helper — captura, validación, normalización y persistencia
 * del nombre del usuario para la intro personalizada.
 *
 * Fuentes de verdad (en orden de prioridad de lectura):
 *   1. profiles.display_name (si hay sesión activa)
 *   2. localStorage('neo-first-name')
 *
 * Escritura: siempre se persiste en ambas (best-effort en perfil).
 */

import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "neo-first-name";

// Letras (incluye acentos / ñ / etc.), espacios, guiones y apóstrofes.
const VALID_NAME_REGEX = /^[\p{L}][\p{L}\s'-]*$/u;

export const FIRST_NAME_MIN = 2;
export const FIRST_NAME_MAX = 32;

export type FirstNameValidation =
  | { valid: true; value: string }
  | { valid: false; error: "empty" | "too_short" | "too_long" | "invalid_chars" };

/**
 * Normaliza un nombre: trim, colapso de espacios, toma el primer token,
 * capitaliza la primera letra y baja el resto.
 */
export function normalizeFirstName(raw: string): string {
  if (!raw) return "";
  const collapsed = raw.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  const firstToken = collapsed.split(" ")[0];
  return firstToken.charAt(0).toLocaleUpperCase() + firstToken.slice(1).toLocaleLowerCase();
}

/**
 * Valida un nombre crudo y devuelve el resultado normalizado o un error tipado.
 */
export function validateFirstName(raw: string): FirstNameValidation {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { valid: false, error: "empty" };

  const normalized = normalizeFirstName(trimmed);
  if (normalized.length < FIRST_NAME_MIN) return { valid: false, error: "too_short" };
  if (normalized.length > FIRST_NAME_MAX) return { valid: false, error: "too_long" };
  if (!VALID_NAME_REGEX.test(normalized)) return { valid: false, error: "invalid_chars" };

  return { valid: true, value: normalized };
}

/**
 * Lectura síncrona desde localStorage. Útil en render inicial.
 */
export function getStoredFirstName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

/**
 * Escritura síncrona en localStorage. No lanza.
 */
export function setStoredFirstName(value: string): void {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Persiste el nombre en el perfil del usuario autenticado (display_name).
 * Best-effort: no lanza, solo loguea en consola si falla.
 * Solo actualiza si display_name está vacío o difiere.
 */
export async function persistFirstNameToProfile(value: string): Promise<boolean> {
  if (!value) return false;

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) return false;
    if (profile.display_name === value) return true;

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: value })
      .eq("id", profile.id);

    if (error) {
      console.warn("[firstName] profile update failed:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[firstName] persistFirstNameToProfile error:", e);
    return false;
  }
}

/**
 * Resuelve el firstName desde la mejor fuente disponible.
 * Orden: perfil (si hay sesión) → localStorage → "".
 * Si encuentra el nombre en el perfil, sincroniza localStorage.
 */
export async function resolveFirstName(): Promise<string> {
  // 1. Perfil
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, full_name")
        .eq("user_id", userId)
        .maybeSingle();

      const candidate = profile?.display_name || profile?.full_name || "";
      const normalized = normalizeFirstName(candidate);
      if (normalized) {
        setStoredFirstName(normalized);
        return normalized;
      }
    }
  } catch {
    // ignore — caemos al fallback
  }

  // 2. localStorage
  return getStoredFirstName();
}

/**
 * Guarda el nombre en localStorage + perfil (best-effort, no bloqueante).
 * Devuelve el valor normalizado.
 */
export async function saveFirstName(raw: string): Promise<string> {
  const validation = validateFirstName(raw);
  if (!validation.valid) return "";

  setStoredFirstName(validation.value);
  // No await: no bloqueamos la UI por la persistencia remota.
  void persistFirstNameToProfile(validation.value);
  return validation.value;
}
