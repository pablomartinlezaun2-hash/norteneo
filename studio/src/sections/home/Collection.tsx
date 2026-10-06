import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'
import { to } from '@/i18n/paths'
import { caseBySlug, sectors, type Case } from '@/content/cases'
import { getMedia, type MediaEntry } from '@/lib/media'
import { Meta } from '@/components/Meta'
import { Video } from '@/components/Video'
import { PhoneFrame } from '@/components/PhoneFrame'
import { Cta } from '@/components/Cta'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { useMediaQuery, useReducedMotion } from '@/hooks/useMediaQuery'
import { MQ } from '@/lib/motion'
import { pauseIn, playIn } from '@/sections/closing/hoverVideo'

const copy = {
  es: {
    title: 'La colección.',
    sub: 'Encargos para restauración, inmobiliaria, bebidas y moda.',
    ai: 'Generado con IA, dirigido por NEO',
    concept: 'Concepto · no oficial',
    all: 'Ver todo el trabajo',
  },
  en: {
    title: 'The collection.',
    sub: 'Commissions across hospitality, real estate, drinks and fashion.',
    ai: 'AI-generated, directed by NEO',
    concept: 'Concept · unofficial',
    all: 'See all work',
  },
} satisfies Record<Lang, unknown>

/**
 * Orden editorial: se sale de la comida desde la primera pieza.
 * `place` coloca cada pieza en la rejilla de 12 columnas de escritorio (asimétrica).
 * En móvil, una columna: Trono a ancho completo y el resto de verticales alternando lado.
 */
const ORDER: { slug: string; place: string; mobile?: string }[] = [
  // Pliego 1: dos verticales escalonadas y un 16:9 (el spot de running va aparte, tras el hero)
  { slug: 'trono', place: 'lg:col-span-3 lg:col-start-1 lg:row-start-2' },
  { slug: 'real-empire-estate', place: 'lg:col-span-3 lg:col-start-4 lg:row-start-2 lg:mt-32', mobile: 'ml-auto' },
  { slug: 'fuego', place: 'lg:col-span-6 lg:col-start-7 lg:row-start-2 lg:self-center lg:pl-6' },
  // Pliego 2, en espejo: dos 16:9 apilados y una vertical
  { slug: 'reserva', place: 'lg:col-span-6 lg:col-start-1 lg:row-start-3 lg:mt-32 lg:pr-6' },
  { slug: 'llave', place: 'lg:col-span-6 lg:col-start-1 lg:row-start-4 lg:mt-20 lg:pr-6' },
  { slug: 'mudanza', place: 'lg:col-span-3 lg:col-start-8 lg:row-span-2 lg:row-start-3 lg:mt-48', mobile: 'ml-auto' },
]

type Item = { c: Case; m: MediaEntry; place: string; mobile: string }

const items: Item[] = ORDER.flatMap(({ slug, place, mobile = '' }) => {
  const c = caseBySlug(slug)
  const m = c?.media ? getMedia(c.media) : undefined
  return c && m ? [{ c, m, place, mobile }] : []
})

/**
 * La colección · amplitud. Rejilla editorial asimétrica que mezcla 16:9 y 9:16 (en PhoneFrame).
 * Vídeo al pasar el ratón en escritorio y al entrar en pantalla en móvil, con un solo vídeo activo.
 * Reduced-motion: pósters, y vídeo solo al pulsar su botón.
 */
export function Collection() {
  const lang = useLang()
  const t = copy[lang]
  const titleRef = useRef<HTMLHeadingElement>(null)
  useSplitReveal(titleRef)

  if (items.length === 0) return null

  return (
    <section aria-labelledby="collection-title" className="border-t border-line py-24 lg:py-36">
      <div className="container-x">
        <ul className="grid grid-cols-1 gap-y-16 sm:gap-y-20 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
          <li className="lg:col-span-12 lg:row-start-1 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8 lg:pb-20">
            <h2 id="collection-title" ref={titleRef} className="type-display lg:col-span-7">
              {t.title}
            </h2>
            <p className="type-lead measure mt-5 text-mute lg:col-span-5 lg:col-start-8 lg:mt-0 lg:pb-2">{t.sub}</p>
          </li>
          {items.map((it, i) => (
            <Piece key={it.c.slug} item={it} lang={lang} first={i === 0} />
          ))}
          <li className="lg:col-span-12 lg:row-start-5 lg:mt-24">
            <Cta to={to.work(lang)} variant="ghost">
              {t.all}
            </Cta>
          </li>
        </ul>
      </div>
    </section>
  )
}

function Piece({ item, lang, first }: { item: Item; lang: Lang; first: boolean }) {
  const t = copy[lang]
  const { c, m, place, mobile } = item
  const ref = useRef<HTMLLIElement>(null)
  const hover = useMediaQuery(MQ.hover)
  const reduce = useReducedMotion()
  const port = m.orient === 'port'
  const hoverPlay = hover && !reduce
  const label = `${c.title} · ${c.line[lang]}`

  const video = (
    <Video
      media={m.id}
      label={label}
      play={hover || reduce ? 'manual' : 'inview'}
      exclusive
      className={port ? 'h-full w-full' : 'aspect-video w-full'}
    />
  )

  // Ancho de las verticales: Trono la más grande en móvil; el resto más estrecho y alternando lado.
  // Por debajo de lg, el ancho se limita también por la altura del viewport (pantalla 9:16 del PhoneFrame, ≈ 0,5625) para que
  // la pieza y su pie (título, línea y etiquetas, unos 12rem con la nav) quepan en una pantalla.
  // Clases escritas completas para que Tailwind las detecte.
  const phoneWidth = first
    ? 'w-[min(100%,calc((100svh_-_12rem)*0.5625))] sm:w-[min(62%,calc((100svh_-_12rem)*0.5625))] lg:w-full'
    : `w-[min(78%,calc((100svh_-_12rem)*0.5625))] sm:w-[min(52%,calc((100svh_-_12rem)*0.5625))] lg:w-full ${mobile} lg:mx-0`

  return (
    <li
      ref={ref}
      onPointerEnter={hoverPlay ? () => playIn(ref.current) : undefined}
      onPointerLeave={hoverPlay ? () => pauseIn(ref.current) : undefined}
      onFocus={hoverPlay ? () => playIn(ref.current) : undefined}
      onBlur={hoverPlay ? (e) => !e.currentTarget.contains(e.relatedTarget as Node) && pauseIn(ref.current) : undefined}
      className={`group relative ${place}`}
    >
      <div className={port ? phoneWidth : 'w-full'}>
        {port ? <PhoneFrame className="w-full">{video}</PhoneFrame> : <div className="overflow-hidden rounded-[0.75rem]">{video}</div>}
        <div className="mt-5 flex flex-col gap-2 lg:mt-6">
          <h3 className="text-[1.375rem] leading-[1.15] font-[450] tracking-[-0.015em] [font-stretch:108%]">
            <Link
              to={to.case(lang, c.slug)}
              viewTransition
              className="outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:after:rounded-[0.75rem] focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent underline-offset-4 decoration-1"
            >
              {c.title}
            </Link>
          </h3>
          <p className="type-small max-w-[40ch] text-mute">{c.line[lang]}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <Meta>
              {sectors[c.sector][lang]} · {port ? '9:16' : '16:9'} · {Math.round(m.duration)} s
            </Meta>
            {c.kind === 'concept' && <Meta>{t.concept}</Meta>}
            <Meta>{t.ai}</Meta>
          </div>
        </div>
      </div>
    </li>
  )
}
