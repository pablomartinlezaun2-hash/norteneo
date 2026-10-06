import { useLang } from '@/i18n'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { dashedTop, ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'camera' }>; id: string }

/** Ficha de cámara: ajustes recomendados en tabla con hairlines discontinuas. */
export function CameraChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const head = `${id}-title`
  return (
    <ChapterShell labelledBy={head}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} proof={chapter.proof?.[lang]} className="lg:col-span-5" compact />
        <table className="w-full border-collapse text-left lg:col-span-6 lg:col-start-7">
          <caption className="sr-only">{chapter.proof?.[lang] ?? chapter.claim[lang]}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">{t.setting}</th>
              <th scope="col">{t.value}</th>
            </tr>
          </thead>
          <tbody>
            {chapter.rows.map((r, i) => (
              <tr key={i} style={dashedTop} className="align-baseline">
                <th scope="row" className="type-body w-[38%] py-5 pr-6 font-[450] text-mute sm:w-[34%]">
                  {r.label[lang]}
                </th>
                <td className="py-5">
                  <span className="type-title block">{r.value[lang]}</span>
                  {r.note && <span className="type-small mt-2 block text-mute">{r.note[lang]}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChapterShell>
  )
}
