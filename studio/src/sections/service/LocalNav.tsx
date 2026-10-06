import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import type { Service } from '@/content/services'
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from '@/lib/motion'
import { ui } from './copy'

export type Anchor = { id: string; label: string }

/**
 * Navegación local fija bajo la global (como la de producto de Apple).
 * Escritorio: nombre · anclas · píldora. Móvil: nombre desplegable con las anclas · píldora.
 * Cuando la nav global se oculta al bajar, esta sube a ocupar su sitio (misma regla que Nav.tsx).
 * En estas rutas la nav global no lleva píldora: la única es "Solicitar propuesta" de aquí.
 * `data-local-nav` permite a global.css ampliar el scroll-padding (foco con teclado bajo las dos barras).
 */
export function LocalNav({ service, anchors }: { service: Service; anchors: Anchor[] }) {
  const lang = useLang()
  const t = ui[lang]
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(anchors[0]?.id)
  const [open, setOpen] = useState(false)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      let hidden = false
      const st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate(self) {
          const hide = self.direction === 1 && self.scroll() > window.innerHeight * 0.6
          if (hide === hidden) return
          hidden = hide
          const offset = parseFloat(getComputedStyle(el).top) || 56
          const instant = prefersReducedMotion()
          gsap.to(el, {
            y: hide ? -offset : 0,
            duration: instant ? 0 : hide ? 0.35 : 0.5,
            ease: hide ? 'power2.in' : 'expo.out',
            overwrite: true,
          })
        },
      })
      return () => st.kill()
    },
    { scope: ref },
  )

  // Sección activa: la última (en orden de página) que cruza la franja central del viewport
  useEffect(() => {
    const els = anchors.map((a) => document.getElementById(a.id)).filter((el): el is HTMLElement => !!el)
    const inside = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inside.add(e.target.id)
          else inside.delete(e.target.id)
        }
        const current = [...anchors].reverse().find((a) => inside.has(a.id))
        if (current) setActive(current.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [anchors])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  /**
   * Salto a una sección calculado a mano (no scrollIntoView):
   * 1. Cierra antes el desplegable móvil (flushSync): si se cierra durante el desplazamiento suave, el contenido
   *    sube ~200 px y el salto aterriza por debajo del destino.
   * 2. Deja el contenido de la sección (no su padding) bajo el cromo que quedará visible: al bajar, la nav global
   *    se oculta y solo queda esta barra; al subir, quedan las dos.
   * 3. Si algo cambia el layout durante el salto (pins, medios), corrige al terminar.
   */
  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    flushSync(() => setOpen(false))
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
    const first = id === anchors[0]?.id
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 56
    // Alto real de la barra (con el desplegable ya cerrado y su hairline)
    const localH = ref.current?.offsetHeight ?? 53
    const contentTop = () => {
      const inner = el.firstElementChild instanceof HTMLElement ? el.firstElementChild : null
      const pad = inner ? parseFloat(getComputedStyle(inner).paddingTop) || 0 : 0
      return el.getBoundingClientRect().top + window.scrollY + pad
    }
    // El sentido se decide una vez: fija qué cromo quedará visible al llegar
    const down = contentTop() - localH - 32 > window.scrollY
    const targetY = () => (first ? 0 : Math.max(0, Math.round(contentTop() - (down ? localH : navH + localH) - 32)))
    const y = targetY()
    window.scrollTo({ top: y, behavior })
    if (behavior === 'smooth' && Math.abs(y - window.scrollY) > 8 && 'onscrollend' in window) {
      const started = performance.now()
      window.addEventListener(
        'scrollend',
        () => {
          // Solo corrige el final de este salto, nunca un desplazamiento posterior del usuario
          if (performance.now() - started > 3000) return
          const fix = targetY()
          if (Math.abs(fix - window.scrollY) > 8) window.scrollTo({ top: fix, behavior })
        },
        { once: true },
      )
    }
    window.history.replaceState(window.history.state, '', `#${id}`)
    el.focus({ preventScroll: true })
  }

  const linkCls = (id: string, size = 'min-h-11 text-[0.8125rem]') =>
    `inline-flex items-center font-[460] transition-colors hover:text-paper ${size} ${active === id ? 'text-paper' : 'text-mute'}`

  return (
    <div ref={ref} data-local-nav className="sticky top-[var(--nav-h)] z-40 border-b border-line bg-black/85 backdrop-blur-md">
      <nav aria-label={t.localNav} className="container-x flex h-13 items-center justify-between gap-4">
        <a
          href={`#${anchors[0].id}`}
          onClick={(e) => go(e, anchors[0].id)}
          className="hidden min-h-11 items-center text-[1.125rem] font-[520] tracking-[-0.012em] [font-stretch:108%] md:inline-flex"
        >
          {service.name[lang]}
        </a>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-0 items-center gap-2 text-[1rem] font-[520] tracking-[-0.01em] [font-stretch:106%] md:hidden"
          aria-expanded={open}
          aria-controls="local-nav-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="truncate">{service.name[lang]}</span>
          <span className="sr-only">· {t.sections}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={`shrink-0 text-mute ${open ? 'rotate-180' : ''}`}>
            <path d="m1 1 4 4 4-4" />
          </svg>
        </button>
        <div className="flex shrink-0 items-center gap-7">
          <ul className="hidden items-center gap-7 md:flex">
            {anchors.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`} onClick={(e) => go(e, a.id)} aria-current={active === a.id ? 'location' : undefined} className={linkCls(a.id)}>
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
          {/* Área táctil de 44 px (el enlace); la píldora visible mide 32 px y lleva el anillo de foco */}
          <Link
            to={to.contact(lang, service.id)}
            viewTransition
            className="group inline-flex min-h-11 items-center outline-none"
          >
            <span className="inline-flex h-8 items-center rounded-full bg-paper px-4 text-[0.8125rem] font-[540] whitespace-nowrap text-ink transition-colors group-hover:bg-white group-focus-visible:outline-2 group-focus-visible:outline-offset-3 group-focus-visible:outline-accent">
              <span className="sm:hidden">{t.proposeShort}</span>
              <span className="hidden sm:inline">{t.propose}</span>
            </span>
          </Link>
        </div>
      </nav>
      <div id="local-nav-menu" hidden={!open} className="border-t border-line md:hidden">
        <ul className="container-x py-2">
          {anchors.map((a) => (
            <li key={a.id}>
              <a href={`#${a.id}`} onClick={(e) => go(e, a.id)} aria-current={active === a.id ? 'location' : undefined} className={`${linkCls(a.id, 'min-h-12 text-[1rem]')} w-full`}>
                {a.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
