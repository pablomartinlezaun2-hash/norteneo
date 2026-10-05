import type { ServiceDetail } from './types'
import { faqCost, faqLabel, specTiming } from './shared'

export const websites: ServiceDetail = {
  id: 'websites',
  sub: {
    es: 'Sitios a medida, rápidos y difíciles de olvidar. Diseño, movimiento y código bajo una misma dirección.',
    en: 'Bespoke sites, fast and hard to forget. Design, motion and code under one direction.',
  },
  heroFacts: [
    { es: 'Dirección de arte', en: 'Art direction' },
    { es: 'Movimiento', en: 'Motion' },
    { es: 'Rendimiento', en: 'Performance' },
    { es: 'SEO y puesta en marcha', en: 'SEO and launch' },
  ],
  intro: {
    strong: { es: 'Una web de autor se nota en el primer segundo.', en: 'A signature website shows in the first second.' },
    rest: {
      es: 'En cómo carga, en cómo se mueve y en todo lo que no sobra. La diseñamos y la programamos a medida, sin plantillas.',
      en: 'In how it loads, how it moves and everything it leaves out. We design and build it to measure, with no templates.',
    },
  },
  chapters: [
    {
      kind: 'sites',
      claim: { es: 'Seis webs. Todas en producción.', en: 'Six websites. All live.' },
      text: {
        es: 'Para inmobiliarias y marcas. No son maquetas: están publicadas y puedes visitarlas ahora mismo.',
        en: 'For real estate firms and brands. These aren’t mock-ups: they are live and you can visit them right now.',
      },
    },
    {
      kind: 'grid',
      claim: { es: 'Una rejilla que no se ve, pero se nota.', en: 'A grid you don’t see, but feel.' },
      text: {
        es: 'Todo en esta página cae sobre una retícula, una escala tipográfica y una sola curva de movimiento. Actívala y compruébalo.',
        en: 'Everything on this page sits on one grid, one type scale and a single motion curve. Switch it on and see for yourself.',
      },
      proof: { es: 'Esta misma página', en: 'This very page' },
    },
    {
      kind: 'terms',
      claim: { es: 'Rápidas, accesibles y fáciles de encontrar.', en: 'Fast, accessible and easy to find.' },
      text: {
        es: 'El lujo no hace esperar. Cuidamos lo que no se ve con el mismo criterio que la portada.',
        en: 'Luxury doesn’t keep you waiting. We treat what you can’t see with the same care as the homepage.',
      },
      items: [
        { term: { es: 'Carga', en: 'Loading' }, text: { es: 'HTML prerenderizado, imágenes AVIF y vídeo que solo se carga cuando se ve.', en: 'Prerendered HTML, AVIF images and video that only loads when it’s seen.' } },
        { term: { es: 'Accesibilidad', en: 'Accessibility' }, text: { es: 'Contraste suficiente, foco visible, teclado y una versión sin movimiento para quien la pide.', en: 'Sufficient contrast, visible focus, keyboard support and a reduced-motion version for those who ask for it.' } },
        { term: { es: 'SEO', en: 'SEO' }, text: { es: 'Metadatos por página, versiones por idioma y datos estructurados para buscadores.', en: 'Per-page metadata, language versions and structured data for search engines.' } },
        { term: { es: 'Medición', en: 'Measurement' }, text: { es: 'Rendimiento revisado antes de publicar, en móvil y en escritorio.', en: 'Performance checked before launch, on mobile and desktop.' } },
      ],
    },
  ],
  process: {
    steps: [
      {
        text: {
          es: 'Nos cuentas qué vendes, a quién y qué tiene que pasar cuando alguien llega a tu web.',
          en: 'You tell us what you sell, to whom, and what should happen when someone lands on your site.',
        },
      },
      {
        text: {
          es: 'Definimos estructura, textos, dirección de arte y movimiento. Apruebas el diseño antes de programar.',
          en: 'We define structure, copy, art direction and motion. You approve the design before we build.',
        },
      },
      {
        text: {
          es: 'Programamos a medida y revisamos rendimiento, accesibilidad y SEO en móvil y escritorio.',
          en: 'We build to measure and review performance, accessibility and SEO on mobile and desktop.',
        },
      },
      {
        text: {
          es: 'Publicamos en tu dominio y te explicamos cómo mantenerla viva.',
          en: 'We launch on your domain and show you how to keep it alive.',
        },
      },
    ],
    deliverables: [
      { es: 'Diseño a medida', en: 'Bespoke design' },
      { es: 'Web programada y publicada', en: 'Built and launched website' },
      { es: 'SEO técnico por idioma', en: 'Technical SEO per language' },
      { es: 'Guía de uso', en: 'Handover guide' },
    ],
  },
  specs: [
    { label: { es: 'Diseño y código', en: 'Design and code' }, value: { es: 'A medida, sin plantillas', en: 'Bespoke, no templates' } },
    { label: { es: 'Idiomas', en: 'Languages' }, value: { es: 'Uno o varios, con SEO por idioma', en: 'One or more, with SEO per language' } },
    { label: { es: 'Dispositivos', en: 'Devices' }, value: { es: 'Móvil, tableta y escritorio', en: 'Mobile, tablet and desktop' } },
    { label: { es: 'Accesibilidad', en: 'Accessibility' }, value: { es: 'Contraste, foco visible y teclado', en: 'Contrast, visible focus and keyboard' } },
    { label: { es: 'Contenidos', en: 'Content' }, value: { es: 'Textos, imagen y vídeo, propios o generados con IA', en: 'Copy, images and video, original or AI-generated' } },
    { label: { es: 'Mantenimiento', en: 'Maintenance' }, value: { es: 'A consultar', en: 'On request' } },
    specTiming,
  ],
  faqs: [
    faqCost,
    {
      q: { es: '¿Cuánto se tarda?', en: 'How long does it take?' },
      a: {
        es: 'Depende del alcance. El plazo se fija en la propuesta, antes de empezar, y no cambia sin que lo hablemos.',
        en: 'It depends on the scope. The timeline is set in the proposal, before we start, and doesn’t change without a conversation.',
      },
    },
    {
      q: { es: '¿Podré cambiar los textos yo mismo?', en: 'Will I be able to edit the copy myself?' },
      a: {
        es: 'Si lo necesitas, sí. Lo definimos en el brief: desde un editor de contenidos hasta cambios que hacemos nosotros.',
        en: 'If you need to, yes. We define it in the brief: from a content editor to changes we make for you.',
      },
    },
    {
      q: { es: '¿Qué es mío al terminar?', en: 'What do I own at the end?' },
      a: {
        es: 'La propuesta detalla qué te llevas y en qué condiciones: diseño, código, textos e imágenes, incluidas las generadas con IA, cuyos derechos de uso quedan por escrito en el contrato.',
        en: 'The proposal details what you take away and on what terms: design, code, copy and images, including AI-generated ones, whose usage rights are put in writing in the contract.',
      },
    },
    {
      ...faqLabel,
      a: {
        es: 'Si la web incluye imágenes o vídeos generados con IA que parecen reales, sí: el artículo 50 del Reglamento europeo de IA (AI Act) obliga a indicarlo. Lo resolvemos con una etiqueta discreta, como la que ves en esta web.',
        en: 'If the site includes AI-generated images or videos that look real, yes: Article 50 of the EU AI Act requires disclosing it. We handle it with a discreet label, like the ones on this site.',
      },
    },
  ],
  pairs: [
    { id: 'ai-video', line: { es: 'Un vídeo de cabecera con luz de cine.', en: 'A header video lit like cinema.' } },
    { id: 'ai-3d', line: { es: 'Tu producto en volumen, listo para la web.', en: 'Your product in 3D, ready for the web.' } },
  ],
  cta: {
    title: { es: 'Tu próxima web empieza aquí.', en: 'Your next website starts here.' },
    text: { es: 'Cuéntanos qué necesitas. Te respondemos con una propuesta.', en: 'Tell us what you need. We’ll reply with a proposal.' },
  },
  seo: {
    description: {
      es: 'Webs de autor a medida: dirección de arte, movimiento, rendimiento y SEO. Seis webs en producción diseñadas y programadas por NEO Studio.',
      en: 'Bespoke signature websites: art direction, motion, performance and SEO. Six live websites designed and built by NEO Studio.',
    },
  },
}
