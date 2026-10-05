import { Fragment, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'
import { LEGAL, to, type LegalId } from '@/i18n/paths'
import { site } from '@/content/site'
import { legalDocs, legalOrder, type LegalBlock } from '@/content/legal'
import { Seo } from '@/components/Seo'
import { Missing } from '@/sections/work/Missing'

const TOKEN = /(\[(?:PENDIENTE|PENDING):[^\]]+\]|\{email\}|\{doc:[a-z]+\|[^}]+\}|\{ext:[^|]+\|[^}]+\})/g

/** Marcador de dato pendiente: claramente visible, pero dentro del sistema (sin colores nuevos). */
function Pending({ children }: { children: ReactNode }) {
  return <mark className="rounded-[0.3rem] bg-surface-2 px-1.5 py-0.5 text-paper outline-1 outline-line-strong outline-dashed">{children}</mark>
}

/** Convierte el marcado ligero de los textos legales en nodos. */
function rich(text: string, lang: Lang): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null
    if (/^\[(PENDIENTE|PENDING):/.test(part)) return <Pending key={i}>{part}</Pending>
    if (part === '{email}') {
      return site.email ? (
        <a key={i} href={`mailto:${site.email}`} className="text-paper underline underline-offset-4 hover:text-accent">
          {site.email}
        </a>
      ) : (
        <Pending key={i}>{lang === 'es' ? '[PENDIENTE: email]' : '[PENDING: email]'}</Pending>
      )
    }
    const doc = part.match(/^\{doc:([a-z]+)\|([^}]+)\}$/)
    if (doc && doc[1] in LEGAL) {
      return (
        <Link key={i} to={to.legal(lang, doc[1] as LegalId)} viewTransition className="text-paper underline underline-offset-4 hover:text-accent">
          {doc[2]}
        </Link>
      )
    }
    const ext = part.match(/^\{ext:([^|]+)\|([^}]+)\}$/)
    if (ext) {
      return (
        <a key={i} href={ext[1]} target="_blank" rel="noopener noreferrer" className="text-paper underline underline-offset-4 hover:text-accent">
          {ext[2]}
        </a>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

function Block({ block, lang }: { block: LegalBlock; lang: Lang }) {
  if (typeof block === 'string') return <p className="type-body text-mute">{rich(block, lang)}</p>
  return (
    <ul className="type-body flex list-disc flex-col gap-2 pl-5 text-mute marker:text-dim">
      {block.list.map((item) => (
        <li key={item}>{rich(item, lang)}</li>
      ))}
    </ul>
  )
}

/** /legal/:doc · /en/legal/:doc → aviso legal, privacidad y cookies. Quieto, legible, a 65ch. */
export function Component() {
  const lang = useLang()
  const { doc = '' } = useParams()
  const id = (Object.keys(LEGAL) as LegalId[]).find((k) => LEGAL[k][lang] === doc)
  if (!id) return <Missing />
  const d = legalDocs[lang][id]
  const navLabel = lang === 'es' ? 'Documentos legales' : 'Legal documents'

  return (
    <>
      <Seo title={d.title} description={d.description} />
      <article className="container-x grid gap-12 pt-[calc(var(--nav-h)+clamp(3rem,9vw,7rem))] pb-24 md:pb-36 lg:grid-cols-12 lg:gap-10">
        <nav aria-label={navLabel} className="lg:order-2 lg:col-span-3 lg:col-start-10">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
            <p className="type-meta mb-3 hidden text-dim lg:block">{navLabel}</p>
            <ul className="-ml-4 flex flex-wrap gap-1 lg:ml-0 lg:flex-col lg:gap-0">
              {legalOrder.map((k) => {
                const current = k === id
                return (
                  <li key={k}>
                    <Link
                      to={to.legal(lang, k)}
                      viewTransition
                      aria-current={current ? 'page' : undefined}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.875rem] transition-colors lg:rounded-none lg:px-0 ${
                        current ? 'text-paper' : 'text-mute hover:text-paper'
                      }`}
                    >
                      <span aria-hidden="true" className={`size-1.5 rounded-full bg-accent ${current ? 'opacity-100' : 'opacity-0'}`} />
                      {legalDocs[lang][k].title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <div className="measure lg:order-1 lg:col-span-8">
          <h1 className="type-display">{d.title}</h1>
          <p className="type-lead mt-6 text-mute">{rich(d.intro, lang)}</p>

          <div className="mt-14 flex flex-col gap-12 md:mt-20">
            {d.sections.map((s) => (
              <section key={s.h} className="border-t border-line pt-8">
                <h2 className="text-[1.25rem] leading-snug font-[480] tracking-[-0.01em] text-paper [font-stretch:104%]">{s.h}</h2>
                <div className="mt-4 flex flex-col gap-4">
                  {s.body.map((b, i) => (
                    <Block key={i} block={b} lang={lang} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </article>
    </>
  )
}
