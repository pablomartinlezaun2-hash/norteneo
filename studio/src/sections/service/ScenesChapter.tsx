import { useState } from 'react'
import { useLang } from '@/i18n'
import { frameUrl, getMedia } from '@/lib/media'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { ui } from './copy'
import { Segmented } from './Segmented'

type Props = { chapter: Extract<Chapter, { kind: 'scenes' }>; id: string }

/** Un modelo, cada uso: el visitante elige un uso y ve el fotograma de la misma pieza que lo resuelve. */
export function ScenesChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const [current, setCurrent] = useState(0)
  const seq = getMedia(chapter.media)?.seq
  const head = `${id}-title`
  const scene = chapter.scenes[current]

  return (
    <ChapterShell labelledBy={head}>
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
        <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} className="lg:col-span-5">
          <Segmented
            className="mt-10"
            label={t.scenesGroup}
            options={chapter.scenes.map((s) => s.label[lang])}
            value={current}
            onChange={setCurrent}
          />
          <p className="type-body mt-5 min-h-[3.2em] text-paper/85" aria-live="polite">
            {scene.text[lang]}
          </p>
        </ChapterHead>
        <figure className="lg:col-span-7">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface md:aspect-video">
            {seq &&
              chapter.scenes.map((s, i) => (
                <picture key={i}>
                  <source media="(max-width: 767.98px)" srcSet={frameUrl(seq.mobile, Math.round(s.at * (seq.mobile.count - 1)))} />
                  <img
                    src={frameUrl(seq.desktop, Math.round(s.at * (seq.desktop.count - 1)))}
                    alt={i === current ? s.label[lang] : ''}
                    aria-hidden={i === current ? undefined : true}
                    width={seq.desktop.w}
                    height={seq.desktop.h}
                    loading="lazy"
                    decoding="async"
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                      i === current ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </picture>
              ))}
          </div>
          <figcaption className="mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1">
            {chapter.proof && <Meta>{chapter.proof[lang]}</Meta>}
            <Meta>{t.ai}</Meta>
          </figcaption>
        </figure>
      </div>
    </ChapterShell>
  )
}
