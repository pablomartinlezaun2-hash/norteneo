import type { L } from '@/i18n'
import type { ServiceId } from '@/content/services'

/** Copy de La Casa (home) y del hub /servicios. ES principal, EN nativo. */
export const houseCopy = {
  es: {
    title: 'Seis oficios, una sola casa.',
    intro: 'Si sabes lo que buscas, entra por oficio. Si no, empieza por tu situación.',
    modes: 'Cómo ver los oficios',
    byCraft: 'Por oficio',
    bySituation: 'Por situación',
    discover: 'Descubrir',
    propose: 'Solicitar propuesta',
    legend: '¿En qué punto estás?',
    suggest: 'Te proponemos',
    announce: (names: string) => `Te proponemos: ${names}.`,
    ai: 'Generado con IA, dirigido por NEO',
    preview: (name: string) => `Vista previa de ${name}`,
    and: ' y ',
  },
  en: {
    title: 'Six crafts, one house.',
    intro: 'If you know what you need, browse by craft. If not, start from your situation.',
    modes: 'How to browse the crafts',
    byCraft: 'By craft',
    bySituation: 'By situation',
    discover: 'Discover',
    propose: 'Request a proposal',
    legend: 'Where are you right now?',
    suggest: 'What we suggest',
    announce: (names: string) => `We suggest: ${names}.`,
    ai: 'AI-generated, directed by NEO',
    preview: (name: string) => `Preview of ${name}`,
    and: ' and ',
  },
}

export type SituationId = 'launch' | 'website' | 'weekly' | 'self' | 'footage'

export type Situation = {
  id: SituationId
  label: L
  /** 1–2 servicios recomendados, en orden, con el porqué */
  picks: { id: ServiceId; why: L }[]
}

/** "Por situación": 5 puntos de partida y los oficios que proponemos para cada uno. */
export const situations: Situation[] = [
  {
    id: 'launch',
    label: { es: 'Lanzo un producto', en: "I'm launching a product" },
    picks: [
      {
        id: 'ai-3d',
        why: {
          es: 'Primero, tu producto en 3D, fiel al original y listo para cualquier escena.',
          en: 'First, your product in 3D, true to the original and ready for any scene.',
        },
      },
      {
        id: 'ai-video',
        why: {
          es: 'Después, el spot que lo presenta, en horizontal y en vertical.',
          en: 'Then the spot that introduces it, in landscape and vertical.',
        },
      },
    ],
  },
  {
    id: 'website',
    label: { es: 'Mi web no está a la altura', en: "My website isn't up to scratch" },
    picks: [
      {
        id: 'websites',
        why: {
          es: 'Una web a medida y rápida, a la altura de tu marca. Sin plantillas.',
          en: 'A bespoke, fast website that lives up to your brand. No templates.',
        },
      },
    ],
  },
  {
    id: 'weekly',
    label: { es: 'Tengo que publicar cada semana', en: 'I need to post every week' },
    picks: [
      {
        id: 'content',
        why: {
          es: 'Un plan mensual con guiones y piezas listas para publicar.',
          en: 'A monthly plan with scripts and pieces ready to post.',
        },
      },
      {
        id: 'editing',
        why: {
          es: 'Montaje y color para que cada pieza salga terminada.',
          en: 'Editing and colour so every piece goes out finished.',
        },
      },
    ],
  },
  {
    id: 'self',
    label: { es: 'Quiero grabarme yo', en: 'I want to film myself' },
    picks: [
      {
        id: 'mobile-cinema',
        why: {
          es: 'Tu móvil, bien ajustado y rodando en Log, con un acabado de estudio.',
          en: 'Your phone, properly set up and shooting in Log, with a studio finish.',
        },
      },
    ],
  },
  {
    id: 'footage',
    label: { es: 'Tengo material y no sé montarlo', en: "I have footage and don't know how to edit it" },
    picks: [
      {
        id: 'editing',
        why: {
          es: 'Montaje, etalonado en DaVinci y grafismo en After Effects, con entregas para cada plataforma.',
          en: 'Editing, grading in DaVinci and motion graphics in After Effects, delivered for every platform.',
        },
      },
    ],
  },
]

export type CompareKey = 'get' | 'format' | 'who' | 'start'

export const compareRows: { id: CompareKey; label: L }[] = [
  { id: 'get', label: { es: 'Qué recibes', en: 'What you get' } },
  { id: 'format', label: { es: 'Formato', en: 'Format' } },
  { id: 'who', label: { es: 'Para quién', en: "Who it's for" } },
  { id: 'start', label: { es: 'Punto de partida', en: 'Starting point' } },
]

/** Ficha comparativa del hub (sin precios ni plazos). El formato sale de content/services. */
export const compare: Record<ServiceId, Record<Exclude<CompareKey, 'format'>, L>> = {
  'ai-video': {
    get: {
      es: 'Spots dirigidos plano a plano, con montaje, color y sonido.',
      en: 'Spots directed shot by shot, with editing, colour and sound.',
    },
    who: { es: 'Restauración, bebidas, moda e inmobiliaria.', en: 'Hospitality, drinks, fashion and real estate.' },
    start: { es: 'Fotos de tu producto y una idea. Sin plató.', en: 'Photos of your product and an idea. No set.' },
  },
  'ai-3d': {
    get: {
      es: 'Un modelo 3D de tu producto y escenas para web, anuncio o catálogo.',
      en: 'A 3D model of your product and scenes for web, ads or catalogue.',
    },
    who: { es: 'Marcas con un producto físico que enseñar.', en: 'Brands with a physical product to show.' },
    start: { es: 'Fotos de tu producto.', en: 'Photos of your product.' },
  },
  websites: {
    get: {
      es: 'Dirección de arte, desarrollo, movimiento y puesta en marcha con SEO.',
      en: 'Art direction, build, motion and launch, with SEO.',
    },
    who: {
      es: 'Inmobiliarias, restaurantes y marcas que cuidan su imagen.',
      en: 'Real estate firms, restaurants and image-conscious brands.',
    },
    start: { es: 'Tu marca y lo que la web tiene que conseguir.', en: 'Your brand and what the site needs to achieve.' },
  },
  editing: {
    get: {
      es: 'Montaje, etalonado en DaVinci y motion graphics en After Effects.',
      en: 'Editing, grading in DaVinci and motion graphics in After Effects.',
    },
    who: { es: 'Marcas y creadores con material grabado.', en: 'Brands and creators with footage to hand.' },
    start: { es: 'Tu material en bruto.', en: 'Your raw footage.' },
  },
  content: {
    get: {
      es: 'Estrategia mensual, guiones y piezas producidas con IA.',
      en: 'A monthly strategy, scripts and pieces produced with AI.',
    },
    who: { es: 'Marcas que necesitan publicar cada semana.', en: 'Brands that need to post every week.' },
    start: { es: 'Tus objetivos y tus redes actuales.', en: 'Your goals and your current channels.' },
  },
  'mobile-cinema': {
    get: {
      es: 'Ajustes de cámara, luz con lo que tienes, perfiles Log y edición con IA.',
      en: 'Camera settings, lighting with what you have, Log profiles and AI editing.',
    },
    who: {
      es: 'Creadores y marcas que quieren grabarse ellos mismos.',
      en: 'Creators and brands who want to film themselves.',
    },
    start: { es: 'Tu móvil.', en: 'Your phone.' },
  },
}

export const hubCopy = {
  es: {
    seoTitle: 'Servicios',
    seoDescription:
      'Vídeo y 3D con IA, webs de autor, postproducción, contenido para redes y cine con tu móvil. Seis oficios dirigidos por NEO Studio, con propuesta a medida.',
    title: 'Seis oficios, una sola casa.',
    lead: 'Vídeo y 3D con IA, webs de autor, postproducción, contenido y cine con tu móvil. Todo dirigido por NEO.',
    indexTitle: 'Los oficios',
    compareTitle: 'Qué incluye cada oficio.',
    compareLead: 'Sin precios de catálogo: cada propuesta se hace a medida de tu marca.',
    compareCaption: 'Comparativa de los seis oficios de NEO Studio',
    compareA: 'Primer oficio',
    compareB: 'Segundo oficio',
    compareWith: 'con',
    compareVerb: 'Compara',
    closingTitle: '¿Por dónde empezamos?',
    closingLead: 'Cuéntanos qué necesita tu marca. Te respondemos con una propuesta a medida.',
    cta: 'Solicitar propuesta',
    listName: 'Servicios de NEO Studio',
  },
  en: {
    seoTitle: 'Services',
    seoDescription:
      'AI video and 3D, signature websites, post-production, social content and mobile cinema. Six crafts directed by NEO Studio, with a tailored proposal.',
    title: 'Six crafts, one house.',
    lead: 'AI video and 3D, signature websites, post-production, social content and mobile cinema. All directed by NEO.',
    indexTitle: 'The crafts',
    compareTitle: 'What each craft includes.',
    compareLead: 'No price list: every proposal is tailored to your brand.',
    compareCaption: 'Comparison of the six NEO Studio crafts',
    compareA: 'First craft',
    compareB: 'Second craft',
    compareWith: 'with',
    compareVerb: 'Compare',
    closingTitle: 'Where shall we start?',
    closingLead: "Tell us what your brand needs. We'll reply with a tailored proposal.",
    cta: 'Request a proposal',
    listName: 'NEO Studio services',
  },
}
