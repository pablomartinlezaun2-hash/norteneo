import type { RefObject } from 'react'
import { gsap, MQ, ScrollTrigger, SplitText, STAGGER, useGSAP } from '@/lib/motion'

type Options = {
  /** 'scroll' (por defecto) anima al entrar en pantalla; 'load' anima al montar (hero). */
  on?: 'scroll' | 'load'
  delay?: number
  /** Retardo adicional entre varios titulares de un mismo bloque */
  stagger?: number
  start?: string
}

/**
 * Revela un titular por líneas enmascaradas (SplitText + mask).
 * Uso: const ref = useRef<HTMLHeadingElement>(null); useSplitReveal(ref)
 * - Respeta prefers-reduced-motion (no anima; el texto queda visible).
 * - Con autoSplit re-divide al cambiar el ancho y limpia todo al desmontar.
 * - Para el hero, marca el elemento con data-hero-reveal y usa on: 'load'.
 */
export function useSplitReveal<T extends HTMLElement>(ref: RefObject<T | null>, opts: Options = {}) {
  const { on = 'scroll', delay = 0, stagger = STAGGER, start = 'top 85%' } = opts
  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, (ctx) => {
        // Se divide tras cargar la fuente: así autoSplit no re-divide (y reinicia el retardo) al llegar Archivo.
        const t0 = performance.now()
        let split: SplitText | undefined
        let alive = true
        let io: IntersectionObserver | undefined
        // Primera visita (con intro): si el JS llega cuando la intro ya terminó, el titular ya se ve;
        // animarlo ahora provocaría un parpadeo, así que se queda quieto.
        const introVisit = !document.documentElement.classList.contains('intro-seen')
        const make = () => {
          if (!alive) return
          if (on === 'load' && introVisit && performance.now() > 1400) {
            gsap.set(el, { autoAlpha: 1 })
            return
          }
          let first = true
          split = SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            linesClass: 'split-line',
            // Sin aria-label artificial: el lector de pantalla lee el texto real (sin palabras pegadas ni asteriscos)
            aria: 'none',
            onSplit(self) {
              gsap.set(el, { autoAlpha: 1 })
              // El retardo cuenta desde el montaje y solo se aplica en la primera división
              const d = first ? Math.max(0, delay - (performance.now() - t0) / 1000) : 0
              first = false
              const tween = gsap.from(self.lines, {
                yPercent: 105,
                duration: 0.8,
                ease: 'expo.out',
                stagger,
                delay: d,
                paused: on === 'scroll',
              })
              if (on === 'scroll') {
                // Un IntersectionObserver por titular en vez de un ScrollTrigger: evita recalcular
                // toda la página en cada refresco (bloqueos de CPU en móviles).
                io?.disconnect()
                io = new IntersectionObserver(
                  (entries) => {
                    if (entries.some((e) => e.isIntersecting)) {
                      tween.play()
                      io?.disconnect()
                    }
                  },
                  { rootMargin: startToMargin(start) },
                )
                io.observe(el)
              }
              return tween
            },
          })
        }
        const fonts = typeof document !== 'undefined' ? document.fonts : undefined
        const whenFonts = (fn: () => void) => {
          if (!fonts || fonts.status === 'loaded') fn()
          else fonts.ready.then(() => ctx.add(fn))
        }
        // División perezosa: los titulares que aparecen al hacer scroll se dividen cuando están
        // a una pantalla de distancia. Así la carga inicial no divide todos a la vez (layout thrashing).
        let near: IntersectionObserver | undefined
        if (on === 'load') whenFonts(make)
        else {
          near = new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) {
                near?.disconnect()
                whenFonts(make)
              }
            },
            { rootMargin: '100% 0px 100% 0px' },
          )
          near.observe(el)
        }
        return () => {
          alive = false
          near?.disconnect()
          io?.disconnect()
          split?.revert()
        }
      })
      mm.add(MQ.reduce, () => {
        gsap.set(el, { autoAlpha: 1 })
      })
      return () => mm.revert()
    },
    { dependencies: [] },
  )
}

export { ScrollTrigger }

/** Convierte un start de ScrollTrigger tipo 'top 85%' en rootMargin de IntersectionObserver. */
function startToMargin(start: string): string {
  const m = /top\s+(\d+)%/.exec(start)
  const pct = m ? 100 - Number(m[1]) : 15
  return `0px 0px -${pct}% 0px`
}
