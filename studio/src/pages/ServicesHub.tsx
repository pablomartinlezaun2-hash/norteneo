import { useRef } from 'react'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { site } from '@/content/site'
import { services } from '@/content/services'
import { Seo } from '@/components/Seo'
import { Cta } from '@/components/Cta'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { heroDelay } from '@/lib/motion'
import { HouseIndex } from '@/sections/house/HouseIndex'
import { Compare } from '@/sections/house/Compare'
import { hubCopy } from '@/sections/house/copy'

/**
 * Hub /servicios: hero tipográfico, el índice de La Casa (por oficio / por situación),
 * ficha comparativa sin precios y cierre con "Solicitar propuesta".
 */
export function Component() {
  const lang = useLang()
  const t = hubCopy[lang]
  const hero = useRef<HTMLHeadingElement>(null)
  useSplitReveal(hero, { on: 'load', delay: heroDelay() })

  const abs = (p: string) => `${site.url.replace(/\/$/, '')}${p}`
  const jsonLd = {
    '@type': 'ItemList',
    name: t.listName,
    url: abs(to.services(lang)),
    numberOfItems: services.length,
    itemListElement: services.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: s.name[lang],
        description: s.line[lang],
        url: abs(to.service(lang, s.id)),
        provider: { '@type': 'Organization', name: site.name, url: site.url },
      },
    })),
  }

  return (
    <>
      <Seo title={t.seoTitle} description={t.seoDescription} jsonLd={jsonLd} />
      <div className="pt-[var(--nav-h)]">
        <header className="container-x pt-[clamp(4.5rem,11vw,10rem)] pb-[clamp(3.5rem,7vw,6rem)]">
          <h1 ref={hero} data-hero-reveal className="type-hero max-w-[13ch] text-paper">
            {t.title}
          </h1>
          <p className="type-lead measure mt-6 text-mute lg:mt-8">{t.lead}</p>
        </header>

        <section aria-labelledby="hub-index" className="container-x pb-[clamp(6rem,12vw,11rem)]">
          <h2 id="hub-index" className="sr-only">
            {t.indexTitle}
          </h2>
          <HouseIndex />
        </section>

        <section aria-labelledby="hub-compare" className="container-x pb-[clamp(6rem,12vw,11rem)]">
          <div className="mb-10 lg:mb-14">
            <h2 id="hub-compare" className="type-display max-w-[16ch] text-paper">
              {t.compareTitle}
            </h2>
            <p className="type-lead measure mt-5 text-mute">{t.compareLead}</p>
          </div>
          <Compare lang={lang} />
        </section>

        <section aria-labelledby="hub-closing" className="border-t border-line">
          <div className="container-x flex flex-col gap-8 py-[clamp(6rem,12vw,11rem)] lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 id="hub-closing" className="type-display text-paper">
                {t.closingTitle}
              </h2>
              <p className="type-lead measure mt-5 text-mute">{t.closingLead}</p>
            </div>
            <Cta variant="primary" to={to.contact(lang)} className="w-full shrink-0 sm:w-auto">
              {t.cta}
            </Cta>
          </div>
        </section>
      </div>
    </>
  )
}
