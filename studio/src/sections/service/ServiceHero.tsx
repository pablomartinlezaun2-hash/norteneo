import { useRef } from 'react'
import { useLang } from '@/i18n'
import type { Service } from '@/content/services'
import type { ServiceDetail } from '@/content/services/types'
import { getMedia } from '@/lib/media'
import { heroDelay } from '@/lib/motion'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { Video } from '@/components/Video'
import { Meta } from '@/components/Meta'
import { ui } from './copy'

/**
 * Hero del servicio: nombre + una frase y la pieza a sangre.
 * - Horizontal: titular arriba y medio a todo el ancho.
 * - Vertical: titular a la izquierda y la pieza 9:16 a la derecha (a sangre en móvil).
 * - Sin medio: variante tipográfica a escala de póster, con los oficios del servicio al pie.
 */
export function ServiceHero({ service, detail }: { service: Service; detail: ServiceDetail }) {
  const lang = useLang()
  const t = ui[lang]
  const h1 = useRef<HTMLHeadingElement>(null)
  useSplitReveal(h1, { on: 'load', delay: heroDelay() })
  const hero = detail.hero
  const name = service.name[lang]
  const sub = detail.sub[lang]

  if (!hero) {
    return (
      <header className="container-x flex min-h-[62svh] flex-col justify-end pt-16 pb-10 md:min-h-[calc(86svh-var(--nav-h)-3.25rem)] md:pt-20 md:pb-14">
        <h1 ref={h1} data-hero-reveal className="type-hero max-w-[12ch]" style={{ fontSize: 'clamp(2.75rem, 10vw, 9.5rem)' }}>
          {name}
        </h1>
        <p className="type-lead mt-6 max-w-[36ch] text-mute md:mt-8">{sub}</p>
        {detail.heroFacts && (
          <ul className="mt-14 grid grid-cols-2 border-t border-line md:mt-20 md:grid-cols-4">
            {detail.heroFacts.map((f, i) => (
              <li key={i} className={`type-small border-line pt-4 pr-4 pb-2 text-mute md:border-l md:pl-5 md:first:border-l-0 md:first:pl-0`}>
                {f[lang]}
              </li>
            ))}
          </ul>
        )}
      </header>
    )
  }

  const caption = (
    <>
      <Meta>{hero.meta[lang]}</Meta>
      {hero.ai && <Meta>{t.ai}</Meta>}
    </>
  )

  const media = hero.still ? (
    <Still media={hero.media} label={hero.label[lang]} priority className="h-full w-full" />
  ) : (
    <Video media={hero.media} priority label={hero.label[lang]} controls exclusive className="h-full w-full" />
  )

  if (hero.orient === 'port') {
    return (
      <header className="container-x grid items-end gap-8 pt-10 md:grid-cols-12 md:gap-10 md:pt-16 md:pb-6">
        <div className="md:col-span-8 md:pb-4">
          <h1 ref={h1} data-hero-reveal className="type-hero">
            {name}
          </h1>
          <p className="type-lead mt-6 max-w-[34ch] text-mute">{sub}</p>
          <p className="mt-10 hidden flex-col gap-1 md:flex">{caption}</p>
        </div>
        <figure className="-mx-[var(--gutter)] md:col-span-4 md:mx-0">
          <div className="aspect-[4/5] w-full md:ml-auto md:aspect-[9/16] md:w-[min(100%,calc(76svh*9/16),428px)]">{media}</div>
          <figcaption className="mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1 px-[var(--gutter)] md:hidden">{caption}</figcaption>
        </figure>
      </header>
    )
  }

  return (
    <header>
      <div className="container-x pt-12 pb-8 md:pt-20 md:pb-12">
        <h1 ref={h1} data-hero-reveal className="type-hero">
          {name}
        </h1>
        <p className="type-lead mt-5 max-w-[40ch] text-mute md:mt-6">{sub}</p>
      </div>
      <figure>
        <div className="aspect-[4/3] w-full sm:aspect-video md:max-h-[88svh]">{media}</div>
        <figcaption className="container-x mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1">{caption}</figcaption>
      </figure>
    </header>
  )
}

/** Póster fijo de un clip (AVIF + JPG) con las mismas proporciones que el vídeo. */
export function Still({
  media,
  label,
  className = '',
  fit = 'cover',
  priority = false,
}: {
  media: string
  label: string
  className?: string
  fit?: 'cover' | 'contain'
  /** Póster LCP del hero */
  priority?: boolean
}) {
  const m = getMedia(media)
  if (!m) return <div className={`bg-surface ${className}`} role="img" aria-label={label} />
  return (
    <picture>
      <source type="image/avif" srcSet={m.poster.avif} />
      <img
        src={m.poster.jpg}
        alt={label}
        width={m.poster.w}
        height={m.poster.h}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={`${fit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
      />
    </picture>
  )
}
