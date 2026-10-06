import type { L } from '@/i18n'

/**
 * Datos globales de la marca.
 * Pendiente (Pablo): dominio final e Instagram.
 */
export const site = {
  name: 'NEO Studio',
  /**
   * Dominio de la web (canonical, hreflang y Open Graph). En Vercel sale solo del dominio de producción
   * del proyecto (ver vite.config.ts); VITE_SITE_URL lo fija a mano (p. ej. el dominio propio).
   */
  url: (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'http://localhost:4173',
  /** WhatsApp en formato internacional sin "+" ni espacios. */
  whatsapp: (import.meta.env.VITE_WHATSAPP as string | undefined) ?? '34629946893',
  /** Email comercial (recibe las propuestas). */
  email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'neo.method.lab@gmail.com',
  /**
   * Endpoint que recibe el brief. Por defecto FormSubmit (gratuito, sin servidor): acepta POST JSON
   * y reenvía al email. La primera vez FormSubmit manda un email de activación a la cuenta.
   * Tras activarlo puede sustituirse el email por el alias aleatorio que FormSubmit facilita.
   */
  leadEndpoint: (import.meta.env.VITE_LEAD_ENDPOINT as string | undefined) ?? 'https://formsubmit.co/ajax/neo.method.lab@gmail.com',
  instagram: (import.meta.env.VITE_INSTAGRAM as string | undefined) ?? '',
  description: {
    es: 'Estudio creativo de vídeo con IA, 3D y webs de autor para marcas de lujo. Imagen de cine, sin plató.',
    en: 'Creative studio for AI video, AI 3D and signature websites for luxury brands. Cinematic imagery, no set.',
  } satisfies L,
} as const

export function whatsappHref(message = ''): string | null {
  if (!site.whatsapp) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${site.whatsapp}${text}`
}
