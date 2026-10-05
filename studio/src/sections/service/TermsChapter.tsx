import { useLang } from '@/i18n'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { dashedTop } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'terms' }>; id: string }

/** Capítulo tipográfico: afirmación a la izquierda y lista de términos con hairlines discontinuas. */
export function TermsChapter({ chapter, id }: Props) {
  const lang = useLang()
  const head = `${id}-title`
  return (
    <ChapterShell labelledBy={head}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} proof={chapter.proof?.[lang]} className="lg:col-span-5" />
        <div className="lg:col-span-6 lg:col-start-7 lg:self-end">
          <dl>
          {chapter.items.map((item, i) => (
            <div key={i} style={dashedTop} className="py-6 md:py-7">
              <dt className="type-title">{item.term[lang]}</dt>
              <dd className="type-body mt-2 max-w-[48ch] text-mute">{item.text[lang]}</dd>
            </div>
          ))}
          </dl>
          {chapter.note && (
            <p className="pt-4" style={dashedTop}>
              <Meta>{chapter.note[lang]}</Meta>
            </p>
          )}
        </div>
      </div>
    </ChapterShell>
  )
}
