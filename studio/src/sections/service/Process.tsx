import { useLang } from '@/i18n'
import type { ServiceDetail } from '@/content/services/types'
import { anchorOffset, dashedTop, ui } from './copy'

/** Proceso en texto corrido (Brief · Dirección · Producción · Entrega) y entregables. Sin tarjetas ni numeración. */
export function Process({ detail }: { detail: ServiceDetail }) {
  const lang = useLang()
  const t = ui[lang]
  return (
    <section id="proceso" tabIndex={-1} aria-labelledby="proceso-title" className={`border-t border-line outline-none ${anchorOffset}`}>
      <div className="container-x grid gap-12 py-24 md:py-36 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <p className="type-meta text-mute">{t.process}</p>
          <h2 id="proceso-title" className="type-display mt-4">
            {t.processTitle}
          </h2>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <div className="measure space-y-7">
            {detail.process.steps.map((s, i) => (
              <p key={i} className="type-lead text-mute">
                <span className="font-[520] text-paper">{t.verbs[i]}.</span> {s.text[lang]}
              </p>
            ))}
          </div>
          <h3 className="type-meta mt-16 text-paper">{t.deliverables}</h3>
          <ul className="mt-4 grid sm:grid-cols-2 sm:gap-x-10">
            {detail.process.deliverables.map((d, i) => (
              <li key={i} style={dashedTop} className="type-body py-4">
                {d[lang]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
