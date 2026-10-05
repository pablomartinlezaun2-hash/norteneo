import { useRef } from 'react'
import { useLang, type Lang } from '@/i18n'
import { to } from '@/i18n/paths'
import { Cta } from '@/components/Cta'
import { Logo } from '@/components/Logo'
import { gsap, MQ, SplitText, STAGGER, useGSAP } from '@/lib/motion'
import { ParticleWordmark } from '@/sections/closing/ParticleWordmark'

const copy = {
  es: {
    reveal: 'Ningún plato, copa ni abrigo de esta página pasó por un plató. Todo lo dirigió NEO.',
    imagine: 'Imagina tu marca.',
    cta: 'Solicitar propuesta',
  },
  en: {
    reveal: 'No dish, glass or coat on this page ever touched a set. NEO directed it all.',
    imagine: 'Imagine your brand.',
    cta: 'Request a proposal',
  },
} satisfies Record<Lang, unknown>

/**
 * Revelado "footer fijo que se descubre": solo escritorio con altura suficiente y sin reduced-motion.
 * Debe coincidir con las variantes `[@media(...)]` de las clases de abajo (escritas completas para Tailwind).
 */
const REVEAL_MQ = '(min-width: 64rem) and (min-height: 42rem)'

/**
 * Cierre (peak-end): resuelve el asterisco del hero y deja la última impresión.
 * Detrás, el wordmark NEO de polvo dorado (Canvas 2D) que se aparta con el cursor o el dedo.
 *
 * Escritorio: la capa de contenido es fija y la sección la recorta con clip-path, así que el
 * contenido anterior sube y la descubre (sin pin ni JS de scroll); al llegar el footer, la tapa.
 * Móvil, pantallas bajas y reduced-motion: flujo normal.
 *
 * Titulares: máscara de líneas con los mismos parámetros que useSplitReveal. En el revelado el
 * texto es fijo, así que el disparador es la sección (el hook usa el propio titular como trigger).
 */
export function Closing() {
  const lang = useLang()
  const t = copy[lang]
  const sectionRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLHeadingElement>(null)
  const imagineRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useGSAP(
    (_ctx, contextSafe) => {
      const section = sectionRef.current
      const heads = [revealRef.current, imagineRef.current]
      const cta = ctaRef.current
      if (!section || !cta || heads.some((h) => !h) || !contextSafe) return
      const mm = gsap.matchMedia()

      mm.add({ motion: MQ.motion, reveal: REVEAL_MQ }, (ctx) => {
        const { motion, reveal } = ctx.conditions as { motion: boolean; reveal: boolean }
        if (!motion) {
          gsap.set([...heads, cta], { autoAlpha: 1 })
          return
        }
        const fixed = reveal
        // Fijo: el texto aparece cuando la sección está casi descubierta. En flujo: como useSplitReveal.
        const st = (el: Element) => (fixed ? { trigger: section, start: 'top 12%', once: true } : { trigger: el, start: 'top 85%', once: true })
        const splits = heads.map((el, i) =>
          SplitText.create(el!, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            linesClass: 'split-line',
            onSplit(self) {
              gsap.set(el, { autoAlpha: 1 })
              return gsap.from(self.lines, {
                yPercent: 105,
                duration: 0.8,
                ease: 'expo.out',
                stagger: STAGGER,
                delay: i * 0.12,
                scrollTrigger: st(el!),
              })
            },
          }),
        )
        // El CTA entra con la misma máscara que las líneas (no un fade-up).
        const ctaTween = gsap.from(cta.firstElementChild, {
          yPercent: 130,
          duration: 0.8,
          ease: 'expo.out',
          delay: 0.3,
          scrollTrigger: st(cta),
        })

        // Con la capa fija, el foco por teclado no desplaza la página: llevarla a la vista.
        const onFocus = contextSafe(() => {
          if (!fixed) return
          const r = section.getBoundingClientRect()
          if (Math.abs(r.top) > 2) window.scrollTo({ top: window.scrollY + r.top, behavior: 'auto' })
        })
        section.addEventListener('focusin', onFocus)

        return () => {
          section.removeEventListener('focusin', onFocus)
          ctaTween.kill()
          splits.forEach((s) => s.revert())
        }
      })
      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      aria-labelledby="closing-title"
      className="relative isolate overflow-hidden bg-ink [clip-path:inset(0)] [@media(min-width:64rem)_and_(min-height:42rem)_and_(prefers-reduced-motion:no-preference)]:h-[100svh]"
    >
      <div className="relative flex min-h-[100svh] flex-col [@media(min-width:64rem)_and_(min-height:42rem)_and_(prefers-reduced-motion:no-preference)]:fixed [@media(min-width:64rem)_and_(min-height:42rem)_and_(prefers-reduced-motion:no-preference)]:inset-0 [@media(min-width:64rem)_and_(min-height:42rem)_and_(prefers-reduced-motion:no-preference)]:min-h-0">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <ParticleWordmark slotRef={slotRef} areaRef={sectionRef} />
        </div>

        <div className="container-x flex flex-1 flex-col pt-[calc(var(--nav-h)+12svh)] pb-[max(2.5rem,6svh)] lg:pt-[calc(var(--nav-h)+9svh)]">
          <h2 id="closing-title" ref={revealRef} className="type-display max-w-[24ch]">
            <span className="text-accent" aria-hidden="true">
              *
            </span>
            {t.reveal}
          </h2>
          <div className="mt-8 flex flex-col items-start gap-x-12 gap-y-8 sm:flex-row sm:flex-wrap sm:items-center lg:mt-10">
            <p ref={imagineRef} className="type-display text-mute">
              {t.imagine}
            </p>
            <div ref={ctaRef} className="-m-2 overflow-hidden p-2 sm:mt-0">
              <Cta to={to.contact(lang)}>{t.cta}</Cta>
            </div>
          </div>

          {/* Ranura del wordmark: el canvas forma aquí las partículas (contain, apoyado abajo). Sin JS, el logo vectorial. */}
          <div className="mt-auto flex max-h-[calc(36svh+3rem)] min-h-[8.5rem] flex-1 flex-col pt-12">
            <div ref={slotRef} aria-hidden="true" className="flex min-h-0 flex-1 items-end justify-center">
              <Logo title="" className="h-full w-full opacity-40 [.js_&]:invisible" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
