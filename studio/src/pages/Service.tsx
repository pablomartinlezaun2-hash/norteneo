import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { serviceBySlug, type Service } from '@/content/services'
import { casesFor } from '@/content/cases'
import { site } from '@/content/site'
import { getMedia } from '@/lib/media'
import { details } from '@/content/services/details'
import type { ServiceDetail } from '@/content/services/types'
import { Seo } from '@/components/Seo'
import { DiscoverLink } from '@/components/Cta'
import { LocalNav, type Anchor } from '@/sections/service/LocalNav'
import { ServiceHero } from '@/sections/service/ServiceHero'
import { Chapters } from '@/sections/service/Chapters'
import { Process } from '@/sections/service/Process'
import { Examples } from '@/sections/service/Examples'
import { Specs } from '@/sections/service/Specs'
import { Faq } from '@/sections/service/Faq'
import { Pairs } from '@/sections/service/Pairs'
import { FinalCta } from '@/sections/service/FinalCta'
import { ui } from '@/sections/service/copy'

/**
 * Subpágina de servicio: UNA plantilla, datos por servicio (src/content/services/<id>.ts).
 * Nav local · hero · resumen y tres capítulos (con el momento propio como único pin) · proceso ·
 * ejemplos · ficha técnica · preguntas · combina con · CTA.
 */
export function Component() {
  const { slug = '' } = useParams()
  const service = serviceBySlug(slug)
  if (!service) return <ServiceNotFound />
  return <ServicePage key={service.id} service={service} detail={details[service.id]} />
}

/** Casos que se muestran como ejemplos (máx. 6, primero los que tienen pieza). */
function examplesFor(detail: ServiceDetail) {
  const hasSites = detail.chapters.some((c) => c.kind === 'sites')
  return casesFor(detail.id)
    // Las webs en producción ya se muestran en su capítulo
    .filter((c) => !(hasSites && c.services.includes('websites')))
    .sort((a, b) => Number(!!b.media) - Number(!!a.media))
    .slice(0, 6)
}

function ServicePage({ service, detail }: { service: Service; detail: ServiceDetail }) {
  const lang = useLang()
  const t = ui[lang]
  const sitesChapter = detail.chapters.some((c) => c.kind === 'sites')
  const examples = useMemo(() => examplesFor(detail), [detail])

  const anchors = useMemo<Anchor[]>(() => {
    const list: Anchor[] = [{ id: 'resumen', label: t.overview }]
    if (sitesChapter) list.push({ id: 'ejemplos', label: t.examples })
    list.push({ id: 'proceso', label: t.process })
    if (!sitesChapter && examples.length) list.push({ id: 'ejemplos', label: t.examples })
    list.push({ id: 'preguntas', label: t.faq })
    return list
  }, [t, sitesChapter, examples.length])

  const name = service.name[lang]
  const url = `${site.url.replace(/\/$/, '')}${to.service(lang, service.id)}`
  const jsonLd = [
    {
      '@type': 'Service',
      name,
      serviceType: name,
      description: detail.seo.description[lang],
      url,
      inLanguage: lang,
      provider: { '@type': 'Organization', name: site.name, url: site.url },
    },
    {
      '@type': 'FAQPage',
      inLanguage: lang,
      mainEntity: detail.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q[lang],
        acceptedAnswer: { '@type': 'Answer', text: f.a[lang] },
      })),
    },
  ]

  return (
    <>
      <Seo title={name} description={detail.seo.description[lang]} jsonLd={jsonLd} image={detail.hero ? getMedia(detail.hero.media)?.poster.jpg : undefined} />
      <div className="pt-[var(--nav-h)]">
        <LocalNav service={service} anchors={anchors} />
        <div id="resumen" tabIndex={-1} className="outline-none">
          <ServiceHero service={service} detail={detail} />
          <section aria-label={t.overview} className="container-x py-24 md:py-40">
            <p className="type-title max-w-[30ch]">
              <span className="text-paper">{detail.intro.strong[lang]}</span> <span className="text-mute">{detail.intro.rest[lang]}</span>
            </p>
          </section>
          <Chapters chapters={detail.chapters} examplesAnchor={sitesChapter ? 'ejemplos' : undefined} />
        </div>
        <Process detail={detail} />
        {!sitesChapter && examples.length > 0 && <Examples items={examples} />}
        <Specs specs={detail.specs} />
        <Faq faqs={detail.faqs} />
        <Pairs pairs={detail.pairs} />
        <FinalCta service={service} detail={detail} />
      </div>
    </>
  )
}

function ServiceNotFound() {
  const lang = useLang()
  const t = ui[lang]
  return (
    <>
      <Seo title={t.notFoundTitle} noindex />
      <section className="container-x flex min-h-[80svh] flex-col justify-center pt-[var(--nav-h)]">
        <p className="type-meta text-mute">404</p>
        <h1 className="type-display mt-4 max-w-[16ch]">{t.notFoundTitle}</h1>
        <p className="type-lead mt-5 max-w-[40ch] text-mute">{t.notFoundText}</p>
        <DiscoverLink to={to.services(lang)} className="mt-8">
          {t.allServices}
        </DiscoverLink>
      </section>
    </>
  )
}
