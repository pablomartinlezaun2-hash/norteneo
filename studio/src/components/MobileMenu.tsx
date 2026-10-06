import { useEffect, useRef, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { alternatePath, to } from '@/i18n/paths'
import { useLocation } from 'react-router-dom'
import { services } from '@/content/services'
import { whatsappHref } from '@/content/site'
import { gsap, MQ, useGSAP } from '@/lib/motion'
import { navCopy } from './Nav'

/** Menú móvil a pantalla completa con revelado clip-path (inspirado en codrops/EaseReverseClipMenu, sin vídeo). */
export function MobileMenu({ open, onClose, returnFocusRef }: { open: boolean; onClose: () => void; returnFocusRef?: RefObject<HTMLElement | null> }) {
  const lang = useLang()
  const t = navCopy[lang]
  const { pathname, search } = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wa = whatsappHref()
  const other = lang === 'es' ? 'en' : 'es'

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        if (open) {
          gsap.set(el, { display: 'flex' })
          gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'expo.out' })
          gsap.from(el.querySelectorAll('[data-item]'), { yPercent: 60, autoAlpha: 0, duration: 0.6, stagger: 0.035, delay: 0.12 })
        } else {
          gsap.to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.35, ease: 'power2.in', onComplete: () => gsap.set(el, { display: 'none' }) })
        }
      })
      mm.add(MQ.reduce, () => {
        gsap.set(el, { display: open ? 'flex' : 'none', clipPath: 'none' })
      })
      return () => mm.revert()
    },
    { dependencies: [open], scope: ref },
  )

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('a,button')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    const returnTo = returnFocusRef?.current
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
      // Al cerrar, el foco vuelve al botón "Menú" (si seguimos en la misma página)
      if (returnTo && document.contains(returnTo)) returnTo.focus({ preventScroll: true })
    }
  }, [open, onClose, returnFocusRef])

  return (
    <div
      id="mobile-menu"
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={t.menu}
      className="fixed inset-0 z-[70] hidden flex-col bg-ink lg:hidden"
      style={{ clipPath: 'inset(0 0 100% 0)' }}
    >
      <div className="container-x flex h-[var(--nav-h)] items-center justify-end">
        <button ref={closeRef} type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center text-[0.875rem] font-[480]">
          {t.close}
        </button>
      </div>
      <nav className="container-x flex flex-1 flex-col justify-between overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]" aria-label={t.menu}>
        <ul className="flex flex-col gap-1 pt-6">
          {[
            [to.work(lang), t.work],
            [to.services(lang), t.services],
            [to.studio(lang), t.studio],
            [to.contact(lang), t.contact],
          ].map(([href, label]) => (
            <li key={href} data-item>
              <Link to={href} onClick={onClose} className="type-display block py-1.5">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-6">
          {services.map((s) => (
            <li key={s.id} data-item>
              <Link to={to.service(lang, s.id)} onClick={onClose} className="type-small block min-h-11 content-center text-mute">
                {s.name[lang]}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-4" data-item>
          <Link to={to.contact(lang)} onClick={onClose} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-paper px-6 font-[520] text-ink">
            {t.cta}
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center text-[0.9375rem] underline-offset-4 hover:underline">
              WhatsApp
            </a>
          )}
          <Link to={alternatePath(pathname, other) + search} hrefLang={other} onClick={onClose} className="type-meta inline-flex min-h-11 min-w-11 items-center justify-center text-mute">
            {other.toUpperCase()}
          </Link>
        </div>
      </nav>
    </div>
  )
}
