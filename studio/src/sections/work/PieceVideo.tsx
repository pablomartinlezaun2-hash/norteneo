import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/i18n'
import { getMedia, type MediaId } from '@/lib/media'
import { useMediaQuery, useReducedMotion } from '@/hooks/useMediaQuery'

/**
 * Vídeo de una pieza de la colección (variante local de components/Video):
 * - póster primero y preload=none;
 * - con ratón: se reproduce al pasar por encima (o al enfocar la pieza con teclado);
 * - en táctil: se reproduce cuando la pieza cruza el centro de la pantalla;
 * - exclusivo: solo suena una pieza a la vez en toda la página;
 * - reduced-motion: póster quieto con botón de reproducir.
 */

let current: HTMLVideoElement | null = null
function claim(v: HTMLVideoElement) {
  if (current && current !== v) current.pause()
  current = v
}

const ui = {
  es: { pause: 'Pausar vídeo', play: 'Reproducir vídeo' },
  en: { pause: 'Pause video', play: 'Play video' },
}

type Props = {
  media: MediaId
  label: string
  /** La pieza tiene el puntero encima o el foco dentro */
  hovered: boolean
  className?: string
  fit?: 'cover' | 'contain'
}

export function PieceVideo({ media, label, hovered, className = '', fit = 'cover' }: Props) {
  const lang = useLang()
  const reduce = useReducedMotion()
  const touch = useMediaQuery('(hover: none)')
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [centered, setCentered] = useState(false)
  const [playing, setPlaying] = useState(false)
  /** Decisión explícita del usuario con el botón: null = automático */
  const [manual, setManual] = useState<null | 'play' | 'pause'>(null)
  const m = getMedia(media)

  // En táctil: banda central de la pantalla
  useEffect(() => {
    const el = wrapRef.current
    if (!el || !touch) return
    const io = new IntersectionObserver(([e]) => setCentered(e.isIntersecting), { rootMargin: '-42% 0px -42% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [touch])

  const auto = !reduce && (touch ? centered : hovered)
  const want = manual === 'play' ? true : manual === 'pause' ? false : auto

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (want) {
      claim(v)
      v.play().catch(() => setPlaying(false))
    } else if (!v.paused) {
      v.pause()
    }
  }, [want])

  // Al salir del hover o del centro, vuelve el modo automático
  useEffect(() => {
    if (!auto && manual === 'pause') setManual(null)
  }, [auto, manual])

  if (!m) return <div className={`bg-surface ${className}`} role="img" aria-label={label} />

  const h264 = m.sources.filter((s) => s.codec === 'h264')
  const av1 = m.sources.find((s) => s.codec === 'av1')
  const objectFit = fit === 'cover' ? 'object-cover' : 'object-contain'

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    setManual(v.paused ? 'play' : 'pause')
  }

  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-ink ${className}`}>
      <picture>
        <source type="image/avif" srcSet={m.poster.avif} />
        <img
          src={m.poster.jpg}
          alt=""
          width={m.poster.w}
          height={m.poster.h}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full ${objectFit}`}
        />
      </picture>
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full ${objectFit} transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${playing ? 'opacity-100' : 'opacity-0'}`}
        muted
        playsInline
        loop
        preload="none"
        aria-label={label}
        disablePictureInPicture
        onPlaying={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false)
          if (current === videoRef.current) current = null
        }}
      >
        {av1 && <source src={av1.src} type={av1.type} />}
        {h264[1] && <source src={h264[1].src} type="video/mp4" media="(max-width: 900px)" />}
        {h264[0] && <source src={h264[0].src} type="video/mp4" />}
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? ui[lang].pause : ui[lang].play}
        className="absolute right-3 bottom-3 z-20 grid size-11 place-items-center rounded-full border border-line-strong bg-black/50 text-paper transition-colors hover:bg-black/80"
      >
        {playing ? (
          <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
            <rect x="1" y="1" width="3" height="12" rx="1" fill="currentColor" />
            <rect x="8" y="1" width="3" height="12" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
            <path d="M2 1.5v11l9-5.5z" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  )
}
