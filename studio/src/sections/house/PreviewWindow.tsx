import { useRef, useState } from 'react'
import type { Lang } from '@/i18n'
import { services, type ServiceId } from '@/content/services'
import { cases } from '@/content/cases'
import { getMedia } from '@/lib/media'
import { Video } from '@/components/Video'
import { Meta } from '@/components/Meta'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { gsap, MQ, prefersReducedMotion, useGSAP } from '@/lib/motion'
import { TypeComposition } from './TypeComposition'
import { houseCopy } from './copy'

const SHOWN = 'inset(0% 0% 0% 0%)'
const HIDDEN = 'inset(100% 0% 0% 0%)'

/** Título de la pieza que usa el clip del servicio (dato real de content/cases). */
export const pieceTitle = (media?: string) => (media ? cases.find((c) => c.media === media)?.title : undefined)

/**
 * Ventana fija de la columna derecha (solo escritorio).
 * Cada oficio tiene su capa; la activa sube encima y se revela con clip-path inset() 500 ms expo.out.
 * Solo la capa activa (y la saliente mientras dura el revelado) monta su <Video exclusive>.
 * Reduced-motion: cambio instantáneo y el <Video> queda en póster con botón de reproducir.
 */
export function PreviewWindow({ active, lang }: { active: ServiceId; lang: Lang }) {
  const t = houseCopy[lang]
  const scope = useRef<HTMLDivElement>(null)
  const desktop = useMediaQuery(MQ.desktop)
  const [initial] = useState(active)
  // Capa saliente: mantiene su vídeo montado hasta que la nueva termina de revelarse
  const [current, setCurrent] = useState(active)
  const [trailing, setTrailing] = useState<ServiceId | null>(null)
  if (current !== active) {
    setTrailing(current)
    setCurrent(active)
  }
  const z = useRef(1)

  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const layers = gsap.utils.toArray<HTMLElement>('[data-layer]', root)
      const layer = layers.find((l) => l.dataset.layer === active)
      if (!layer || active === initial && z.current === 1) return
      const level = ++z.current
      layer.dataset.z = String(level)
      const settle = () => {
        // Oculta todo lo que ha quedado por debajo de esta capa
        layers.forEach((l) => {
          if (Number(l.dataset.z ?? 0) < level) gsap.set(l, { clipPath: HIDDEN })
        })
        if (Number(layer.dataset.z) === z.current) setTrailing(null)
      }
      gsap.set(layer, { zIndex: level })
      if (prefersReducedMotion()) {
        gsap.set(layer, { clipPath: SHOWN })
        settle()
        return
      }
      gsap.fromTo(layer, { clipPath: HIDDEN }, { clipPath: SHOWN, duration: 0.5, ease: 'expo.out', overwrite: true, onComplete: settle })
    },
    { scope, dependencies: [active] },
  )

  const svc = services.find((s) => s.id === active)!
  const media = svc.media && getMedia(svc.media) ? svc.media : undefined
  const piece = pieceTitle(media)

  return (
    <div className="w-full max-w-[calc((100svh-var(--nav-h)-8rem)*0.8)]">
      <div ref={scope} className="relative isolate aspect-[4/5] overflow-hidden bg-ink outline outline-1 -outline-offset-1 outline-line">
        {services.map((s) => {
          const m = s.media ? getMedia(s.media) : undefined
          const isOn = s.id === current || s.id === trailing
          return (
            <div
              key={s.id}
              data-layer={s.id}
              data-z={s.id === initial ? 1 : 0}
              className="absolute inset-0"
              style={{ clipPath: s.id === initial ? SHOWN : HIDDEN, zIndex: s.id === initial ? 1 : 0 }}
            >
              {m ? (
                <>
                  <picture>
                    <source type="image/avif" srcSet={m.poster.avif} />
                    <img src={m.poster.jpg} alt="" width={m.poster.w} height={m.poster.h} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                  </picture>
                  {desktop && isOn && (
                    <Video media={s.media!} label={t.preview(s.name[lang])} exclusive controls fit="cover" className="absolute inset-0 size-full" />
                  )}
                </>
              ) : (
                <TypeComposition service={s} lang={lang} />
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-4 min-h-5">
        {media ? (
          <Meta>
            {piece ? `${piece} · ` : ''}
            {t.ai}
          </Meta>
        ) : (
          <Meta>{svc.name[lang]}</Meta>
        )}
      </p>
    </div>
  )
}
