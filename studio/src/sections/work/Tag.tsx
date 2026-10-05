import type { ReactNode } from 'react'

/**
 * Metadato entre corchetes con un tono concreto (Meta compartido usa siempre text-mute;
 * aquí se elige el tono sin clases de color en conflicto).
 */
export function Tag({ children, tone = 'mute', className = '' }: { children: ReactNode; tone?: 'paper' | 'mute' | 'dim'; className?: string }) {
  const color = { paper: 'text-paper', mute: 'text-mute', dim: 'text-dim' }[tone]
  return <span className={`type-meta ${color} ${className}`}>[ {children} ]</span>
}
