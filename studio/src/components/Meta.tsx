import type { ReactNode } from 'react'

/** Metadatos entre corchetes con cifras tabulares: [ Moda · 9:16 · 14 s ] */
export function Meta({ children, className = '' }: { children: ReactNode; className?: string }) {
  // Espacios duros: el corchete nunca queda solo en una línea
  return <span className={`type-meta text-mute ${className}`}>[{'\u00a0'}{children}{'\u00a0'}]</span>
}
