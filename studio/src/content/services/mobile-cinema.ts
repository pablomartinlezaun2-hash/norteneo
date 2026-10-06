import type { ServiceDetail } from './types'
import { faqCost } from './shared'

export const mobileCinema: ServiceDetail = {
  id: 'mobile-cinema',
  sub: {
    es: 'Configura tu móvil, rueda en Log y termina el color como un estudio.',
    en: 'Set up your phone, shoot in Log and finish the colour like a studio.',
  },
  heroFacts: [
    { es: 'Ajustes de cámara', en: 'Camera settings' },
    { es: 'Luz con lo que tienes', en: 'Light with what you have' },
    { es: 'Log y LUT', en: 'Log and LUTs' },
    { es: 'Edición con IA', en: 'Editing with AI' },
  ],
  intro: {
    strong: { es: 'Tu móvil graba mejor de lo que crees.', en: 'Your phone shoots better than you think.' },
    rest: {
      es: 'Te enseñamos a configurarlo, a iluminar con lo que tienes y a terminar el color como en un estudio.',
      en: 'We show you how to set it up, light with what you have and finish the colour the way a studio would.',
    },
  },
  chapters: [
    {
      kind: 'log',
      media: 'fpv-kitchen',
      claim: { es: 'El Log guarda la luz.\nEl color la devuelve.', en: 'Log keeps the light.\nColour gives it back.' },
      text: {
        es: 'Un perfil Log graba una imagen plana a propósito: conserva más información en las luces y en las sombras para decidir el color después. Arrastra para comparar.',
        en: 'A Log profile records a deliberately flat image: it keeps more detail in highlights and shadows so the colour can be decided later. Drag to compare.',
      },
      note: {
        es: 'Simulación: un filtro que imita un perfil Log sobre un fotograma de la casa. No es un plano rodado con móvil.',
        en: 'Simulation: a filter imitating a Log profile over one of our frames. This is not footage shot on a phone.',
      },
    },
    {
      kind: 'camera',
      claim: { es: 'La ficha de cámara.', en: 'The camera sheet.' },
      text: {
        es: 'Abre Blackmagic Camera, gratuita para iPhone y Android, y deja esto fijo antes de grabar. Es nuestro punto de partida; luego cada plano manda.',
        en: 'Open Blackmagic Camera, free for iPhone and Android, and lock these in before you roll. It’s our starting point; after that, every shot decides.',
      },
      proof: { es: 'Ajustes recomendados · Blackmagic Camera', en: 'Recommended settings · Blackmagic Camera' },
      rows: [
        {
          label: { es: 'Perfil', en: 'Profile' },
          value: { es: 'Log', en: 'Log' },
          note: { es: 'Apple Log en los iPhone que lo admiten. Imagen plana, más margen para el color.', en: 'Apple Log on iPhones that support it. A flat image with more room for colour.' },
        },
        {
          label: { es: 'Espacio de color', en: 'Colour space' },
          value: { es: 'P3 o Rec.709', en: 'P3 or Rec.709' },
          note: { es: 'Rec.709 es el estándar de redes y web; P3 aprovecha las pantallas de gama amplia.', en: 'Rec.709 is the standard for social and web; P3 makes use of wide-gamut screens.' },
        },
        {
          label: { es: 'Fotogramas', en: 'Frame rate' },
          value: { es: '24 o 25 fps', en: '24 or 25 fps' },
          note: { es: '24 para el aire de cine; 25 en Europa evita parpadeos con luz artificial a 50 Hz.', en: '24 for the cinema look; 25 in Europe avoids flicker under 50 Hz artificial light.' },
        },
        {
          label: { es: 'Obturación', en: 'Shutter' },
          value: { es: '180°', en: '180°' },
          note: { es: '1/48 s a 24 fps y 1/50 s a 25 fps: el desenfoque de movimiento natural del cine.', en: '1/48 s at 24 fps and 1/50 s at 25 fps: cinema’s natural motion blur.' },
        },
        {
          label: { es: 'ISO', en: 'ISO' },
          value: { es: 'Nativo', en: 'Native' },
          note: { es: 'El más limpio del sensor. Si falta luz, añade luz antes que ISO.', en: 'The sensor’s cleanest setting. If you need more light, add light before ISO.' },
        },
        {
          label: { es: 'Balance de blancos', en: 'White balance' },
          value: { es: 'Fijo', en: 'Locked' },
          note: { es: '5600 K con luz de día, 3200 K con tungsteno. En automático cambia entre planos.', en: '5600 K in daylight, 3200 K under tungsten. On auto it shifts between shots.' },
        },
        {
          label: { es: 'Códec y bitrate', en: 'Codec and bitrate' },
          value: { es: 'El más alto disponible', en: 'The highest available' },
          note: { es: 'Apple ProRes si tu móvil lo graba; si no, H.265 a la máxima tasa de datos.', en: 'Apple ProRes if your phone records it; otherwise H.265 at the highest data rate.' },
        },
        {
          label: { es: 'Enfoque y exposición', en: 'Focus and exposure' },
          value: { es: 'Manuales', en: 'Manual' },
          note: { es: 'Bloquéalos antes de grabar. La cebra y el falso color protegen las altas luces.', en: 'Lock them before you roll. Zebras and false colour protect the highlights.' },
        },
      ],
    },
    {
      kind: 'terms',
      claim: { es: 'Luz, color y montaje.', en: 'Light, colour and editing.' },
      text: {
        es: 'Lo demás no depende del móvil. Depende de dónde pones la luz y de cómo terminas la imagen.',
        en: 'The rest doesn’t depend on the phone. It depends on where you put the light and how you finish the image.',
      },
      items: [
        { term: { es: 'Luz', en: 'Light' }, text: { es: 'Una ventana lateral como luz principal y una lámpara cálida al fondo para separar. Apaga las luces del techo.', en: 'A side window as your key light and a warm lamp in the background for separation. Switch off the ceiling lights.' } },
        { term: { es: 'Log y LUT', en: 'Log and LUTs' }, text: { es: 'Primero, una LUT de conversión a Rec.709. Después, el color con intención.', en: 'First, a conversion LUT to Rec.709. Then, colour with intent.' } },
        { term: { es: 'Edición con IA', en: 'Editing with AI' }, text: { es: 'Montaje y color en DaVinci Resolve, con IA para limpiar el audio, reencuadrar en vertical y subtitular.', en: 'Editing and colour in DaVinci Resolve, with AI to clean up audio, reframe for vertical and subtitle.' } },
      ],
    },
  ],
  process: {
    steps: [
      {
        text: {
          es: 'Nos cuentas qué móvil tienes, qué quieres rodar y para qué redes.',
          en: 'You tell us which phone you have, what you want to shoot and for which platforms.',
        },
      },
      {
        text: {
          es: 'Preparamos los ajustes de cámara y un plan de rodaje sencillo para tu espacio y tu luz.',
          en: 'We prepare the camera settings and a simple shooting plan for your space and your light.',
        },
      },
      {
        text: {
          es: 'Ruedas con nosotros en la sesión: luz, encuadre y movimiento, plano a plano.',
          en: 'You shoot with us in the session: light, framing and movement, shot by shot.',
        },
      },
      {
        text: {
          es: 'Te llevas el móvil configurado y el flujo de color para terminar tus piezas.',
          en: 'You leave with your phone set up and a colour workflow to finish your pieces.',
        },
      },
    ],
    deliverables: [
      { es: 'Sesión práctica', en: 'Hands-on session' },
      { es: 'Ajustes guardados en tu móvil', en: 'Settings saved on your phone' },
      { es: 'Flujo de color en DaVinci Resolve', en: 'DaVinci Resolve colour workflow' },
      { es: 'Revisión de tus primeros planos', en: 'Review of your first shots' },
    ],
  },
  specs: [
    { label: { es: 'Formato', en: 'Format' }, value: { es: 'Sesión práctica', en: 'Hands-on session' } },
    { label: { es: 'App de cámara', en: 'Camera app' }, value: { es: 'Blackmagic Camera', en: 'Blackmagic Camera' } },
    { label: { es: 'Perfil', en: 'Profile' }, value: { es: 'Log (Apple Log en iPhone compatibles)', en: 'Log (Apple Log on compatible iPhones)' } },
    { label: { es: 'Edición', en: 'Editing' }, value: { es: 'DaVinci Resolve', en: 'DaVinci Resolve' } },
    { label: { es: 'Requisitos', en: 'Requirements' }, value: { es: 'Un móvil compatible con Blackmagic Camera', en: 'A phone compatible with Blackmagic Camera' } },
    { label: { es: 'Duración y modalidad', en: 'Length and format' }, value: { es: 'A consultar', en: 'On request' } },
  ],
  faqs: [
    {
      ...faqCost,
      a: {
        es: 'Depende de la duración y la modalidad de la sesión. Tras el brief te enviamos una propuesta a medida, sin compromiso.',
        en: 'It depends on the length and format of the session. After the brief we send you a tailored proposal, with no commitment.',
      },
    },
    {
      q: { es: '¿Qué móvil necesito?', en: 'Which phone do I need?' },
      a: {
        es: 'Uno compatible con Blackmagic Camera, que está disponible para iPhone y para muchos Android. Lo comprobamos contigo antes de la sesión.',
        en: 'One that runs Blackmagic Camera, available for iPhone and many Android phones. We check it with you before the session.',
      },
    },
    {
      q: { es: '¿Tengo que comprar equipo?', en: 'Do I need to buy gear?' },
      a: {
        es: 'No para empezar. Te enseñamos a sacar partido de la luz que ya tienes; si más adelante quieres invertir, te orientamos.',
        en: 'Not to begin with. We show you how to make the most of the light you already have; if you want to invest later, we’ll guide you.',
      },
    },
    {
      q: { es: '¿De quién son los derechos de lo que ruedo?', en: 'Who owns the rights to what I shoot?' },
      a: {
        es: 'Lo que ruedas es tuyo. Si en la edición añadimos elementos generados con IA, lo indicamos y la propuesta fija sus derechos de uso por escrito.',
        en: 'What you shoot is yours. If we add AI-generated elements in the edit, we say so and the proposal sets out their usage rights in writing.',
      },
    },
    {
      q: { es: '¿Hay que etiquetar algo como IA?', en: 'Does anything need an AI label?' },
      a: {
        es: 'Lo rodado con tu móvil, no. Si un plano se genera o se altera con IA de forma realista, sí: el artículo 50 del Reglamento europeo de IA (AI Act) obliga a indicarlo, y te decimos cómo hacerlo en cada red.',
        en: 'What you shoot on your phone, no. If a shot is realistically generated or altered with AI, yes: Article 50 of the EU AI Act requires disclosing it, and we show you how on each platform.',
      },
    },
  ],
  pairs: [
    { id: 'editing', line: { es: 'Tráenos tu material en Log: lo montamos y lo etalonamos.', en: 'Bring us your Log footage: we’ll edit and grade it.' } },
    { id: 'content', line: { es: 'Convierte lo que ruedas en un plan de publicación.', en: 'Turn what you shoot into a posting plan.' } },
  ],
  cta: {
    title: { es: 'Rueda tu primera escena.', en: 'Shoot your first scene.' },
    text: { es: 'Cuéntanos qué móvil tienes y qué quieres contar. Te respondemos con una propuesta.', en: 'Tell us which phone you have and what you want to say. We’ll reply with a proposal.' },
  },
  seo: {
    description: {
      es: 'Cine con tu móvil: ajustes de Blackmagic Camera, rodaje en Log, luz con lo que tienes y color en DaVinci Resolve. Sesiones de NEO Studio.',
      en: 'Mobile cinema: Blackmagic Camera settings, shooting in Log, lighting with what you have and colour in DaVinci Resolve. Sessions by NEO Studio.',
    },
  },
}
