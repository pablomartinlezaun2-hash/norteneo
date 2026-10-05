import { useEffect, useRef, type RefObject } from 'react'

/**
 * Trazos del wordmark NEO, copiados de src/components/Logo.tsx (viewBox "-3 -3 374 106").
 * Si el logo cambia, actualizar aquí también.
 */
const VIEW = { x: -3, y: -3, w: 374, h: 106 }
const STROKE = 4.2
const PATHS = ['M2 100V2l72 96V0', 'M207 2.1H153.1V97.9H207M153.1 50H202']
const ELLIPSE = { cx: 321, cy: 50, rx: 44, ry: 48 }
export const WORDMARK_ASPECT = VIEW.w / VIEW.h

/** Polvo dorado del clip (no los colores del UI): de champán a blanco. */
const DUST = ['#e9d9b0', '#efe3c2', '#f6eedb', '#ffffff']

type Props = {
  /** Caja del layout donde se forma el wordmark */
  slotRef: RefObject<HTMLElement | null>
  /** Sección: visibilidad (IntersectionObserver) y eventos de puntero. El origen es el propio canvas. */
  areaRef: RefObject<HTMLElement | null>
  className?: string
}

function makeSprite(color: string, px: number) {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  const r = px / 2
  const grad = g.createRadialGradient(r, r, 0, r, r, r)
  grad.addColorStop(0, color)
  grad.addColorStop(0.22, color)
  grad.addColorStop(0.42, `${color}55`)
  grad.addColorStop(1, `${color}00`)
  g.fillStyle = grad
  g.fillRect(0, 0, px, px)
  return c
}

const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5

/**
 * Wordmark NEO hecho de partículas (Canvas 2D, sin Three.js), adaptado del ParticleField
 * de la app (CinematicOnboarding): capas de tamaño, parpadeo suave y DPR máx. 2.
 * - Muestrea los trazos del logo en un canvas oculto y reparte ~1.200 partículas (≈500 en móvil).
 * - Se forman al entrar en pantalla, se apartan con el cursor o el dedo y vuelven con muelles
 *   amortiguados (sin rebotes).
 * - rAF pausado fuera de pantalla y con la pestaña oculta.
 * - Reduced-motion, deviceMemory ≤ 4 o Save-Data: se dibuja una sola vez, quieto.
 */
export function ParticleWordmark({ slotRef, areaRef, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const area = areaRef.current
    const slot = slotRef.current
    if (!canvas || !area || !slot) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowEnd = (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) || nav.connection?.saveData === true
    const still = reduce || lowEnd
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const compact = window.matchMedia('(max-width: 767.98px)').matches
    const COUNT = compact ? 500 : 1200

    const sprites = DUST.map((c) => makeSprite(c, Math.round(24 * dpr)))

    // Estado en arrays planos (sin objetos por partícula)
    const x = new Float32Array(COUNT)
    const y = new Float32Array(COUNT)
    const vx = new Float32Array(COUNT)
    const vy = new Float32Array(COUNT)
    const hx = new Float32Array(COUNT)
    const hy = new Float32Array(COUNT)
    const size = new Float32Array(COUNT)
    const alpha = new Float32Array(COUNT)
    const phase = new Float32Array(COUNT)
    const speed = new Float32Array(COUNT)
    const color = new Uint8Array(COUNT)

    // Capas como en ParticleField: lejos (finas y tenues), medio y cerca (más grandes y brillantes)
    for (let i = 0; i < COUNT; i++) {
      const r = Math.random()
      const layer = r < 0.14 ? 2 : r < 0.55 ? 1 : 0
      size[i] = layer === 2 ? 3.4 + Math.random() * 1.8 : layer === 1 ? 2.4 + Math.random() * 1 : 1.6 + Math.random() * 0.7
      alpha[i] = layer === 2 ? 0.9 + Math.random() * 0.1 : layer === 1 ? 0.7 + Math.random() * 0.25 : 0.45 + Math.random() * 0.25
      phase[i] = Math.random() * Math.PI * 2
      speed[i] = 0.6 + Math.random() * 1.4
      color[i] = Math.random() < 0.18 ? 3 : Math.floor(Math.random() * 3)
    }

    let w = 0
    let h = 0
    let radius = 100
    let placed = false

    /** Muestrea el logo en un canvas oculto y asigna a cada partícula su sitio. */
    const layout = () => {
      const cr = canvas.getBoundingClientRect()
      w = cr.width
      h = cr.height
      if (w < 1 || h < 1) return
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)

      // El wordmark se ajusta (contain) dentro de la ranura, centrado y apoyado abajo.
      const sr = slot.getBoundingClientRect()
      if (sr.width < 1 || sr.height < 1) return
      const sw = Math.min(sr.width, sr.height * WORDMARK_ASPECT)
      const s = sw / VIEW.w
      const sh = VIEW.h * s
      const ox = sr.left - cr.left + (sr.width - sw) / 2
      const oy = sr.top - cr.top + sr.height - sh
      radius = Math.max(56, sw * 0.085)

      const ow = Math.ceil(sw)
      const oh = Math.ceil(sh)
      const off = document.createElement('canvas')
      off.width = ow
      off.height = oh
      const o = off.getContext('2d', { willReadFrequently: true })
      if (!o) return
      o.scale(s, s)
      o.translate(-VIEW.x, -VIEW.y)
      // Trazo algo más grueso que el logo para que el polvo forme una banda legible
      const px = STROKE * s
      o.lineWidth = STROKE * Math.max(1.2, 6 / px)
      o.strokeStyle = '#fff'
      for (const d of PATHS) o.stroke(new Path2D(d))
      o.beginPath()
      o.ellipse(ELLIPSE.cx, ELLIPSE.cy, ELLIPSE.rx, ELLIPSE.ry, 0, 0, Math.PI * 2)
      o.stroke()

      const data = o.getImageData(0, 0, ow, oh).data
      const pts: number[] = []
      for (let yy = 0; yy < oh; yy++) {
        for (let xx = 0; xx < ow; xx++) if (data[(yy * ow + xx) * 4 + 3] > 140) pts.push(xx, yy)
      }
      const n = pts.length / 2
      if (n === 0) return
      for (let i = 0; i < COUNT; i++) {
        const k = Math.floor(Math.random() * n) * 2
        let px2 = pts[k] + Math.random()
        let py2 = pts[k + 1] + Math.random()
        // Un 7 % queda suelto alrededor de las letras: halo de polvo
        if (i % 14 === 0) {
          px2 += gauss() * radius * 0.35
          py2 += gauss() * radius * 0.35
        }
        hx[i] = ox + px2
        hy[i] = oy + py2
      }
      if (!placed) {
        for (let i = 0; i < COUNT; i++) {
          if (still) {
            x[i] = hx[i]
            y[i] = hy[i]
          } else {
            // Nube dispersa que se condensa en el wordmark al entrar en pantalla
            x[i] = hx[i] + gauss() * w * 0.32
            y[i] = hy[i] + gauss() * h * 0.28 - h * 0.08
          }
        }
        placed = true
      }
    }

    const drawStill = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < COUNT; i++) {
        const sz = size[i]
        ctx.globalAlpha = alpha[i] * (0.7 + 0.3 * Math.sin(phase[i]))
        ctx.drawImage(sprites[color[i]], x[i] - sz, y[i] - sz, sz * 2, sz * 2)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    // ── Puntero (ratón, lápiz o dedo). El canvas no recibe eventos: escucha la sección.
    let pX = -1e5
    let pY = -1e5
    let pOn = false
    let pAmt = 0
    const setPointer = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect()
      pX = cx - r.left
      pY = cy - r.top
      pOn = true
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') setPointer(e.clientX, e.clientY)
    }
    const onTouch = (e: TouchEvent) => {
      const tt = e.touches[0]
      if (tt) setPointer(tt.clientX, tt.clientY)
    }
    const onLeave = () => {
      pOn = false
    }

    // ── Bucle
    const K = 0.01
    const DAMP = 0.84
    const FORCE = 0.9
    let raf = 0
    let last = 0
    let startedAt = 0
    let inView = false

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const step = last ? Math.min(2.5, (now - last) / 16.667) : 1
      last = now
      if (!startedAt) startedAt = now
      const age = now - startedAt
      // Condensación inicial: muelles que se endurecen y polvo que aparece
      const ramp = Math.min(1, age / 1600)
      const k = K * (0.2 + 0.8 * ramp * ramp) * step
      const damp = Math.pow(DAMP, step)
      const fade = Math.min(1, age / 900)
      const time = now * 0.001
      pAmt += ((pOn ? 1 : 0) - pAmt) * Math.min(1, 0.08 * step)
      const R = radius
      const R2 = R * R

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < COUNT; i++) {
        const sp = speed[i]
        const tx = hx[i] + Math.sin(time * sp * 0.5 + phase[i]) * 0.7
        const ty = hy[i] + Math.cos(time * sp * 0.4 + phase[i]) * 0.7
        let ax = (tx - x[i]) * k
        let ay = (ty - y[i]) * k
        if (pAmt > 0.01) {
          const dx = x[i] - pX
          const dy = y[i] - pY
          const d2 = dx * dx + dy * dy
          if (d2 < R2) {
            const d = Math.sqrt(d2) + 0.001
            const f = 1 - d / R
            const F = f * f * FORCE * pAmt * step
            // Empuje radial con un leve remolino tangencial
            ax += (dx / d) * F - (dy / d) * F * 0.3
            ay += (dy / d) * F + (dx / d) * F * 0.3
          }
        }
        vx[i] = (vx[i] + ax) * damp
        vy[i] = (vy[i] + ay) * damp
        x[i] += vx[i] * step
        y[i] += vy[i] * step

        const v = Math.abs(vx[i]) + Math.abs(vy[i])
        const tw = 0.6 + 0.4 * Math.sin(time * sp + phase[i])
        ctx.globalAlpha = Math.min(1, alpha[i] * tw + v * 0.04) * fade
        const sz = size[i]
        ctx.drawImage(sprites[color[i]], x[i] - sz, y[i] - sz, sz * 2, sz * 2)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    const sync = () => {
      const run = !still && inView && !document.hidden
      if (run && !raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      } else if (!run && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    layout()
    if (still) drawStill()

    let pending = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(() => {
        layout()
        if (still) drawStill()
      })
    })
    ro.observe(area)
    ro.observe(slot)
    ro.observe(canvas)

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting
        sync()
      },
      { rootMargin: '80px 0px', threshold: 0 },
    )
    io.observe(area)
    document.addEventListener('visibilitychange', sync)

    if (!still) {
      area.addEventListener('pointermove', onMove, { passive: true })
      area.addEventListener('pointerleave', onLeave, { passive: true })
      area.addEventListener('touchstart', onTouch, { passive: true })
      area.addEventListener('touchmove', onTouch, { passive: true })
      area.addEventListener('touchend', onLeave, { passive: true })
      area.addEventListener('touchcancel', onLeave, { passive: true })
    }

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(pending)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', sync)
      area.removeEventListener('pointermove', onMove)
      area.removeEventListener('pointerleave', onLeave)
      area.removeEventListener('touchstart', onTouch)
      area.removeEventListener('touchmove', onTouch)
      area.removeEventListener('touchend', onLeave)
      area.removeEventListener('touchcancel', onLeave)
    }
  }, [areaRef, slotRef])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />
}
