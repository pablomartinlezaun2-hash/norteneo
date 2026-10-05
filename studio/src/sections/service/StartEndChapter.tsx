import { useLang } from '@/i18n'
import { frameUrl, getMedia, type Sequence } from '@/lib/media'
import { BeforeAfter } from '@/components/BeforeAfter'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'start-end' }>; id: string }

/** Método start-frame / end-frame: comparador entre el primer y el último fotograma de la secuencia. */
export function StartEndChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const seq = getMedia(chapter.media)?.seq
  const head = `${id}-title`

  const frame = (at: 'first' | 'last', alt: string) => {
    if (!seq) return null
    const n = (s: Sequence) => (at === 'first' ? 0 : s.count - 1)
    return (
      <picture>
        <source media="(max-width: 767.98px)" srcSet={frameUrl(seq.mobile, n(seq.mobile))} />
        <img
          src={frameUrl(seq.desktop, n(seq.desktop))}
          alt={alt}
          width={seq.desktop.w}
          height={seq.desktop.h}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </picture>
    )
  }

  return (
    <ChapterShell labelledBy={head}>
      <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
        <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} className="lg:col-span-5" />
        <div className="lg:col-span-7">
          {seq && (
            <BeforeAfter
              before={frame('first', t.startFrame)}
              after={frame('last', t.endFrame)}
              labels={{ before: t.startFrame, after: t.endFrame }}
              ariaLabel={t.compare}
              className="aspect-[4/5] w-full md:aspect-video"
            />
          )}
          <p className="mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1">
            {chapter.proof && <Meta>{chapter.proof[lang]}</Meta>}
            <Meta>{t.ai}</Meta>
          </p>
        </div>
      </div>
    </ChapterShell>
  )
}
