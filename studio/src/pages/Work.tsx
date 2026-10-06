import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { site } from '@/content/site'
import { sectors, type Case, type SectorId } from '@/content/cases'
import { services, type ServiceId } from '@/content/services'
import { Seo } from '@/components/Seo'
import { Cta } from '@/components/Cta'
import { Meta } from '@/components/Meta'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { heroDelay } from '@/lib/motion'
import { FilmGrid, type FilmGridHandle } from '@/sections/work/FilmGrid'
import { Filters, type WorkFilter } from '@/sections/work/Filters'
import { Piece } from '@/sections/work/Piece'
import { WebList } from '@/sections/work/WebList'
import { caseShape, clientFilms, clientWebs, conceptCases, ownCases } from '@/sections/work/meta'

const copy = {
  es: {
    seo: 'Trabajo',
    desc: 'Webs de autor, vídeo y 3D con IA para marcas reales. Cada pieza en su formato original.',
    title: 'Trabajo.',
    sub: 'Webs, vídeo y 3D para marcas reales. Cada pieza, en su formato original.',
    clients: 'Clientes',
    clientsLine: 'Encargos reales, firmados por NEO.',
    films: 'Vídeo y 3D',
    webs: 'Webs',
    websLine: 'Webs de autor en producción. Ábrelas: están vivas.',
    concept: 'Concepto',
    conceptLine: 'Ejercicio propio, sin encargo ni relación con ninguna marca.',
    own: 'Producto propio',
    ownLine: 'Lo que construimos para nosotros, con el mismo oficio.',
    pieces: (n: number) => (n === 1 ? '1 pieza' : `${n} piezas`),
    websCount: (n: number) => (n === 1 ? '1 web' : `${n} webs`),
    shown: (n: number) => (n === 1 ? 'Se muestra 1 pieza.' : `Se muestran ${n} piezas.`),
    empty: 'Nada con esta combinación, todavía.',
    clear: 'Quitar filtros',
    closeTitle: '¿Tu marca, la siguiente?',
    closeLine: 'Cuéntanos qué necesitas y preparamos una propuesta a medida.',
    cta: 'Solicitar propuesta',
  },
  en: {
    seo: 'Work',
    desc: 'Signature websites, AI video and AI 3D for real brands. Every piece in its original format.',
    title: 'Work.',
    sub: 'Websites, film and 3D for real brands. Every piece in its original format.',
    clients: 'Clients',
    clientsLine: 'Real commissions, signed by NEO.',
    films: 'Film and 3D',
    webs: 'Websites',
    websLine: 'Signature websites, all live. Go ahead and open them.',
    concept: 'Concept',
    conceptLine: 'A self-initiated exercise, not commissioned by or linked to any brand.',
    own: 'Own product',
    ownLine: 'What we build for ourselves, with the same craft.',
    pieces: (n: number) => (n === 1 ? '1 piece' : `${n} pieces`),
    websCount: (n: number) => (n === 1 ? '1 website' : `${n} websites`),
    shown: (n: number) => (n === 1 ? 'Showing 1 piece.' : `Showing ${n} pieces.`),
    empty: 'Nothing with this combination, yet.',
    clear: 'Clear filters',
    closeTitle: 'Your brand, next?',
    closeLine: 'Tell us what you need, and we’ll prepare a tailored proposal.',
    cta: 'Request a proposal',
  },
}

const NONE: WorkFilter = { service: null, sector: null }

function matches(c: Case, f: WorkFilter) {
  return (!f.service || c.services.includes(f.service)) && (!f.sector || c.sector === f.sector)
}

function Block({ title, line, count, children, level = 3 }: { title: string; line?: string; count?: string; children: ReactNode; level?: 2 | 3 }) {
  const H = level === 2 ? 'h2' : 'h3'
  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 md:mb-14">
        <div>
          <H className={level === 2 ? 'type-display' : 'type-title'}>{title}</H>
          {line && <p className="type-small mt-2 text-mute">{line}</p>}
        </div>
        {count && <Meta>{count}</Meta>}
      </div>
      {children}
    </div>
  )
}

/**
 * /trabajo · /en/work: la colección.
 * Clientes (vídeo y 3D + webs), y aparte el concepto no oficial y el producto propio.
 * Filtros por servicio y sector (aria-pressed), sincronizados con ?servicio=&sector=.
 */
export function Component() {
  const lang = useLang()
  const t = copy[lang]
  const h1 = useRef<HTMLHeadingElement>(null)
  useSplitReveal(h1, { on: 'load', delay: heroDelay() })
  const grid = useRef<FilmGridHandle>(null)
  const [filter, setFilter] = useState<WorkFilter>(NONE)

  // Filtro inicial desde la URL (después de montar, para no romper la hidratación)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const svc = q.get('servicio') ?? q.get('service')
    const sec = q.get('sector')
    const service = services.find((s) => s.id === svc || s.slug.es === svc || s.slug.en === svc)?.id ?? null
    const sector = sec && sec in sectors ? (sec as SectorId) : null
    if (service || sector) setFilter({ service, sector })
  }, [])

  // La query pasa por el router (no por history.replaceState) para que el resto de la app,
  // p. ej. el selector ES/EN, conozca el filtro aplicado.
  const [, setParams] = useSearchParams()
  const change = (next: WorkFilter) => {
    grid.current?.capture()
    setFilter(next)
    const q = new URLSearchParams(window.location.search)
    q.delete('service')
    if (next.service) q.set('servicio', next.service as ServiceId)
    else q.delete('servicio')
    if (next.sector) q.set('sector', next.sector)
    else q.delete('sector')
    setParams(q, { replace: true, preventScrollReset: true })
  }

  const films = clientFilms.filter((c) => matches(c, filter))
  const webs = clientWebs.filter((c) => matches(c, filter))
  const concept = conceptCases.filter((c) => matches(c, filter))
  const own = ownCases.filter((c) => matches(c, filter))
  const total = films.length + webs.length + concept.length + own.length
  const filtered = filter.service !== null || filter.sector !== null
  const flipKey = `${filter.service ?? '-'}|${filter.sector ?? '-'}`

  const jsonLd = {
    '@type': 'CollectionPage',
    name: `${t.seo} · ${site.name}`,
    url: `${site.url}${to.work(lang)}`,
    inLanguage: lang,
    hasPart: [...clientFilms, ...clientWebs, ...conceptCases, ...ownCases].map((c) => ({
      '@type': 'CreativeWork',
      name: c.title,
      url: `${site.url}${to.case(lang, c.slug)}`,
    })),
  }

  return (
    <>
      <Seo title={t.seo} description={t.desc} jsonLd={jsonLd} />

      <header className="container-x pt-[calc(var(--nav-h)+clamp(4rem,12vw,9rem))] pb-12 md:pb-16">
        <h1 ref={h1} data-hero-reveal className="type-hero">
          {t.title}
        </h1>
        <p className="type-lead measure mt-6 text-mute md:mt-8">{t.sub}</p>
      </header>

      <div className="container-x">
        {/* Sin JS los chips no harían nada: los filtros solo se muestran con .js */}
        <div className="hidden border-y border-line py-3 [.js_&]:block">
          <Filters value={filter} onChange={change} />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {filtered ? t.shown(total) : ''}
      </p>

      {total === 0 && (
        <div className="container-x py-24 text-center md:py-32">
          <p className="type-title">{t.empty}</p>
          <button type="button" onClick={() => change(NONE)} className="mt-6 inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
            {t.clear}
          </button>
        </div>
      )}

      {(films.length > 0 || webs.length > 0) && (
        <section aria-labelledby="work-clients" className="container-x pt-16 md:pt-24">
          <div className="mb-14 md:mb-20">
            <h2 id="work-clients" className="type-display">
              {t.clients}
            </h2>
            <p className="type-lead mt-3 text-mute">{t.clientsLine}</p>
          </div>
          <div className="flex flex-col gap-24 md:gap-36">
            {films.length > 0 && (
              <Block title={t.films} count={t.pieces(films.length)}>
                <FilmGrid ref={grid} items={films} flipKey={flipKey} />
              </Block>
            )}
            {webs.length > 0 && (
              <Block title={t.webs} line={t.websLine} count={t.websCount(webs.length)}>
                <WebList items={webs} />
              </Block>
            )}
          </div>
        </section>
      )}

      {(concept.length > 0 || own.length > 0) && (
        <div className="container-x mt-24 grid grid-cols-1 gap-24 border-t border-line pt-16 md:mt-36 md:grid-cols-2 md:gap-10 md:pt-24">
          {concept.length > 0 && (
            <section aria-labelledby="work-concept">
              <h2 id="work-concept" className="type-title">
                {t.concept}
              </h2>
              <p className="type-small mt-2 mb-10 text-mute">{t.conceptLine}</p>
              <div className="grid grid-cols-12">
                {concept.map((c) => (
                  <Piece key={c.slug} c={c} shape={caseShape(c)} />
                ))}
              </div>
            </section>
          )}
          {own.length > 0 && (
            <section aria-labelledby="work-own" className={concept.length === 0 ? 'md:col-start-2' : ''}>
              <h2 id="work-own" className="type-title">
                {t.own}
              </h2>
              <p className="type-small mt-2 mb-10 text-mute">{t.ownLine}</p>
              <div className="grid grid-cols-12">
                {own.map((c) => (
                  <Piece key={c.slug} c={c} shape={caseShape(c)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <section className="container-x mt-28 border-t border-line py-24 md:mt-40 md:py-32">
        <h2 className="type-display">{t.closeTitle}</h2>
        <p className="type-lead measure mt-5 text-mute">{t.closeLine}</p>
        <Cta to={to.contact(lang)} className="mt-10">
          {t.cta}
        </Cta>
      </section>
    </>
  )
}
