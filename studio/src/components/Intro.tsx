import { useEffect } from 'react'
import { Logo } from './Logo'

/**
 * Intro con el logo NEO: ~1,4 s, solo la primera vez por sesión, solo CSS (no bloquea el pintado ni el LCP).
 * Se oculta con reduced-motion y sin JS (ver global.css .neo-intro).
 */
export function Intro() {
  useEffect(() => {
    try {
      sessionStorage.setItem('neo-intro', '1')
    } catch {
      /* modo privado */
    }
  }, [])
  return (
    <div className="neo-intro" aria-hidden="true">
      <Logo />
    </div>
  )
}
