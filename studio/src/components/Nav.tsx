import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useLang } from '@/i18n'
import { alternatePath, to } from '@/i18n/paths'
import { services } from '@/content/services'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/motion'

export const navCopy = {
  es: { work: 'Trabajo', services: 'Servicios', studio: 'Estudio', contact: 'Contacto', cta: 'Propuesta', menu: 'Menú', close: 'Cerrar', skip: 'Saltar al contenido', all: 'Ver todos los servicios', home: 'Inicio' },
  en: { work: 'Work', services: 'Services', studio: 'Studio', contact: 'Contact', cta: 'Proposal', menu: 'Menu', close: 'Close', skip: 'Skip to content', all: 'See all services', home: 'Home' },
}

/**
 * Navegación global: 56 px, transparente sobre el hero y negra con hairline al bajar.
 * Se oculta al bajar y vuelve al subir. Panel de servicios accesible (disclosure).
 */
export function Nav() {
  const lang = useLang()
  const t = navCopy[lang]
  const { pathname, search } = useLocation()
  const ref = useRef<HTMLElement>(null)
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
    setMenu(false)
  }, [pathname])

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate(self) {
          setSolid(self.scroll() > 24)
          const hide = self.direction === 1 && self.scroll() > window.innerHeight * 0.6
          gsap.to(el, { yPercent: hide ? -100 : 0, duration: hide ? 0.35 : 0.5, ease: hide ? 'power2.in' : 'expo.out', overwrite: true })
        },
      })
      return () => st.kill()
    },
    { scope: ref },
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.parentElement?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [open])

  const other = lang === 'es' ? 'en' : 'es'
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-[0.875rem] font-[460] transition-colors hover:text-paper ${isActive ? 'text-paper' : 'text-paper/80'}`

  return (
    <>
      <a href="#main" className="sr-only-focusable fixed top-2 left-2 z-[60] rounded-full bg-paper px-4 py-2 text-ink">
        {t.skip}
      </a>
      <header
        ref={ref}
        className={`fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] transition-[background-color,border-color] duration-300 ${
          solid || open ? 'border-b border-line bg-black/85 backdrop-blur-md' : 'border-b border-transparent bg-transparent'
        }`}
      >
        {/* Velo superior: mantiene el contraste de la nav sobre fotogramas claros del hero */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(var(--nav-h)+0.75rem)] bg-gradient-to-b from-black/60 via-black/30 to-transparent transition-opacity duration-300 ${solid || open ? 'opacity-0' : 'opacity-100'}`}
        />
        <nav className="container-x flex h-full items-center justify-between gap-6" aria-label="Principal">
          <Link to={to.home(lang)} viewTransition className="-m-2 p-2" aria-label={`NEO Studio · ${t.home}`}>
            <Logo className="h-[0.95rem] w-auto" />
          </Link>
          <ul className="hidden items-center gap-8 lg:flex">
            <li>
              <NavLink to={to.work(lang)} className={linkCls} viewTransition>
                {t.work}
              </NavLink>
            </li>
            <li className="relative">
              <button
                type="button"
                aria-expanded={open}
                aria-controls="nav-services"
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 text-[0.875rem] font-[460] transition-colors hover:text-paper ${open ? 'text-paper' : 'text-paper/80'}`}
              >
                {t.services}
                <svg width="9" height="6" viewBox="0 0 9 6" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
                  <path d="m1 1 3.5 3.5L8 1" />
                </svg>
              </button>
            </li>
            <li>
              <NavLink to={to.studio(lang)} className={linkCls} viewTransition>
                {t.studio}
              </NavLink>
            </li>
            <li>
              <NavLink to={to.contact(lang)} className={linkCls} viewTransition>
                {t.contact}
              </NavLink>
            </li>
          </ul>
          <div className="flex items-center gap-4">
            <Link
              to={alternatePath(pathname, other) + search}
              hrefLang={other}
              className="type-meta min-h-11 content-center text-paper/80 hover:text-paper"
              aria-label={other === 'en' ? 'English version' : 'Versión en español'}
            >
              {other.toUpperCase()}
            </Link>
            <Link
              to={to.contact(lang)}
              viewTransition
              className="hidden min-h-9 items-center rounded-full bg-paper px-4 text-[0.8125rem] font-[540] text-ink transition-colors hover:bg-white sm:inline-flex"
            >
              {t.cta}
            </Link>
            <button
              type="button"
              className="min-h-11 text-[0.875rem] font-[480] lg:hidden"
              aria-expanded={menu}
              aria-controls="mobile-menu"
              onClick={() => setMenu(true)}
            >
              {t.menu}
            </button>
          </div>
        </nav>
        {open && (
          <div id="nav-services" ref={panelRef} className="absolute inset-x-0 top-full border-b border-line bg-black/95 backdrop-blur-md">
            <ul className="container-x grid grid-cols-3 gap-x-10 gap-y-6 py-10">
              {services.map((s) => (
                <li key={s.id}>
                  <Link to={to.service(lang, s.id)} viewTransition className="group block">
                    <span className="block text-[1.0625rem] font-[480] text-paper group-hover:text-accent">{s.name[lang]}</span>
                    <span className="type-small block text-mute">{s.line[lang]}</span>
                  </Link>
                </li>
              ))}
              <li className="col-span-3 pt-2">
                <Link to={to.services(lang)} viewTransition className="type-small text-accent hover:underline">
                  {t.all}
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
    </>
  )
}
