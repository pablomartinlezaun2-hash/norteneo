import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Lang } from '@/i18n'
import { to } from '@/i18n/paths'
import { services, type Service, type ServiceId } from '@/content/services'
import { getMedia } from '@/lib/media'
import { Video } from '@/components/Video'
import { Meta } from '@/components/Meta'
import { DiscoverLink } from '@/components/Cta'
import { PreviewWindow, pieceTitle } from './PreviewWindow'
import { TypeComposition } from './TypeComposition'
import { houseCopy } from './copy'

/** Enlace de texto "Solicitar propuesta" con el servicio ya marcado. */
export function ProposeLink({ lang, service, className = '' }: { lang: Lang; service: Service; className?: string }) {
  const t = houseCopy[lang]
  return (
    <Link
      to={to.contact(lang, service.id)}
      viewTransition
      className={`inline-flex min-h-11 items-center text-[0.9375rem] font-[460] text-mute underline-offset-4 transition-colors hover:text-paper hover:underline ${className}`}
    >
      {t.propose}
      <span className="sr-only">: {service.name[lang]}</span>
    </Link>
  )
}

/**
 * "Por oficio": índice tipográfico de los 6 oficios.
 * Escritorio: filas con hairline discontinua + ventana fija con vista previa (hover o foco).
 * Móvil: acordeón nativo (<details>), con póster, frase y enlaces; sin autoplay.
 * Sin JS: funciona como lista de enlaces (escritorio) o acordeón nativo (móvil).
 */
export function ByCraft({ lang }: { lang: Lang }) {
  const t = houseCopy[lang]
  const [active, setActive] = useState<ServiceId>(services[0].id)
  const [open, setOpen] = useState<ServiceId | null>(null)

  return (
    <>
      {/* Escritorio */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <ul className="lg:col-span-7">
          {services.map((s) => {
            const on = s.id === active
            return (
              <li key={s.id} className="relative" onPointerEnter={() => setActive(s.id)} onFocus={() => setActive(s.id)}>
                <div aria-hidden="true" className="hairline-dashed" />
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-10 gap-y-1 py-6 xl:py-7">
                  <h3 className={`type-title transition-colors duration-500 ${on ? 'text-paper' : 'text-mute'}`}>{s.name[lang]}</h3>
                  <Meta className="justify-self-end">{s.format[lang]}</Meta>
                  <p className={`type-body col-span-2 transition-colors duration-500 xl:col-span-1 ${on ? 'text-mute' : 'text-dim'}`}>{s.line[lang]}</p>
                  <div className="col-span-2 flex items-center gap-7 xl:col-span-1 xl:justify-self-end">
                    <DiscoverLink to={to.service(lang, s.id)} className="after:absolute after:inset-0">
                      {t.discover}
                      <span className="sr-only"> {s.name[lang]}</span>
                    </DiscoverLink>
                    <ProposeLink lang={lang} service={s} className="relative z-10" />
                  </div>
                </div>
              </li>
            )
          })}
          <li aria-hidden="true" className="hairline-dashed" />
        </ul>
        <div className="lg:col-span-5">
          <div className="sticky top-[calc(var(--nav-h)+1.5rem)] flex justify-end">
            <PreviewWindow active={active} lang={lang} />
          </div>
        </div>
      </div>

      {/* Móvil: acordeón */}
      <ul className="lg:hidden">
        {services.map((s) => {
          const m = s.media ? getMedia(s.media) : undefined
          const piece = pieceTitle(m ? s.media : undefined)
          return (
            <li key={s.id}>
              <div aria-hidden="true" className="hairline-dashed" />
              <details
                name="house-crafts"
                className="group/acc"
                onToggle={(e) => {
                  const isOpen = e.currentTarget.open
                  setOpen((cur) => (isOpen ? s.id : cur === s.id ? null : cur))
                }}
              >
                <summary className="flex min-h-[4.75rem] cursor-pointer list-none items-center justify-between gap-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="grid gap-1.5">
                    <span className="type-title text-paper">{s.name[lang]}</span>
                    <Meta>{s.format[lang]}</Meta>
                  </span>
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-mute transition-colors group-open/acc:border-line-strong group-open/acc:text-paper">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-open/acc:rotate-45">
                      <path d="M6 1v10M1 6h10" />
                    </svg>
                  </span>
                </summary>
                <div className="pb-9">
                  {open === s.id &&
                    (m ? (
                      <figure>
                        <Video
                          media={s.media!}
                          play="manual"
                          controls
                          exclusive
                          fit="cover"
                          label={t.preview(s.name[lang])}
                          className={m.orient === 'port' ? 'aspect-[4/5]' : 'aspect-video'}
                        />
                        <figcaption className="mt-3">
                          <Meta>
                            {piece ? `${piece} · ` : ''}
                            {t.ai}
                          </Meta>
                        </figcaption>
                      </figure>
                    ) : (
                      // Webs apila meta, la lista de webs y el nombre: en móvil necesita una caja más alta para no cortar el nombre.
                      <div className={`relative border border-line ${s.id === 'websites' ? 'aspect-square sm:aspect-[4/3]' : 'aspect-[4/3]'}`}>
                        <TypeComposition service={s} lang={lang} />
                      </div>
                    ))}
                  <p className="type-body mt-5 text-mute">{s.line[lang]}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-7">
                    <DiscoverLink to={to.service(lang, s.id)}>
                      {t.discover}
                      <span className="sr-only"> {s.name[lang]}</span>
                    </DiscoverLink>
                    <ProposeLink lang={lang} service={s} />
                  </div>
                </div>
              </details>
            </li>
          )
        })}
        <li aria-hidden="true" className="hairline-dashed" />
      </ul>
    </>
  )
}
