import type { ReactNode } from 'react'
import { Meta } from '@/components/Meta'
import { anchorOffset } from './copy'

/** Afirmación + texto + prueba de un capítulo. Quieto a propósito (sin fade-up). */
export function ChapterHead({
  id,
  claim,
  text,
  proof,
  children,
  className = '',
}: {
  id: string
  claim: string
  text: string
  proof?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <h2 id={id} className="type-display max-w-[18ch] whitespace-pre-line">
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

/** Contenedor de un capítulo: una idea por pantalla en escritorio. */
export function ChapterShell({ labelledBy, children, className = '', id }: { labelledBy: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} tabIndex={id ? -1 : undefined} aria-labelledby={labelledBy} className={`outline-none ${id ? anchorOffset : ''} ${className}`}>
      <div className="container-x flex flex-col justify-center py-24 md:py-32 lg:min-h-[100svh]">{children}</div>
    </section>
  )
}
