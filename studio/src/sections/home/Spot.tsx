import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'
import { to } from '@/i18n/paths'
import { caseBySlug } from '@/content/cases'
import type { ServiceId } from '@/content/services'
import { getMedia } from '@/lib/media'
import { Meta } from '@/components/Meta'
import { Video } from '@/components/Video'
import { Cta } from '@/components/Cta'
import { useSplitReveal } from '@/hooks/useSplitReveal'

type PieceCopy = { eyebrow: string; title: string; line: string; want: string; label: string }

/** Piezas verticales que se presentan a gran tamaño tras el hero. */
const pieces: Record<'running' | 'trono', { media: string; service: ServiceId; copy: Record<Lang, PieceCopy> }> = {
  running: {
    media: 'running',
    service: 'ai-video',
    copy: {
      es: {
        eyebrow: 'Spot deportivo',
        title: 'Running.',
        line: 'Un spot vertical generado con IA, dirigido y montado por NEO. Súbele el volumen.',
        want: 'Quiero un spot así',
        label: 'Running: spot deportivo vertical de concepto, generado con IA y dirigido por NEO. Con sonido.',
      },
      en: {
        eyebrow: 'Sports spot',
        title: 'Running.',
        line: 'A vertical spot generated with AI, directed and cut by NEO. Turn it up.',
        want: 'I want a spot like this',
        label: 'Running: vertical concept sports spot, AI-generated and directed by NEO. With sound.',
      },
    },
  },
  trono: {
    media: 'fashion',
    service: 'ai-video',
    copy: {
      es: {
        eyebrow: 'Videoclip',
        title: 'Trono.',
        line: 'Un videoclip de moda en vertical: abrigo burdeos, un trono y bailarinas. Generado con IA, dirigido y montado por NEO.',
        want: 'Quiero un videoclip así',
        label: 'Trono: videoclip de moda vertical con un cantante, generado con IA y dirigido por NEO. Con sonido.',
      },
      en: {
        eyebrow: 'Music video',
        title: 'Trono.',
        line: 'A vertical fashion music video: a burgundy coat, a throne and dancers. AI-generated, directed and cut by NEO.',
        want: 'I want a music video like this',
        label: 'Trono: vertical fashion music video with a singer, AI-generated and directed by NEO. With sound.',
      },
    },
  },
}

const shared = {
  es: { concept: 'Concepto · no oficial', ai: 'Generado con IA, dirigido por NEO', case: 'Ver el caso' },
  en: { concept: 'Concept · unofficial', ai: 'AI-generated, directed by NEO', case: 'View the case' },
} satisfies Record<Lang, unknown>

/**
 * Pieza vertical a gran tamaño, centrada sobre su propio póster desenfocado a sangre
 * (ambiente sin un segundo vídeo). `mirror` cambia de lado el texto y las acciones.
 * Suena por defecto si el navegador lo permite y solo mientras está en pantalla (ver <Video>).
 */
export function Spot({ slug, mirror = false }: { slug: keyof typeof pieces; mirror?: boolean }) {
  const lang = useLang()
  const piece = pieces[slug]
  const t = piece.copy[lang]
  const s = shared[lang]
  const titleRef = useRef<HTMLHeadingElement>(null)
  useSplitReveal(titleRef)
  const c = caseBySlug(slug)
  const m = getMedia(piece.media)
  if (!c || !m) return null
  const titleId = `spot-${slug}-title`

  return (
    <section aria-labelledby={titleId} data-spot={slug} className="relative isolate overflow-hidden bg-ink py-20 md:py-28 lg:py-24">
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
        <div className={`order-2 flex flex-col gap-5 lg:col-span-4 lg:row-start-1 ${mirror ? 'lg:col-start-9' : 'lg:col-start-1'}`}>
          <Meta>
            {t.eyebrow} · 9:16 · {Math.round(m.duration)}
            {' '}s
          </Meta>
          <h2 id={titleId} ref={titleRef} className="type-display">
            {t.title}
          </h2>
          <p className="type-lead measure text-mute">{t.line}</p>
        </div>

        <div
          className={`order-3 flex flex-col items-start gap-6 lg:col-span-3 lg:row-start-1 lg:self-end lg:pb-4 ${mirror ? 'lg:col-start-1' : 'lg:col-start-10'}`}
        >
          <div className="flex flex-col gap-1.5">
            {c.kind === 'concept' && <Meta className="text-paper/80">{s.concept}</Meta>}
            <Meta>{s.ai}</Meta>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Cta to={to.contact(lang, piece.service)} variant="ghost">
              {t.want}
            </Cta>
            <Link
              to={to.case(lang, c.slug)}
              viewTransition
              className="inline-flex min-h-11 items-center text-[0.9375rem] font-[480] text-accent underline-offset-4 hover:underline"
            >
              {s.case}
            </Link>
          </div>
        </div>

        <div className="order-1 lg:col-span-4 lg:col-start-5 lg:row-start-1">
          {/* Ancho limitado por la altura de la pantalla para que el 9:16 quepa entero */}
          <div className="mx-auto w-[min(100%,calc((100svh-var(--nav-h)-3rem)*0.5625))] lg:w-[min(100%,calc((100svh-8rem)*0.5625))]">
            <Video
              media={piece.media}
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
