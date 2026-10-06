import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMagnetic } from '@/hooks/useMagnetic'

type Variant = 'primary' | 'ghost' | 'text' | 'dark'

const styles: Record<Variant, string> = {
  primary:
    'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-paper px-6 text-[0.9375rem] font-[520] text-ink transition-colors hover:bg-white',
  dark: 'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-light-ink px-6 text-[0.9375rem] font-[520] text-light transition-colors hover:bg-black',
  ghost:
    'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line-strong px-6 text-[0.9375rem] font-[480] text-paper transition-colors hover:border-paper',
  text: 'inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap text-[0.9375rem] font-[480] text-paper underline-offset-4 hover:underline',
}

type Props = {
  to: string
  children: ReactNode
  variant?: Variant
  /** Solo 2 CTAs magnéticos en toda la web (hero y cierre) */
  magnetic?: boolean
  className?: string
  external?: boolean
  onClick?: () => void
}

/** Botón-enlace del sistema. Interno con <Link>, externo con <a target=_blank>. */
export function Cta({ to, children, variant = 'primary', magnetic = false, className = '', external, onClick }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  useMagnetic(ref, magnetic ? 0.28 : 0)
  const cls = `${styles[variant]} ${className}`
  const isExternal = external ?? /^(https?:|mailto:|tel:)/.test(to)
  if (isExternal) {
    return (
      <a ref={ref} href={to} className={cls} target={to.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <Link ref={ref} to={to} className={cls} onClick={onClick} viewTransition>
      {children}
    </Link>
  )
}

/** Enlace "Descubrir" en el acento azul con chevron dibujado (no un glifo pegado). */
export function DiscoverLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} viewTransition className={`group inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-[480] text-accent ${className}`}>
      <span className="underline-offset-4 group-hover:underline">{children}</span>
      <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
        <path d="m1 1 5 5-5 5" />
      </svg>
    </Link>
  )
}
