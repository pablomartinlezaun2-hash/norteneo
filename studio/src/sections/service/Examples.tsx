import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { isWeb, sectors, type Case } from '@/content/cases'
import { frameUrl, getMedia } from '@/lib/media'
import { DiscoverLink } from '@/components/Cta'
import { Meta } from '@/components/Meta'
import { ui } from './copy'

/** Ejemplos: casos del servicio con enlace a su página. Pósters fijos (sin vídeo ni zoom al pasar). */
export function Examples({ items }: { items: Case[] }) {
  const lang = useLang()
  const t = ui[lang]
  const two = items.length <= 2
  const allClient = items.every((c) => c.kind === 'client')
  return (
    <section id="ejemplos" tabIndex={-1} aria-labelledby="ejemplos-title" className="border-t border-line outline-none">
      <div className="container-x py-24 md:py-36">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <p className="type-meta text-mute">{t.examples}</p>
            <h2 id="ejemplos-title" className="type-display mt-4">
              {allClient ? t.examplesTitle : t.examplesTitleMixed}
            </h2>
            <p className="type-lead mt-4 text-mute">{allClient ? t.examplesText : t.examplesTextMixed}</p>
            {items.some((c) => c.media && !isWeb(c)) && (
              <p className="mt-3">
                <Meta>{t.ai}</Meta>
              </p>
            )}
          </div>
          <DiscoverLink to={to.work(lang)}>{t.seeWork}</DiscoverLink>
        </div>
        {/* Móvil: carril con scroll-snap nativo. Desde sm: rejilla. */}
        <ul
          className={`-mx-[var(--gutter)] mt-12 flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:thin] sm:mx-0 sm:grid sm:snap-none sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 md:mt-16 ${two ? '' : 'lg:grid-cols-3'}`}
        >
          {items.map((c) => (
            <li key={c.slug} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <ExampleItem item={c} wide={two} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ExampleItem({ item, wide }: { item: Case; wide: boolean }) {
  const lang = useLang()
  const t = ui[lang]
  const m = item.media ? getMedia(item.media) : undefined
  // Si la pieza tiene secuencia, su último fotograma (el plano final) es mejor miniatura que el póster
  const seq = m?.seq?.desktop
  return (
    <Link to={to.case(lang, item.slug)} viewTransition className="group block">
      <div className={`relative overflow-hidden bg-surface ${wide ? 'aspect-[4/5] md:aspect-[5/4]' : 'aspect-[4/5]'}`}>
        {seq ? (
          <img
            src={frameUrl(seq, seq.count - 1)}
            alt=""
            width={seq.w}
            height={seq.h}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : m ? (
          <picture>
            <source type="image/avif" srcSet={m.poster.avif} />
            <img
              src={m.poster.jpg}
              alt=""
              width={m.poster.w}
              height={m.poster.h}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
        ) : (
          <span aria-hidden="true" className="type-display absolute inset-0 grid place-items-center px-6 text-center text-paper/90">
            {item.title}
          </span>
        )}
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-6">
        <h3 className="type-title group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[0.18em]">{item.title}</h3>
        <span className="type-small shrink-0 text-accent">{t.seeCase}</span>
      </div>
      <p className="type-small mt-2 text-mute">{item.line[lang]}</p>
      <p className="mt-2">
        <Meta>{[...new Set([sectors[item.sector][lang], t.kind[item.kind]])].join(' · ')}</Meta>
      </p>
    </Link>
  )
}
