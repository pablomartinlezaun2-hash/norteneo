import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { getMedia, type MediaEntry, type MediaId } from '@/lib/media'
import { useLang } from '@/i18n'
import { useReducedMotion } from '@/hooks/useMediaQuery'

type Props = {
  /** Clip principal (ver lib/media.ts) */
  media: MediaId
  /** Clip alternativo para pantallas verticales (art direction), p. ej. reel-port */
  portrait?: MediaId
  /** 'inview' reproduce al entrar en pantalla y pausa al salir; 'manual' solo con el botón */
  play?: 'inview' | 'manual'
  /** Solo un vídeo "exclusive" se reproduce a la vez en toda la página */
  exclusive?: boolean
  loop?: boolean
  /** Prioridad de carga del póster (solo para el LCP del hero) */
  priority?: boolean
  fit?: 'cover' | 'contain'
  /** Texto accesible que describe el vídeo */
  label: string
  /** Mostrar botón de pausa/reproducción (obligatorio si se reproduce sola más de 5 s) */
  controls?: boolean
  controlsPosition?: 'br' | 'bl' | 'tr'
  className?: string
  style?: CSSProperties
  onPlayingChange?: (playing: boolean) => void
}

const ui = {
  es: { pause: 'Pausar vídeo', play: 'Reproducir vídeo' },
  en: { pause: 'Pause video', play: 'Play video' },
}

let current: HTMLVideoElement | null = null
function claim(v: HTMLVideoElement) {
  if (current && current !== v) current.pause()
  current = v
}

/**
 * Vídeo de marca: póster AVIF/JPG (LCP) + fuentes AV1/H.264, autoplay silencioso en vista,
 * pausa fuera de pantalla, botón de pausa accesible y respeto a prefers-reduced-motion.
 */
export function Video({
  media,
  portrait,
  play = 'inview',
  exclusive = false,
  loop = true,
  priority = false,
  fit = 'cover',
  label,
  controls = true,
  controlsPosition = 'br',
  className = '',
  style,
  onPlayingChange,
}: Props) {
  const lang = useLang()
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shown, setShown] = useState(false)
  const [paused, setPaused] = useState(true)
  const [visible, setVisible] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [active, setActive] = useState<MediaEntry | undefined>(() => getMedia(media))
  const land = getMedia(media)
  const port = portrait ? getMedia(portrait) : undefined

  // Art direction en cliente: vertical si la pantalla es alta
  useEffect(() => {
    if (!port) return
    const mql = window.matchMedia('(max-aspect-ratio: 4/5)')
    const pick = () => setActive(mql.matches ? port : land)
    pick()
    mql.addEventListener('change', pick)
    return () => mql.removeEventListener('change', pick)
  }, [land, port])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && e.intersectionRatio > 0.25), {
      threshold: [0, 0.25, 0.5],
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const shouldPlay = play === 'inview' && visible && !reduce && !userPaused
    if (shouldPlay) {
      if (exclusive) claim(v)
      v.play().catch(() => setPaused(true))
    } else if (!v.paused && play === 'inview' && (!visible || reduce)) {
      v.pause()
    }
  }, [visible, reduce, userPaused, play, exclusive, active])

  if (!land || !active) {
    return <div className={`bg-surface ${className}`} style={style} role="img" aria-label={label} />
  }

  const h264 = active.sources.filter((s) => s.codec === 'h264')
  const av1 = active.sources.find((s) => s.codec === 'av1')
  const big = h264[0]
  const small = h264[1]

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      setUserPaused(false)
      if (exclusive) claim(v)
      v.play().catch(() => undefined)
    } else {
      setUserPaused(true)
      v.pause()
    }
  }

  const pos = { br: 'right-4 bottom-4', bl: 'left-4 bottom-4', tr: 'right-4 top-4' }[controlsPosition]
  const objectFit = fit === 'cover' ? 'object-cover' : 'object-contain'

  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-ink ${className}`} style={style}>
      <picture>
        {port && <source media="(max-aspect-ratio: 4/5)" type="image/avif" srcSet={port.poster.avif} />}
        {port && <source media="(max-aspect-ratio: 4/5)" srcSet={port.poster.jpg} />}
        <source type="image/avif" srcSet={land.poster.avif} />
        <img
          src={land.poster.jpg}
          alt=""
          width={land.poster.w}
          height={land.poster.h}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className={`absolute inset-0 h-full w-full ${objectFit}`}
        />
      </picture>
      <video
        key={active.id}
        ref={videoRef}
        className={`absolute inset-0 h-full w-full ${objectFit} transition-opacity duration-500 ${shown ? 'opacity-100' : 'opacity-0'}`}
        muted
        playsInline
        loop={loop}
        preload={priority ? 'auto' : 'none'}
        aria-label={label}
        disablePictureInPicture
        onPlaying={() => {
          setShown(true)
          setPaused(false)
          onPlayingChange?.(true)
        }}
        onPause={() => {
          setPaused(true)
          onPlayingChange?.(false)
        }}
      >
        {av1 && <source src={av1.src} type={av1.type} />}
        {small && <source src={small.src} type="video/mp4" media="(max-width: 900px)" />}
        {big && <source src={big.src} type="video/mp4" />}
      </video>
      {controls && (
        <button
          type="button"
          onClick={toggle}
          aria-label={paused ? ui[lang].play : ui[lang].pause}
          className={`absolute ${pos} z-10 grid size-11 place-items-center rounded-full border border-line-strong bg-black/40 text-paper backdrop-blur-sm transition-colors hover:bg-black/70`}
        >
          {!paused ? (
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
      )}
    </div>
  )
}
