import type { RefObject } from 'react'
import { gsap, MQ, useGSAP } from '@/lib/motion'

/**
 * Efecto magnético sutil (máx. 2 CTAs en toda la web).
 * Solo con puntero fino y sin reduced-motion. Basado en codrops/MagneticButtons, con gsap.quickTo.
 */
export function useMagnetic<T extends HTMLElement>(ref: RefObject<T | null>, strength = 0.3) {
  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current
      if (!el || !contextSafe) return
      const mm = gsap.matchMedia()
      mm.add(`${MQ.motion} and ${MQ.hover}`, () => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'expo.out' })
        const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'expo.out' })
        const move = contextSafe((e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          xTo((e.clientX - (r.left + r.width / 2)) * strength)
          yTo((e.clientY - (r.top + r.height / 2)) * strength)
        })
        const leave = contextSafe(() => {
          xTo(0)
          yTo(0)
        })
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
        return () => {
          el.removeEventListener('pointermove', move)
          el.removeEventListener('pointerleave', leave)
        }
      })
      return () => mm.revert()
    },
    { dependencies: [strength] },
  )
}
