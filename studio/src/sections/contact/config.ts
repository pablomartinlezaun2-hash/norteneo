import type { L } from '@/i18n'
import type { ServiceId } from '@/content/services'

/**
 * Configuración del brief de /contacto. Todo lo editable sin tocar el componente vive aquí.
 */

export type Option<K extends string = string> = { id: K; label: L; hint?: L }

/** "Aún no lo sé" junto a los 6 servicios */
export const UNSURE = 'unsure' as const
export type ServiceChoice = ServiceId | typeof UNSURE

export const BRIEF_SECTORS: Option[] = [
  { id: 'hospitality', label: { es: 'Restauración / Hostelería', en: 'Restaurants / Hospitality' } },
  { id: 'real-estate', label: { es: 'Inmobiliaria', en: 'Real estate' } },
  { id: 'fashion', label: { es: 'Moda', en: 'Fashion' } },
  { id: 'drinks', label: { es: 'Bebidas', en: 'Drinks' } },
  { id: 'creator', label: { es: 'Creador o marca personal', en: 'Creator or personal brand' } },
  { id: 'other', label: { es: 'Otro', en: 'Other' } },
]

export const GOALS: Option[] = [
  { id: 'launch', label: { es: 'Lanzamiento', en: 'A launch' } },
  { id: 'refresh', label: { es: 'Renovar la imagen', en: 'Refresh the brand image' } },
  { id: 'regular', label: { es: 'Publicar con regularidad', en: 'Post consistently' } },
  { id: 'learn', label: { es: 'Aprender a grabar', en: 'Learn to shoot' } },
]

export const TIMELINES: Option[] = [
  { id: 'lt-1m', label: { es: 'Menos de 1 mes', en: 'Under a month' } },
  { id: '1-3m', label: { es: '1–3 meses', en: '1–3 months' } },
  { id: 'no-rush', label: { es: 'Sin prisa', en: 'No rush' } },
]

export type Preference = 'email' | 'call' | 'whatsapp'
export const PREFERENCES: Option<Preference>[] = [
  { id: 'email', label: { es: 'Email', en: 'Email' } },
  { id: 'call', label: { es: 'Llamada', en: 'Phone call' } },
  { id: 'whatsapp', label: { es: 'WhatsApp', en: 'WhatsApp' } },
]

/**
 * Rango de inversión orientativo (pregunta OPCIONAL del paso 3).
 * PENDIENTE (Pablo): definir los rangos reales. Los valores de abajo son genéricos y editables.
 * - `enabled: false` oculta la pregunta entera (no se publica ninguna cifra).
 * - El último valor ("Prefiero hablarlo") debe mantenerse.
 */
export const INVESTMENT: { pending: boolean; enabled: boolean; options: Option[] } = {
  pending: true,
  enabled: true,
  options: [
    { id: 'lt-1500', label: { es: 'Menos de 1.500 €', en: 'Under €1,500' } },
    { id: '1500-5000', label: { es: '1.500–5.000 €', en: '€1,500–5,000' } },
    { id: '5000-15000', label: { es: '5.000–15.000 €', en: '€5,000–15,000' } },
    { id: 'gt-15000', label: { es: 'Más de 15.000 €', en: 'Over €15,000' } },
    { id: 'talk', label: { es: 'Prefiero hablarlo', en: 'I’d rather discuss it' } },
  ],
}

/** Límite del texto libre de referencias */
export const NOTES_MAX = 500

/** Clave del borrador en localStorage y del último envío en sessionStorage */
export const DRAFT_KEY = 'neo-brief-draft'
export const LAST_KEY = 'neo-brief-last'
