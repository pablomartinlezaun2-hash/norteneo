import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { sectors, type Case } from '@/content/cases'
import { getMedia } from '@/lib/media'
import { DiscoverLink } from '@/components/Cta'
import { Meta } from '@/components/Meta'
import { anchorOffset, ui } from './copy'

/** Ejemplos: casos del servicio con enlace a su página. Pósters fijos (sin vídeo ni zoom al pasar). */
export function Examples({ items }: { items: Case[] }) {
  const lang = useLang()
  const t = ui[lang]
  const two = items.length <= 2
  return (
    <section id="ejemplos" tabIndex={-1} aria-labelledby="ejemplos-title" className={`border-t border-line outline-none ${anchorOffset}`}>
      <div className="container-x py-24 md:py-36">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <p className="type-meta text-mute">{t.examples}</p>
            <h2 id="ejemplos-title" className="type-display mt-4">
              {t.examplesTitle}
            </h2>
            <p className="type-lead mt-4 text-mute">{t.examplesText}</p>
            {items.some((c) => c.media) && (
              <p className="mt-3">
                <Meta>{t.ai}</Meta>
              </p>
            )}
          </div>
          <DiscoverLink to={to.work(lang)}>{t.seeWork}</DiscoverLink>
        </div>
        <ul className={`mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:mt-16 ${two ? '' : 'lg:grid-cols-3'}`}>
          {items.map((c) => (
            <li key={c.slug}>
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
  return (
    <Link to={to.case(lang, item.slug)} viewTransition className="group block">
      <div className={`relative overflow-hidden bg-surface ${wide ? 'aspect-[4/5] md:aspect-[5/4]' : 'aspect-[4/5]'}`}>
        {m ? (
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
        <Meta>
          {sectors[item.sector][lang]} · {t.kind[item.kind]}
        </Meta>
      </p>
    </Link>
  )
}
