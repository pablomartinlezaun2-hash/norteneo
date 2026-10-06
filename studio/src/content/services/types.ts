import type { L } from '@/i18n'
import type { MediaId } from '@/lib/media'
import type { ServiceId } from '@/content/services'

/**
 * Detalle de la subpágina de un servicio. UNA plantilla (src/pages/Service.tsx), datos por servicio.
 * Regla: nada inventado. Si falta un dato, el campo es opcional y el bloque no se renderiza.
 */

/** Párrafo estilo Apple: primera frase en blanco y el resto en gris. */
export type Lede = { strong: L; rest: L }

export type HeroMedia = {
  media: MediaId
  orient: 'land' | 'port'
  /** Pieza generada con IA: muestra la etiqueta de transparencia */
  ai: boolean
  /** Póster fijo en lugar del vídeo (p. ej. packshot de producto) */
  still?: boolean
  /** Descripción accesible */
  label: L
  /** Ficha en corchetes: proyecto · formato · duración */
  meta: L
}

/** "Míralo en 60 segundos": vídeo explicativo con subtítulos ES/EN. Pendiente del cliente. */
export type Explainer = { src: string; poster: string; vtt: L }

/** Visor 3D (GLB). Pendiente del cliente; sin Three.js hasta que exista el modelo. */
export type Model3D = { glb: string; usdz?: string; poster: string; finishes?: L[] }

export type Term = { term: L; text: L }
export type Spec = { label: L; value: L; note?: L }
export type Faq = { q: L; a: L }
export type Step = { text: L }
export type Pair = { id: ServiceId; line: L }

type Base = {
  /** Afirmación del capítulo (titular corto) */
  claim: L
  text: L
  /** Prueba en corchetes */
  proof?: L
}

/** Marca de un scrub: a partir de `at` (0..1 del recorrido) se muestra `label`. Etiqueta vacía = sin marca. */
export type ScrubMark = { at: number; label: L }

export type Chapter =
  /** Momento propio con pin: scroll-scrub de una secuencia de imágenes */
  | (Base & {
      kind: 'scrub'
      media: MediaId
      label: L
      /** Hasta qué punto de la secuencia llega el scrub (0..1). Por defecto 1. */
      to?: number
      /** Fotogramas del clip original: muestra un contador "Fotograma n / total" */
      frames?: number
      marks?: ScrubMark[]
      /** Progresos (0..1 del recorrido) de los fotogramas fijos de la variante reduced-motion */
      stills: [number, number, number]
    })
  /** Comparador entre el primer y el último fotograma de una secuencia */
  | (Base & { kind: 'start-end'; media: MediaId })
  /** Vídeo con su ficha */
  | (Base & { kind: 'video'; media: MediaId; label: L; meta: L; ai: boolean })
  /** Selector de escenas: fotogramas de la misma pieza (`at`: 0..1 de la secuencia) */
  | (Base & { kind: 'scenes'; media: MediaId; scenes: { at: number; label: L; text: L }[] })
  /** Capítulo tipográfico: lista de términos con hairlines */
  | (Base & { kind: 'terms'; items: Term[]; note?: L })
  /** Webs en producción (casos 'client' con url) */
  | (Base & { kind: 'sites' })
  /** La web se demuestra a sí misma: rejilla y escala tipográfica */
  | (Base & { kind: 'grid' })
  /** Mismo clip, tres montajes */
  | (Base & {
      kind: 'cuts'
      media: MediaId
      label: L
      cuts: { name: L; rate: number; frame: 'full' | 'close' | 'feed'; meta: L; text: L }[]
      note: L
    })
  /** Pieza vertical con su guion sincronizado */
  | (Base & { kind: 'script'; media: MediaId; label: L; meta: L; lines: { t: number; text: L }[] })
  /** Pieza vertical en marco de móvil */
  | (Base & { kind: 'phone'; media: MediaId; label: L; meta: L; ai: boolean })
  /** Comparador Log ↔ etalonado (simulado si no hay par real) */
  | (Base & { kind: 'log'; media: MediaId; note: L })
  /** Ficha de cámara */
  | (Base & { kind: 'camera'; rows: Spec[] })

export type ServiceDetail = {
  id: ServiceId
  /** Frase del hero (≤20 palabras) */
  sub: L
  /** Sin hero: variante tipográfica */
  hero?: HeroMedia
  /** Pie del hero tipográfico */
  heroFacts?: L[]
  intro: Lede
  explainer?: Explainer
  model?: Model3D
  chapters: [Chapter, Chapter, Chapter]
  /** Brief · Dirección · Producción · Entrega */
  process: { steps: [Step, Step, Step, Step]; deliverables: L[] }
  specs: Spec[]
  faqs: Faq[]
  pairs: [Pair, Pair]
  cta: { title: L; text: L }
  seo: { description: L }
}
