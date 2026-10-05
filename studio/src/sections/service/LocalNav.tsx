import { useEffect, useRef, useState, type MouseEvent } from 'react'
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

  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    setOpen(false)
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    window.history.replaceState(window.history.state, '', `#${id}`)
    el.focus({ preventScroll: true })
  }

  const linkCls = (id: string, size = 'min-h-11 text-[0.8125rem]') =>
    `inline-flex items-center font-[460] transition-colors hover:text-paper ${size} ${active === id ? 'text-paper' : 'text-mute'}`

  return (
    <div ref={ref} className="sticky top-[var(--nav-h)] z-40 border-b border-line bg-black/85 backdrop-blur-md">
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
          <Link
            to={to.contact(lang, service.id)}
            viewTransition
            className="relative inline-flex h-8 items-center rounded-full bg-paper px-4 text-[0.8125rem] font-[540] whitespace-nowrap text-ink transition-colors before:absolute before:inset-x-0 before:-inset-y-1.5 hover:bg-white"
          >
            <span className="sm:hidden">{t.proposeShort}</span>
            <span className="hidden sm:inline">{t.propose}</span>
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
