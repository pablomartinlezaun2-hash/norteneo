import type { ReactNode } from 'react'

/** Metadatos entre corchetes con cifras tabulares: [ Moda · 9:16 · 14 s ] */
export function Meta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`type-meta text-mute ${className}`}>[ {children} ]</span>
}
