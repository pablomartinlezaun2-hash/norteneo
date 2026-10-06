import { useLang } from '@/i18n'
import { Video } from '@/components/Video'
import { PhoneFrame } from '@/components/PhoneFrame'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'phone' }>; id: string }

/** Pieza vertical en marco de móvil. La etiqueta IA va al pie, fuera de la pantalla, para no tapar la pieza. */
export function PhoneChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const head = `${id}-title`
  return (
    <ChapterShell labelledBy={head}>
      <div className="grid items-center gap-12 md:grid-cols-12 md:gap-10">
        <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} proof={chapter.proof?.[lang]} className="md:col-span-7 lg:col-span-6" compact />
        <figure className="md:col-span-5 lg:col-span-4 lg:col-start-9">
          <PhoneFrame className="mx-auto w-[min(60vw,280px)] md:w-full md:max-w-[300px]">
            <Video media={chapter.media} label={chapter.label[lang]} controls exclusive className="h-full w-full" />
          </PhoneFrame>
          <figcaption className="mt-5 flex flex-col items-center gap-1 text-center">
            <Meta>{chapter.meta[lang]}</Meta>
            {chapter.ai && <Meta>{t.ai}</Meta>}
          </figcaption>
        </figure>
      </div>
    </ChapterShell>
  )
}
