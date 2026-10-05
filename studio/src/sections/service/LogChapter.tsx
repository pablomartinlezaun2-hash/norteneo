import { useLang } from '@/i18n'
import { getMedia } from '@/lib/media'
import { BeforeAfter } from '@/components/BeforeAfter'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'log' }>; id: string }

/**
 * Filtro que imita un perfil Log: negros levantados, contraste y saturación bajos.
 * Es una SIMULACIÓN rotulada como tal hasta que exista un par Log/etalonado real rodado con móvil.
 */
const LOG_LOOK = 'contrast(0.58) saturate(0.42) brightness(1.2) sepia(0.06)'

export function LogChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const head = `${id}-title`
  const m = getMedia(chapter.media)

  const still = (log: boolean) =>
    m ? (
      <>
        <picture>
          <source type="image/avif" srcSet={m.poster.avif} />
          <img
            src={m.poster.jpg}
            alt=""
            width={m.poster.w}
            height={m.poster.h}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            style={log ? { filter: LOG_LOOK } : undefined}
          />
        </picture>
        {/* Velo superior para que las etiquetas [ Log ] / [ Etalonado ] se lean sobre zonas claras */}
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/60 to-transparent" />
      </>
    ) : null

  return (
    <ChapterShell labelledBy={head}>
      <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} proof={chapter.proof?.[lang]} />
      {m && (
        <figure className="mt-12 md:mt-16">
          <div className="relative">
            <BeforeAfter
              before={still(true)}
              after={still(false)}
              labels={{ before: t.log, after: t.graded }}
              ariaLabel={`${t.logCompare} (${t.simulation})`}
              className="aspect-[4/5] w-full sm:aspect-video"
            />
            <span className="type-meta pointer-events-none absolute bottom-4 left-4 z-30 rounded-full bg-black/60 px-3 py-1.5 text-paper">[ {t.simulation} ]</span>
          </div>
          <figcaption className="mt-4 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-10">
            <span className="type-small measure text-mute">{chapter.note[lang]}</span>
            <Meta className="shrink-0">{t.ai}</Meta>
          </figcaption>
        </figure>
      )}
    </ChapterShell>
  )
}
