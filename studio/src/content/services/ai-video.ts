import type { ServiceDetail } from './types'
import { faqCost, faqLabel, faqRights, specLabel, specRights, specTiming } from './shared'

export const aiVideo: ServiceDetail = {
  id: 'ai-video',
  sub: {
    es: 'Spots de producto, comida, bebida y moda con luz de cine. Dirigidos plano a plano.',
    en: 'Spots for product, food, drink and fashion, lit like cinema. Directed shot by shot.',
  },
  hero: {
    media: 'tacos-spot',
    orient: 'land',
    ai: true,
    label: {
      es: 'Spot de tacos generado con IA: brasa, queso fundido, salsa y packshot dorado.',
      en: 'AI-generated taco spot: embers, melted cheese, salsa and a golden packshot.',
    },
    meta: { es: 'Fuego · 16:9 · 8 s', en: 'Fuego · 16:9 · 8 s' },
  },
  intro: {
    strong: { es: 'Un spot ya no necesita cocina, equipo ni días de rodaje.', en: 'A spot no longer needs a kitchen, a crew or days of shooting.' },
    rest: {
      es: 'Necesita dirección: elegir la luz, el instante y el movimiento, y descartar todo lo que no esté a la altura de tu marca.',
      en: 'It needs direction: choosing the light, the moment and the movement, and discarding anything that falls short of your brand.',
    },
  },
  chapters: [
    {
      kind: 'scrub',
      media: 'tacos-drop',
      frames: 480,
      claim: { es: 'Una gota. 480 fotogramas.', en: 'One drop. 480 frames.' },
      text: {
        es: 'Ocho segundos a 60 fotogramas por segundo. Recorre el plano como lo revisamos nosotros: fotograma a fotograma, hasta que la gota cae justo donde debe.',
        en: 'Eight seconds at 60 frames per second. Scroll through the shot the way we review it: frame by frame, until the drop lands exactly where it should.',
      },
      proof: { es: 'Fuego · 8 s · 60 fps', en: 'Fuego · 8 s · 60 fps' },
      label: {
        es: 'Macro de una gota de salsa que cae sobre unos tacos. El scroll controla el plano fotograma a fotograma.',
        en: 'Macro of a drop of salsa falling onto tacos. Scrolling controls the shot frame by frame.',
      },
      marks: [
        { at: 0, label: { es: 'Start-frame', en: 'Start-frame' } },
        { at: 0.012, label: { es: '', en: '' } },
        { at: 0.988, label: { es: 'End-frame', en: 'End-frame' } },
      ],
      stills: [0, 0.5, 1],
    },
    {
      kind: 'start-end',
      media: 'tacos-drop',
      claim: { es: 'Dos fotogramas mandan.', en: 'Two frames lead.' },
      text: {
        es: 'Así dirigimos un plano: fijamos cómo empieza y cómo acaba, y el modelo genera el movimiento entre ambos. Tú apruebas dos imágenes antes de que exista el vídeo.',
        en: 'This is how we direct a shot: we set how it starts and how it ends, and the model generates the movement in between. You approve two images before the video exists.',
      },
      proof: { es: 'Fuego · fotograma 1 y fotograma 480', en: 'Fuego · frame 1 and frame 480' },
    },
    {
      kind: 'video',
      media: 'fpv-kitchen',
      ai: true,
      claim: { es: 'Cámaras que no caben en una cocina.', en: 'Cameras that don’t fit in a kitchen.' },
      text: {
        es: 'Un vuelo continuo que cruza la cocina y entra en el comedor. Sin dron, sin cerrar el restaurante y sin permisos de rodaje.',
        en: 'One continuous flight through the kitchen and into the dining room. No drone, no closing the restaurant, no filming permits.',
      },
      label: {
        es: 'Plano FPV generado con IA que cruza una cocina profesional hasta un comedor de lujo.',
        en: 'AI-generated FPV shot flying through a professional kitchen into a luxury dining room.',
      },
      meta: { es: 'Mesa negra · FPV · 8 s', en: 'Mesa negra · FPV · 8 s' },
    },
  ],
  process: {
    steps: [
      {
        text: {
          es: 'Nos cuentas el producto, el canal y lo que debe sentir quien lo vea. Si tienes fotos del producto, son el punto de partida.',
          en: 'You tell us about the product, the channel and what viewers should feel. If you have product photos, they are our starting point.',
        },
      },
      {
        text: {
          es: 'Escribimos el guion plano a plano y fijamos los fotogramas de inicio y final. Los apruebas antes de generar nada.',
          en: 'We write the shot-by-shot script and set the start and end frames. You approve them before anything is generated.',
        },
      },
      {
        text: {
          es: 'Generamos, elegimos y descartamos. Después montamos, etalonamos y añadimos el sonido.',
          en: 'We generate, select and discard. Then we edit, grade and add sound.',
        },
      },
      {
        text: {
          es: 'Recibes el spot en cada formato que necesites, etiquetado como contenido generado con IA.',
          en: 'You receive the spot in every format you need, labelled as AI-generated content.',
        },
      },
    ],
    deliverables: [
      { es: 'Spot máster', en: 'Master spot' },
      { es: 'Versiones 16:9, 9:16 y 4:5', en: '16:9, 9:16 and 4:5 versions' },
      { es: 'Cortes para redes', en: 'Social cut-downs' },
      { es: 'Fotogramas fijos para gráfica', en: 'Stills for print and display' },
    ],
  },
  specs: [
    { label: { es: 'Formatos', en: 'Formats' }, value: { es: '16:9, 9:16, 1:1 y 4:5', en: '16:9, 9:16, 1:1 and 4:5' } },
    { label: { es: 'Resolución', en: 'Resolution' }, value: { es: 'Adaptada a cada canal', en: 'Matched to each channel' } },
    { label: { es: 'Duración', en: 'Length' }, value: { es: 'De un plano a un spot completo', en: 'From a single shot to a full spot' } },
    { label: { es: 'Archivos', en: 'Files' }, value: { es: 'MP4; otros códecs a consultar', en: 'MP4; other codecs on request' } },
    { label: { es: 'Revisiones', en: 'Revisions' }, value: { es: 'Definidas en la propuesta', en: 'Set out in the proposal' } },
    specTiming,
    specRights,
    specLabel,
  ],
  faqs: [
    faqCost,
    {
      q: { es: '¿Saldrá mi producto tal y como es?', en: 'Will my product look exactly like it is?' },
      a: {
        es: 'Partimos de fotos de tu producto y revisamos cada plano para que forma, color y etiqueta sean fieles. Si un detalle no está a la altura, se descarta y se genera de nuevo.',
        en: 'We start from photos of your product and check every shot so that shape, colour and label stay true. If a detail falls short, it is discarded and generated again.',
      },
    },
    {
      q: { es: '¿En qué formatos lo recibo?', en: 'Which formats will I receive?' },
      a: {
        es: 'En los que necesites: horizontal para web y televisión, vertical para Reels, TikTok y Shorts, y 4:5 o cuadrado para el feed.',
        en: 'Whichever you need: horizontal for web and TV, vertical for Reels, TikTok and Shorts, and 4:5 or square for the feed.',
      },
    },
    {
      q: { es: '¿Puedo pedir cambios?', en: 'Can I ask for changes?' },
      a: {
        es: 'Sí. Las rondas de revisión se acuerdan en la propuesta, y lo más importante se aprueba antes de generar: el guion y los fotogramas clave.',
        en: 'Yes. Revision rounds are agreed in the proposal, and the most important decisions are approved before generating: the script and the key frames.',
      },
    },
    faqRights,
    faqLabel,
  ],
  pairs: [
    { id: 'editing', line: { es: 'El montaje, el color y el sonido que convierten planos en un spot.', en: 'The editing, colour and sound that turn shots into a spot.' } },
    { id: 'content', line: { es: 'Para que tu spot viva cada semana en redes.', en: 'So your spot keeps living on social, week after week.' } },
  ],
  cta: {
    title: { es: 'Tu producto, con luz de cine.', en: 'Your product, lit like cinema.' },
    text: { es: 'Cuéntanos qué quieres vender. Te respondemos con una propuesta.', en: 'Tell us what you want to sell. We’ll reply with a proposal.' },
  },
  seo: {
    description: {
      es: 'Spots de producto, comida, bebida y moda generados con IA y dirigidos plano a plano por NEO Studio. Formatos para cada canal y etiquetado IA.',
      en: 'AI-generated spots for product, food, drink and fashion, directed shot by shot by NEO Studio. Formats for every channel and AI labelling.',
    },
  },
}
