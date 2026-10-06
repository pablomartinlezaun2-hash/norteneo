import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useLang } from '@/i18n'
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/motion'
import { ByCraft } from './ByCraft'
import { BySituation } from './BySituation'
import { houseCopy } from './copy'

type Mode = 'craft' | 'situation'
const MODES: Mode[] = ['craft', 'situation']

/**
 * Índice de La Casa con conmutador accesible "Por oficio" / "Por situación" (tablist).
 * Se usa en la home (sección La Casa) y en el hub /servicios.
 * Sin JS el conmutador no se muestra y queda el índice por oficio como lista de enlaces.
 */
export function HouseIndex({ className = '', intro }: { className?: string; intro?: string }) {
  const lang = useLang()
  const t = houseCopy[lang]
  const uid = useId()
  const [mode, setMode] = useState<Mode>('craft')
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const panels = useRef<HTMLDivElement>(null)
  const changed = useRef(false)

  // Al cambiar de modo, el panel nuevo entra con un fundido corto (no en la carga inicial)
  useGSAP(
    () => {
      const panel = panels.current?.querySelector<HTMLElement>(`[data-mode="${mode}"]`)
      if (!changed.current || !panel || prefersReducedMotion()) return
      gsap.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'expo.out' })
    },
    { scope: panels, dependencies: [mode] },
  )

  const select = (m: Mode, focus = false) => {
    changed.current = true
    setMode(m)
    if (focus) tabs.current[MODES.indexOf(m)]?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = MODES.indexOf(mode)
    let next: Mode | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = MODES[(i + 1) % MODES.length]
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = MODES[(i - 1 + MODES.length) % MODES.length]
    else if (e.key === 'Home') next = MODES[0]
    else if (e.key === 'End') next = MODES[MODES.length - 1]
    if (!next) return
    e.preventDefault()
    select(next, true)
  }

  const label: Record<Mode, string> = { craft: t.byCraft, situation: t.bySituation }

  return (
    <div className={className}>
      <div className="mb-10 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
        {intro && <p className="type-lead measure text-mute">{intro}</p>}
        <div role="tablist" aria-label={t.modes} className="hidden gap-8 js:flex">
          {MODES.map((m, i) => {
            const on = mode === m
            return (
              <button
                key={m}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${m}`}
                aria-selected={on}
                aria-controls={`${uid}-${m}`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(m)}
                onKeyDown={onKey}
                className={`type-lead relative min-h-11 whitespace-nowrap transition-colors duration-300 hover:text-paper ${on ? 'text-paper' : 'text-mute'}`}
              >
                {label[m]}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-1 h-px origin-left bg-accent transition-transform duration-500 ease-[var(--ease-out-expo)] ${on ? 'scale-x-100' : 'scale-x-0'}`}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div ref={panels}>
        {MODES.map((m) => (
          <div key={m} data-mode={m} role="tabpanel" id={`${uid}-${m}`} aria-labelledby={`${uid}-tab-${m}`} hidden={mode !== m}>
            {m === 'craft' ? <ByCraft lang={lang} /> : <BySituation lang={lang} />}
          </div>
        ))}
      </div>
    </div>
  )
}
