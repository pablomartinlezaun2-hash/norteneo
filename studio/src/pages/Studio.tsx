import { useRef } from 'react'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { site } from '@/content/site'
import { heroDelay } from '@/lib/motion'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { Seo } from '@/components/Seo'
import { Video } from '@/components/Video'
import { Meta } from '@/components/Meta'
import { Cta } from '@/components/Cta'
import { durationLabel } from '@/sections/work/meta'

type Row = { term: string; text: string }

const copy: Record<'es' | 'en', {
  seo: string
  desc: string
  kicker: string
  title: [string, string]
  sub: string
  logoLabel: string
  logoMeta: string
  houseTitle: string
  house: string[]
  methodTitle: string
  methodLead: string
  method: Row[]
  craftTitle: string
  craftLead: string
  craft: Row[]
  quote: string
  waysTitle: string
  ways: Row[]
  closeTitle: string
  closeLine: string
  cta: string
  work: string
}> = {
  es: {
    seo: 'Estudio',
    desc: 'NEO Studio: la IA genera, nosotros dirigimos. Dirección de arte, montaje, color en DaVinci Resolve y acabado en After Effects.',
    kicker: 'Atelier',
    title: ['La IA genera.', 'Nosotros dirigimos.'],
    sub: 'NEO Studio es una casa de imagen: dirigimos cada plano que genera la IA y lo terminamos a mano.',
    logoLabel: 'Animación del logo NEO sobre fondo negro, con su reflejo.',
    logoMeta: 'Animación del logo NEO',
    houseTitle: 'Una casa de imagen, no una agencia.',
    house: [
      'NEO Studio hace imagen para marcas que cuidan cada detalle: vídeo y 3D generados con IA, webs de autor, postproducción y contenido para redes.',
      'La IA abre posibilidades que antes exigían un plató, un equipo de rodaje y semanas de producción. Lo que no cambia es la mirada que decide qué merece quedarse en pantalla.',
    ],
    methodTitle: 'El método.',
    methodLead: 'La IA propone. Nosotros elegimos, corregimos y terminamos.',
    method: [
      { term: 'Dirección', text: 'Antes de generar nada, definimos la pieza: referencias, paleta, luz, encuadres y el formato de cada canal.' },
      { term: 'Generación', text: 'La IA genera variantes a partir de fotogramas de inicio y de final que fijamos nosotros. La mayoría se descartan.' },
      { term: 'Oficio', text: 'El ritmo se decide en la línea de tiempo, el color en DaVinci Resolve y el acabado en After Effects. A mano.' },
      { term: 'Entrega', text: 'Cada pieza sale en los formatos que pide su destino, 16:9, 9:16 o web, y con su etiqueta si es generada.' },
    ],
    craftTitle: 'Lo que no hace la IA.',
    craftLead: 'El oficio humano no se esconde: es la parte que firma la pieza.',
    craft: [
      { term: 'Dirección de arte', text: 'Paleta, luz, materiales y encuadre. Qué entra en el plano y qué se queda fuera.' },
      { term: 'Montaje', text: 'Ritmo, cortes y duración para cada canal. Un plano de más estropea una pieza.' },
      { term: 'Color en DaVinci Resolve', text: 'Etalonado plano a plano para que clips generados por separado parezcan de la misma película.' },
      { term: 'After Effects', text: 'Composición, tipografía, logotipos y limpieza de los defectos que la IA deja por el camino.' },
    ],
    quote: 'La herramienta cambia. El criterio, no.',
    waysTitle: 'Cómo trabajamos.',
    ways: [
      { term: 'Propuesta a medida', text: 'Sin precios de catálogo. Cada encargo empieza con un brief y termina en una propuesta pensada para tu marca.' },
      { term: 'Transparencia con la IA', text: 'Toda pieza generada lleva la etiqueta «Generado con IA, dirigido por NEO». Lo que es IA, se dice.' },
      { term: 'Hablas con quien dirige', text: 'Sin intermediarios entre tu marca y quien decide cada plano.' },
      { term: 'Cada pantalla, su versión', text: 'Una pieza no se recorta sin más: se compone para la pantalla en la que se va a ver.' },
    ],
    closeTitle: '¿Hablamos de tu marca?',
    closeLine: 'Cuéntanos qué necesitas. Te respondemos con una propuesta a medida.',
    cta: 'Solicitar propuesta',
    work: 'Ver trabajo',
  },
  en: {
    seo: 'Studio',
    desc: 'NEO Studio: AI generates, we direct. Art direction, editing, colour in DaVinci Resolve and finishing in After Effects.',
    kicker: 'Atelier',
    title: ['AI generates.', 'We direct.'],
    sub: 'NEO Studio is a house of imagery: we direct every shot the AI generates and finish it by hand.',
    logoLabel: 'NEO logo animation on a black background, with its reflection.',
    logoMeta: 'NEO logo animation',
    houseTitle: 'A house of imagery, not an agency.',
    house: [
      'NEO Studio creates imagery for brands that care about every detail: AI-generated film and 3D, signature websites, post-production and social content.',
      'AI makes possible what once took a set, a film crew and weeks of production. What doesn’t change is the eye that decides what deserves to stay on screen.',
    ],
    methodTitle: 'The method.',
    methodLead: 'AI proposes. We choose, correct and finish.',
    method: [
      { term: 'Direction', text: 'Before generating anything, we define the piece: references, palette, light, framing and the format for each channel.' },
      { term: 'Generation', text: 'AI generates variations from start and end frames that we set. Most of them are discarded.' },
      { term: 'Craft', text: 'Rhythm is decided on the timeline, colour in DaVinci Resolve and finishing in After Effects. By hand.' },
      { term: 'Delivery', text: 'Every piece ships in the format its destination needs (16:9, 9:16 or web) and is labelled when it’s AI-generated.' },
    ],
    craftTitle: 'What AI doesn’t do.',
    craftLead: 'We don’t hide the human craft: it’s what signs the piece.',
    craft: [
      { term: 'Art direction', text: 'Palette, light, materials and framing. What goes into the shot and what stays out.' },
      { term: 'Editing', text: 'Rhythm, cuts and running time for each channel. One shot too many spoils a piece.' },
      { term: 'Colour in DaVinci Resolve', text: 'Shot-by-shot grading so that clips generated separately look like the same film.' },
      { term: 'After Effects', text: 'Compositing, typography, logos and clean-up of the flaws AI leaves along the way.' },
    ],
    quote: 'The tool changes. The judgement doesn’t.',
    waysTitle: 'How we work.',
    ways: [
      { term: 'Tailored proposals', text: 'No price list. Every commission starts with a brief and ends with a proposal designed for your brand.' },
      { term: 'Open about AI', text: 'Every generated piece carries the label “AI-generated, directed by NEO”. If it’s AI, we say so.' },
      { term: 'You talk to the director', text: 'No intermediaries between your brand and the person directing each shot.' },
      { term: 'One version per screen', text: 'A piece is never simply cropped: it is composed for the screen it will be seen on.' },
    ],
    closeTitle: 'Shall we talk about your brand?',
    closeLine: 'Tell us what you need, and we’ll reply with a tailored proposal.',
    cta: 'Request a proposal',
    work: 'See the work',
  },
}

/** Lista de término + texto con hairlines discontinuas (ficha, no tarjetas). */
function Spec({ rows }: { rows: Row[] }) {
  return (
    <dl>
      {rows.map((r) => (
        <div key={r.term} className="relative grid gap-2 py-6 md:grid-cols-12 md:gap-10 md:py-8">
          <span aria-hidden="true" className="hairline-dashed absolute inset-x-0 top-0" />
          <dt className="text-[1.1875rem] font-[480] tracking-[-0.01em] text-paper md:col-span-4 [font-stretch:104%]">{r.term}</dt>
          <dd className="type-body text-mute md:col-span-7 md:col-start-6">{r.text}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * /estudio · /en/studio: el Atelier.
 * Quién es NEO Studio y su método. Sin foto (pendiente) y sin historia inventada:
 * método y valores. Un solo momento: la animación original del logo como pieza de apertura.
 * El resto, quieto a propósito.
 */
export function Component() {
  const lang = useLang()
  const t = copy[lang]
  const h1 = useRef<HTMLHeadingElement>(null)
  useSplitReveal(h1, { on: 'load', delay: heroDelay() })

  const jsonLd = {
    '@type': 'AboutPage',
    name: `${t.seo} · ${site.name}`,
    url: `${site.url}${to.studio(lang)}`,
    inLanguage: lang,
    mainEntity: { '@type': 'Organization', name: site.name, url: site.url, ...(site.email ? { email: site.email } : {}) },
  }

  return (
    <>
      <Seo title={t.seo} description={t.desc} jsonLd={jsonLd} />

      <header className="container-x pt-[calc(var(--nav-h)+clamp(4rem,12vw,9rem))]">
        <Meta>{t.kicker}</Meta>
        <h1 ref={h1} data-hero-reveal className="type-hero mt-6 max-sm:text-[8.1vw] max-sm:[font-stretch:100%]">
          <span className="block">{t.title[0]}</span>
          <span className="block">{t.title[1]}</span>
        </h1>
        <p className="type-lead measure mt-8 text-mute">{t.sub}</p>
      </header>

      {/* Pieza de apertura: la animación original del logo */}
      <figure className="container-x mt-16 md:mt-24">
        <div className="overflow-hidden rounded-2xl">
          {/* El tercio inferior del vídeo funde a negro: oculta las bandas de compresión bajo el reflejo
              (en OLED se veían como una mancha escalonada). El botón de pausa queda fuera de la máscara. */}
          <Video
            media="logo"
            label={t.logoLabel}
            controls
            exclusive
            loop
            className="aspect-video [&_img]:[mask-image:linear-gradient(to_bottom,#000_72%,transparent_88%)] [&_video]:[mask-image:linear-gradient(to_bottom,#000_72%,transparent_88%)]"
          />
        </div>
        <figcaption className="mt-4">
          <Meta>{[t.logoMeta, '16:9', durationLabel('logo')].filter(Boolean).join(' · ')}</Meta>
        </figcaption>
      </figure>

      <section aria-labelledby="studio-house" className="container-x mt-28 grid gap-8 md:mt-40 md:grid-cols-12 md:gap-10">
        <h2 id="studio-house" className="type-display md:col-span-6">
          {t.houseTitle}
        </h2>
        <div className="flex flex-col gap-5 md:col-span-5 md:col-start-8 md:pt-3">
          {t.house.map((p) => (
            <p key={p} className="type-lead text-mute">
              {p}
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="studio-method" className="container-x mt-28 md:mt-40">
        <div className="mb-10 md:mb-14">
          <h2 id="studio-method" className="type-display">
            {t.methodTitle}
          </h2>
          <p className="type-lead measure mt-4 text-mute">{t.methodLead}</p>
        </div>
        <Spec rows={t.method} />
      </section>

      <section aria-labelledby="studio-craft" className="container-x mt-28 md:mt-40">
        <div className="mb-10 md:mb-14">
          <h2 id="studio-craft" className="type-display">
            {t.craftTitle}
          </h2>
          <p className="type-lead measure mt-4 text-mute">{t.craftLead}</p>
        </div>
        <Spec rows={t.craft} />
      </section>

      {/* En lugar de la foto (pendiente): una frase a escala de póster */}
      <section className="container-x mt-28 border-y border-line py-24 md:mt-40 md:py-36">
        <p className="type-hero max-w-[18ch]">{t.quote}</p>
      </section>

      <section aria-labelledby="studio-ways" className="container-x mt-28 md:mt-40">
        <h2 id="studio-ways" className="type-display mb-10 md:mb-14">
          {t.waysTitle}
        </h2>
        <ul className="grid gap-x-10 md:grid-cols-2">
          {t.ways.map((w) => (
            <li key={w.term} className="border-t border-line py-8">
              <h3 className="text-[1.1875rem] font-[480] tracking-[-0.01em] text-paper [font-stretch:104%]">{w.term}</h3>
              <p className="type-body mt-2 max-w-[48ch] text-mute">{w.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-28 border-t border-line py-24 md:mt-40 md:py-32">
        <h2 className="type-display">{t.closeTitle}</h2>
        <p className="type-lead measure mt-5 text-mute">{t.closeLine}</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Cta to={to.contact(lang)}>{t.cta}</Cta>
          <Cta to={to.work(lang)} variant="text">
            {t.work}
          </Cta>
        </div>
      </section>
    </>
  )
}
