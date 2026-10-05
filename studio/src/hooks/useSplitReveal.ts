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
        const make = () => {
          if (!alive) return
          let first = true
          split = SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            linesClass: 'split-line',
            onSplit(self) {
              gsap.set(el, { autoAlpha: 1 })
              // El retardo cuenta desde el montaje y solo se aplica en la primera división
              const d = first ? Math.max(0, delay - (performance.now() - t0) / 1000) : 0
              first = false
              return gsap.from(self.lines, {
                yPercent: 105,
                duration: 0.8,
                ease: 'expo.out',
                stagger,
                delay: d,
                scrollTrigger: on === 'scroll' ? { trigger: el, start, once: true } : undefined,
              })
            },
          })
        }
        const fonts = typeof document !== 'undefined' ? document.fonts : undefined
        if (!fonts || fonts.status === 'loaded') make()
        else fonts.ready.then(() => ctx.add(make))
        return () => {
          alive = false
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
