import type { ServiceDetail } from './types'
import { faqCost, faqLabel, faqRights, specLabel, specRights, specTiming } from './shared'

export const ai3d: ServiceDetail = {
  id: 'ai-3d',
  sub: {
    es: 'Tu producto en volumen, fiel al original, en escenas que ningún estudio podría construir.',
    en: 'Your product in three dimensions, true to the original, in scenes no studio could build.',
  },
  hero: {
    media: 'golden-key',
    orient: 'land',
    ai: true,
    still: true,
    label: { es: 'Llave dorada modelada en 3D con IA sobre un fondo de oro.', en: 'A golden key modelled in 3D with AI on a gold background.' },
    meta: { es: 'La llave · packshot', en: 'La llave · packshot' },
  },
  intro: {
    strong: { es: 'Primero, tu producto modelado con fidelidad.', en: 'First, your product, modelled faithfully.' },
    rest: {
      es: 'Después, lo llevamos a escenas que no existen: oro en suspensión, arena, una cerradura que se abre a la luz.',
      en: 'Then we take it into scenes that don’t exist: gold in mid-air, sand, a keyhole opening onto light.',
    },
  },
  chapters: [
    {
      kind: 'scrub',
      media: 'golden-key',
      to: 0.755,
      claim: { es: 'El objeto, fiel.\nLa escena, imposible.', en: 'The object, faithful.\nThe scene, impossible.' },
      text: {
        es: 'La llave es siempre la misma: forma, cepillado del metal y proporciones. Lo que cambia es el mundo que la rodea, hasta llegar a la cerradura con luz.',
        en: 'The key never changes: its shape, the brushed metal, its proportions. What changes is the world around it, all the way to the lit keyhole.',
      },
      proof: { es: 'La llave · 3D con IA', en: 'La llave · AI 3D' },
      label: {
        es: 'Llave dorada en 3D: explosión de oro, arena, detalle del metal y una cerradura que se abre a la luz. El scroll controla la escena.',
        en: 'Golden 3D key: a burst of gold, sand, metal detail and a keyhole opening onto light. Scrolling controls the scene.',
      },
      marks: [
        { at: 0, label: { es: 'Oro en suspensión', en: 'Gold in mid-air' } },
        { at: 0.27, label: { es: 'Arena', en: 'Sand' } },
        { at: 0.4, label: { es: 'Metal cepillado', en: 'Brushed metal' } },
        { at: 0.89, label: { es: 'Cerradura con luz', en: 'Lit keyhole' } },
      ],
      stills: [0.04, 0.3, 1],
    },
    {
      kind: 'scenes',
      media: 'golden-key',
      claim: { es: 'Un modelo.\nCada uso.', en: 'One model.\nEvery use.' },
      text: {
        es: 'Con el mismo objeto resolvemos el anuncio, la ficha de producto y el detalle que vende el material. Elige un uso.',
        en: 'The same object covers the ad, the product page and the close-up that sells the material. Choose a use.',
      },
      proof: { es: 'La llave · fotogramas de la misma pieza', en: 'La llave · frames from the same piece' },
      scenes: [
        { at: 17 / 149, label: { es: 'Anuncio', en: 'Ad' }, text: { es: 'Movimiento y espectáculo para captar en segundos.', en: 'Motion and spectacle to win attention in seconds.' } },
        { at: 34 / 149, label: { es: 'Escena', en: 'Scene' }, text: { es: 'El producto dentro de un mundo propio.', en: 'The product inside a world of its own.' } },
        { at: 85 / 149, label: { es: 'Detalle', en: 'Detail' }, text: { es: 'Macro del material: el cepillado, el canto, el brillo.', en: 'A macro of the material: the brushing, the edge, the shine.' } },
        { at: 1, label: { es: 'Catálogo', en: 'Catalogue' }, text: { es: 'Fondo limpio y luz de estudio para la ficha de producto.', en: 'A clean background and studio light for the product page.' } },
      ],
    },
    {
      kind: 'terms',
      claim: { es: 'Listo para la web, el anuncio y el catálogo.', en: 'Ready for web, ads and catalogue.' },
      text: {
        es: 'Del mismo trabajo salen todas las piezas. Las pides en la propuesta y te llegan preparadas para cada uso.',
        en: 'Every piece comes from the same work. You choose them in the proposal and receive them ready for each use.',
      },
      items: [
        { term: { es: 'Vídeo', en: 'Video' }, text: { es: 'Piezas 16:9 y 9:16 para anuncios, redes y cabeceras web.', en: '16:9 and 9:16 pieces for ads, social and website headers.' } },
        { term: { es: 'Imagen fija', en: 'Stills' }, text: { es: 'Renders para catálogo, ficha de producto y gráfica.', en: 'Renders for catalogues, product pages and print.' } },
        { term: { es: 'Modelo 3D', en: '3D model' }, text: { es: 'Para webs interactivas y realidad aumentada, cuando el proyecto lo pide.', en: 'For interactive websites and augmented reality, when the project calls for it.' } },
      ],
    },
  ],
  process: {
    steps: [
      {
        text: {
          es: 'Nos envías fotos del producto desde varios ángulos y nos cuentas dónde va a vivir: anuncio, web o catálogo.',
          en: 'You send photos of the product from several angles and tell us where it will live: ad, website or catalogue.',
        },
      },
      {
        text: {
          es: 'Definimos materiales, luz y escenas, y te mostramos los primeros fotogramas antes de producir.',
          en: 'We define materials, light and scenes, and show you the first frames before production.',
        },
      },
      {
        text: {
          es: 'Modelamos, generamos las escenas y revisamos cada render contra tus fotos.',
          en: 'We model, generate the scenes and check every render against your photos.',
        },
      },
      {
        text: {
          es: 'Recibes vídeo, imágenes y, si lo pediste, el modelo, etiquetados como contenido generado con IA.',
          en: 'You receive video, stills and, if requested, the model, labelled as AI-generated content.',
        },
      },
    ],
    deliverables: [
      { es: 'Vídeos 16:9 y 9:16', en: '16:9 and 9:16 videos' },
      { es: 'Renders fijos', en: 'Still renders' },
      { es: 'Escenas a medida', en: 'Bespoke scenes' },
      { es: 'Modelo 3D, si el proyecto lo pide', en: '3D model, when the project calls for it' },
    ],
  },
  specs: [
    { label: { es: 'Punto de partida', en: 'Starting point' }, value: { es: 'Fotos del producto desde varios ángulos', en: 'Product photos from several angles' } },
    { label: { es: 'Salidas', en: 'Outputs' }, value: { es: 'Vídeo, imagen fija y modelo 3D', en: 'Video, stills and 3D model' } },
    { label: { es: 'Formatos de vídeo', en: 'Video formats' }, value: { es: '16:9 y 9:16', en: '16:9 and 9:16' } },
    { label: { es: 'Formatos 3D', en: '3D formats' }, value: { es: 'GLB y USDZ, a consultar', en: 'GLB and USDZ, on request' } },
    specTiming,
    specRights,
    specLabel,
  ],
  faqs: [
    faqCost,
    {
      q: { es: '¿Qué necesito enviaros?', en: 'What do I need to send you?' },
      a: {
        es: 'Fotos de tu producto desde varios ángulos, con buena luz, y medidas o planos si los tienes. Cuanta más referencia, más fiel el resultado.',
        en: 'Photos of your product from several angles, in good light, plus measurements or drawings if you have them. The more reference, the more faithful the result.',
      },
    },
    {
      q: { es: '¿Será exacto?', en: 'Will it be accurate?' },
      a: {
        es: 'Buscamos que forma, materiales y proporciones sean fieles. Revisamos cada render contra tus fotos y corregimos lo que no lo sea antes de entregar.',
        en: 'We aim for faithful shape, materials and proportions. We check every render against your photos and correct anything that isn’t before delivery.',
      },
    },
    faqRights,
    faqLabel,
  ],
  pairs: [
    { id: 'ai-video', line: { es: 'Tu objeto en movimiento: del packshot al spot.', en: 'Your object in motion: from packshot to spot.' } },
    { id: 'websites', line: { es: 'Tu producto en volumen, dentro de una web a su altura.', en: 'Your product in 3D, inside a website that matches it.' } },
  ],
  cta: {
    title: { es: 'Tu producto, en volumen.', en: 'Your product, in three dimensions.' },
    text: { es: 'Envíanos unas fotos y cuéntanos qué necesitas. Te respondemos con una propuesta.', en: 'Send us a few photos and tell us what you need. We’ll reply with a proposal.' },
  },
  seo: {
    description: {
      es: 'Producto en 3D con IA, fiel al original, para anuncios, webs y catálogo. Escenas imposibles dirigidas por NEO Studio.',
      en: 'AI 3D product imagery, true to the original, for ads, websites and catalogues. Impossible scenes directed by NEO Studio.',
    },
  },
}
