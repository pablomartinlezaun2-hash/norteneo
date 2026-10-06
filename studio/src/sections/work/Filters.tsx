import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useLang } from '@/i18n'
import { sectors, type SectorId } from '@/content/cases'
import { serviceById, type ServiceId } from '@/content/services'
import { filterSectors, filterServices } from './meta'

export type WorkFilter = { service: ServiceId | null; sector: SectorId | null }

const copy = {
  es: { service: 'Servicio', sector: 'Sector', all: 'Todo' },
  en: { service: 'Service', sector: 'Sector', all: 'All' },
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      // En el carril móvil, el chip enfocado con teclado entra entero en la vista (Chrome no lo hace si asoma un trozo)
      onFocus={(e) => e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest' })}
      className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[0.875rem] font-[460] transition-colors duration-300 ${
        pressed ? 'border-line-strong text-paper' : 'border-transparent text-mute hover:text-paper'
      }`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full bg-accent transition-opacity ${pressed ? 'opacity-100' : 'opacity-0'}`} />
      {children}
    </button>
  )
}

/**
 * Grupo de filtros. En móvil, carril horizontal con snap y un fundido en el borde derecho
 * mientras quede algo por ver (pista de que hay más opciones); en escritorio, una línea que envuelve.
 * py-1 / -my-1: el anillo de foco no se recorta arriba ni abajo por el overflow.
 */
function Group({ labelId, label, children }: { labelId: string; label: string; children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)

  useEffect(() => {
    const el = rail.current
    if (!el) return
    const update = () => setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div role="group" aria-labelledby={labelId} className="md:flex md:items-center">
      <span id={labelId} className="type-meta block w-20 shrink-0 text-dim">
        {label}
      </span>
      <div
        ref={rail}
        className={`-mx-[var(--gutter)] -my-1 flex snap-x scroll-pr-[4.5rem] scroll-pl-[var(--gutter)] flex-nowrap gap-1 overflow-x-auto px-[var(--gutter)] py-1 [scrollbar-width:none] md:mx-0 md:snap-none md:flex-wrap md:overflow-visible md:px-0 ${
          more ? 'max-md:[mask-image:linear-gradient(to_right,#000_calc(100%-4.5rem),transparent)]' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}

/** Filtros accesibles por servicio y por sector: botones con aria-pressed, sin colores de píldora. */
export function Filters({ value, onChange }: { value: WorkFilter; onChange: (f: WorkFilter) => void }) {
  const lang = useLang()
  const t = copy[lang]
  const svcId = useId()
  const secId = useId()
  return (
    <div className="flex flex-col gap-3 md:gap-1">
      <Group labelId={svcId} label={t.service}>
        <Chip pressed={value.service === null} onClick={() => onChange({ ...value, service: null })}>
          {t.all}
        </Chip>
        {filterServices.map((id) => (
          <Chip key={id} pressed={value.service === id} onClick={() => onChange({ ...value, service: value.service === id ? null : id })}>
            {serviceById(id).name[lang]}
          </Chip>
        ))}
      </Group>
      <Group labelId={secId} label={t.sector}>
        <Chip pressed={value.sector === null} onClick={() => onChange({ ...value, sector: null })}>
          {t.all}
        </Chip>
        {filterSectors.map((id) => (
          <Chip key={id} pressed={value.sector === id} onClick={() => onChange({ ...value, sector: value.sector === id ? null : id })}>
            {sectors[id][lang]}
          </Chip>
        ))}
      </Group>
    </div>
  )
}
