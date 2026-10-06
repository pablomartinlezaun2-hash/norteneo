import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import type { Case } from '@/content/cases'
import { Meta } from '@/components/Meta'
import { domainOf, labels, sectorLabel } from './meta'

/** Icono de enlace externo dibujado (no un glifo pegado al texto). */
export function ExternalIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
      <path d="M3 1h7v7M10 1 1 10" />
    </svg>
  )
}

/** Botón "Visitar web": abre la web real en una pestaña nueva. */
export function VisitLink({ url, className = '', variant = 'ghost' }: { url: string; className?: string; variant?: 'ghost' | 'primary' }) {
  const lang = useLang()
  const sr = lang === 'es' ? '(se abre en una pestaña nueva)' : '(opens in a new tab)'
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/visit inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full text-[0.9375rem] transition-colors ${
        variant === 'primary'
          ? 'bg-paper px-6 font-[520] text-ink hover:bg-white'
          : 'border border-line-strong px-5 font-[480] text-paper hover:border-paper hover:bg-paper hover:text-ink'
      } ${className}`}
    >
      {labels.visit[lang]}
      <ExternalIcon className="transition-transform duration-300 group-hover/visit:translate-x-0.5 group-hover/visit:-translate-y-0.5" />
      <span className="sr-only">{sr}</span>
    </a>
  )
}

/**
 * Webs de clientes en variante tipográfica (las grabaciones de pantalla están pendientes):
 * nombre, dominio, sector y "Visitar web" bien visible. El nombre lleva al caso.
 */
export function WebList({ items }: { items: Case[] }) {
  const lang = useLang()
  return (
    <ul className="border-b border-line">
      {items.map((c) => {
        const sector = sectorLabel(c, lang)
        return (
          <li key={c.slug} className="grid grid-cols-1 items-center gap-x-10 gap-y-4 border-t border-line py-7 md:grid-cols-12 md:py-9">
            <div className="md:col-span-6">
              <h4 className="type-title">
                <Link to={to.case(lang, c.slug)} viewTransition className="decoration-line-strong underline-offset-[0.18em] hover:underline">
                  {c.title}
                </Link>
              </h4>
              <p className="type-meta mt-2 text-dim">{domainOf(c.url)}</p>
            </div>
            <div className="md:col-span-3">
              <p className="type-small text-mute">{c.line[lang]}</p>
              <Meta className="mt-1 inline-block">{[sector, lang === 'es' ? 'Web' : 'Website'].filter(Boolean).join(' · ')}</Meta>
            </div>
            <div className="md:col-span-3 md:justify-self-end">{c.url && <VisitLink url={c.url} />}</div>
          </li>
        )
      })}
    </ul>
  )
}
