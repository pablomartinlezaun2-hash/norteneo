import { services } from '@/content/services'
import type { Lang } from './index'

/** Segmentos de ruta traducidos */
export const SEG = {
  services: { es: 'servicios', en: 'services' },
  work: { es: 'trabajo', en: 'work' },
  studio: { es: 'estudio', en: 'studio' },
  contact: { es: 'contacto', en: 'contact' },
  thanks: { es: 'gracias', en: 'thank-you' },
  legal: { es: 'legal', en: 'legal' },
} as const

export const LEGAL = {
  privacy: { es: 'privacidad', en: 'privacy' },
  notice: { es: 'aviso-legal', en: 'legal-notice' },
  cookies: { es: 'cookies', en: 'cookies' },
} as const
export type LegalId = keyof typeof LEGAL

const prefix = (lang: Lang) => (lang === 'en' ? '/en' : '')

/** Constructores de rutas. Úsalos siempre en vez de escribir rutas a mano. */
export const to = {
  home: (lang: Lang) => (lang === 'en' ? '/en' : '/'),
  services: (lang: Lang) => `${prefix(lang)}/${SEG.services[lang]}`,
  service: (lang: Lang, id: (typeof services)[number]['id']) =>
    `${prefix(lang)}/${SEG.services[lang]}/${services.find((s) => s.id === id)!.slug[lang]}`,
  work: (lang: Lang) => `${prefix(lang)}/${SEG.work[lang]}`,
  case: (lang: Lang, slug: string) => `${prefix(lang)}/${SEG.work[lang]}/${slug}`,
  studio: (lang: Lang) => `${prefix(lang)}/${SEG.studio[lang]}`,
  contact: (lang: Lang, service?: (typeof services)[number]['id']) =>
    `${prefix(lang)}/${SEG.contact[lang]}${service ? `?servicio=${service}` : ''}`,
  thanks: (lang: Lang) => `${prefix(lang)}/${SEG.contact[lang]}/${SEG.thanks[lang]}`,
  legal: (lang: Lang, id: LegalId) => `${prefix(lang)}/${SEG.legal[lang]}/${LEGAL[id][lang]}`,
}

/** Traduce una ruta al otro idioma (selector ES/EN y hreflang). */
export function alternatePath(pathname: string, target: Lang): string {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  const from: Lang = parts[0] === 'en' ? 'en' : 'es'
  if (from === 'en') parts.shift()
  if (parts.length === 0) return to.home(target)
  const segKey = (Object.keys(SEG) as (keyof typeof SEG)[]).find((k) => SEG[k][from] === parts[0])
  if (!segKey) return to.home(target)
  const rest = parts.slice(1)
  if (segKey === 'services' && rest[0]) {
    const svc = services.find((s) => s.slug[from] === rest[0])
    return svc ? to.service(target, svc.id) : to.services(target)
  }
  if (segKey === 'legal' && rest[0]) {
    const id = (Object.keys(LEGAL) as LegalId[]).find((k) => LEGAL[k][from] === rest[0])
    return id ? to.legal(target, id) : to.home(target)
  }
  if (segKey === 'contact' && rest[0] === SEG.thanks[from]) return to.thanks(target)
  if (segKey === 'work' && rest[0]) return to.case(target, rest[0])
  return `${prefix(target)}/${SEG[segKey][target]}`
}
