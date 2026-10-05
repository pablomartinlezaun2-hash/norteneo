import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { services } from '@/content/services'
import { site, whatsappHref } from '@/content/site'
import { Logo } from './Logo'

/**
 * Pie de página global (versión base). El agente de "Cierre" lo completa con
 * la revelación del asterisco y el wordmark de partículas en la home.
 */
export function Footer() {
  const lang = useLang()
  const wa = whatsappHref()
  const t = {
    es: { services: 'Servicios', studio: 'Estudio', work: 'Trabajo', contact: 'Contacto', legal: 'Aviso legal', privacy: 'Privacidad', cookies: 'Cookies', made: 'Hecho en España por NEO Studio' },
    en: { services: 'Services', studio: 'Studio', work: 'Work', contact: 'Contact', legal: 'Legal notice', privacy: 'Privacy', cookies: 'Cookies', made: 'Made in Spain by NEO Studio' },
  }[lang]
  return (
    <footer className="border-t border-line bg-ink">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <Logo className="h-4 w-auto" />
          <p className="type-small mt-6 max-w-xs text-mute">{site.description[lang]}</p>
        </div>
        <div>
          <h2 className="type-meta mb-4 text-dim">{t.services}</h2>
          <ul className="space-y-2">
            {services.map((s) => (
              <li key={s.id}>
                <Link to={to.service(lang, s.id)} className="type-small text-mute hover:text-paper">
                  {s.name[lang]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="type-meta mb-4 text-dim">{t.studio}</h2>
          <ul className="space-y-2">
            <li><Link to={to.work(lang)} className="type-small text-mute hover:text-paper">{t.work}</Link></li>
            <li><Link to={to.studio(lang)} className="type-small text-mute hover:text-paper">{t.studio}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="type-meta mb-4 text-dim">{t.contact}</h2>
          <ul className="space-y-2">
            <li><Link to={to.contact(lang)} className="type-small text-mute hover:text-paper">{t.contact}</Link></li>
            {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="type-small text-mute hover:text-paper">WhatsApp</a></li>}
            {site.email && <li><a href={`mailto:${site.email}`} className="type-small text-mute hover:text-paper">{site.email}</a></li>}
            {site.instagram && <li><a href={site.instagram} target="_blank" rel="noopener noreferrer" className="type-small text-mute hover:text-paper">Instagram</a></li>}
          </ul>
        </div>
      </div>
      <div className="container-x flex flex-wrap items-center justify-between gap-4 border-t border-line py-6">
        <span className="type-meta text-dim">[ {t.made} ]</span>
        <ul className="flex gap-6">
          <li><Link to={to.legal(lang, 'notice')} className="type-meta text-dim hover:text-paper">{t.legal}</Link></li>
          <li><Link to={to.legal(lang, 'privacy')} className="type-meta text-dim hover:text-paper">{t.privacy}</Link></li>
          <li><Link to={to.legal(lang, 'cookies')} className="type-meta text-dim hover:text-paper">{t.cookies}</Link></li>
        </ul>
      </div>
    </footer>
  )
}
