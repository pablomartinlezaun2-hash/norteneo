import { useState, type FocusEvent, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import type { Case } from '@/content/cases'
import { PhoneFrame } from '@/components/PhoneFrame'
import { PieceVideo } from './PieceVideo'
import { Tag } from './Tag'
import { formatLabel, isGenerated, kindLabel, labels, pieceAlt, sectorLabel, SEP, servicesLabel, type Shape } from './meta'

/** Nombre de transición compartida pieza → hero del caso (View Transitions). */
export const pieceTransition = (slug: string) => `piece-${slug}`

type Props = {
  c: Case
  shape: Shape
  /** Clases de columna en escritorio (ver arrange) */
  cls?: string
  paired?: boolean
  /** Nivel del titular según la sección que la contiene */
  level?: 3 | 4
}

/**
 * Pieza de la colección. Toda la tarjeta enlaza al caso (enlace estirado sobre el titular);
 * el botón de pausa queda por encima del enlace.
 */
export function Piece({ c, shape, cls = '', paired = false, level = 3 }: Props) {
  const H = level === 4 ? 'h4' : 'h3'
  const lang = useLang()
  const [hovered, setHovered] = useState(false)
  const href = to.case(lang, c.slug)
  const sector = sectorLabel(c, lang)
  const kind = kindLabel(c, lang)
  const meta = [sector, formatLabel(c, lang)].filter(Boolean).join(SEP)

  // Enlace estirado: toda la tarjeta lleva al caso
  const title = (
    <Link
      to={href}
      viewTransition
      className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
    >
      {c.title}
    </Link>
  )

  const enter = (e: PointerEvent) => e.pointerType === 'mouse' && setHovered(true)
  const leave = (e: PointerEvent) => e.pointerType === 'mouse' && setHovered(false)
  const blur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false)
  }

  return (
    <article
      data-piece={c.slug}
      className={`group relative col-span-12 ${cls} ${paired && shape === 'land' ? 'md:self-center' : ''}`}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onFocus={() => setHovered(true)}
      onBlur={blur}
    >
      {shape === 'land' && c.media && (
        <div className="overflow-hidden rounded-2xl" style={{ viewTransitionName: pieceTransition(c.slug) }}>
          <PieceVideo media={c.media} hovered={hovered} label={pieceAlt(c, lang)} className="aspect-video" />
        </div>
      )}
      {shape === 'port' && c.media && (
        <PhoneFrame className="mx-auto w-[min(72vw,17rem)] md:mx-0 lg:w-[18.5rem]">
          <div className="h-full w-full" style={{ viewTransitionName: pieceTransition(c.slug) }}>
            <PieceVideo media={c.media} hovered={hovered} label={pieceAlt(c, lang)} className="h-full w-full" />
          </div>
        </PhoneFrame>
      )}
      {shape === 'type' && (
        // Variante tipográfica (sin grabación todavía): caja apaisada con el titular y la línea dentro,
        // para que no se lea como un hueco vacío ni repita el nombre debajo.
        <div
          className="relative flex aspect-[16/10] flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-colors duration-500 group-hover:border-line-strong md:aspect-[16/7] md:p-8"
          style={{ viewTransitionName: pieceTransition(c.slug) }}
        >
          <Tag>{servicesLabel(c, lang)}</Tag>
          <div>
            <H className="type-title text-paper">{title}</H>
            <p className="type-small mt-2 text-mute">{c.line[lang]}</p>
          </div>
        </div>
      )}
      {shape === 'type' && (meta || isGenerated(c)) && (
        <p className="mt-4 flex flex-col gap-1">
          {meta && <Tag>{meta}</Tag>}
          {isGenerated(c) && <Tag tone="dim">{labels.ai[lang]}</Tag>}
        </p>
      )}

      {shape !== 'type' && (
        <div className={`mt-5 ${shape === 'port' ? 'mx-auto w-[min(72vw,17rem)] md:mx-0 lg:w-[18.5rem]' : ''}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
            <H className="text-[1.375rem] leading-tight font-[460] tracking-[-0.015em] [font-stretch:106%]">
              {title}
            </H>
            {meta && <Tag>{meta}</Tag>}
          </div>
          <p className="type-small mt-1.5 text-mute">{c.line[lang]}</p>
          {kind || isGenerated(c) ? (
            <p className="mt-3 flex flex-col gap-1">
              {kind && <Tag tone="paper">{kind}</Tag>}
              {isGenerated(c) && <Tag tone="dim">{labels.ai[lang]}</Tag>}
            </p>
          ) : null}
        </div>
      )}
    </article>
  )
}
