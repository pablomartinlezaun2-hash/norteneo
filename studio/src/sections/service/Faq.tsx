import { useLang } from '@/i18n'
import type { Faq as FaqItem } from '@/content/services/types'
import { anchorOffset, dashedTop, ui } from './copy'

/** Preguntas con <details>/<summary> nativos (funcionan sin JS; solo la apertura nativa, sin animación). */
export function Faq({ faqs }: { faqs: FaqItem[] }) {
  const lang = useLang()
  const t = ui[lang]
  return (
    <section id="preguntas" tabIndex={-1} aria-labelledby="preguntas-title" className={`border-t border-line outline-none ${anchorOffset}`}>
      <div className="container-x grid gap-12 py-24 md:py-36 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <p className="type-meta text-mute">{t.faq}</p>
          <h2 id="preguntas-title" className="type-display mt-4">
            {t.faqTitle}
          </h2>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          {faqs.map((f, i) => (
            <details key={i} style={dashedTop} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                <span className="type-lead text-paper">{f.q[lang]}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className="mt-2 shrink-0 text-mute group-open:rotate-45">
                  <path d="M7 1v12M1 7h12" />
                </svg>
              </summary>
              <p className="type-body measure pb-7 text-mute">{f.a[lang]}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
