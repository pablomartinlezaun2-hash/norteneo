import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'
import { to } from '@/i18n/paths'
import { caseBySlug } from '@/content/cases'
import { getMedia } from '@/lib/media'
import { Meta } from '@/components/Meta'
import { Video } from '@/components/Video'
import { Cta } from '@/components/Cta'
import { useSplitReveal } from '@/hooks/useSplitReveal'

const copy = {
  es: {
    eyebrow: 'Spot deportivo',
    title: 'Running.',
    line: 'Un spot vertical generado con IA, dirigido y montado por NEO. Súbele el volumen.',
    concept: 'Concepto · no oficial',
    ai: 'Generado con IA, dirigido por NEO',
    case: 'Ver el caso',
    want: 'Quiero un spot así',
    label: 'Running: spot deportivo vertical de concepto, generado con IA y dirigido por NEO. Con sonido.',
  },
  en: {
    eyebrow: 'Sports spot',
    title: 'Running.',
    line: 'A vertical spot generated with AI, directed and cut by NEO. Turn it up.',
    concept: 'Concept · unofficial',
    ai: 'AI-generated, directed by NEO',
    case: 'View the case',
    want: 'I want a spot like this',
    label: 'Running: vertical concept sports spot, AI-generated and directed by NEO. With sound.',
  },
} satisfies Record<Lang, unknown>

/**
 * El spot de running, justo después del hero: la pieza vertical a gran tamaño, centrada,
 * sobre su propio póster desenfocado a sangre (ambiente sin un segundo vídeo).
 * Suena por defecto si el navegador lo permite; si no, con el primer toque (ver <Video>).
 */
export function Spot() {
  const lang = useLang()
  const t = copy[lang]
  const titleRef = useRef<HTMLHeadingElement>(null)
  useSplitReveal(titleRef)
  const c = caseBySlug('running')
  const m = getMedia('running')
  if (!c || !m) return null

  return (
    <section aria-labelledby="spot-title" className="relative isolate overflow-hidden bg-ink py-20 md:py-28 lg:py-24">
      {/* Ambiente: el propio póster, muy desenfocado y oscurecido */}
      <picture aria-hidden="true">
        <source type="image/avif" srcSet={m.poster.avif} />
        <img
          src={m.poster.jpg}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full scale-125 object-cover opacity-45 blur-3xl"
        />
      </picture>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(0_0_0/0.55)_55%,#000_100%)]" />

      <div className="container-x grid items-center gap-10 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-12 lg:gap-8">
        <div className="order-2 flex flex-col gap-5 lg:order-1 lg:col-span-4">
          <Meta>{t.eyebrow} · 9:16 · {Math.round(m.duration)}{'\u00a0'}s</Meta>
          <h2 id="spot-title" ref={titleRef} className="type-display">
            {t.title}
          </h2>
          <p className="type-lead measure text-mute">{t.line}</p>
        </div>

        <div className="order-3 flex flex-col items-start gap-6 lg:col-span-3 lg:col-start-10 lg:self-end lg:pb-4">
          <div className="flex flex-col gap-1.5">
            <Meta className="text-paper/80">{t.concept}</Meta>
            <Meta>{t.ai}</Meta>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Cta to={to.contact(lang, 'ai-video')} variant="ghost">
              {t.want}
            </Cta>
            <Link
              to={to.case(lang, c.slug)}
              viewTransition
              className="inline-flex min-h-11 items-center text-[0.9375rem] font-[480] text-accent underline-offset-4 hover:underline"
            >
              {t.case}
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-4 lg:col-start-5">
          {/* Ancho limitado por la altura de la pantalla para que el 9:16 quepa entero */}
          <div className="mx-auto w-[min(100%,calc((100svh-var(--nav-h)-3rem)*0.5625))] lg:w-[min(100%,calc((100svh-8rem)*0.5625))]">
            <Video
              media="running"
              label={t.label}
              exclusive
              className="aspect-[9/16] w-full rounded-[1.25rem] shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
