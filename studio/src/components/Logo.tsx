import { useId } from 'react'

/**
 * Wordmark NEO redibujado en vector a partir de la animación del logo de Pablo:
 * sans geométrica de trazo fino, muy espaciada, con brillo metálico.
 */
export function Logo({ className = '', title = 'NEO Studio' }: { className?: string; title?: string }) {
  const gid = useId()
  return (
    <svg viewBox="-3 -3 374 106" className={className} role="img" aria-label={title} fill="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e9e9ee" />
          <stop offset="1" stopColor="#b9b9c0" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gid})`} strokeWidth="4.2" strokeLinecap="butt" strokeLinejoin="miter">
        {/* N */}
        <path d="M2 100V2l72 96V0" />
        {/* E */}
        <path d="M207 2.1H153.1V97.9H207M153.1 50H202" />
        {/* O */}
        <ellipse cx="321" cy="50" rx="44" ry="48" />
      </g>
    </svg>
  )
}
