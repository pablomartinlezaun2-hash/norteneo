import type { ServiceDetail } from './types'
import { faqCost, faqLabel, faqRights, specRights, specTiming } from './shared'

export const editing: ServiceDetail = {
  id: 'editing',
  sub: {
    es: 'Montaje, color y gráficos con IA, After Effects y DaVinci Resolve. El ritmo también es mensaje.',
    en: 'Editing, colour and graphics with AI, After Effects and DaVinci Resolve. Rhythm is part of the message.',
  },
  hero: {
    media: 'empire-teaser',
    orient: 'port',
    ai: true,
    label: {
      es: 'Teaser vertical de Real Empire Estate: cerradura iluminada, pasillo, ático y logotipo.',
      en: 'Real Empire Estate vertical teaser: lit lock, hallway, penthouse and logo.',
    },
    meta: { es: 'Real Empire Estate · 9:16 · 7 s', en: 'Real Empire Estate · 9:16 · 7 s' },
  },
  intro: {
    strong: { es: 'La IA genera planos. El montaje decide qué cuentan.', en: 'AI generates shots. The edit decides what they say.' },
    rest: {
      es: 'Unimos IA, After Effects y DaVinci Resolve para que el ritmo, el color y la tipografía digan lo que tu marca quiere decir.',
      en: 'We combine AI, After Effects and DaVinci Resolve so that rhythm, colour and type say what your brand means to say.',
    },
  },
  chapters: [
    {
      kind: 'cuts',
      media: 'empire-film',
      claim: { es: 'El ritmo cambia el mensaje.', en: 'Rhythm changes the message.' },
      text: {
        es: 'Velocidad y encuadre deciden si una pieza transmite urgencia o calma. Elige un montaje y mira cómo cambia la misma película.',
        en: 'Speed and framing decide whether a piece feels urgent or calm. Pick a cut and watch the same film change.',
      },
      proof: { es: 'Real Empire Estate · 9:16', en: 'Real Empire Estate · 9:16' },
      label: {
        es: 'Película vertical de Real Empire Estate: llave, pasillo, rótulos de vender y alquilar, ciudad y logotipo.',
        en: 'Real Empire Estate vertical film: key, hallway, sell and rent signage, city and logo.',
      },
      cuts: [
        {
          name: { es: 'Original', en: 'Original' },
          rate: 1,
          frame: 'full',
          meta: { es: '1× · 9:16 completo', en: '1× · full 9:16' },
          text: { es: 'El montaje tal como se entregó.', en: 'The cut as it was delivered.' },
        },
        {
          name: { es: 'Urgente', en: 'Urgent' },
          rate: 1.5,
          frame: 'close',
          meta: { es: '1,5× · encuadre cerrado', en: '1.5× · tight framing' },
          text: { es: 'Más rápido y más cerca: energía para frenar el scroll.', en: 'Faster and closer: energy that stops the scroll.' },
        },
        {
          name: { es: 'Pausado', en: 'Unhurried' },
          rate: 0.6,
          frame: 'feed',
          meta: { es: '0,6× · recorte 4:5', en: '0.6× · 4:5 crop' },
          text: { es: 'Más lento y con aire: se percibe más caro. Pensado para el feed.', en: 'Slower, with room to breathe: it reads as more expensive. Made for the feed.' },
        },
      ],
      note: {
        es: 'Es el mismo clip: aquí solo cambian la velocidad y el encuadre. En una edición real también cambian los cortes, el orden y el sonido.',
        en: 'It’s the same clip: only speed and framing change here. In a real edit, the cuts, the order and the sound change too.',
      },
    },
    {
      kind: 'terms',
      claim: { es: 'Tres herramientas, un solo criterio.', en: 'Three tools, one judgement.' },
      text: {
        es: 'Cada una hace lo que mejor sabe hacer. La decisión final sobre cada plano es nuestra.',
        en: 'Each one does what it does best. The final call on every shot is ours.',
      },
      items: [
        { term: { es: 'IA', en: 'AI' }, text: { es: 'Genera, amplía y limpia planos: extender un fondo, alargar una toma, quitar lo que sobra.', en: 'Generates, extends and cleans shots: widening a background, lengthening a take, removing what doesn’t belong.' } },
        { term: { es: 'After Effects', en: 'After Effects' }, text: { es: 'Títulos y gráficos con tipografía de verdad, porque la IA todavía escribe mal.', en: 'Titles and graphics with real typography, because AI still can’t spell.' } },
        { term: { es: 'DaVinci Resolve', en: 'DaVinci Resolve' }, text: { es: 'Montaje, etalonado y sonido final: el color que une planos de orígenes distintos.', en: 'Editing, grading and final sound: the colour that ties together shots from different sources.' } },
      ],
    },
    {
      kind: 'terms',
      claim: { es: 'Cada plataforma, su versión.', en: 'Every platform, its own version.' },
      text: {
        es: 'Un mismo material no se monta igual para el feed que para una pantalla grande. Preparamos cada versión desde el principio.',
        en: 'The same footage isn’t cut the same way for the feed and for a big screen. We plan every version from the start.',
      },
      items: [
        { term: { es: 'Reels, TikTok y Shorts', en: 'Reels, TikTok and Shorts' }, text: { es: '9:16, con subtítulos y la idea en el primer segundo.', en: '9:16, with subtitles and the idea in the first second.' } },
        { term: { es: 'Feed', en: 'Feed' }, text: { es: '4:5 y 1:1, con el encuadre recompuesto, no solo recortado.', en: '4:5 and 1:1, with the framing recomposed, not just cropped.' } },
        { term: { es: 'Web y YouTube', en: 'Web and YouTube' }, text: { es: '16:9 con el máster de color completo.', en: '16:9 with the full colour master.' } },
      ],
    },
  ],
  process: {
    steps: [
      {
        text: {
          es: 'Nos envías el material, grabado o generado, y nos cuentas dónde se va a publicar.',
          en: 'You send the footage, shot or generated, and tell us where it will be published.',
        },
      },
      {
        text: {
          es: 'Proponemos estructura, ritmo y estilo gráfico, y lo aprobamos contigo antes de montar.',
          en: 'We propose structure, rhythm and graphic style, and agree it with you before cutting.',
        },
      },
      {
        text: {
          es: 'Montamos, etalonamos, animamos títulos y mezclamos el sonido.',
          en: 'We edit, grade, animate titles and mix the sound.',
        },
      },
      {
        text: {
          es: 'Recibes el máster y una versión para cada plataforma.',
          en: 'You receive the master and a version for each platform.',
        },
      },
    ],
    deliverables: [
      { es: 'Máster editado y etalonado', en: 'Edited and graded master' },
      { es: 'Versiones 9:16, 4:5, 1:1 y 16:9', en: '9:16, 4:5, 1:1 and 16:9 versions' },
      { es: 'Títulos y motion graphics', en: 'Titles and motion graphics' },
      { es: 'Subtítulos', en: 'Subtitles' },
    ],
  },
  specs: [
    { label: { es: 'Material de entrada', en: 'Source footage' }, value: { es: 'Cámara, móvil o generado con IA', en: 'Camera, phone or AI-generated' } },
    { label: { es: 'Formatos de entrega', en: 'Delivery formats' }, value: { es: '9:16, 4:5, 1:1 y 16:9', en: '9:16, 4:5, 1:1 and 16:9' } },
    { label: { es: 'Color', en: 'Colour' }, value: { es: 'Etalonado en DaVinci Resolve', en: 'Graded in DaVinci Resolve' } },
    { label: { es: 'Gráficos', en: 'Graphics' }, value: { es: 'Títulos y motion graphics en After Effects', en: 'Titles and motion graphics in After Effects' } },
    { label: { es: 'Subtítulos', en: 'Subtitles' }, value: { es: 'Incrustados o en archivo aparte', en: 'Burned in or as a separate file' } },
    { label: { es: 'Revisiones', en: 'Revisions' }, value: { es: 'Definidas en la propuesta', en: 'Set out in the proposal' } },
    specTiming,
    specRights,
  ],
  faqs: [
    faqCost,
    {
      q: { es: '¿Puedo enviaros material grabado por mí?', en: 'Can I send you footage I shot myself?' },
      a: {
        es: 'Sí: de cámara o de móvil, en el archivo original. Cuanto menos comprimido llegue, más margen tenemos en el color.',
        en: 'Yes: from a camera or a phone, in the original file. The less compressed it arrives, the more room we have in the grade.',
      },
    },
    {
      q: { es: '¿Qué programas usáis?', en: 'Which software do you use?' },
      a: {
        es: 'Herramientas de IA para generar y limpiar planos, After Effects para gráficos y títulos, y DaVinci Resolve para montaje, color y sonido.',
        en: 'AI tools to generate and clean up shots, After Effects for graphics and titles, and DaVinci Resolve for editing, colour and sound.',
      },
    },
    faqRights,
    faqLabel,
  ],
  pairs: [
    { id: 'ai-video', line: { es: 'Planos generados con IA, listos para montar.', en: 'AI-generated shots, ready to cut.' } },
    { id: 'content', line: { es: 'Montajes pensados para cada red, cada semana.', en: 'Edits made for every platform, every week.' } },
  ],
  cta: {
    title: { es: 'Trae tu material.', en: 'Bring us your footage.' },
    text: { es: 'Grabado, generado o a medias. Te respondemos con una propuesta.', en: 'Shot, generated or half-finished. We’ll reply with a proposal.' },
  },
  seo: {
    description: {
      es: 'Postproducción con IA, After Effects y DaVinci Resolve: montaje, etalonado, motion graphics y versiones para cada plataforma. NEO Studio.',
      en: 'Post-production with AI, After Effects and DaVinci Resolve: editing, grading, motion graphics and versions for every platform. NEO Studio.',
    },
  },
}
