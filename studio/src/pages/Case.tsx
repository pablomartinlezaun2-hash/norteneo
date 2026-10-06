import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'
import { to } from '@/i18n/paths'
import { site } from '@/content/site'
import { caseBySlug, type Case } from '@/content/cases'
import { getMedia } from '@/lib/media'
import { heroDelay } from '@/lib/motion'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { Seo } from '@/components/Seo'
import { Video } from '@/components/Video'
import { PhoneFrame } from '@/components/PhoneFrame'
import { Cta } from '@/components/Cta'
import { Missing } from '@/sections/work/Missing'
import { Tag } from '@/sections/work/Tag'
import { VisitLink } from '@/sections/work/WebList'
import { caseCopy } from '@/sections/work/caseCopy'
import { pieceTransition } from '@/sections/work/Piece'
import {
  arrange,
  caseShape,
  domainOf,
  durationLabel,
  formatLabel,
  isGenerated,
  kindLabel,
  labels,
  mediaShape,
  nextCase,
  pieceAlt,
  sectorLabel,
  servicesLabel,
  SEP,
} from '@/sections/work/meta'

const copy = {
  es: {
    back: 'Trabajo',
    challenge: 'El reto',
    solution: 'La solución',
    gallery: 'Galería',
    galleryAlt: (title: string, n: number) => `${title}, pieza ${n} de la galería`,
    askTitle: '¿Algo así para tu marca?',
    askLine: 'Cuéntanos qué necesitas. Respondemos con una propuesta a medida.',
    cta: 'Solicitar propuesta',
    next: 'Siguiente caso',
    web: 'Web en producción',
  },
  en: {
    back: 'Work',
    challenge: 'The challenge',
    solution: 'The solution',
    gallery: 'Gallery',
    galleryAlt: (title: string, n: number) => `${title}, gallery piece ${n}`,
    askTitle: 'Something like this for your brand?',
    askLine: 'Tell us what you need, and we’ll reply with a tailored proposal.',
    cta: 'Request a proposal',
    next: 'Next case',
    web: 'Live website',
  },
}

const fill = (text: string, c: Case) => text.replace('{domain}', domainOf(c.url))

function ficha(c: Case, lang: Lang): string {
  // En las webs el formato ("Web") ya lo dice el servicio: no se repite
  const format = !c.media && c.services.includes('websites') ? '' : formatLabel(c, lang)
  // En el producto propio el sector ya lo dice su etiqueta
  const sector = c.kind === 'own' ? null : sectorLabel(c, lang)
  return [sector, servicesLabel(c, lang), format, durationLabel(c.media)].filter(Boolean).join(SEP)
}

function jsonLd(c: Case, lang: Lang) {
  const abs = (p: string) => `${site.url.replace(/\/$/, '')}${p}`
  const page = abs(to.case(lang, c.slug))
  const creator = { '@type': 'Organization', name: site.name, url: site.url }
  const base = {
    name: c.title,
    description: c.line[lang],
    inLanguage: lang,
    creator,
    genre: sectorLabel(c, lang) ?? undefined,
    keywords: servicesLabel(c, lang),
    ...(c.year ? { dateCreated: c.year } : {}),
  }
  const m = c.media ? getMedia(c.media) : undefined
  if (m) {
    // CreativeWork con el vídeo como medio asociado (MediaObject), no VideoObject de nivel superior:
    // Google exige uploadDate en VideoObject y no tenemos la fecha real de publicación de cada pieza.
    // Cuando cases.ts tenga esa fecha, puede volver a VideoObject con uploadDate.
    const mp4 = m.sources.find((s) => s.codec === 'h264')
    return {
      '@type': 'CreativeWork',
      ...base,
      url: page,
      image: abs(m.poster.jpg),
      associatedMedia: {
        '@type': 'MediaObject',
        encodingFormat: 'video/mp4',
        thumbnailUrl: abs(m.poster.jpg),
        ...(mp4 ? { contentUrl: abs(mp4.src), width: mp4.w, height: mp4.h } : {}),
        duration: `PT${Math.round(m.duration)}S`,
      },
    }
  }
  return { '@type': 'CreativeWork', ...base, url: c.url ?? page, mainEntityOfPage: page }
}

/** Chevron dibujado (no un glifo pegado al texto). */
function Chevron({ dir = 'right', className = '' }: { dir?: 'left' | 'right'; className?: string }) {
  return (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d={dir === 'right' ? 'm1 1 5 5-5 5' : 'M6 1 1 6l5 5'} />
    </svg>
  )
}

function CaseView({ c }: { c: Case }) {
  const lang = useLang()
  const t = copy[lang]
  const h1 = useRef<HTMLHeadingElement>(null)
  useSplitReveal(h1, { on: 'load', delay: heroDelay() })
  const shape = caseShape(c)
  const text = caseCopy[c.slug]
  const kind = kindLabel(c, lang)
  const next = nextCase(c.slug)
  const nextPoster = next.media ? getMedia(next.media)?.poster : undefined
  const poster = c.media ? getMedia(c.media)?.poster.jpg : undefined
  const ctaService = c.services[0]

  const tags = (
    <div className="mt-6 flex flex-col gap-1.5">
      <Tag>{ficha(c, lang)}</Tag>
      {kind && <Tag tone="paper">{kind}</Tag>}
      {isGenerated(c) && <Tag tone="dim">{labels.ai[lang]}</Tag>}
    </div>
  )

  const back = (
    <Link to={to.work(lang)} viewTransition className="group type-small inline-flex min-h-11 items-center gap-2 text-mute hover:text-paper">
      <Chevron dir="left" className="transition-transform duration-300 group-hover:-translate-x-0.5" />
      {t.back}
    </Link>
  )

  return (
    <>
      <Seo title={c.title} description={`${c.line[lang]} ${text ? fill(text.solution[lang], c) : ''}`.trim()} image={poster} jsonLd={jsonLd(c, lang)} />

      <article>
        {/* Hero: vertical en marco de móvil, horizontal a sangre o tipográfico */}
        {shape === 'port' && c.media && (
          <header className="container-x grid items-center gap-12 pt-[calc(var(--nav-h)+1.5rem)] pb-16 md:grid-cols-12 md:gap-10 md:pt-[calc(var(--nav-h)+3rem)] md:pb-24">
            <div className="md:col-span-6 lg:col-span-6">
              {back}
              <h1 ref={h1} data-hero-reveal className="type-hero mt-8 md:mt-12">
                {c.title}
              </h1>
              <p className="type-lead measure mt-6 text-mute">{c.line[lang]}</p>
              {tags}
            </div>
            <div className="md:col-span-6 md:justify-self-center lg:col-span-5 lg:col-start-8">
              {/* El ancho se limita por la altura del viewport para que el teléfono y su botón de pausa
                  quepan enteros en pantallas bajas (1280×720): alto ≈ 16/9 del ancho + marco. */}
              <PhoneFrame className="mx-auto w-[min(78vw,19rem)] md:w-[min(19rem,calc((100svh-var(--nav-h)-6rem)*0.54))] lg:w-[min(20rem,calc((100svh-var(--nav-h)-6rem)*0.54))]">
                <div className="h-full w-full" style={{ viewTransitionName: pieceTransition(c.slug) }}>
                  <Video media={c.media} label={pieceAlt(c, lang)} priority exclusive controls className="h-full w-full" />
                </div>
              </PhoneFrame>
            </div>
          </header>
        )}

        {shape === 'land' && c.media && (
          <header className="pt-[calc(var(--nav-h)+1.5rem)] md:pt-[calc(var(--nav-h)+3rem)]">
            <div className="container-x">
              {back}
              <div className="mt-8 grid gap-6 md:mt-12 md:grid-cols-12 md:items-end md:gap-10">
                <h1 ref={h1} data-hero-reveal className="type-hero md:col-span-7">
                  {c.title}
                </h1>
                <div className="md:col-span-5 md:pb-2">
                  <p className="type-lead text-mute">{c.line[lang]}</p>
                  {tags}
                </div>
              </div>
            </div>
            <div className="mt-12 md:mt-16" style={{ viewTransitionName: pieceTransition(c.slug) }}>
              <Video media={c.media} label={pieceAlt(c, lang)} priority exclusive controls className="aspect-video w-full" />
            </div>
          </header>
        )}

        {shape === 'type' && (
          <header className="container-x pt-[calc(var(--nav-h)+1.5rem)] pb-8 md:pt-[calc(var(--nav-h)+3rem)]">
            {back}
            <h1 ref={h1} data-hero-reveal className="type-hero mt-8 max-w-[16ch] md:mt-12">
              {c.title}
            </h1>
            <p className="type-lead measure mt-6 text-mute">{c.line[lang]}</p>
            {tags}
            {c.url && (
              <div className="mt-14 flex flex-col gap-6 border-t border-line pt-8 md:mt-20 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="type-meta text-dim">{t.web}</p>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="type-title mt-2 inline-block break-all decoration-line-strong underline-offset-[0.15em] hover:underline"
                  >
                    {domainOf(c.url)}
                    <span className="sr-only">{lang === 'es' ? ' (se abre en una pestaña nueva)' : ' (opens in a new tab)'}</span>
                  </a>
                </div>
                <VisitLink url={c.url} variant="primary" className="self-start md:self-auto" />
              </div>
            )}
          </header>
        )}

        {/* El reto / La solución */}
        {text && (
          <section aria-label={`${t.challenge} · ${t.solution}`} className={`container-x ${shape === 'land' ? 'mt-16 md:mt-24' : ''}`}>
            <div className="grid gap-12 border-t border-line pt-12 md:grid-cols-12 md:gap-10 md:pt-16">
              <div className="md:col-span-5">
                <h2 className="text-[1.0625rem] font-[520] text-paper">{t.challenge}</h2>
                <p className="type-lead mt-4 text-mute">{text.challenge[lang]}</p>
              </div>
              <div className="md:col-span-6 md:col-start-7">
                <h2 className="text-[1.0625rem] font-[520] text-paper">{t.solution}</h2>
                <p className="type-lead mt-4 text-mute">{fill(text.solution[lang], c)}</p>
                {text.note && <p className="type-small mt-6 text-dim">{text.note[lang]}</p>}
              </div>
            </div>
          </section>
        )}

        {/* Galería */}
        {c.gallery && c.gallery.length > 0 && (
          <section aria-labelledby="case-gallery" className="container-x mt-24 md:mt-36">
            <div className="mb-10 flex items-end justify-between gap-6 md:mb-14">
              <h2 id="case-gallery" className="type-title">
                {t.gallery}
              </h2>
              {isGenerated(c) && <Tag tone="dim">{labels.ai[lang]}</Tag>}
            </div>
            <div className="grid grid-cols-12 gap-x-6 gap-y-14 md:gap-x-10">
              {arrange(c.gallery, mediaShape).map(({ item, cls, shape: s, paired }, i) => (
                <figure key={item} className={`col-span-12 ${cls} ${paired && s === 'land' ? 'md:self-center' : ''}`}>
                  {s === 'port' ? (
                    <PhoneFrame className="mx-auto w-[min(72vw,17rem)] md:mx-0 lg:w-[18.5rem]">
                      <Video media={item} label={t.galleryAlt(c.title, i + 1)} exclusive controls className="h-full w-full" />
                    </PhoneFrame>
                  ) : (
                    <div className="overflow-hidden rounded-2xl">
                      <Video media={item} label={t.galleryAlt(c.title, i + 1)} exclusive controls className="aspect-video" />
                    </div>
                  )}
                  <figcaption className={`mt-4 ${s === 'port' ? 'mx-auto w-[min(72vw,17rem)] md:mx-0 lg:w-[18.5rem]' : ''}`}>
                    <Tag>{[mediaShape(item) === 'port' ? '9:16' : '16:9', durationLabel(item)].filter(Boolean).join(SEP)}</Tag>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Llamada a la acción */}
        <section className="container-x mt-24 md:mt-36">
          <div className="flex flex-col gap-8 border-t border-line py-14 md:flex-row md:items-end md:justify-between md:py-20">
            <div>
              <h2 className="type-title">{t.askTitle}</h2>
              <p className="type-body measure mt-3 text-mute">{t.askLine}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Cta to={to.contact(lang, ctaService)}>{t.cta}</Cta>
              {c.url && <VisitLink url={c.url} />}
            </div>
          </div>
        </section>
      </article>

      {/* Siguiente caso */}
      <nav aria-label={t.next} className="border-t border-line">
        <Link to={to.case(lang, next.slug)} viewTransition className="group container-x grid items-center gap-8 py-16 md:grid-cols-12 md:gap-10 md:py-24">
          <div className="md:col-span-7">
            <span className="type-meta text-dim">{t.next}</span>
            <span className="type-hero mt-4 block">
              {next.title}
              <Chevron className="ml-[0.28em] inline-block h-[0.5em] w-auto align-[0.02em] text-mute transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 group-hover:text-paper" />
            </span>
            <span className="type-small mt-4 block text-mute">{next.line[lang]}</span>
          </div>
          {nextPoster && (
            <div className="hidden md:col-span-4 md:col-start-9 md:block">
              <div
                className={`overflow-hidden rounded-2xl ${mediaShape(next.media) === 'port' ? 'mx-auto aspect-[9/16] w-[55%]' : 'aspect-video'}`}
                style={{ viewTransitionName: pieceTransition(next.slug) }}
              >
                <picture>
                  <source type="image/avif" srcSet={nextPoster.avif} />
                  <img
                    src={nextPoster.jpg}
                    alt=""
                    width={nextPoster.w}
                    height={nextPoster.h}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                  />
                </picture>
              </div>
            </div>
          )}
        </Link>
      </nav>
    </>
  )
}

/** /trabajo/:slug · /en/work/:slug */
export function Component() {
  const { slug = '' } = useParams()
  const c = caseBySlug(slug)
  if (!c) return <Missing />
  return <CaseView key={c.slug} c={c} />
}
