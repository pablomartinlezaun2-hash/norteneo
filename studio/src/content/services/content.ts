import type { ServiceDetail } from './types'
import { faqCost, faqLabel, faqRights, specRights } from './shared'

export const content: ServiceDetail = {
  id: 'content',
  sub: {
    es: 'Guiones y piezas verticales listas para publicar, cada mes, con la estética de una campaña.',
    en: 'Scripts and vertical pieces ready to post, every month, with the look of a campaign.',
  },
  hero: {
    media: 'fashion',
    orient: 'port',
    ai: true,
    label: {
      es: 'Videoclip vertical de moda: un hombre con abrigo burdeos y gafas negras ante un trono y bailarinas.',
      en: 'Vertical fashion music video: a man in a burgundy coat and black sunglasses before a throne and dancers.',
    },
    meta: { es: 'Trono · 9:16 · 14 s', en: 'Trono · 9:16 · 14 s' },
  },
  intro: {
    strong: { es: 'Cada semana, piezas listas para publicar.', en: 'Every week, pieces ready to post.' },
    rest: {
      es: 'Con estrategia, guion y producción con IA, adaptadas a cada red y etiquetadas con transparencia.',
      en: 'With strategy, scripts and AI production, adapted to each platform and labelled transparently.',
    },
  },
  chapters: [
    {
      kind: 'script',
      media: 'fashion',
      claim: { es: 'Del guion al feed.', en: 'From script to feed.' },
      text: {
        es: 'Cada pieza nace de un guion con tiempos. Dale al play y sigue la línea activa; toca cualquier línea para saltar a ese momento.',
        en: 'Every piece starts as a timed script. Press play and follow the active line; tap any line to jump to that moment.',
      },
      proof: { es: 'Guion escrito por NEO para esta pieza', en: 'Script written by NEO for this piece' },
      label: {
        es: 'Videoclip vertical de moda: abrigo burdeos, trono y bailarinas.',
        en: 'Vertical fashion music video: burgundy coat, throne and dancers.',
      },
      meta: { es: 'Trono · 9:16 · 14 s', en: 'Trono · 9:16 · 14 s' },
      lines: [
        { t: 0, text: { es: 'Primer plano. Gafas negras, abrigo burdeos. Mira a cámara, inmóvil.', en: 'Close-up. Black sunglasses, burgundy coat. He stares into the lens, still.' } },
        { t: 3, text: { es: 'La mano barre el objetivo. Transición sin corte.', en: 'His hand sweeps across the lens. A transition with no cut.' } },
        { t: 4.5, text: { es: 'La cámara retrocede: el abrigo se abre y aparece la cadena.', en: 'The camera pulls back: the coat falls open, revealing the chain.' } },
        { t: 8, text: { es: 'Baja la cabeza. Detrás, el trono y las bailarinas.', en: 'He lowers his head. Behind him, the throne and the dancers.' } },
        { t: 10, text: { es: 'Plano entero. El salón rojo, completo.', en: 'Full shot. The red hall, in its entirety.' } },
        { t: 12.8, text: { es: 'Las bailarinas alzan los brazos. Señala a cámara.', en: 'The dancers raise their arms. He points at the camera.' } },
      ],
    },
    {
      kind: 'phone',
      media: 'ugc-move',
      ai: true,
      claim: { es: 'UGC sin casting.', en: 'UGC without casting.' },
      text: {
        es: 'Una creadora enseña su piso nuevo entre cajas. No existe: la generamos con IA, con guion y tono de marca, y la etiquetamos como contenido sintético.',
        en: 'A creator shows off her new flat among moving boxes. She doesn’t exist: we generate her with AI, with a script and a brand voice, and label her as synthetic content.',
      },
      label: {
        es: 'Vídeo UGC generado con IA: una chica se graba en su piso nuevo durante la mudanza.',
        en: 'AI-generated UGC video: a young woman films herself in her new flat during the move.',
      },
      meta: { es: 'Mudanza · 9:16 · 15 s', en: 'Mudanza · 9:16 · 15 s' },
    },
    {
      kind: 'terms',
      claim: { es: 'Cada red, su formato.', en: 'Every platform, its format.' },
      text: {
        es: 'Planificamos el mes con tu equipo y entregamos cada pieza con su texto y su versión para cada plataforma.',
        en: 'We plan the month with your team and deliver every piece with its caption and a version for each platform.',
      },
      items: [
        { term: { es: 'Instagram', en: 'Instagram' }, text: { es: 'Reels 9:16 y publicaciones 4:5 para el feed.', en: '9:16 Reels and 4:5 posts for the feed.' } },
        { term: { es: 'TikTok', en: 'TikTok' }, text: { es: '9:16, con el gancho en el primer segundo y subtítulos.', en: '9:16, with the hook in the first second and subtitles.' } },
        { term: { es: 'YouTube Shorts', en: 'YouTube Shorts' }, text: { es: '9:16, con título y miniatura pensados para que te encuentren.', en: '9:16, with a title and thumbnail made to be found.' } },
        { term: { es: 'LinkedIn', en: 'LinkedIn' }, text: { es: '1:1 o 4:5, con un tono más sobrio.', en: '1:1 or 4:5, in a more restrained tone.' } },
      ],
    },
  ],
  process: {
    steps: [
      {
        text: {
          es: 'Nos cuentas tu marca, tus redes y qué quieres conseguir este mes.',
          en: 'You tell us about your brand, your channels and what you want to achieve this month.',
        },
      },
      {
        text: {
          es: 'Proponemos temas y escribimos los guiones. Los apruebas antes de producir.',
          en: 'We propose topics and write the scripts. You approve them before production.',
        },
      },
      {
        text: {
          es: 'Producimos las piezas con IA, las montamos y las adaptamos a cada red.',
          en: 'We produce the pieces with AI, edit them and adapt them to each platform.',
        },
      },
      {
        text: {
          es: 'Recibes el mes listo para publicar, con textos y etiquetas de contenido sintético.',
          en: 'You receive the month ready to post, with captions and synthetic-content labels.',
        },
      },
    ],
    deliverables: [
      { es: 'Plan mensual', en: 'Monthly plan' },
      { es: 'Guiones con tiempos', en: 'Timed scripts' },
      { es: 'Piezas verticales y de feed', en: 'Vertical and feed pieces' },
      { es: 'Textos para cada publicación', en: 'Captions for every post' },
    ],
  },
  specs: [
    { label: { es: 'Cadencia', en: 'Cadence' }, value: { es: 'Mensual', en: 'Monthly' } },
    { label: { es: 'Incluye', en: 'Includes' }, value: { es: 'Estrategia, guiones, producción y versiones por red', en: 'Strategy, scripts, production and per-platform versions' } },
    { label: { es: 'Formatos', en: 'Formats' }, value: { es: '9:16, 4:5 y 1:1', en: '9:16, 4:5 and 1:1' } },
    { label: { es: 'Producción', en: 'Production' }, value: { es: 'Con IA, etiquetada como contenido sintético', en: 'With AI, labelled as synthetic content' } },
    { label: { es: 'Volumen', en: 'Volume' }, value: { es: 'Según propuesta', en: 'Per proposal' } },
    specRights,
  ],
  faqs: [
    faqCost,
    {
      q: { es: '¿Escribís vosotros los guiones?', en: 'Do you write the scripts?' },
      a: {
        es: 'Sí. Cada pieza parte de un guion con tiempos que apruebas antes de producir.',
        en: 'Yes. Every piece starts from a timed script that you approve before production.',
      },
    },
    {
      q: { es: '¿Las personas de los vídeos UGC son reales?', en: 'Are the people in the UGC videos real?' },
      a: {
        es: 'En las piezas generadas con IA, no: son personas sintéticas y se etiquetan como tales. Nunca reproducimos a personas reales sin su autorización.',
        en: 'In AI-generated pieces, no: they are synthetic people and are labelled as such. We never reproduce real people without their permission.',
      },
    },
    {
      q: { es: '¿Publicáis por nosotros?', en: 'Do you post for us?' },
      a: {
        es: 'Lo acordamos en la propuesta: te entregamos las piezas listas para publicar o nos ocupamos también de programarlas.',
        en: 'We agree it in the proposal: we deliver the pieces ready to post, or we schedule them for you too.',
      },
    },
    faqRights,
    faqLabel,
  ],
  pairs: [
    { id: 'ai-video', line: { es: 'Piezas de marca más ambiciosas para tus campañas.', en: 'More ambitious brand pieces for your campaigns.' } },
    { id: 'editing', line: { es: 'Montaje, color y subtítulos para cada plataforma.', en: 'Editing, colour and subtitles for every platform.' } },
  ],
  cta: {
    title: { es: 'Tu próximo mes, resuelto.', en: 'Your next month, sorted.' },
    text: { es: 'Cuéntanos tu marca y tus redes. Te respondemos con una propuesta.', en: 'Tell us about your brand and your channels. We’ll reply with a proposal.' },
  },
  seo: {
    description: {
      es: 'Contenido mensual para redes: estrategia, guiones y piezas verticales producidas con IA y etiquetadas con transparencia. NEO Studio.',
      en: 'Monthly social content: strategy, scripts and vertical pieces produced with AI and transparently labelled. NEO Studio.',
    },
  },
}
