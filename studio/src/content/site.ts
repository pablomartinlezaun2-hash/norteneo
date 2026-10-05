import type { L } from '@/i18n'

/**
 * Datos globales de la marca.
 * TODO(Pablo): sustituir los valores marcados como pendientes cuando los tengamos.
 */
export const site = {
  name: 'NEO Studio',
  /** Dominio final (para canonical, hreflang y Open Graph). Pendiente: cambiar al dominio real. */
  url: (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://neo-studio.vercel.app',
  /** WhatsApp en formato internacional sin "+" ni espacios, p. ej. 34600000000. Pendiente. */
  whatsapp: (import.meta.env.VITE_WHATSAPP as string | undefined) ?? '',
  /** Email comercial. Pendiente. */
  email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? '',
  /** Endpoint que recibe el brief (Web3Forms, Formspree, función propia…). Pendiente. */
  leadEndpoint: (import.meta.env.VITE_LEAD_ENDPOINT as string | undefined) ?? '',
  instagram: (import.meta.env.VITE_INSTAGRAM as string | undefined) ?? '',
  description: {
    es: 'Estudio creativo de vídeo con IA, 3D y webs de autor para marcas de lujo. Imagen de cine, sin rodaje.',
    en: 'Creative studio for AI film, 3D and bespoke websites for luxury brands. Cinematic imagery, no shoot.',
  } satisfies L,
} as const

export function whatsappHref(message = ''): string | null {
  if (!site.whatsapp) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${site.whatsapp}${text}`
}
