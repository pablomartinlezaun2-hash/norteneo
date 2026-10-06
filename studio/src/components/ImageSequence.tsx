import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { frameUrl, getMedia, type MediaId, type Sequence } from '@/lib/media'

export type ImageSequenceHandle = {
  /** Pinta el frame correspondiente a un progreso 0..1 */
  render: (progress: number) => void
  /** Número de frames de la variante activa */
  count: () => number
  /** Cambia el punto focal horizontal (0..1) en modo 'cover' (p. ej. animado por tramos en móvil) */
  setFocus: (x: number) => void
}

type Props = {
  media: MediaId
  label: string
  className?: string
  /** Empezar a cargar ya (por defecto espera a estar cerca del viewport) */
  eager?: boolean
  /** Ajuste dentro del contenedor. Por defecto 'cover'. Con fondo negro, 'contain' se funde con la página. */
  fit?: 'cover' | 'contain'
  /** Punto focal horizontal para 'cover' (0 izquierda … 1 derecha) */
  focusX?: number
  /** Variante de frames: 'auto' (desktop ≥768 px, si no mobile), o forzar una */
  variant?: 'auto' | 'desktop' | 'mobile'
  ref?: Ref<ImageSequenceHandle>
}

type Frame = ImageBitmap | HTMLImageElement | null

/**
 * Secuencia de imágenes en canvas para scroll-scrub (técnica OPTIKKA / gsap imageSequenceScrub).
 * El padre controla el progreso con ScrollTrigger: `onUpdate: (st) => seqRef.current?.render(st.progress)`.
 * Carga progresiva: primer frame, último, 1 de cada 8, 4, 2 y el resto. Variante móvil por debajo de 768 px.
 * Nunca usa video.currentTime (poco fiable en iOS).
 */
export function ImageSequence({ media, label, className = '', eager = false, fit = 'cover', focusX = 0.5, variant = 'auto', ref }: Props) {
  const entry = getMedia(media)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const state = useRef({
    seq: entry?.seq?.desktop as Sequence | undefined,
    frames: [] as Frame[],
    target: 0,
    drawn: -1,
    raf: 0,
    focus: focusX,
    start: null as null | (() => void),
  })

  const draw = () => {
    const s = state.current
    s.raf = 0
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !s.seq || !s.frames.length) return
    // Frame cargado más cercano al objetivo
    let idx = -1
    for (let d = 0; d < s.frames.length; d++) {
      if (s.frames[s.target - d]) { idx = s.target - d; break }
      if (s.frames[s.target + d]) { idx = s.target + d; break }
    }
    if (idx < 0 || idx === s.drawn) return
    const img = s.frames[idx]!
    const iw = 'width' in img ? img.width : 0
    const ih = 'height' in img ? img.height : 0
    const cw = canvas.width
    const ch = canvas.height
    const scale = fit === 'cover' ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih)
    const dw = iw * scale
    const dh = ih * scale
    const dx = (cw - dw) * (fit === 'cover' ? s.focus : 0.5)
    const dy = (ch - dh) / 2
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, dw, dh)
    s.drawn = idx
  }

  const schedule = () => {
    const s = state.current
    if (!s.raf) s.raf = requestAnimationFrame(draw)
  }

  useImperativeHandle(ref, () => ({
    render(progress: number) {
      const s = state.current
      if (!s.seq) return
      const t = Math.round(Math.max(0, Math.min(1, progress)) * (s.seq.count - 1))
      if (t === s.target && s.drawn === t) return
      s.target = t
      // Red de seguridad: si el padre ya pide frames, empezamos a cargar aunque el observer no haya disparado
      if (t > 0) s.start?.()
      schedule()
    },
    count: () => state.current.seq?.count ?? 0,
    setFocus(x: number) {
      const s = state.current
      s.focus = Math.max(0, Math.min(1, x))
      s.drawn = -1
      schedule()
    },
  }))

  useEffect(() => {
    if (!entry?.seq) return
    const s = state.current
    const desktop = variant === 'auto' ? window.matchMedia('(min-width: 768px)').matches : variant === 'desktop'
    s.seq = desktop ? entry.seq.desktop : entry.seq.mobile
    s.frames = new Array(s.seq.count).fill(null)
    s.drawn = -1

    const canvas = canvasRef.current!
    const wrap = wrapRef.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ro = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(r.width * dpr))
      canvas.height = Math.max(1, Math.round(r.height * dpr))
      s.drawn = -1
      schedule()
    })
    ro.observe(wrap)

    // Orden de carga por subdivisión
    const n = s.seq.count
    const order: number[] = []
    const seen = new Set<number>()
    const push = (i: number) => {
      if (i >= 0 && i < n && !seen.has(i)) { seen.add(i); order.push(i) }
    }
    push(0); push(n - 1)
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < n; i += step) push(i)

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const lite = !!conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType ?? ''))
    const queue = lite ? order.filter((i) => i % 8 === 0 || i === n - 1) : order

    let cancelled = false
    let started = false
    const load = async (i: number) => {
      const url = frameUrl(s.seq!, i)
      try {
        if ('createImageBitmap' in window) {
          const res = await fetch(url)
          const blob = await res.blob()
          s.frames[i] = await createImageBitmap(blob)
        } else {
          const img = new Image()
          img.src = url
          await img.decode()
          s.frames[i] = img
        }
        if (!cancelled && Math.abs(i - s.target) <= Math.abs((s.drawn < 0 ? Infinity : s.drawn) - s.target)) schedule()
      } catch {
        /* frame perdido: se usa el vecino más cercano */
      }
    }
    const start = () => {
      if (started) return
      started = true
      let cursor = 0
      const worker = async () => {
        while (!cancelled && cursor < queue.length) await load(queue[cursor++])
      }
      for (let k = 0; k < 6; k++) void worker()
    }

    s.start = start
    let io: IntersectionObserver | undefined
    if (eager) start()
    else {
      io = new IntersectionObserver(
        (entries) => {
          // Procesar todas las entradas: la primera puede ser un estado obsoleto
          if (entries.some((e) => e.isIntersecting)) {
            const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
            if (ric) ric(start, { timeout: 400 } as never)
            else setTimeout(start, 50)
            io?.disconnect()
          }
        },
        { rootMargin: '60% 0px' },
      )
      io.observe(wrap)
    }

    return () => {
      cancelled = true
      s.start = null
      ro.disconnect()
      io?.disconnect()
      cancelAnimationFrame(s.raf)
      s.raf = 0
      s.frames.forEach((f) => { if (f && 'close' in f) f.close() })
      s.frames = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media])

  const first = entry?.seq ? frameUrl(variant === 'mobile' ? entry.seq.mobile : entry.seq.desktop, 0) : entry?.poster.jpg
  const firstMobile = entry?.seq && variant === 'auto' ? frameUrl(entry.seq.mobile, 0) : undefined
  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-ink ${className}`} role="img" aria-label={label}>
      {first && (
        <picture>
          {firstMobile && <source media="(max-width: 767px)" srcSet={firstMobile} />}
          <img
          src={first}
          alt=""
          className={`absolute inset-0 h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // Si falla el frame, el póster del clip evita el icono de imagen rota
            if (entry && e.currentTarget.src !== new URL(entry.poster.jpg, location.href).href) e.currentTarget.src = entry.poster.jpg
          }}
          />
        </picture>
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
