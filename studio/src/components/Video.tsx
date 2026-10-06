import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react'
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
  /** Acceso al <video> interno (velocidad, tiempo, play/pause externos) */
  videoRef?: Ref<HTMLVideoElement | null>
}

const ui = {
  es: { pause: 'Pausar vídeo', play: 'Reproducir vídeo', soundOn: 'Activar sonido', soundOff: 'Silenciar' },
  en: { pause: 'Pause video', play: 'Play video', soundOn: 'Sound on', soundOff: 'Mute' },
}

let current: HTMLVideoElement | null = null
function claim(v: HTMLVideoElement) {
  if (current && current !== v) current.pause()
  current = v
}

/** Solo suena un vídeo a la vez: el que toma el sonido silencia al anterior (el sonido sigue al usuario). */
let speaking: HTMLVideoElement | null = null
function takeSound(v: HTMLVideoElement) {
  if (speaking && speaking !== v && !speaking.muted) speaking.muted = true
  speaking = v
}

/** ¿Ha tocado ya el usuario la página? Con ese gesto el navegador deja activar el sonido. */
const hasGesture = () => (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? false

/**
 * Vídeo de marca: póster AVIF/JPG (LCP) + fuentes AV1/H.264, autoplay en vista,
 * pausa fuera de pantalla, botón de pausa accesible y respeto a prefers-reduced-motion.
 * Los clips con sonido suenan por defecto (si el navegador lo permite) y solo uno a la vez:
 * el que el usuario tiene delante. Botón para silenciar y activar el sonido.
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
  videoRef: externalRef,
}: Props) {
  const lang = useLang()
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useImperativeHandle(externalRef, () => videoRef.current as HTMLVideoElement, [])
  const [shown, setShown] = useState(false)
  const [paused, setPaused] = useState(true)
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)
  const [userPaused, setUserPaused] = useState(false)
  // Los clips con sonido intentan sonar por defecto. Si el navegador bloquea el autoplay con sonido,
  // arrancan silenciados y el sonido se activa con el primer toque o tecla del usuario en la página.
  const [muted, setMuted] = useState(true)
  const userMuted = useRef(false)
  const [active, setActive] = useState<MediaEntry | undefined>(() => getMedia(media))
  // Hasta montar (y resolver la variante vertical) no se precarga nada: evita bajar dos vídeos en móvil
  const [mounted, setMounted] = useState(false)
  const land = getMedia(media)
  const port = portrait ? getMedia(portrait) : undefined

  // Art direction en cliente: vertical si la pantalla es alta
  useEffect(() => {
    setMounted(true)
    if (!port) return
    const mql = window.matchMedia('(max-aspect-ratio: 4/5)')
    const pick = () => setActive(mql.matches ? port : land)
    pick()
    mql.addEventListener('change', pick)
    return () => mql.removeEventListener('change', pick)
  }, [land, port])

  // Al cambiar de variante el <video> se vuelve a crear silenciado
  useEffect(() => setMuted(true), [active])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1]
      visibleRef.current = e.isIntersecting && e.intersectionRatio > 0.25
      setVisible(visibleRef.current)
    }, {
      threshold: [0, 0.25, 0.5],
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const withSound = Boolean(active?.audio)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const shouldPlay = play === 'inview' && visible && !reduce && !userPaused
    if (shouldPlay) {
      if (exclusive) claim(v)
      if (withSound && !userMuted.current) {
        v.muted = false
        v.play()
          .then(() => {
            takeSound(v)
            setMuted(false)
          })
          .catch((err: unknown) => {
            // Solo si el navegador bloquea el sonido (NotAllowedError). Un AbortError significa que otro
            // vídeo ha tomado el relevo y lo ha pausado: entonces no hay que volver a reproducirlo.
            if ((err as DOMException | undefined)?.name !== 'NotAllowedError') return
            // Autoplay con sonido bloqueado: sigue en silencio hasta el primer gesto
            v.muted = true
            setMuted(true)
            v.play().catch(() => setPaused(true))
          })
      } else {
        v.play().catch(() => setPaused(true))
      }
    } else if (!v.paused && play === 'inview' && (!visible || reduce)) {
      v.pause()
    }
  }, [visible, reduce, userPaused, play, exclusive, active, withSound])

  // Primer gesto en la página (fuera de los controles del vídeo): activa el sonido si sigue bloqueado
  useEffect(() => {
    if (!withSound) return
    const unlock = (e: Event) => {
      const v = videoRef.current
      if (!v || userMuted.current || !visibleRef.current) return
      if (wrapRef.current?.contains(e.target as Node)) return
      if (!v.paused && v.muted) {
        v.muted = false
        takeSound(v)
        setMuted(false)
      }
    }
    const opts = { capture: true, passive: true } as const
    window.addEventListener('pointerdown', unlock, opts)
    window.addEventListener('keydown', unlock, opts)
    return () => {
      window.removeEventListener('pointerdown', unlock, opts)
      window.removeEventListener('keydown', unlock, opts)
    }
  }, [withSound])

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

  const toggleSound = () => {
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    setMuted(next)
    userMuted.current = next
    if (!next) {
      takeSound(v)
      setUserPaused(false)
      if (exclusive) claim(v)
      if (v.paused) v.play().catch(() => undefined)
    }
  }

  const sound = withSound
  const pos = { br: 'right-4 bottom-4 flex-row-reverse', bl: 'left-4 bottom-4', tr: 'right-4 top-4 flex-row-reverse' }[controlsPosition]
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
        preload={priority && mounted && !reduce ? 'auto' : 'none'}
        aria-label={label}
        disablePictureInPicture
        onPlaying={(e) => {
          const v = e.currentTarget
          // Reproducido al pasar el ratón o con el botón: suena si el usuario ya ha tocado la página
          if (withSound && !userMuted.current && v.muted && hasGesture()) v.muted = false
          if (!v.muted) takeSound(v)
          setShown(true)
          setPaused(false)
          setMuted(v.muted)
          onPlayingChange?.(true)
        }}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        onPause={() => {
          setPaused(true)
          onPlayingChange?.(false)
        }}
      >
        {av1 && <source src={av1.src} type={av1.type} />}
        {small && <source src={small.src} type="video/mp4" media="(max-width: 900px)" />}
        {big && <source src={big.src} type="video/mp4" />}
      </video>
      {(controls || sound) && (
        <div className={`absolute ${pos} z-10 flex items-center gap-2`}>
          {controls && (
            <button
              type="button"
              onClick={toggle}
              aria-label={`${paused ? ui[lang].play : ui[lang].pause}: ${label}`}
              className="grid size-11 place-items-center rounded-full border border-line-strong bg-black/40 text-paper backdrop-blur-sm transition-colors hover:bg-black/70"
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
          {sound && (
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={!muted}
              aria-label={`${ui[lang].soundOn}: ${label}`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-black/40 px-4 text-[0.8125rem] font-[500] whitespace-nowrap text-paper backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1.5 5h2.5L8 1.5v11L4 9H1.5z" fill="currentColor" stroke="none" />
                {muted ? <path d="m11 5 4 4m0-4-4 4" /> : <path d="M11 4.5a3.5 3.5 0 0 1 0 5M12.8 2.5a6.2 6.2 0 0 1 0 9" />}
              </svg>
              <span aria-hidden="true">{muted ? ui[lang].soundOn : ui[lang].soundOff}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
