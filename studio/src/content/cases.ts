import type { L } from '@/i18n'
import type { MediaId } from '@/lib/media'
import type { ServiceId } from './services'

export type SectorId = 'hospitality' | 'real-estate' | 'fashion' | 'drinks' | 'sport' | 'own' | 'brand'

export const sectors: Record<SectorId, L> = {
  hospitality: { es: 'Restauración', en: 'Hospitality' },
  'real-estate': { es: 'Inmobiliaria', en: 'Real estate' },
  fashion: { es: 'Moda', en: 'Fashion' },
  drinks: { es: 'Bebidas', en: 'Drinks' },
  sport: { es: 'Deporte', en: 'Sport' },
  own: { es: 'Producto propio', en: 'Own product' },
  /** Sector pendiente de confirmar por Pablo */
  brand: { es: 'Marca', en: 'Brand' },
}

/**
 * kind:
 *  - 'client'  → encargo de cliente (sección "Clientes")
 *  - 'study'   → estudio propio / pieza de concepto (sección "Estudios propios")
 *  - 'concept' → spec de una marca que NO es cliente: se etiqueta "Concepto · no oficial"
 *  - 'own'     → producto propio de NEO
 * Confirmado por Pablo: todos los vídeos y webs son encargos de clientes, salvo el spot de running (concepto).
 * Los nombres de las piezas (Mesa negra, Fuego…) son títulos de proyecto, no nombres de cliente.
 */
export type CaseKind = 'client' | 'study' | 'concept' | 'own'

export type Case = {
  slug: string
  title: string
  kind: CaseKind
  sector: SectorId
  services: ServiceId[]
  /** Una línea descriptiva */
  line: L
  media?: MediaId
  /** Clips adicionales para la página del caso */
  gallery?: MediaId[]
  /** Web en producción */
  url?: string
  year?: string
}

export const cases: Case[] = [
  // ── Webs de autor (clientes, en producción). Grabaciones de pantalla pendientes.
  { slug: 'navarro-real-estate', title: 'Navarro Real Estate', kind: 'client', sector: 'real-estate', services: ['websites'],
    line: { es: 'Web inmobiliaria a medida.', en: 'Bespoke real estate website.' }, url: 'https://navarrorealestate.es' },
  { slug: 'urbalia-inmobiliaria', title: 'Urbalia Inmobiliaria', kind: 'client', sector: 'real-estate', services: ['websites'],
    line: { es: 'Web inmobiliaria a medida.', en: 'Bespoke real estate website.' }, url: 'https://urbalia-inmobiliaria.vercel.app' },
  { slug: 'masventa-inmobiliaria', title: 'Masventa Inmobiliaria', kind: 'client', sector: 'real-estate', services: ['websites'],
    line: { es: 'Web inmobiliaria a medida.', en: 'Bespoke real estate website.' }, url: 'https://masventa-inmobiliaria.vercel.app' },
  { slug: 'nexodea', title: 'Nexodea', kind: 'client', sector: 'brand', services: ['websites'],
    line: { es: 'Web de autor.', en: 'Signature website.' }, url: 'https://nexodea.vercel.app' },
  { slug: 'waka-wow', title: 'Waka Wow', kind: 'client', sector: 'brand', services: ['websites'],
    line: { es: 'Web de autor.', en: 'Signature website.' }, url: 'https://waka-wow.vercel.app' },
  { slug: 'pedacito-de-cielo', title: 'Pedacito de Cielo', kind: 'client', sector: 'brand', services: ['websites'],
    line: { es: 'Web de autor.', en: 'Signature website.' }, url: 'https://pedacito-de-cielo.vercel.app' },

  // ── Piezas de vídeo y 3D con IA (encargos de clientes)
  { slug: 'real-empire-estate', title: 'Real Empire Estate', kind: 'client', sector: 'real-estate', services: ['ai-video', 'editing'],
    line: { es: 'Película de marca vertical para una inmobiliaria.', en: 'Vertical brand film for a real estate firm.' },
    media: 'empire-film', gallery: ['empire-teaser', 'golden-key'] },
  { slug: 'mesa-negra', title: 'Mesa negra', kind: 'client', sector: 'hospitality', services: ['ai-video'],
    line: { es: 'Spot de alta cocina sin cocina.', en: 'A fine-dining spot with no kitchen.' },
    media: 'gastro', gallery: ['flambe', 'fpv-kitchen'] },
  { slug: 'fuego', title: 'Fuego', kind: 'client', sector: 'hospitality', services: ['ai-video'],
    line: { es: 'Spot de producto para una taquería.', en: 'Product spot for a taqueria.' },
    media: 'tacos-spot', gallery: ['tacos-drop'] },
  { slug: 'reserva', title: 'Reserva', kind: 'client', sector: 'drinks', services: ['ai-video'],
    line: { es: 'Vino que nace del humo.', en: 'Wine born from smoke.' }, media: 'wine' },
  { slug: 'trono', title: 'Trono', kind: 'client', sector: 'fashion', services: ['ai-video', 'content'],
    line: { es: 'Videoclip de moda en formato vertical.', en: 'Vertical fashion music video.' }, media: 'fashion' },
  { slug: 'llave', title: 'La llave', kind: 'client', sector: 'real-estate', services: ['ai-3d', 'ai-video'],
    line: { es: 'Objeto 3D generado con IA, de la explosión al detalle.', en: 'AI-generated 3D object, from burst to detail.' },
    media: 'golden-key' },
  { slug: 'mudanza', title: 'Mudanza', kind: 'client', sector: 'real-estate', services: ['content'],
    line: { es: 'Contenido UGC generado con IA para redes.', en: 'AI-generated UGC content for social.' }, media: 'ugc-move' },
  { slug: 'running', title: 'Running', kind: 'concept', sector: 'sport', services: ['ai-video', 'editing'],
    line: { es: 'Spot deportivo de concepto. No oficial.', en: 'Concept sports spot. Unofficial.' }, media: 'running' },
  { slug: 'neo-app', title: 'NEO App', kind: 'own', sector: 'own', services: ['ai-3d', 'websites'],
    line: { es: 'App de entrenamiento con robot 3D interactivo.', en: 'Training app with an interactive 3D robot.' } },
]

export const caseBySlug = (slug: string) => cases.find((c) => c.slug === slug)
export const casesFor = (service: ServiceId) => cases.filter((c) => c.services.includes(service))
