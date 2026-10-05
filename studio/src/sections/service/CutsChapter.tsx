import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLang } from '@/i18n'
import { Video } from '@/components/Video'
import { PhoneFrame } from '@/components/PhoneFrame'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { Segmented } from './Segmented'
import { ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'cuts' }>; id: string }

const ZOOM = { full: 1, close: 1.35, feed: 1 } as const
/** Franja negra arriba y abajo para dejar a la vista un 4:5 dentro de la pantalla 9:19,5 del marco */
const FEED_BAR = '21%'

/**
 * Mismo clip, tres montajes: cambian de verdad la velocidad (playbackRate) y el encuadre
 * (zoom o recorte 4:5), y se explica con honestidad que en una edición real cambia mucho más.
 */
export function CutsChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const head = `${id}-title`
  const [current, setCurrent] = useState(0)
  const cut = chapter.cuts[current]
  const screen = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const v = screen.current?.querySelector('video')
    if (!v) return
    const apply = () => {
      v.defaultPlaybackRate = cut.rate
      v.playbackRate = cut.rate
    }
    apply()
    v.addEventListener('loadedmetadata', apply)
    v.addEventListener('playing', apply)
    return () => {
      v.removeEventListener('loadedmetadata', apply)
      v.removeEventListener('playing', apply)
    }
  }, [cut.rate])

  const bar = cut.frame === 'feed' ? FEED_BAR : '0%'
  const ease = 'cubic-bezier(0.16,1,0.3,1)'

  return (
    <ChapterShell labelledBy={head}>
      <div className="grid items-center gap-12 md:grid-cols-12 md:gap-10">
        <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} className="md:col-span-7 lg:col-span-6">
          <Segmented className="mt-10" label={t.cutsGroup} options={chapter.cuts.map((c) => c.name[lang])} value={current} onChange={setCurrent} />
          <div aria-live="polite" className="mt-5 min-h-[4.5em]">
            <p className="type-meta text-paper">[ {cut.meta[lang]} ]</p>
            <p className="type-body mt-2 text-paper/85">{cut.text[lang]}</p>
          </div>
          <p className="type-small measure mt-6 hidden text-mute md:block">{chapter.note[lang]}</p>
        </ChapterHead>

        <figure className="md:col-span-5 lg:col-span-5 lg:col-start-8">
          <PhoneFrame className="mx-auto w-[min(60vw,300px)] md:w-full md:max-w-[320px]">
            <div
              ref={screen}
              className="absolute inset-0"
              style={{ '--zoom': ZOOM[cut.frame] } as CSSProperties}
            >
              <Video
                media={chapter.media}
                label={chapter.label[lang]}
                controls
                exclusive
                className="h-full w-full [&_img]:[scale:var(--zoom)] [&_img]:transition-[scale] [&_img]:duration-700 [&_img]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_video]:[scale:var(--zoom)] [&_video]:transition-[scale,opacity] [&_video]:duration-700 [&_video]:ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:[&_img]:transition-none motion-reduce:[&_video]:transition-none"
              />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-[5] bg-black transition-[height] duration-700 motion-reduce:transition-none"
              style={{ height: bar, transitionTimingFunction: ease }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 z-[5] bg-black transition-[height] duration-700 motion-reduce:transition-none"
              style={{ height: bar, transitionTimingFunction: ease }}
            />
          </PhoneFrame>
          <figcaption className="mt-5 flex flex-col items-center gap-1 text-center">
            {chapter.proof && <Meta>{chapter.proof[lang]}</Meta>}
            <Meta>{t.ai}</Meta>
            <span className="type-small measure mt-5 text-left text-mute md:hidden">{chapter.note[lang]}</span>
          </figcaption>
        </figure>
      </div>
    </ChapterShell>
  )
}
