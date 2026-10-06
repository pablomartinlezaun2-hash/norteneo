import { useSyncExternalStore } from 'react'
import { MQ } from '@/lib/motion'

type Conn = { saveData?: boolean; effectiveType?: string }
type Nav = Navigator & { connection?: Conn; deviceMemory?: number }

/** Save-Data, 2G/3G o poca memoria: mejor fotogramas fijos que 150 imágenes en un pin. */
function isLite(): boolean {
  const nav = navigator as Nav
  const c = nav.connection
  if (c?.saveData) return true
  if (c?.effectiveType && /(^|-)(2g|3g)$/.test(c.effectiveType)) return true
  return typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4
}

function subscribe(cb: () => void) {
  const mql = window.matchMedia(MQ.reduce)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

/**
 * ¿Se puede hacer el scroll-scrub con pin?
 * - Servidor / sin JS: false (se pinta la variante de fotogramas fijos, completa y legible).
 * - Cliente: true salvo prefers-reduced-motion, Save-Data, 2G/3G o deviceMemory < 4.
 */
export function useScrubMode(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !window.matchMedia(MQ.reduce).matches && !isLite(),
    () => false,
  )
}

/** Timecode HH:MM:SS:FF a 60 fps. */
export const FPS = 60
export function timecode(frame: number): string {
  const f = Math.max(0, Math.round(frame))
  const pad = (n: number) => String(n).padStart(2, '0')
  const ss = Math.floor(f / FPS)
  return `00:${pad(Math.floor(ss / 60))}:${pad(ss % 60)}:${pad(f % FPS)}`
}
