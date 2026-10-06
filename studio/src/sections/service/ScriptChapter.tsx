import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/i18n'
import { Video } from '@/components/Video'
import { PhoneFrame } from '@/components/PhoneFrame'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'script' }>; id: string }

const tc = (s: number) => `00:${String(Math.floor(s)).padStart(2, '0')}`

/**
 * Del guion al feed: la pieza vertical junto a su guion. La línea activa se ilumina con el tiempo
 * del vídeo (timeupdate) y cada línea es un botón que salta a su momento.
 */
export function ScriptChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const head = `${id}-title`
  const screen = useRef<HTMLDivElement>(null)
  const [time, setTime] = useState(0)

  useEffect(() => {
    const v = screen.current?.querySelector('video')
    if (!v) return
    const sync = () => setTime(v.currentTime)
    v.addEventListener('timeupdate', sync)
    v.addEventListener('seeked', sync)
    return () => {
      v.removeEventListener('timeupdate', sync)
      v.removeEventListener('seeked', sync)
    }
  }, [])

  const active = chapter.lines.reduce((acc, l, i) => (time >= l.t ? i : acc), 0)

  const seek = (at: number) => {
    const v = screen.current?.querySelector('video')
    if (!v) return
    v.currentTime = at
    setTime(at)
    v.play().catch(() => undefined)
  }

  return (
    <ChapterShell labelledBy={head}>
      <div className="grid gap-12 md:grid-cols-12 md:gap-x-10 md:gap-y-12">
        <figure className="md:order-1 md:col-span-5 md:row-span-2 md:self-center lg:col-span-4 lg:col-start-2">
          <PhoneFrame className="mx-auto w-[min(56vw,260px)] md:w-full md:max-w-[300px]">
            <div ref={screen} className="absolute inset-0">
              <Video media={chapter.media} label={chapter.label[lang]} controls exclusive className="h-full w-full" />
            </div>
          </PhoneFrame>
          <figcaption className="mt-5 flex flex-col items-center gap-1 text-center">
            <Meta>{chapter.meta[lang]}</Meta>
            <Meta>{t.ai}</Meta>
          </figcaption>
        </figure>

        <div className="-order-1 md:order-2 md:col-span-7 md:self-end lg:col-span-6 lg:col-start-7">
          <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} compact />
        </div>

        <div className="md:order-3 md:col-span-7 md:self-start lg:col-span-6 lg:col-start-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
            <h3 className="type-meta text-paper">{t.script}</h3>
            {chapter.proof && <Meta>{chapter.proof[lang]}</Meta>}
          </div>
          <ol className="mt-2" aria-label={t.scriptHint}>
            {chapter.lines.map((l, i) => {
              const on = i === active
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => seek(l.t)}
                    aria-current={on ? 'true' : undefined}
                    className="grid min-h-11 w-full grid-cols-[3.75rem_minmax(0,1fr)] items-baseline gap-3 py-2.5 text-left"
                  >
                    <span className={`type-meta transition-colors duration-300 motion-reduce:transition-none ${on ? 'text-accent' : 'text-dim'}`}>{tc(l.t)}</span>
                    <span className={`type-body transition-colors duration-300 motion-reduce:transition-none ${on ? 'text-paper' : 'text-dim hover:text-mute'}`}>{l.text[lang]}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="type-small mt-4 text-mute">{t.scriptHint}</p>
        </div>
      </div>
    </ChapterShell>
  )
}
