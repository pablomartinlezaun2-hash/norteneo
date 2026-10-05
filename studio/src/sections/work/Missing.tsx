import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { getMedia } from '@/lib/media'
import { Seo } from '@/components/Seo'
import { Cta } from '@/components/Cta'

const copy = {
  es: {
    seo: 'Página no encontrada',
    title: 'Esta pieza no existe. Aún.',
    line: 'Puede que el enlace haya cambiado o que la estemos dirigiendo ahora mismo.',
    work: 'Ver trabajo',
    home: 'Volver al inicio',
    paused: 'En pausa',
  },
  en: {
    seo: 'Page not found',
    title: 'This piece doesn’t exist. Yet.',
    line: 'The link may have changed, or we may be directing it right now.',
    work: 'See the work',
    home: 'Back to home',
    paused: 'Paused',
  },
}

/**
 * 404: el vino en pausa (póster de "wine": la gota suspendida sobre la copa).
 * Sin vídeo ni animación: la imagen congelada es el gesto. noindex.
 */
export function Missing() {
  const lang = useLang()
  const t = copy[lang]
  const wine = getMedia('wine')
  return (
    <>
      <Seo title={t.seo} noindex />
      <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
        {wine && (
          <picture>
            <source type="image/avif" srcSet={wine.poster.avif} />
            <img
              src={wine.poster.jpg}
              alt=""
              width={wine.poster.w}
              height={wine.poster.h}
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_30%] opacity-80"
            />
          </picture>
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,#000_8%,rgb(0_0_0/0.82)_38%,rgb(0_0_0/0.15)_75%,rgb(0_0_0/0.35))]" />
        <p className="type-meta absolute top-[calc(var(--nav-h)+1.25rem)] right-[var(--gutter)] flex items-center gap-2 text-paper">
          <svg width="9" height="11" viewBox="0 0 9 11" aria-hidden="true">
            <rect x="0" y="0" width="3" height="11" rx="0.5" fill="currentColor" />
            <rect x="6" y="0" width="3" height="11" rx="0.5" fill="currentColor" />
          </svg>
          <span>[ {t.paused} · 00:02 ]</span>
        </p>
        <div className="container-x pb-[clamp(3.5rem,10vh,7rem)]">
          <h1 className="type-display max-w-[14ch]">{t.title}</h1>
          <p className="type-lead measure mt-5 text-mute">{t.line}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Cta to={to.work(lang)}>{t.work}</Cta>
            <Cta to={to.home(lang)} variant="text">
              {t.home}
            </Cta>
          </div>
        </div>
      </section>
    </>
  )
}
