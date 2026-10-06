import { useLang } from '@/i18n'
import { getMedia } from '@/lib/media'
import { Video } from '@/components/Video'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'video' }>; id: string }

/** Capítulo con una pieza en vídeo (reproducción en vista, un vídeo a la vez, botón de pausa). */
export function VideoChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const head = `${id}-title`
  const port = getMedia(chapter.media)?.orient === 'port'
  return (
    <ChapterShell labelledBy={head}>
      <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
        <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} proof={chapter.proof?.[lang]} className="lg:order-2 lg:col-span-5" compact />
        <figure className="lg:order-1 lg:col-span-7">
          <Video
            media={chapter.media}
            label={chapter.label[lang]}
            controls
            exclusive
            className={port ? 'mx-auto aspect-[9/16] w-full max-w-sm' : 'aspect-[4/3] w-full sm:aspect-video'}
          />
          <figcaption className="mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1">
            <Meta>{chapter.meta[lang]}</Meta>
            {chapter.ai && <Meta>{t.ai}</Meta>}
          </figcaption>
        </figure>
      </div>
    </ChapterShell>
  )
}
