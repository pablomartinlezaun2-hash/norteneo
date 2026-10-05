import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { site, whatsappHref } from '@/content/site'
import { Seo } from '@/components/Seo'
import { Brief } from '@/sections/contact/Brief'
import { briefCopy } from '@/sections/contact/copy'

/** Vías directas (WhatsApp y email, solo si existen) y nota de privacidad. */
function Direct({ className = '' }: { className?: string }) {
  const lang = useLang()
  const t = briefCopy[lang]
  const wa = whatsappHref(t.whatsappMsg)
  const hasDirect = Boolean(wa || site.email)
  return (
    <div className={className}>
      {hasDirect && (
        <div className="mt-12 border-t border-line pt-6">
          <p className="type-small text-dim">{t.direct}</p>
          <ul className="mt-2 flex flex-col">
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[1.0625rem] text-paper underline-offset-4 hover:underline">
                  {t.whatsapp}
                </a>
              </li>
            )}
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center text-[1.0625rem] break-all text-paper underline-offset-4 hover:underline">
                  {site.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
      <p className="type-small mt-8 text-dim">
        {t.privacyNote}{' '}
        <Link to={to.legal(lang, 'privacy')} viewTransition className="text-mute underline underline-offset-4 hover:text-paper">
          {t.privacyLink}
        </Link>
      </p>
    </div>
  )
}

/**
 * /contacto · /en/contact: brief guiado en 5 pasos.
 * Vías alternativas visibles (WhatsApp y email, solo si existen). Sin burbuja flotante.
 */
export function Component() {
  const lang = useLang()
  const t = briefCopy[lang]
  const jsonLd = {
    '@type': 'ContactPage',
    name: `${t.seo} · ${site.name}`,
    url: `${site.url}${to.contact(lang)}`,
    inLanguage: lang,
    mainEntity: {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
      ...(site.email ? { email: site.email } : {}),
      ...(site.whatsapp ? { contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: `+${site.whatsapp}`, availableLanguage: ['es', 'en'] } } : {}),
    },
  }

  return (
    <>
      <Seo title={t.seo} description={t.desc} jsonLd={jsonLd} />
      <div className="container-x grid gap-14 pt-[calc(var(--nav-h)+clamp(3rem,9vw,7rem))] pb-24 md:pb-36 lg:grid-cols-12 lg:gap-10">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
            <h1 className="type-display">{t.title}</h1>
            <p className="type-lead mt-6 max-w-[34ch] text-mute">{t.sub}</p>

            <Direct className="hidden lg:block" />
          </div>
        </aside>

        <section className="lg:col-span-7 lg:col-start-6">
          <Brief />
        </section>
        <Direct className="lg:hidden" />
      </div>
    </>
  )
}
