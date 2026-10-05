import type { Faq, Spec } from './types'

/** Preguntas que se repiten en todos los servicios (coste, derechos y etiquetado IA). */
export const faqCost: Faq = {
  q: { es: '¿Cuánto cuesta?', en: 'How much does it cost?' },
  a: {
    es: 'Depende del alcance: piezas, formatos, plazos y derechos de uso. Tras el brief te enviamos una propuesta a medida, sin compromiso.',
    en: 'It depends on the scope: pieces, formats, timing and usage rights. After the brief we send you a tailored proposal, with no commitment.',
  },
}

export const faqRights: Faq = {
  q: { es: '¿De quién son los derechos del contenido generado con IA?', en: 'Who owns the rights to AI-generated content?' },
  a: {
    es: 'La propuesta fija qué derechos de uso te cedemos: canales, territorio y duración. Como la protección legal de lo creado con IA aún se está definiendo, lo dejamos todo por escrito en el contrato. Nunca usamos la imagen de personas reales ni marcas ajenas sin autorización.',
    en: 'The proposal sets out the usage rights we grant you: channels, territory and duration. Because the legal protection of AI-made work is still being defined, we put everything in writing in the contract. We never use a real person’s likeness or another brand without permission.',
  },
}

export const faqLabel: Faq = {
  q: { es: '¿Hay que indicar que está hecho con IA?', en: 'Do I have to say it was made with AI?' },
  a: {
    es: 'Sí, cuando la imagen, el audio o el vídeo parecen reales. El artículo 50 del Reglamento europeo de IA (AI Act) obliga a indicar que el contenido se ha generado o manipulado con IA. Entregamos cada pieza con su etiqueta y te explicamos cómo mostrarla en cada red; en obras claramente creativas basta una mención discreta que no estropee la pieza.',
    en: 'Yes, when the image, audio or video looks real. Article 50 of the EU AI Act requires disclosing that content has been generated or manipulated with AI. We deliver every piece with its label and show you how to display it on each platform; for clearly creative work, a discreet mention that doesn’t spoil the piece is enough.',
  },
}

export const specTiming: Spec = { label: { es: 'Plazo', en: 'Timing' }, value: { es: 'A consultar', en: 'On request' } }
export const specRights: Spec = {
  label: { es: 'Derechos de uso', en: 'Usage rights' },
  value: { es: 'Canales, territorio y duración, según propuesta', en: 'Channels, territory and duration, per proposal' },
}
export const specLabel: Spec = {
  label: { es: 'Etiquetado IA', en: 'AI labelling' },
  value: { es: 'Incluido (AI Act, art. 50)', en: 'Included (AI Act, art. 50)' },
}
