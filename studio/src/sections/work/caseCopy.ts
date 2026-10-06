import type { L } from '@/i18n'

/**
 * "El reto" y "La solución" de cada caso, en 2–3 líneas.
 * Redactado a partir de la línea del caso y de lo que se ve en cada clip.
 * Sin resultados, cifras ni datos de cliente: si Pablo aporta datos reales y autorizados,
 * se añaden aquí. En las webs, {domain} se sustituye por el dominio publicado.
 */
export type CaseCopy = { challenge: L; solution: L; note?: L }

export const caseCopy: Record<string, CaseCopy> = {
  'navarro-real-estate': {
    challenge: {
      es: 'Presentar una cartera inmobiliaria con la calma de una marca seria: que buscar sea fácil y que cada inmueble luzca.',
      en: 'Present a property portfolio with the composure of a serious brand: easy to search, with every home given room to shine.',
    },
    solution: {
      es: 'Una web inmobiliaria a medida, diseñada y desarrollada por NEO. Está publicada en {domain}.',
      en: 'A bespoke real estate website, designed and built by NEO. It is live at {domain}.',
    },
  },
  'urbalia-inmobiliaria': {
    challenge: {
      es: 'Dar a una inmobiliaria una presencia propia, lejos de las plantillas de portal, que funcione igual de bien en el móvil.',
      en: 'Give a real estate agency a presence of its own, far from listing-portal templates, that works just as well on a phone.',
    },
    solution: {
      es: 'Diseño y desarrollo a medida por NEO. La web está publicada en {domain}.',
      en: 'Bespoke design and development by NEO. The site is live at {domain}.',
    },
  },
  'masventa-inmobiliaria': {
    challenge: {
      es: 'Que vender o alquilar con la agencia empiece por una web clara, rápida y con carácter propio.',
      en: 'Make selling or renting with the agency start with a website that is clear, fast and unmistakably its own.',
    },
    solution: {
      es: 'Una web a medida, diseñada y desarrollada por NEO. Está publicada en {domain}.',
      en: 'A bespoke website, designed and built by NEO. It is live at {domain}.',
    },
  },
  nexodea: {
    challenge: {
      es: 'Una web de autor que diga quién es la marca antes de leer una sola línea.',
      en: 'A signature website that tells you who the brand is before you read a single line.',
    },
    solution: {
      es: 'Diseño y desarrollo a medida por NEO. La web está publicada en {domain}.',
      en: 'Bespoke design and development by NEO. The site is live at {domain}.',
    },
  },
  'waka-wow': {
    challenge: {
      es: 'Una marca con nombre propio pedía una web con la misma personalidad.',
      en: 'A brand with a name this distinctive needed a website with the same personality.',
    },
    solution: {
      es: 'Web de autor diseñada y desarrollada por NEO. Está publicada en {domain}.',
      en: 'A signature website designed and built by NEO. It is live at {domain}.',
    },
  },
  'pedacito-de-cielo': {
    challenge: {
      es: 'Llevar el tono de la marca a una web propia, cuidada en cada detalle.',
      en: 'Carry the brand’s tone into a website of its own, considered down to the last detail.',
    },
    solution: {
      es: 'Web de autor diseñada y desarrollada por NEO. Está publicada en {domain}.',
      en: 'A signature website designed and built by NEO. It is live at {domain}.',
    },
  },
  'real-empire-estate': {
    challenge: {
      es: 'El encargo: una película de marca vertical para una inmobiliaria, con el lenguaje de una casa de lujo y no el de un portal de anuncios.',
      en: 'The brief: a vertical brand film for a real estate firm, speaking the language of a luxury house rather than a listings portal.',
    },
    solution: {
      es: 'Llave, pasillo, ciudad y un logo con anillos: planos generados con IA, elegidos uno a uno y montados por NEO en 9:16. En montaje se descartó todo plano con texto defectuoso.',
      en: 'Key, hallway, city and a ringed logo: AI-generated shots, chosen one by one and cut by NEO in 9:16. Every shot with flawed generated text stayed on the cutting-room floor.',
    },
  },
  'mesa-negra': {
    challenge: {
      es: 'El encargo: un spot de alta cocina que hiciera sentir el corte, la sal, el humo y la copa, sin cocina, sin cámara y sin plató.',
      en: 'The brief: a fine-dining spot that makes you feel the cut, the salt, the smoke and the glass, with no kitchen, no camera and no set.',
    },
    solution: {
      es: 'Cuchillo, hierbas, sal y piel de limón suspendidos en un bokeh dorado, hasta el plato con humo y la copa. Generado con IA y dirigido plano a plano por NEO.',
      en: 'Knife, herbs, salt and lemon peel suspended in golden bokeh, ending on a smoking plate and a glass. AI-generated and directed shot by shot by NEO.',
    },
    note: {
      es: 'La galería suma un flambeado con emplatado y un plano FPV que cruza la cocina hasta el comedor.',
      en: 'The gallery adds a flambé and plating, and an FPV shot that crosses the kitchen into the dining room.',
    },
  },
  fuego: {
    challenge: {
      es: 'El encargo: un spot de producto para una taquería, con cada taco tan apetecible como en el mejor anuncio de comida.',
      en: 'The brief: a product spot for a taqueria, with every taco as irresistible as in the best food commercial.',
    },
    solution: {
      es: 'Brasa, queso fundido, salsa y un packshot dorado, generados con IA y montados por NEO. El macro de la gota de salsa se trabaja aparte, fotograma a fotograma.',
      en: 'Embers, melting cheese, salsa and a golden packshot, AI-generated and cut by NEO. The macro of the salsa drop is crafted separately, frame by frame.',
    },
  },
  reserva: {
    challenge: {
      es: 'El encargo: una pieza de vino que se sostuviera sola, sin botella, sin viñedo y sin bodega. Solo con lo que provoca.',
      en: 'The brief: a wine piece that stands on its own, with no bottle, no vineyard and no cellar. Only what it evokes.',
    },
    solution: {
      es: 'Humo rojo que se condensa en vino dentro de la copa, sobre mármol negro. Un loop generado con IA y dirigido por NEO para repetirse sin costura.',
      en: 'Red smoke that condenses into wine inside the glass, on black marble. An AI-generated loop directed by NEO to repeat without a seam.',
    },
  },
  trono: {
    challenge: {
      es: 'El encargo: un videoclip de moda en vertical que funcione en el móvil desde el primer segundo, con la puesta en escena de una campaña.',
      en: 'The brief: a vertical fashion music video that works on a phone from the first second, staged like a campaign.',
    },
    solution: {
      es: 'Abrigo burdeos, un trono y bailarinas: escenas generadas con IA, dirigidas y montadas por NEO en formato vertical.',
      en: 'A burgundy coat, a throne and dancers: AI-generated scenes, directed and cut by NEO in vertical format.',
    },
  },
  llave: {
    challenge: {
      es: 'El encargo: un objeto 3D para el sector inmobiliario. Dar a una llave el peso de un producto de lujo en pocos segundos.',
      en: 'The brief: a 3D object for the real estate sector. Give a key the presence of a luxury product in a few seconds.',
    },
    solution: {
      es: 'Una llave dorada en 3D generada con IA: explosión de oro, arena, una cerradura con luz y el packshot final, dirigidos por NEO.',
      en: 'A golden 3D key generated with AI: a burst of gold, sand, a keyhole full of light and the final packshot, directed by NEO.',
    },
  },
  mudanza: {
    challenge: {
      es: 'El encargo: contenido UGC para redes con la naturalidad de un vídeo casero, listo para publicar con regularidad.',
      en: 'The brief: UGC-style social content with the ease of a home video, ready to post week after week.',
    },
    solution: {
      es: 'Una chica se graba en su piso nuevo. La escena entera está generada con IA y dirigida por NEO: no es una grabación real y se etiqueta como tal.',
      en: 'A young woman films herself in her new flat. The whole scene is AI-generated and directed by NEO: it is not real footage, and it is labelled as such.',
    },
  },
  running: {
    challenge: {
      es: 'Un ejercicio propio: llevar un spot deportivo vertical al nivel de una campaña de gran marca.',
      en: 'A self-initiated exercise: bring a vertical sports spot up to the level of a major brand campaign.',
    },
    solution: {
      es: 'Spot de concepto generado con IA, dirigido y montado por NEO en 9:16. No es un encargo ni está aprobado por ninguna marca.',
      en: 'A concept spot generated with AI, directed and cut by NEO in 9:16. It was not commissioned or approved by any brand.',
    },
  },
  'neo-app': {
    challenge: {
      es: 'Que una app de entrenamiento tenga presencia propia: un personaje que acompaña en lugar de una interfaz plana.',
      en: 'Give a training app a presence of its own: a character that keeps you company instead of a flat interface.',
    },
    solution: {
      es: 'Un robot 3D interactivo dentro de la app, diseñado y construido por NEO.',
      en: 'An interactive 3D robot inside the app, designed and built by NEO.',
    },
    note: {
      es: 'NEO App es un producto propio: el estudio aplica en ella el mismo oficio que ofrece a sus clientes.',
      en: 'NEO App is our own product: the studio applies the same craft it offers its clients.',
    },
  },
}
