import type { ReactNode } from 'react'
import { Meta } from '@/components/Meta'
import { displaySide } from './copy'

/**
 * Afirmación + texto + prueba de un capítulo. Quieto a propósito (sin fade-up).
 * `compact`: la cabecera vive en una columna (5–6 de 12) junto a la pieza; el titular baja un escalón
 * en escritorio para no partirse en escalera.
 */
export function ChapterHead({
  id,
  claim,
  text,
  proof,
  children,
  compact = false,
  className = '',
}: {
  id: string
  claim: string
  text: string
  proof?: string
  children?: ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <h2 id={id} className={`${compact ? displaySide : 'type-display'} max-w-[18ch] whitespace-pre-line`}>
        {claim}
      </h2>
      <p className="type-lead measure mt-6 text-mute">{text}</p>
      {proof && (
        <p className="mt-6">
          <Meta>{proof}</Meta>
        </p>
      )}
      {children}
    </div>
  )
}

/**
 * Contenedor de un capítulo. Ritmo vertical fijo, igual que el resto de secciones:
 * solo el capítulo con pin (ScrubChapter) ocupa la pantalla entera.
 */
export function ChapterShell({ labelledBy, children, className = '', id }: { labelledBy: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} tabIndex={id ? -1 : undefined} aria-labelledby={labelledBy} className={`outline-none ${className}`}>
      <div className="container-x py-24 md:py-32 lg:py-36">{children}</div>
    </section>
  )
}
