import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Case } from '@/content/cases'
import { Flip, gsap, prefersReducedMotion, useGSAP } from '@/lib/motion'
import { Piece } from './Piece'
import { arrange, caseShape } from './meta'

export type FilmGridHandle = {
  /** Guarda el estado de las piezas antes de filtrar (para el Flip del reordenado) */
  capture: () => void
}

/**
 * Retícula asimétrica de 12 columnas que respeta el formato real de cada pieza
 * (16:9 ancha, 9:16 en marco de móvil, tipográfica). Sin stagger de entrada:
 * solo el reordenado al filtrar se anima con Flip (500 ms, expo.out).
 */
export const FilmGrid = forwardRef<FilmGridHandle, { items: Case[]; flipKey: string }>(function FilmGrid({ items, flipKey }, ref) {
  const gridRef = useRef<HTMLDivElement>(null)
  const state = useRef<Flip.FlipState | null>(null)

  useImperativeHandle(ref, () => ({
    capture() {
      if (!gridRef.current || prefersReducedMotion()) return
      state.current = Flip.getState(gridRef.current.querySelectorAll('[data-piece]'))
    },
  }))

  useGSAP(
    () => {
      const st = state.current
      const el = gridRef.current
      state.current = null
      if (!st || !el) return
      Flip.from(st, {
        targets: el.querySelectorAll('[data-piece]'),
        duration: 0.5,
        ease: 'expo.out',
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'expo.out' }),
      })
    },
    { dependencies: [flipKey], scope: gridRef },
  )

  const placed = arrange(items, caseShape)
  return (
    <div ref={gridRef} className="grid grid-cols-12 gap-x-6 gap-y-16 md:gap-x-10 md:gap-y-24">
      {placed.map(({ item, cls, shape, paired }) => (
        <Piece key={item.slug} c={item} shape={shape} cls={cls} paired={paired} level={4} />
      ))}
    </div>
  )
})
