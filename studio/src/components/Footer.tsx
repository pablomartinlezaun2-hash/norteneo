import { Link, useLocation } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'
import { alternatePath, to, type LegalId } from '@/i18n/paths'
import { services } from '@/content/services'
import { site, whatsappHref } from '@/content/site'
import { Logo } from './Logo'

const copy = {
  es: {
    tagline: 'Vídeo, 3D y webs de autor con IA, dirigidos con oficio de cine.',
    services: 'Servicios',
    allServices: 'Todos los servicios',
    studio: 'Estudio',
    work: 'Trabajo',
    about: 'El estudio',
    contact: 'Contacto',
    proposal: 'Solicitar propuesta',
    whatsapp: 'WhatsApp',
    newTab: '(se abre en una pestaña nueva)',
    language: 'Idioma',
    legalNav: 'Legal',
    legal: { notice: 'Aviso legal', privacy: 'Privacidad', cookies: 'Cookies' } satisfies Record<LegalId, string>,
    made: 'Hecho en España por NEO Studio',
    home: 'NEO Studio · Inicio',
    waMsg: 'Hola, NEO Studio. Me gustaría hablar de un proyecto.',
  },
  en: {
    tagline: 'AI video, AI 3D and signature websites, directed with a filmmaker’s craft.',
    services: 'Services',
    allServices: 'All services',
    studio: 'Studio',
    work: 'Work',
    about: 'The studio',
    contact: 'Contact',
    proposal: 'Request a proposal',
    whatsapp: 'WhatsApp',
    newTab: '(opens in a new tab)',
    language: 'Language',
    legalNav: 'Legal',
    legal: { notice: 'Legal notice', privacy: 'Privacy', cookies: 'Cookies' } satisfies Record<LegalId, string>,
    made: 'Made in Spain by NEO Studio',
    home: 'NEO Studio · Home',
    waMsg: 'Hi NEO Studio, I’d like to talk about a project.',
  },
} satisfies Record<Lang, unknown>

const LEGAL_ORDER: LegalId[] = ['notice', 'privacy', 'cookies']

const linkCls =
  'inline-flex min-h-11 items-center text-[0.9375rem] text-mute transition-colors duration-300 hover:text-paper lg:min-h-9'
const headCls = 'type-meta mb-3 text-dim'

/**
 * Pie de página global. Sobrio para no competir con el Cierre de la home:
 * en la home el wordmark ya está en partículas justo encima, así que aquí no se repite.
 * Canales vacíos en site.ts (WhatsApp, email, Instagram) se ocultan.
 */
export function Footer() {
  const lang = useLang()
  const t = copy[lang]
  const { pathname } = useLocation()
  const isHome = pathname === to.home(lang) || pathname === `${to.home(lang)}/`
  const wa = whatsappHref(t.waMsg)

  return (
    <footer className="relative border-t border-line bg-ink">
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-12 pt-16 pb-14 md:grid-cols-12 lg:pt-20 lg:pb-16">
        <div className="col-span-2 md:col-span-12 lg:col-span-4">
          {!isHome && (
            <Link to={to.home(lang)} viewTransition aria-label={t.home} className="-m-2 mb-4 inline-block p-2">
              <Logo className="h-[1.05rem] w-auto" />
            </Link>
          )}
          <p className="type-small max-w-[32ch] text-mute">{t.tagline}</p>
        </div>

        <nav aria-labelledby="footer-services" className="col-span-1 md:col-span-4 lg:col-span-3">
          <h2 id="footer-services" className={headCls}>
            {t.services}
          </h2>
          <ul>
            {services.map((s) => (
              <li key={s.id}>
                <Link to={to.service(lang, s.id)} viewTransition className={linkCls}>
                  {s.name[lang]}
                </Link>
              </li>
            ))}
            <li>
              <Link to={to.services(lang)} viewTransition className={`${linkCls} text-paper`}>
                {t.allServices}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-studio" className="col-span-1 md:col-span-4 lg:col-span-2">
          <h2 id="footer-studio" className={headCls}>
            {t.studio}
          </h2>
          <ul>
            <li>
              <Link to={to.work(lang)} viewTransition className={linkCls}>
                {t.work}
              </Link>
            </li>
            <li>
              <Link to={to.studio(lang)} viewTransition className={linkCls}>
                {t.about}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="col-span-2 md:col-span-4 lg:col-span-3">
          <h2 id="footer-contact" className={headCls}>
            {t.contact}
          </h2>
          <ul aria-labelledby="footer-contact">
            <li>
              <Link to={to.contact(lang)} viewTransition className={`${linkCls} text-paper`}>
                {t.proposal}
              </Link>
            </li>
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  {t.whatsapp}
                  <span className="sr-only"> {t.newTab}</span>
                </a>
              </li>
            )}
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className={linkCls}>
                  {site.email}
                </a>
              </li>
            )}
            {site.instagram && (
              <li>
                <a href={site.instagram} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  Instagram
                  <span className="sr-only"> {t.newTab}</span>
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="container-x">
        <div className="flex flex-col gap-4 border-t border-line py-6 md:flex-row md:items-center md:justify-between">
          <span className="type-meta text-dim">[ {t.made} ]</span>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <nav aria-label={t.language}>
              <ul className="-ml-0.5 flex items-center gap-1.5">
                {(['es', 'en'] as const).map((l, i) => (
                  <li key={l} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span aria-hidden="true" className="type-meta text-dim">
                        /
                      </span>
                    )}
                    <Link
                      to={l === lang ? pathname : alternatePath(pathname, l)}
                      hrefLang={l}
                      lang={l}
                      aria-current={l === lang ? 'true' : undefined}
                      className={`type-meta inline-flex min-h-11 items-center px-0.5 transition-colors ${
                        l === lang ? 'text-accent' : 'text-dim hover:text-paper'
                      }`}
                    >
                      {l === 'es' ? 'ES' : 'EN'}
                      <span className="sr-only">{l === 'es' ? ' · Español' : ' · English'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={t.legalNav}>
              <ul className="flex flex-wrap gap-x-6">
                {LEGAL_ORDER.map((id) => (
                  <li key={id}>
                    <Link to={to.legal(lang, id)} viewTransition className="type-meta inline-flex min-h-11 items-center text-dim transition-colors hover:text-paper">
                      {t.legal[id]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
