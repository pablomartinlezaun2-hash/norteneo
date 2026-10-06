/** Control segmentado accesible (grupo de botones con aria-pressed), objetivos táctiles de 44 px. */
export function Segmented({
  label,
  options,
  value,
  onChange,
  className = '',
}: {
  label: string
  options: string[]
  value: number
  onChange: (i: number) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid w-full gap-1 rounded-full border border-line-strong p-1 sm:inline-grid sm:w-auto ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          aria-pressed={i === value}
          onClick={() => onChange(i)}
          className={`min-h-11 truncate rounded-full px-2 text-[0.8125rem] font-[480] transition-colors duration-300 motion-reduce:transition-none sm:px-5 sm:text-[0.875rem] ${
            i === value ? 'bg-paper text-ink' : 'text-mute hover:text-paper'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
