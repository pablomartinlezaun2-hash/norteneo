import type { ChangeEvent, FocusEvent, ReactNode } from 'react'

/**
 * Piezas de formulario del brief. Inputs nativos (funcionan sin JS), etiquetas visibles,
 * errores enlazados con aria-describedby y aria-invalid.
 */

export function ErrorText({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className="type-small mt-2.5 flex items-start gap-2 text-paper">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="mt-[0.2em] shrink-0 text-[#ff7b72]">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.2v4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="11.4" r="0.95" fill="currentColor" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

const describe = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined

type TextProps = {
  id: string
  name: string
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  error?: string
  hint?: ReactNode
  type?: 'text' | 'email' | 'tel' | 'url'
  autoComplete?: string
  required?: boolean
  inputMode?: 'text' | 'email' | 'tel' | 'url'
  maxLength?: number
}

const inputCls = (invalid: boolean) =>
  `mt-2 block w-full rounded-none border-0 border-b bg-transparent px-0 py-3 text-[1.0625rem] text-paper placeholder:text-dim transition-colors focus-visible:border-accent focus-visible:shadow-[0_1px_0_0_var(--color-accent)] focus-visible:outline-none ${
    invalid ? 'border-[#ff7b72]' : 'border-line-strong hover:border-mute'
  }`

export function TextField({ id, name, label, value, onChange, onBlur, error, hint, type = 'text', autoComplete, required, inputMode, maxLength }: TextProps) {
  const errId = `${id}-err`
  const hintId = `${id}-hint`
  return (
    <div>
      <label htmlFor={id} className="type-small block text-paper">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(hint ? hintId : false, error ? errId : false)}
        className={inputCls(Boolean(error))}
      />
      {hint && (
        <p id={hintId} className="type-small mt-2 text-dim">
          {hint}
        </p>
      )}
      <ErrorText id={errId}>{error}</ErrorText>
    </div>
  )
}

export function TextArea({
  id,
  name,
  label,
  value,
  onChange,
  hint,
  maxLength,
  rows = 3,
}: {
  id: string
  name: string
  label: string
  value: string
  onChange: (v: string) => void
  hint?: ReactNode
  maxLength?: number
  rows?: number
}) {
  const hintId = `${id}-hint`
  return (
    <div>
      <label htmlFor={id} className="type-small block text-paper">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? hintId : undefined}
        className={`${inputCls(false)} resize-y leading-relaxed`}
      />
      {hint && (
        <p id={hintId} className="type-small mt-2 text-dim">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Grupo de opciones con <fieldset>/<legend> propios. */
export function Group({ legend, hint, error, errId, children, hintId }: { legend: string; hint?: string; hintId?: string; error?: string; errId: string; children: ReactNode }) {
  return (
    <fieldset aria-describedby={describe(hint ? hintId : false, error ? errId : false)}>
      <legend className="type-small text-paper">{legend}</legend>
      {hint && (
        <p id={hintId} className="type-small mt-1 text-dim">
          {hint}
        </p>
      )}
      <div className="mt-3">{children}</div>
      <ErrorText id={errId}>{error}</ErrorText>
    </fieldset>
  )
}

type ChoiceProps = {
  type: 'checkbox' | 'radio'
  name: string
  value: string
  checked: boolean
  onChange: (checked: boolean) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  label: string
  hint?: string
  invalid?: boolean
  required?: boolean
  variant?: 'card' | 'pill'
}

/** Opción seleccionable: input nativo oculto visualmente + etiqueta con estado activo en el acento. */
export function Choice({ type, name, value, checked, onChange, onBlur, label, hint, invalid, required, variant = 'pill' }: ChoiceProps) {
  const box =
    type === 'checkbox'
      ? 'size-[1.125rem] rounded-[0.3rem] border border-line-strong group-has-checked:border-accent group-has-checked:bg-accent'
      : 'size-[1.125rem] rounded-full border border-line-strong group-has-checked:border-[5px] group-has-checked:border-accent'
  const shell =
    variant === 'card'
      ? 'min-h-16 w-full items-start gap-3.5 rounded-2xl px-4 py-4'
      : 'min-h-11 items-center gap-2.5 rounded-full px-4 py-2'
  return (
    <label
      className={`group relative flex cursor-pointer border transition-colors duration-300 select-none has-checked:border-paper has-checked:bg-surface-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${shell} ${
        invalid ? 'border-[#ff7b72]/70' : 'border-line hover:border-line-strong'
      }`}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        required={required}
        aria-invalid={invalid ? true : undefined}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        className="peer sr-only"
      />
      <span aria-hidden="true" className={`relative grid shrink-0 place-items-center transition-[border-width,background-color,border-color] duration-200 ${box} ${variant === 'card' ? 'mt-0.5' : ''}`}>
        {type === 'checkbox' && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#000" strokeWidth="1.8" className="opacity-0 transition-opacity group-has-checked:opacity-100">
            <path d="m1 4 2.6 2.6L9 1.2" />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className={`block text-paper ${variant === 'card' ? 'text-[1rem] font-[480]' : 'text-[0.9375rem]'}`}>{label}</span>
        {hint && <span className="type-small mt-0.5 block text-mute">{hint}</span>}
      </span>
    </label>
  )
}
