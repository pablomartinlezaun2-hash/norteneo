import { useLang } from '@/i18n'
import type { Spec } from '@/content/services/types'
import { dashedTop, displaySide, ui } from './copy'

/** Ficha técnica (las "Especificaciones" de Apple): pares etiqueta/valor con hairlines discontinuas. */
export function Specs({ specs }: { specs: Spec[] }) {
  const lang = useLang()
  const t = ui[lang]
  return (
    <section aria-labelledby="ficha-title" className="border-t border-line">
      <div className="container-x grid gap-12 py-24 md:py-36 lg:grid-cols-12 lg:gap-10">
        <h2 id="ficha-title" className={`${displaySide} lg:col-span-5`}>
          {t.specs}
        </h2>
        <dl className="lg:col-span-6 lg:col-start-7">
          {specs.map((s, i) => (
            <div key={i} style={dashedTop} className="grid gap-1 py-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8">
              <dt className="type-body text-mute">{s.label[lang]}</dt>
              <dd className="type-body text-paper">{s.value[lang]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
