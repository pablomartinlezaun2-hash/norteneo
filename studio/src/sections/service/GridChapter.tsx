import { useEffect, useState } from 'react'
import { useLang } from '@/i18n'
import { Meta } from '@/components/Meta'
import type { Chapter } from '@/content/services/types'
import { ChapterHead, ChapterShell } from './ChapterHead'
import { dashedTop, ui } from './copy'

type Props = { chapter: Extract<Chapter, { kind: 'grid' }>; id: string }

/** Valores reales de esta web (src/styles/global.css). */
const scale = [
  { cls: 'type-hero', name: { es: 'Hero', en: 'Hero' }, spec: '42–112 px · 380 · 118 %' },
  { cls: 'type-display', name: { es: 'Display', en: 'Display' }, spec: '35–76 px · 400 · 112 %' },
  { cls: 'type-title', name: { es: 'Título', en: 'Title' }, spec: '26–44 px · 450 · 106 %' },
  { cls: 'type-lead', name: { es: 'Entradilla', en: 'Lead' }, spec: '18–22 px · 400 · 100 %' },
  { cls: 'type-body', name: { es: 'Cuerpo', en: 'Body' }, spec: '17 px · 400 · 100 %' },
  { cls: 'type-meta', name: { es: 'Metadatos', en: 'Meta' }, spec: '13 px · 450 · 100 %' },
]

const legend = { es: 'tamaño · peso · anchura', en: 'size · weight · width' }
const curveSpec = 'expo.out · cubic-bezier(0.16, 1, 0.3, 1) · 500–800 ms'

/**
 * La web se demuestra a sí misma: un interruptor superpone la retícula de columnas a toda la página
 * y al lado se muestran la escala tipográfica y la curva de movimiento que usa.
 */
export function GridChapter({ chapter, id }: Props) {
  const lang = useLang()
  const t = ui[lang]
  const head = `${id}-title`
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (!on) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOn(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [on])

  return (
    <ChapterShell labelledBy={head}>
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <ChapterHead id={head} claim={chapter.claim[lang]} text={chapter.text[lang]} proof={chapter.proof?.[lang]} className="lg:col-span-5">
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => setOn((v) => !v)}
            className="mt-10 inline-flex min-h-11 items-center gap-3 rounded-full border border-line-strong py-1 pr-5 pl-2 text-[0.9375rem] font-[480] transition-colors hover:border-paper"
          >
            <span aria-hidden="true" className={`relative h-6 w-10 rounded-full transition-colors motion-reduce:transition-none ${on ? 'bg-accent' : 'bg-surface-2'}`}>
              <span
                className={`absolute top-1 left-1 size-4 rounded-full bg-paper transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${on ? 'translate-x-4' : ''}`}
              />
            </span>
            {t.gridOn}
          </button>
        </ChapterHead>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="type-meta text-paper">{t.typeScale}</h3>
            <Meta>{legend[lang]}</Meta>
          </div>
          <dl className="mt-4">
            {scale.map((s) => (
              <div key={s.cls} style={dashedTop} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 py-3">
                <dt className={`${s.cls} truncate`} aria-hidden="true">
                  Aa
                </dt>
                <dd className="text-right">
                  <span className="type-small block text-paper">{s.name[lang]}</span>
                  <span className="type-meta block text-mute">{s.spec}</span>
                </dd>
              </div>
            ))}
          </dl>
          <div style={dashedTop} className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6 pt-6">
            <svg width="96" height="96" viewBox="0 0 100 100" fill="none" aria-hidden="true" className="text-paper">
              <path d="M0 100H100M0 0V100" stroke="var(--color-line-strong)" strokeWidth="1" />
              <path d="M0 100C16 0 30 0 100 0" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="0" cy="100" r="2.5" fill="var(--color-accent)" />
              <circle cx="100" cy="0" r="2.5" fill="var(--color-accent)" />
            </svg>
            <div>
              <h3 className="type-small text-paper">{t.curve}</h3>
              <p className="type-meta mt-1 text-mute">{curveSpec}</p>
            </div>
          </div>
        </div>
      </div>

      {on && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30">
          <div className="container-x grid h-full grid-cols-4 gap-4 md:grid-cols-8 md:gap-6 lg:grid-cols-12">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className={`h-full border-x border-accent/30 bg-accent/8 ${i >= 8 ? 'hidden lg:block' : i >= 4 ? 'hidden md:block' : ''}`}
              />
            ))}
          </div>
        </div>
      )}
    </ChapterShell>
  )
}
