import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { cases, sectors, type Case } from '@/content/cases'
import { Video } from '@/components/Video'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { dashedTop, ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'sites' }>; id: string; anchorId?: string }

const host = (url: string) => new URL(url).host.replace(/^www\./, '')

/**
 * Webs en producción (casos de cliente con URL real), cada una con "Visitar web" en pestaña nueva.
 * Preparado para las grabaciones de pantalla: cuando un caso tenga `media`, aparece una columna fija
 * con la grabación de la web que esté en el centro de la pantalla.
 */
export function SitesChapter({ chapter, id, anchorId }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const head = `${id}-title`
  const sites = cases.filter((c) => c.kind === 'client' && c.url && c.services.includes('websites'))
  const ours = cases.filter((c) => c.services.includes('websites') && !c.url)
  const withMedia = sites.some((s) => s.media)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (!withMedia || !listRef.current) return
    const rows = [...listRef.current.querySelectorAll<HTMLElement>('[data-site]')]
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.site))),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    rows.forEach((r) => io.observe(r))
    return () => io.disconnect()
  }, [withMedia])

  const recording = sites[active]?.media ?? sites.find((s) => s.media)?.media

  return (
    <ChapterShell labelledBy={head} id={anchorId}>
      <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} proof={chapter.proof?.[lang]} />
      <div className={`mt-14 md:mt-20 ${withMedia ? 'grid gap-12 lg:grid-cols-12 lg:gap-10' : ''}`}>
        <div className={withMedia ? 'lg:col-span-7' : ''}>
          <ol ref={listRef}>
            {sites.map((s, i) => (
              <SiteRow key={s.slug} site={s} index={i} active={withMedia && i === active} />
            ))}
          </ol>
          {ours.length > 0 && (
            <div className="mt-14">
              <h3 className="type-meta text-mute">{t.alsoOurs}</h3>
              <ul className="mt-4">
                {ours.map((c) => (
                  <li key={c.slug} style={dashedTop} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-5">
                    <span className="type-title">{c.title}</span>
                    <span className="type-small text-mute">{c.line[lang]}</span>
                    <Link to={to.case(lang, c.slug)} viewTransition className="inline-flex min-h-11 items-center text-[0.9375rem] font-[480] text-accent hover:underline">
                      {t.seeCase}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {withMedia && recording && (
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-[calc(var(--nav-h)+5rem)]">
              <Video key={recording} media={recording} label={sites[active]?.title ?? ''} controls exclusive className="aspect-[16/10] w-full" />
            </div>
          </div>
        )}
      </div>
    </ChapterShell>
  )
}

function SiteRow({ site, index, active }: { site: Case; index: number; active: boolean }) {
  const lang = useLang()
  const t = ui[lang]
  return (
    <li data-site={index} style={dashedTop} className="grid gap-x-8 gap-y-2 py-6 md:grid-cols-12 md:items-baseline md:py-7">
      <span className={`type-title md:col-span-5 ${active ? 'text-paper' : ''}`}>{site.title}</span>
      <span className="type-small text-mute md:col-span-4">
        {sectors[site.sector][lang]} · {site.line[lang]}
      </span>
      <span className="flex flex-wrap items-center justify-between gap-x-6 md:col-span-3 md:flex-col md:items-end md:gap-0">
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-[480] text-accent"
          aria-label={`${t.visit}: ${site.title} (${t.newTab})`}
        >
          <span className="underline-offset-4 group-hover:underline">{t.visit}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            <path d="M2 8 8 2M3.5 2H8v4.5" />
          </svg>
        </a>
        <Meta>{host(site.url!)}</Meta>
      </span>
    </li>
  )
}
