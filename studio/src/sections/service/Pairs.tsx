import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { serviceById } from '@/content/services'
import type { Pair } from '@/content/services/types'
import { ui } from './copy'

/** "Combina con": dos oficios relacionados, como enlaces tipográficos con una frase (sin tarjetas). */
export function Pairs({ pairs }: { pairs: Pair[] }) {
  const lang = useLang()
  const t = ui[lang]
  return (
    <section aria-labelledby="combina-title" className="border-t border-line">
      <div className="container-x py-24 md:py-32">
        <h2 id="combina-title" className="type-meta text-mute">
          {t.pairs}
        </h2>
        <ul className="mt-8 grid gap-12 md:grid-cols-2 md:gap-10">
          {pairs.map((p) => {
            const s = serviceById(p.id)
            return (
              <li key={p.id}>
                <Link to={to.service(lang, p.id)} viewTransition className="group block">
                  <span className="type-display block underline-offset-[0.12em] group-hover:underline group-hover:decoration-1">{s.name[lang]}</span>
                  <span className="type-lead mt-4 block max-w-[34ch] text-mute">{p.line[lang]}</span>
                  <span className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-[480] text-accent">
                    {t.discover}
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                      <path d="m1 1 5 5-5 5" />
                    </svg>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
