import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useLang } from '@/i18n'
import { alternatePath, to } from '@/i18n/paths'
import { services } from '@/content/services'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/motion'

export const navCopy = {
  es: { work: 'Trabajo', services: 'Servicios', studio: 'Estudio', contact: 'Contacto', cta: 'Propuesta', menu: 'Menú', close: 'Cerrar', skip: 'Saltar al contenido', all: 'Ver todos los servicios', home: 'Inicio', main: 'Principal' },
  en: { work: 'Work', services: 'Services', studio: 'Studio', contact: 'Contact', cta: 'Proposal', menu: 'Menu', close: 'Close', skip: 'Skip to content', all: 'See all services', home: 'Home', main: 'Main' },
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
  const servicesBtnRef = useRef<HTMLButtonElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  // En las páginas de servicio la nav local ya lleva su píldora: no la duplicamos
  const onServicePage = /^\/(en\/services|servicios)\/[^/]+/.test(pathname)

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        servicesBtnRef.current?.focus()
      }
    }
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
          className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(var(--nav-h)+2rem)] bg-gradient-to-b from-black/75 via-black/40 to-transparent transition-opacity duration-300 ${solid || open ? 'opacity-0' : 'opacity-100'}`}
        />
        <nav className="container-x flex h-full items-center justify-between gap-6" aria-label={t.main}>
          <Link to={to.home(lang)} viewTransition className="-mx-2 inline-flex min-h-11 items-center px-2" aria-label={`NEO Studio · ${t.home}`}>
            <Logo className="h-[0.95rem] w-auto" />
          </Link>
          <ul className="hidden items-center gap-8 lg:flex">
            <li>
              <NavLink to={to.work(lang)} className={linkCls} viewTransition>
                {t.work}
              </NavLink>
            </li>
            <li
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
              }}
            >
              {/* Sin JS: enlace directo al hub de servicios */}
              <Link to={to.services(lang)} className={`text-[0.875rem] font-[460] text-paper/80 hover:text-paper [.js_&]:hidden`}>
                {t.services}
              </Link>
              <button
                ref={servicesBtnRef}
                type="button"
                aria-expanded={open}
                aria-controls="nav-services"
                onClick={() => setOpen((v) => !v)}
                className={`hidden min-h-11 items-center gap-1.5 text-[0.875rem] font-[460] transition-colors hover:text-paper [.js_&]:inline-flex ${open ? 'text-paper' : 'text-paper/80'}`}
              >
                {t.services}
                <svg width="9" height="6" viewBox="0 0 9 6" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
                  <path d="m1 1 3.5 3.5L8 1" />
                </svg>
              </button>
              {/* El panel va justo después del botón: el orden de tabulación es lógico */}
              <div
                id="nav-services"
                ref={panelRef}
                hidden={!open}
                className="fixed inset-x-0 top-[var(--nav-h)] border-b border-line bg-black/95 backdrop-blur-md"
              >
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
              className="type-meta inline-flex min-h-11 min-w-11 items-center justify-center text-paper/80 hover:text-paper"
              aria-label={other === 'en' ? 'English version' : 'Versión en español'}
            >
              {other.toUpperCase()}
            </Link>
            {!onServicePage && (
              <Link
                to={to.contact(lang)}
                viewTransition
                className="relative hidden min-h-9 items-center rounded-full bg-paper px-4 text-[0.8125rem] font-[540] text-ink transition-colors before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:bg-white sm:inline-flex"
              >
                {t.cta}
              </Link>
            )}
            {/* Sin JS: "Menú" lleva al pie, que contiene toda la navegación */}
            <a href="#site-footer" className="inline-flex min-h-11 min-w-11 items-center justify-center text-[0.875rem] font-[480] lg:hidden [.js_&]:hidden">
              {t.menu}
            </a>
            <button
              ref={menuBtnRef}
              type="button"
              className="hidden min-h-11 min-w-11 items-center justify-center text-[0.875rem] font-[480] [.js_&]:inline-flex lg:[.js_&]:hidden"
              aria-expanded={menu}
              aria-controls="mobile-menu"
              onClick={() => setMenu(true)}
            >
              {t.menu}
            </button>
          </div>
        </nav>
      </header>
      <MobileMenu open={menu} onClose={() => setMenu(false)} returnFocusRef={menuBtnRef} />
    </>
  )
}
