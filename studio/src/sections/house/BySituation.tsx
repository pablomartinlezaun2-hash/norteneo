import { useId, useRef, useState } from 'react'
import type { Lang } from '@/i18n'
import { to } from '@/i18n/paths'
import { serviceById, services } from '@/content/services'
import { Meta } from '@/components/Meta'
import { DiscoverLink } from '@/components/Cta'
import { Flip, gsap, prefersReducedMotion, useGSAP } from '@/lib/motion'
import { ProposeLink } from './ByCraft'
import { houseCopy, situations, type SituationId } from './copy'

type FlipState = ReturnType<typeof Flip.getState>

/**
 * "Por situación": 5 radios accesibles (filas ≥56 px) y 1–2 oficios recomendados.
 * Los 6 resultados existen siempre en el DOM; los que no aplican van en display:none
 * para que Flip pueda recolocar los que se quedan y fundir los que entran y salen.
 * Reduced-motion: cambio instantáneo, sin Flip.
 */
export function BySituation({ lang }: { lang: Lang }) {
  const t = houseCopy[lang]
  const uid = useId()
  const scope = useRef<HTMLDivElement>(null)
  const pending = useRef<FlipState | null>(null)
  const [sid, setSid] = useState<SituationId>(situations[0].id)
  // La situación anterior conserva el texto de los resultados que salen mientras se funden
  const [prevSid, setPrevSid] = useState<SituationId>(sid)
  const situation = situations.find((s) => s.id === sid)!
  const previous = situations.find((s) => s.id === prevSid)!

  const choose = (id: SituationId) => {
    if (id === sid) return
    const items = scope.current?.querySelectorAll('[data-pick]')
    if (items && !prefersReducedMotion()) pending.current = Flip.getState(items)
    setPrevSid(sid)
    setSid(id)
  }

  useGSAP(
    () => {
      const state = pending.current
      if (!state) {
        gsap.set('[data-pick]', { clearProps: 'opacity,visibility,transform' })
        return
      }
      pending.current = null
      Flip.from(state, {
        duration: 0.5,
        ease: 'expo.out',
        absoluteOnLeave: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out', delay: 0.08 }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, duration: 0.3, ease: 'expo.out' }),
      })
    },
    { scope, dependencies: [sid] },
  )

  const names = situation.picks.map((p) => serviceById(p.id).name[lang]).join(t.and)

  return (
    <div ref={scope} className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
      <fieldset className="lg:col-span-5">
        <legend className="type-lead mb-6 text-mute">{t.legend}</legend>
        <div>
          {situations.map((s) => (
            <label key={s.id} className="group relative flex min-h-14 cursor-pointer items-center gap-4 py-3">
              <span aria-hidden="true" className="hairline-dashed absolute inset-x-0 top-0" />
              <input
                type="radio"
                name={`${uid}-situation`}
                value={s.id}
                checked={sid === s.id}
                onChange={() => choose(s.id)}
                className="size-[1.125rem] shrink-0 cursor-pointer appearance-none rounded-full border border-line-strong transition-[background-color,border-color,box-shadow] duration-300 checked:border-accent checked:bg-accent checked:shadow-[inset_0_0_0_4px_var(--color-ink)]"
              />
              <span className="type-lead text-mute transition-colors duration-300 group-hover:text-paper group-has-checked:text-paper">
                {s.label[lang]}
              </span>
            </label>
          ))}
          <span aria-hidden="true" className="hairline-dashed block" />
        </div>
      </fieldset>

      <div className="lg:col-span-6 lg:col-start-7">
        <p className="type-lead mb-6 text-mute">{t.suggest}</p>
        <p className="sr-only" aria-live="polite">
          {t.announce(names)}
        </p>
        <div className="relative flex flex-col">
          {services.map((svc) => {
            const idx = situation.picks.findIndex((p) => p.id === svc.id)
            const pick = situation.picks[idx]
            const why = (pick ?? previous.picks.find((p) => p.id === svc.id))?.why[lang]
            return (
              <article
                key={svc.id}
                data-pick={svc.id}
                data-flip-id={svc.id}
                className="relative grid gap-3 py-7 lg:py-8"
                style={{ order: idx, display: pick ? undefined : 'none' }}
              >
                <span aria-hidden="true" className="hairline-dashed absolute inset-x-0 top-0" />
                <div className="flex items-baseline justify-between gap-6">
                  <h3 className="type-title text-paper">{svc.name[lang]}</h3>
                  <Meta className="shrink-0">{svc.format[lang]}</Meta>
                </div>
                <p className="type-lead measure text-mute">{why}</p>
                <div className="flex flex-wrap items-center gap-x-7">
                  <DiscoverLink to={to.service(lang, svc.id)}>
                    {t.discover}
                    <span className="sr-only"> {svc.name[lang]}</span>
                  </DiscoverLink>
                  <ProposeLink lang={lang} service={svc} />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
