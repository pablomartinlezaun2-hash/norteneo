import { useId, useState, type ReactNode } from 'react'

type Props = {
  before: ReactNode
  after: ReactNode
  labels: { before: string; after: string }
  /** Texto accesible del control deslizante */
  ariaLabel: string
  initial?: number
  className?: string
}

/**
 * Comparador antes/después (p. ej. Log ↔ gradado). Un <input type="range"> nativo cubre
 * toda la superficie: funciona con ratón, dedo y teclado, y es accesible sin trucos.
 */
export function BeforeAfter({ before, after, labels, ariaLabel, initial = 50, className = '' }: Props) {
  const [pos, setPos] = useState(initial)
  const id = useId()
  return (
    <div className={`relative isolate select-none overflow-hidden bg-ink ${className}`}>
      <div className="absolute inset-0">{before}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        {after}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-paper/80"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-paper/70 bg-black/50 backdrop-blur-sm">
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M5 1 1 5l4 4M13 1l4 4-4 4" />
          </svg>
        </div>
      </div>
      <span className="type-meta pointer-events-none absolute top-4 left-4 z-10 text-paper/90">[ {labels.before} ]</span>
      <span className="type-meta pointer-events-none absolute top-4 right-4 z-10 text-paper/90">[ {labels.after} ]</span>
      <label htmlFor={id} className="sr-only">
        {ariaLabel}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-0 z-20 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0 focus-visible:opacity-100 [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-12 [&::-webkit-slider-thumb]:appearance-none"
      />
    </div>
  )
}
