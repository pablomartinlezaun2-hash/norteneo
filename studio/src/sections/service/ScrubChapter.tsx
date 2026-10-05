import { useRef } from 'react'
import { useLang } from '@/i18n'
import { frameUrl, getMedia } from '@/lib/media'
import { gsap, MQ, useGSAP } from '@/lib/motion'
import { ImageSequence, type ImageSequenceHandle } from '@/components/ImageSequence'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead } from './ChapterHead'
import { ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'scrub' }>; id: string }

/**
 * Momento propio del servicio (único pin de la página): el scroll recorre una secuencia de fotogramas.
 * Contador de fotogramas del clip original, marcas de escena y línea de progreso.
 * Reduced motion: sin pin ni scrub, tres fotogramas clave fijos.
 */
export function ScrubChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const seq = useRef<ImageSequenceHandle>(null)
  const counter = useRef<HTMLSpanElement>(null)
  const tag = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const end = chapter.to ?? 1
  const marks = chapter.marks ?? []
  const total = chapter.frames
  const entry = getMedia(chapter.media)

  const frameOf = (p: number) => Math.round(p * end * ((total ?? 1) - 1)) + 1
  const pad = (n: number) => String(n).padStart(String(total ?? 0).length, '0')
  const counterText = (p: number) => (total ? `${t.frame} ${pad(frameOf(p))} / ${total}` : '')
  const markAt = (p: number) => {
    let label = ''
    for (const m of marks) if (p >= m.at) label = m.label[lang]
    return label
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        const proxy = { p: 0 }
        let lastTag: string | null = null
        let lastCount = ''
        const update = () => {
          const p = proxy.p
          seq.current?.render(p * end)
          const c = counterText(p)
          if (counter.current && c !== lastCount) {
            lastCount = c
            counter.current.textContent = c
          }
          const label = markAt(p)
          if (tag.current && label !== lastTag) {
            lastTag = label
            tag.current.textContent = label ? `[ ${label} ]` : ''
          }
          if (bar.current) bar.current.style.transform = `scaleX(${p})`
        }
        gsap.to(proxy, {
          p: 1,
          ease: 'none',
          onUpdate: update,
          scrollTrigger: { trigger: stage.current, start: 'top top', end: '+=170%', pin: true, scrub: 0.4 },
        })
        update()
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  const head = `${id}-title`
  const first = markAt(0)
  const desk = entry?.seq?.desktop

  return (
    <section ref={root} aria-labelledby={head}>
      {/* Movimiento: escenario a pantalla completa, fijado mientras dura el recorrido */}
      <div className="motion-reduce:hidden">
        <div ref={stage} className="relative h-[100svh] overflow-hidden bg-ink">
          <div className="absolute inset-0">
            <ImageSequence ref={seq} media={chapter.media} label={chapter.label[lang]} fit="cover" className="h-full w-full" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-black via-black/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="container-x grid items-end gap-6 pb-8 md:grid-cols-12 md:gap-10 md:pb-12">
              <div className="md:col-span-7">
                <h2 id={head} className="type-display max-w-[14ch]">
                  {chapter.claim[lang]}
                </h2>
                <p className="type-body mt-4 max-w-[46ch] text-paper/80 md:type-lead md:mt-5">{chapter.text[lang]}</p>
              </div>
              <div className="flex flex-col gap-1 md:col-span-5 md:items-end md:text-right">
                {total && (
                  <span ref={counter} className="type-meta text-paper" aria-hidden="true">
                    {counterText(0)}
                  </span>
                )}
                <span ref={tag} className="type-meta min-h-[1.4em] text-paper/80" aria-hidden="true">
                  {first ? `[ ${first} ]` : ''}
                </span>
                {chapter.proof && <Meta>{chapter.proof[lang]}</Meta>}
                <Meta>{t.ai}</Meta>
              </div>
            </div>
            <div aria-hidden="true" className="h-px bg-line">
              <div ref={bar} className="h-px origin-left scale-x-0 bg-paper/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Reduced motion: fotogramas clave fijos, sin pin ni scrub */}
      <div className="hidden motion-reduce:block">
        <div className="container-x py-24 md:py-32">
          <ChapterHead id={`${id}-reduced`} claim={chapter.claim[lang]} text={chapter.text[lang]} proof={chapter.proof?.[lang]} />
          {desk && (
            <ul className="mt-12 grid gap-6 md:grid-cols-3 md:gap-4" aria-label={chapter.label[lang]}>
              {chapter.stills.map((p) => {
                const caption = total ? `${t.frame} ${frameOf(p)}` : markAt(p)
                return (
                  <li key={p}>
                    <img
                      src={frameUrl(desk, Math.round(p * end * (desk.count - 1)))}
                      alt={caption}
                      width={desk.w}
                      height={desk.h}
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full bg-surface object-cover"
                    />
                    <p className="mt-3">
                      <Meta>{caption}</Meta>
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-6">
            <Meta>{t.ai}</Meta>
          </p>
        </div>
      </div>
    </section>
  )
}
