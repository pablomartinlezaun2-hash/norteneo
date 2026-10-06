import { useState } from 'react'
import type { Lang } from '@/i18n'
import { to } from '@/i18n/paths'
import { services, serviceById, type Service, type ServiceId } from '@/content/services'
import { Meta } from '@/components/Meta'
import { DiscoverLink } from '@/components/Cta'
import { ProposeLink } from './ByCraft'
import { compare, compareRows, houseCopy, hubCopy, type CompareKey } from './copy'

/** Hairline discontinua como fondo (sirve en celdas de tabla, donde no cabe un <div>). */
const dashedTop = 'bg-[linear-gradient(to_right,var(--color-line-strong)_50%,transparent_0)] bg-[length:6px_1px] bg-top bg-repeat-x'

function cell(s: Service, key: CompareKey, lang: Lang) {
  if (key === 'format') return <Meta className="text-paper">{s.format[lang]}</Meta>
  return compare[s.id][key][lang]
}

/**
 * Ficha comparativa estilo "Comparar modelos", sin precios.
 * Escritorio (y sin JS): tabla de 6 columnas con hairlines discontinuas.
 * Móvil con JS: dos selectores nativos para comparar 2 oficios lado a lado.
 */
export function Compare({ lang }: { lang: Lang }) {
  const t = hubCopy[lang]
  const h = houseCopy[lang]
  const [pair, setPair] = useState<[ServiceId, ServiceId]>(['ai-video', 'websites'])
  const chosen = pair.map(serviceById)

  return (
    <>
      {/* Tabla: escritorio, y también en móvil si no hay JS (con scroll horizontal propio) */}
      <div className="overflow-x-auto max-lg:in-[.js]:hidden">
        <table className="w-full min-w-[56rem] table-fixed border-collapse text-left">
          <caption className="sr-only">{t.compareCaption}</caption>
          <colgroup>
            <col className="w-[11%]" />
            {services.map((s) => (
              <col key={s.id} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <td />
              {services.map((s) => (
                <th key={s.id} scope="col" className="pr-6 pb-8 align-bottom font-normal">
                  <span className="type-lead block font-[460] text-paper">{s.name[lang]}</span>
                  <DiscoverLink to={to.service(lang, s.id)} className="mt-1">
                    {h.discover}
                    <span className="sr-only"> {s.name[lang]}</span>
                  </DiscoverLink>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareRows.map((r) => (
              <tr key={r.id}>
                <th scope="row" className={`type-meta py-6 pr-6 align-top font-[450] text-mute ${dashedTop}`}>
                  {r.label[lang]}
                </th>
                {services.map((s) => (
                  <td key={s.id} className={`type-small py-6 pr-6 align-top text-mute ${dashedTop}`}>
                    {cell(s, r.id, lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className={dashedTop} />
              {services.map((s) => (
                <td key={s.id} className={`pt-4 pr-6 align-top ${dashedTop}`}>
                  <ProposeLink lang={lang} service={s} />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Móvil con JS: comparar 2 oficios */}
      <div className="hidden max-lg:in-[.js]:block">
        <div className="grid grid-cols-2 gap-x-4">
          {[0, 1].map((i) => {
            const other = pair[1 - i]
            return (
              <label
                key={i}
                className="relative flex min-h-12 items-end justify-between gap-2 border-b border-line-strong pb-2 has-[select:focus-visible]:rounded-sm has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-4 has-[select:focus-visible]:outline-accent"
              >
                <span className="sr-only">{i === 0 ? t.compareA : t.compareB}</span>
                {/* Texto visible que puede partir en dos líneas; el <select> nativo va encima, transparente */}
                <span aria-hidden="true" className="type-body font-[480] text-paper">
                  {chosen[i].name[lang]}
                </span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true" className="mb-2 shrink-0 text-mute">
                  <path d="m1 1 4 4 4-4" />
                </svg>
                <select
                  value={pair[i]}
                  onChange={(e) => {
                    const value = e.target.value as ServiceId
                    const next = [...pair] as [ServiceId, ServiceId]
                    // Nunca dos columnas iguales: si llega el oficio de la otra columna (la opción va
                    // deshabilitada, pero algún lector o automatización puede forzarla), se intercambian.
                    if (value === other) next[1 - i] = pair[i]
                    next[i] = value
                    setPair(next)
                  }}
                  className="absolute inset-0 size-full cursor-pointer appearance-none bg-ink text-paper opacity-0"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.id === other}>
                      {s.name[lang]}
                    </option>
                  ))}
                </select>
              </label>
            )
          })}
        </div>

        <dl className="mt-8" aria-live="polite">
          {compareRows.map((r) => (
            <div key={r.id} className={`grid grid-cols-2 gap-x-4 py-5 ${dashedTop}`}>
              <dt className="type-meta col-span-2 mb-3 text-mute">{r.label[lang]}</dt>
              {chosen.map((s, i) => (
                <dd key={i} className="type-small text-mute">
                  <span className="sr-only">{s.name[lang]}: </span>
                  {cell(s, r.id, lang)}
                </dd>
              ))}
            </div>
          ))}
        </dl>
        <div aria-hidden="true" className="hairline-dashed" />
        <div className="grid grid-cols-2 gap-x-4 pt-3">
          {chosen.map((s, i) => (
            <div key={i} className="grid justify-items-start">
              <DiscoverLink to={to.service(lang, s.id)}>
                {h.discover}
                <span className="sr-only"> {s.name[lang]}</span>
              </DiscoverLink>
              <ProposeLink lang={lang} service={s} className="-mt-2" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
