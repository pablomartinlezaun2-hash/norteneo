import type { Lang } from '@/i18n'
import type { Service } from '@/content/services'
import { cases } from '@/content/cases'
import { Meta } from '@/components/Meta'

/** Webs reales en producción (dato de content/cases, no inventado). */
const liveSites = cases.filter((c) => c.kind === 'client' && c.services.includes('websites'))

/** Ajustes reales de Blackmagic Camera para Cine con tu móvil (docs/estructura-panel.md §4). */
const cameraSpec = 'Log · P3 · 24 fps · 180°'

/** Pie de la composición (sustituye a la etiqueta de IA cuando no hay clip). */
export function compositionCaption(service: Service, lang: Lang): string {
  if (service.id === 'websites') return lang === 'es' ? `${liveSites.length} webs en producción` : `${liveSites.length} websites live`
  if (service.id === 'mobile-cinema') return lang === 'es' ? 'Ajustes de Blackmagic Camera' : 'Blackmagic Camera settings'
  return service.name[lang]
}

/**
 * Composición tipográfica para los oficios sin clip (webs, cine con móvil) o cuando falta el medio.
 * Nunca un hueco vacío: el nombre a escala de póster con un detalle propio del oficio.
 * Ocupa todo su contenedor (el padre fija el aspecto).
 */
export function TypeComposition({ service, lang, className = '' }: { service: Service; lang: Lang; className?: string }) {
  const id = service.id
  return (
    <div className={`@container absolute inset-0 overflow-hidden bg-ink ${className}`} aria-hidden="true">
      {id === 'websites' && (
        // Rejilla de columnas: la web se enseña a sí misma (guiño a "Ver la rejilla")
        <div className="absolute inset-0 grid grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={`h-full ${i ? 'border-l border-line' : ''}`} />
          ))}
        </div>
      )}
      {id === 'mobile-cinema' && (
        // Visor de cámara: cuatro esquinas y una cruz central
        <div className="absolute inset-[4cqi]">
          <span className="absolute top-0 left-0 size-[8cqi] border-t border-l border-line-strong" />
          <span className="absolute top-0 right-0 size-[8cqi] border-t border-r border-line-strong" />
          <span className="absolute bottom-0 left-0 size-[8cqi] border-b border-l border-line-strong" />
          <span className="absolute right-0 bottom-0 size-[8cqi] border-r border-b border-line-strong" />
          <span className="absolute top-1/2 left-1/2 h-px w-[6cqi] -translate-1/2 bg-line-strong" />
          <span className="absolute top-1/2 left-1/2 h-[6cqi] w-px -translate-1/2 bg-line-strong" />
        </div>
      )}

      <div className="relative flex h-full flex-col justify-between p-[8cqi]">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <Meta className={id === 'websites' ? 'bg-ink pr-2' : ''}>{service.format[lang]}</Meta>
          {id === 'mobile-cinema' && <Meta>{cameraSpec}</Meta>}
        </div>

        {id === 'websites' && (
          <ul className="type-small grid justify-items-start gap-1 text-mute">
            {liveSites.map((c) => (
              <li key={c.slug} className="bg-ink pr-2">
                {c.title}
              </li>
            ))}
          </ul>
        )}

        <p className="text-[clamp(2rem,12cqi,5.5rem)] leading-[0.92] font-[380] tracking-[-0.04em] text-paper [font-stretch:125%]">
          {service.name[lang]}
        </p>
      </div>
    </div>
  )
}
