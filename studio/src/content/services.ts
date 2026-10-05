import type { L } from '@/i18n'
import type { MediaId } from '@/lib/media'

export type ServiceId = 'ai-video' | 'ai-3d' | 'websites' | 'editing' | 'content' | 'mobile-cinema'

export type Service = {
  id: ServiceId
  slug: L
  name: L
  /** Una frase (índice "La Casa" y tarjetas) */
  line: L
  /** Formato en metadatos [ ] */
  format: L
  /** Clip principal del servicio (hero de su página y vista previa) */
  media?: MediaId
  /** Clip vertical alternativo */
  mediaPortrait?: MediaId
}

/** Orden canónico de los 6 oficios. El detalle de cada página vive en content/services/<id>.ts */
export const services: Service[] = [
  {
    id: 'ai-video',
    slug: { es: 'video-ia', en: 'ai-video' },
    name: { es: 'Vídeo con IA', en: 'AI video' },
    line: { es: 'Spots de producto, comida, bebida y moda.', en: 'Spots for product, food, drink and fashion.' },
    format: { es: '16:9 · 9:16', en: '16:9 · 9:16' },
    media: 'tacos-spot',
  },
  {
    id: 'ai-3d',
    slug: { es: '3d-ia', en: 'ai-3d' },
    name: { es: '3D con IA', en: 'AI 3D' },
    line: { es: 'Tu producto en volumen, fiel al original.', en: 'Your product in three dimensions, true to the original.' },
    format: { es: 'Modelo · Escena', en: 'Model · Scene' },
    media: 'golden-key',
  },
  {
    id: 'websites',
    slug: { es: 'webs', en: 'websites' },
    name: { es: 'Webs de autor', en: 'Signature websites' },
    line: { es: 'Sitios a medida, rápidos y difíciles de olvidar.', en: 'Bespoke sites, fast and hard to forget.' },
    format: { es: 'Web', en: 'Web' },
  },
  {
    id: 'editing',
    slug: { es: 'edicion', en: 'editing' },
    name: { es: 'Postproducción', en: 'Post-production' },
    line: { es: 'Montaje y color con IA, After Effects y DaVinci.', en: 'Editing and colour with AI, After Effects and DaVinci.' },
    format: { es: 'Edición', en: 'Editing' },
    media: 'empire-film',
  },
  {
    id: 'content',
    slug: { es: 'contenido', en: 'content' },
    name: { es: 'Contenido para redes', en: 'Social content' },
    line: { es: 'Guiones y piezas listas para publicar cada semana.', en: 'Scripts and pieces ready to post every week.' },
    format: { es: 'Mensual', en: 'Monthly' },
    media: 'fashion',
  },
  {
    id: 'mobile-cinema',
    slug: { es: 'cine-movil', en: 'mobile-cinema' },
    name: { es: 'Cine con tu móvil', en: 'Mobile cinema' },
    line: { es: 'Rueda en Log. Termina como un estudio.', en: 'Shoot in Log. Finish like a studio.' },
    format: { es: 'Sesión', en: 'Session' },
  },
]

export const serviceById = (id: ServiceId) => services.find((s) => s.id === id)!
export const serviceBySlug = (slug: string) => services.find((s) => s.slug.es === slug || s.slug.en === slug)
