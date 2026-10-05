import type { L, Lang } from '@/i18n'
import { cases, sectors, type Case, type SectorId } from '@/content/cases'
import { serviceById, services, type ServiceId } from '@/content/services'
import { getMedia, type MediaId } from '@/lib/media'

/**
 * Utilidades de presentación de los casos (formato, duración, etiquetas).
 * Todo se deriva de content/cases.ts y del manifiesto de media: nada inventado.
 */

/** Clips verticales del catálogo (respaldo mientras el manifiesto no tenga la entrada). */
const PORTRAIT = new Set<string>(['empire-teaser', 'empire-film', 'fashion', 'ugc-move', 'running', 'reel-port'])

export type Shape = 'land' | 'port' | 'type'

export function mediaShape(id?: MediaId): Shape {
  if (!id) return 'type'
  const m = getMedia(id)
  if (m) return m.orient
  return PORTRAIT.has(id) ? 'port' : 'land'
}

export const caseShape = (c: Case): Shape => mediaShape(c.media)

/** Separador de metadatos: el espacio duro evita que una línea empiece por "·". */
export const SEP = '\u00a0· '

/** Formato real de la pieza: 16:9, 9:16, Web o App. */
export function formatLabel(c: Case, lang: Lang): string {
  const shape = caseShape(c)
  if (shape === 'land') return '16:9'
  if (shape === 'port') return '9:16'
  return c.kind === 'own' ? 'App' : lang === 'es' ? 'Web' : 'Website'
}

/** Duración del clip principal, p. ej. "11 s". Vacío si no hay medio. */
export function durationLabel(id?: MediaId): string {
  if (!id) return ''
  const m = getMedia(id)
  return m ? `${Math.round(m.duration)}\u00a0s` : ''
}

/** Sector visible. 'brand' es un sector pendiente de confirmar: no se muestra. */
export function sectorLabel(c: Case, lang: Lang): string | null {
  if (c.sector === 'brand') return null
  return sectors[c.sector][lang]
}

export function servicesLabel(c: Case, lang: Lang): string {
  return c.services.map((id) => serviceById(id).name[lang]).join(', ')
}

export function domainOf(url?: string): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Pieza generada con IA (lleva la etiqueta de transparencia). */
export const isGenerated = (c: Case) => Boolean(c.media) && c.kind !== 'own'

export const labels = {
  ai: { es: 'Generado con IA, dirigido por NEO', en: 'AI-generated, directed by NEO' },
  concept: { es: 'Concepto · no oficial', en: 'Concept · unofficial' },
  own: { es: 'Producto propio', en: 'Own product' },
  visit: { es: 'Visitar web', en: 'Visit website' },
} satisfies Record<string, L>

/** Etiqueta de naturaleza de la pieza (concepto o producto propio). */
export function kindLabel(c: Case, lang: Lang): string | null {
  if (c.kind === 'concept') return labels.concept[lang]
  if (c.kind === 'own') return labels.own[lang]
  return null
}

/** Texto accesible para el vídeo de una pieza. */
export function pieceAlt(c: Case, lang: Lang): string {
  return `${c.title}. ${c.line[lang]}`
}

/** Encargos de clientes: webs (sin medio, variante tipográfica) y piezas de vídeo y 3D. */
export const clientWebs = cases.filter((c) => c.kind === 'client' && !c.media)
export const clientFilms = cases.filter((c) => c.kind === 'client' && Boolean(c.media))
/** Piezas de concepto (no oficiales) y estudios propios sin encargo. */
export const conceptCases = cases.filter((c) => c.kind === 'concept' || c.kind === 'study')
export const ownCases = cases.filter((c) => c.kind === 'own')

/** Servicios con al menos una pieza publicada (no se ofrecen filtros vacíos). */
export const filterServices: ServiceId[] = services.map((s) => s.id).filter((id) => cases.some((c) => c.services.includes(id)))

/** Sectores con piezas, sin los pendientes ('brand') ni 'own'. Ordenados por número de piezas. */
export const filterSectors: SectorId[] = (Object.keys(sectors) as SectorId[])
  .filter((s) => s !== 'brand' && s !== 'own')
  .map((s) => [s, cases.filter((c) => c.sector === s).length] as const)
  .filter(([, n]) => n > 0)
  .sort((a, b) => b[1] - a[1])
  .map(([s]) => s)

export function nextCase(slug: string): Case {
  const i = cases.findIndex((c) => c.slug === slug)
  return cases[(i + 1) % cases.length]
}

/**
 * Coloca piezas en una retícula de 12 columnas respetando su formato real:
 * apaisada ancha + vertical estrecha (alternando lado), dos apaisadas a medias, etc.
 * Devuelve las clases de columna para escritorio (en móvil todo ocupa el ancho).
 */
export function arrange<T>(input: T[], shapeOf: (t: T) => Shape): { item: T; cls: string; shape: Shape; paired: boolean }[] {
  // Intercala apaisadas y estrechas (conservando el orden dentro de cada grupo) para que
  // cada fila combine formatos: [ancha, estrecha], [estrecha, ancha], …
  const wide = input.filter((t) => shapeOf(t) === 'land')
  const narrow = input.filter((t) => shapeOf(t) !== 'land')
  const items: T[] = []
  let takeWide = input.length > 0 && shapeOf(input[0]) === 'land'
  let row = 0
  while (wide.length || narrow.length) {
    const first = takeWide ? wide : narrow
    const second = takeWide ? narrow : wide
    const a = first.shift() ?? second.shift()
    const b = second.shift() ?? first.shift()
    if (a !== undefined) items.push(a)
    if (b !== undefined) items.push(b)
    row += 1
    takeWide = row % 2 === 0 ? shapeOf(input[0]) === 'land' : shapeOf(input[0]) !== 'land'
  }
  row = 0
  const out: { item: T; cls: string; shape: Shape; paired: boolean }[] = []
  let i = 0
  while (i < items.length) {
    const a = items[i]
    const b = items[i + 1]
    const sa = shapeOf(a)
    const sb = b !== undefined ? shapeOf(b) : undefined
    const flip = row % 2 === 1
    if (sb === undefined) {
      // Pieza suelta: apaisada a 8 columnas, estrecha a 5, desplazadas según la fila
      const cls = sa === 'land' ? (flip ? 'md:col-span-8 md:col-start-5' : 'md:col-span-8') : flip ? 'md:col-span-5 md:col-start-8' : 'md:col-span-5 md:col-start-2'
      out.push({ item: a, cls, shape: sa, paired: false })
      i += 1
    } else if ((sa === 'land') !== (sb === 'land')) {
      // Apaisada + estrecha: 7 + 5
      out.push({ item: a, cls: sa === 'land' ? 'md:col-span-7' : 'md:col-span-5', shape: sa, paired: true })
      out.push({ item: b as T, cls: sb === 'land' ? 'md:col-span-7' : 'md:col-span-5', shape: sb, paired: true })
      i += 2
    } else {
      // Mismo formato: 6 + 6
      out.push({ item: a, cls: 'md:col-span-6', shape: sa, paired: true })
      out.push({ item: b as T, cls: 'md:col-span-6', shape: sb, paired: true })
      i += 2
    }
    row += 1
  }
  return out
}
