import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'
import { to } from '@/i18n/paths'
import { cases, sectors, type Case } from '@/content/cases'
import { getMedia } from '@/lib/media'
import { Meta } from '@/components/Meta'
import { Video } from '@/components/Video'
import { DiscoverLink } from '@/components/Cta'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { useMediaQuery, useReducedMotion } from '@/hooks/useMediaQuery'
import { gsap, MQ, useGSAP } from '@/lib/motion'
import { pauseIn, playIn } from '@/sections/closing/hoverVideo'

const copy = {
  es: {
    title: 'Webs que se visitan dos veces.',
    sub: 'Inmobiliarias y restaurantes, en producción. Esta también es nuestra.',
    kind: 'Web de autor',
    visit: 'Visitar web',
    visitLabel: (name: string) => `Visitar la web de ${name} (se abre en una pestaña nueva)`,
    case: 'Ver caso',
    caseLabel: (name: string) => `Ver el caso ${name}`,
    video: (name: string) => `Recorrido por la web de ${name}`,
    rail: 'Webs de autor en producción',
    prev: 'Web anterior',
    next: 'Web siguiente',
    discover: 'Descubrir',
    discoverLabel: 'Descubrir el servicio de webs de autor',
  },
  en: {
    title: 'Websites people visit twice.',
    sub: 'Real estate firms and restaurants, all live. This site is ours too.',
    kind: 'Signature website',
    visit: 'Visit site',
    visitLabel: (name: string) => `Visit the ${name} website (opens in a new tab)`,
    case: 'View case',
    caseLabel: (name: string) => `View the ${name} case`,
    video: (name: string) => `A walk through the ${name} website`,
    rail: 'Signature websites in production',
    prev: 'Previous website',
    next: 'Next website',
    discover: 'Discover',
    discoverLabel: 'Discover our signature websites service',
  },
} satisfies Record<Lang, unknown>

/** Las webs en producción (encargos de clientes con URL). */
const sites = cases.filter((c) => c.services.includes('websites') && !!c.url)

const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Arrastre con ratón: umbral antes de considerarlo arrastre (px). */
const DRAG_THRESHOLD = 6

/**
 * Webs de autor (Clientes) · prueba real.
 * Carril horizontal con overflow-x nativo y scroll-snap, sin pin ni secuestro.
 * Arrastrable con ratón en escritorio; el táctil usa el swipe nativo.
 * Las webs con grabación de pantalla la muestran; el resto es una tarjeta tipográfica.
 */
export function WebsRail() {
  const lang = useLang()
  const t = copy[lang]
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const railRef = useRef<HTMLUListElement>(null)
  const reduce = useReducedMotion()
  const [edges, setEdges] = useState({ start: true, end: false })

  useSplitReveal(titleRef)

  // Parallax interno (máx. 6 %) del nombre mientras la tarjeta entra por la derecha.
  // Llega a 0 cuando la tarjeta queda alineada (snap), así en reposo todo está en su sitio.
  useGSAP(
    () => {
      const rail = railRef.current
      if (!rail) return
      const pad = () => parseFloat(getComputedStyle(rail).paddingLeft) || 0
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        gsap.utils.toArray<HTMLElement>('[data-parallax]', rail).forEach((el) => {
          gsap.fromTo(
            el,
            { xPercent: -6 },
            {
              xPercent: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: el.closest('li'),
                scroller: rail,
                horizontal: true,
                start: 'left right',
                end: () => `left ${pad()}px`,
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          )
        })
      })
      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  // Estado de los extremos para los botones anterior/siguiente.
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    let raf = 0
    const update = () => {
      raf = 0
      const max = rail.scrollWidth - rail.clientWidth
      setEdges({ start: rail.scrollLeft <= 4, end: rail.scrollLeft >= max - 4 })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    rail.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(onScroll)
    ro.observe(rail)
    return () => {
      rail.removeEventListener('scroll', onScroll)
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  /** Posiciones de snap de cada tarjeta (scrollLeft al que queda alineada). */
  const snapPoints = useCallback(() => {
    const rail = railRef.current
    if (!rail) return [] as number[]
    const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0
    const max = rail.scrollWidth - rail.clientWidth
    return Array.from(rail.children).map((li) => Math.max(0, Math.min(max, (li as HTMLElement).offsetLeft - pad)))
  }, [])

  const go = (dir: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    const pts = snapPoints()
    const x = rail.scrollLeft
    const target = dir === 1 ? pts.find((p) => p > x + 4) : [...pts].reverse().find((p) => p < x - 4)
    rail.scrollTo({ left: target ?? (dir === 1 ? pts[pts.length - 1] : 0), behavior: reduce ? 'auto' : 'smooth' })
  }

  // ── Arrastre con ratón (pointerType 'mouse'): no interfiere con el scroll táctil nativo.
  const drag = useRef<{ id: number; x0: number; left0: number; moved: boolean; lastX: number; lastT: number; v: number } | null>(null)
  const suppressClick = useRef(false)

  const onPointerDown = (e: ReactPointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const rail = railRef.current
    if (!rail) return
    drag.current = { id: e.pointerId, x0: e.clientX, left0: rail.scrollLeft, moved: false, lastX: e.clientX, lastT: e.timeStamp, v: 0 }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLUListElement>) => {
    const d = drag.current
    const rail = railRef.current
    if (!d || !rail || e.pointerId !== d.id) return
    const dx = e.clientX - d.x0
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      d.moved = true
      rail.setPointerCapture(d.id)
      rail.style.scrollSnapType = 'none'
      rail.style.cursor = 'grabbing'
      rail.style.userSelect = 'none'
    }
    rail.scrollLeft = d.left0 - dx
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.v = 0.8 * ((e.clientX - d.lastX) / dt) + 0.2 * d.v
    d.lastX = e.clientX
    d.lastT = e.timeStamp
  }

  const endDrag = (e: ReactPointerEvent<HTMLUListElement>) => {
    const d = drag.current
    const rail = railRef.current
    drag.current = null
    if (!d || !rail || !d.moved) return
    if (rail.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId)
    suppressClick.current = true
    window.setTimeout(() => (suppressClick.current = false), 0)
    rail.style.cursor = ''
    rail.style.userSelect = ''
    // Inercia breve y alineado a la tarjeta más cercana.
    const projected = rail.scrollLeft - d.v * 220
    const pts = snapPoints()
    const target = pts.reduce((best, p) => (Math.abs(p - projected) < Math.abs(best - projected) ? p : best), pts[0] ?? 0)
    const restore = () => {
      rail.style.scrollSnapType = ''
      rail.removeEventListener('scrollend', restore)
    }
    rail.addEventListener('scrollend', restore)
    window.setTimeout(restore, 900)
    rail.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' })
  }

  const onClickCapture = (e: ReactMouseEvent) => {
    if (!suppressClick.current) return
    e.preventDefault()
    e.stopPropagation()
    suppressClick.current = false
  }

  if (sites.length === 0) return null

  return (
    <section ref={sectionRef} aria-labelledby="webs-title" className="relative border-t border-line py-24 lg:py-36">
      <div className="container-x grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-6">
        <h2 id="webs-title" ref={titleRef} className="type-display lg:col-span-7">
          {t.title}
        </h2>
        <div className="flex flex-col items-start gap-4 lg:col-span-5 lg:col-start-8 lg:pb-2">
          <p className="type-lead measure text-mute">{t.sub}</p>
          <DiscoverLink to={to.service(lang, 'websites')} className="-my-2">
            <span className="sr-only">{t.discoverLabel}</span>
            <span aria-hidden="true">{t.discover}</span>
          </DiscoverLink>
        </div>
      </div>

      <div className="relative mt-14 lg:mt-20">
        <ul
          ref={railRef}
          aria-label={t.rail}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          onDragStart={(e) => e.preventDefault()}
          className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-[max(var(--gutter),calc((100vw-var(--maxw))/2+var(--gutter)))] pb-2 [scrollbar-width:none] scroll-px-[max(var(--gutter),calc((100vw-var(--maxw))/2+var(--gutter)))] sm:gap-6 [@media(hover:hover)_and_(pointer:fine)]:cursor-grab [&::-webkit-scrollbar]:hidden"
        >
          {sites.map((c) => (
            <SiteCard key={c.slug} c={c} lang={lang} />
          ))}
        </ul>
      </div>

      <div className="container-x mt-8 hidden items-center justify-end gap-3 lg:flex">
        <RailButton dir={-1} label={t.prev} disabled={edges.start} onClick={() => go(-1)} />
        <RailButton dir={1} label={t.next} disabled={edges.end} onClick={() => go(1)} />
      </div>
    </section>
  )
}

function RailButton({ dir, label, disabled, onClick }: { dir: 1 | -1; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full border border-line-strong text-paper transition-[border-color,opacity] duration-300 hover:border-paper disabled:cursor-default disabled:opacity-30 disabled:hover:border-line-strong"
    >
      <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={dir === -1 ? 'rotate-180' : ''}>
        <path d="m1 1 5 5-5 5" />
      </svg>
    </button>
  )
}

/**
 * Tarjeta de una web. Acción principal: abrir la web en producción en una pestaña nueva
 * (toda la tarjeta es el enlace). Secundaria: el caso interno.
 * Variante tipográfica por defecto; si el caso trae `media` (grabación de pantalla),
 * muestra el vídeo arriba: al pasar el ratón en escritorio, en vista en móvil
 * (solo la pieza centrada) y solo al pulsar con reduced-motion.
 */
function SiteCard({ c, lang }: { c: Case; lang: Lang }) {
  const t = copy[lang]
  const ref = useRef<HTMLElement>(null)
  const hover = useMediaQuery(MQ.hover)
  const reduce = useReducedMotion()
  const media = c.media && getMedia(c.media) ? c.media : undefined
  const domain = c.url ? domainOf(c.url) : ''
  const hoverPlay = !!media && hover && !reduce

  return (
    <li className="w-[85%] shrink-0 snap-start sm:w-[62%] lg:w-[min(46rem,54vw)]">
      <article
        ref={ref}
        onPointerEnter={hoverPlay ? () => playIn(ref.current) : undefined}
        onPointerLeave={hoverPlay ? () => pauseIn(ref.current) : undefined}
        className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-line bg-surface transition-colors duration-500 has-[a:hover]:border-line-strong"
      >
        {media && (
          <Video
            media={media}
            label={t.video(c.title)}
            play={hover || reduce ? 'manual' : 'inview'}
            exclusive
            controlsPosition="tr"
            className="aspect-[16/10] w-full"
          />
        )}
        <div className={`flex flex-1 flex-col p-6 sm:p-8 lg:p-10 ${media ? 'gap-6' : 'aspect-[4/5] sm:aspect-[5/4] lg:aspect-[16/11]'}`}>
          <Meta>
            {sectors[c.sector][lang]} · {t.kind}
          </Meta>
          <div className={`flex flex-1 flex-col ${media ? '' : 'justify-center py-8'}`}>
            <h3 className={`${media ? 'type-title' : 'type-display'} max-w-[11ch]`} data-parallax={media ? undefined : ''}>
              {c.title}
            </h3>
            <p className="type-small mt-4 text-mute">{c.line[lang]}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-4">
            <span className="type-meta text-dim">{domain}</span>
            <div className="-my-1 flex items-center gap-6">
              <Link
                to={to.case(lang, c.slug)}
                viewTransition
                draggable={false}
                aria-label={t.caseLabel(c.title)}
                className="relative z-10 inline-flex min-h-11 items-center text-[0.9375rem] font-[460] text-mute underline-offset-4 transition-colors hover:text-paper hover:underline"
              >
                {t.case}
              </Link>
              {c.url && (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  draggable={false}
                  aria-label={t.visitLabel(c.title)}
                  className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-[500] text-paper outline-none after:absolute after:inset-0 after:rounded-[1.25rem] after:content-[''] hover:underline focus-visible:after:outline-2 focus-visible:after:outline-accent focus-visible:after:[outline-offset:-2px] underline-offset-4"
                >
                  {t.visit}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px">
                    <path d="M2 8 8 2M3 2h5v5" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    </li>
  )
}
