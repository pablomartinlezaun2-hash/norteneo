import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { site } from '@/content/site'
import { prefersReducedMotion } from '@/lib/motion'
import { services } from '@/content/services'
import { briefCopy, type ErrKey } from './copy'
import { BRIEF_SECTORS, DRAFT_KEY, GOALS, INVESTMENT, LAST_KEY, NOTES_MAX, PREFERENCES, TIMELINES, UNSURE, type Preference, type ServiceChoice } from './config'
import { Choice, ErrorText, Group, TextArea, TextField } from './fields'
import {
  buildPayload,
  EMAIL_RE,
  EMPTY,
  isFormSubmit,
  mailtoHref,
  makeBriefId,
  noJsAction,
  whatsappBriefHref,
  type BriefContext,
  type BriefData,
} from './submit'

const TOTAL = 5
type Field = 'services' | 'brand' | 'sector' | 'goal' | 'name' | 'email' | 'phone' | 'consent'
type Errors = Partial<Record<Field, ErrKey>>

function validate(step: number, d: BriefData): Errors {
  const e: Errors = {}
  if (step === 0 && d.services.length === 0) e.services = 'services'
  if (step === 1) {
    if (!d.brand.trim()) e.brand = 'brand'
    if (!d.sector) e.sector = 'sector'
  }
  if (step === 2 && !d.goal) e.goal = 'goal'
  if (step === 4) {
    if (!d.name.trim()) e.name = 'name'
    const em = d.email.trim()
    if (!em) e.email = 'email'
    else if (!EMAIL_RE.test(em)) e.email = 'emailFormat'
    if ((d.pref === 'call' || d.pref === 'whatsapp') && !d.phone.trim()) e.phone = 'phone'
    if (!d.consent) e.consent = 'consent'
  }
  return e
}

const stepOf: Record<Field, number> = { services: 0, brand: 1, sector: 1, goal: 2, name: 4, email: 4, phone: 4, consent: 4 }

/** ¿Hay algo escrito además del servicio preseleccionado? */
const hasContent = (d: Partial<BriefData>) =>
  Boolean(d.brand || d.link || d.sector || d.goal || d.timeline || d.budget || d.refs || d.notes || d.name || d.email || d.phone)

function readDraft(): Partial<BriefData> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<BriefData>
    return v && typeof v === 'object' ? v : null
  } catch {
    return null
  }
}

function writeDraft(d: BriefData) {
  try {
    if (!hasContent(d) && d.services.length === 0) localStorage.removeItem(DRAFT_KEY)
    else localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, consent: false, hp: '' }))
  } catch {
    /* almacenamiento no disponible: el formulario funciona igual */
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* nada */
  }
}

const validServices = new Set<string>([...services.map((s) => s.id), UNSURE])

/**
 * Brief guiado en 5 pasos (progressive enhancement):
 * - Sin JS: un <form> real con los 5 bloques visibles y POST al endpoint (FormSubmit) o mailto.
 * - Con JS: un paso por pantalla, "Paso 2 de 5" con hairline azul, validación al salir del campo
 *   y al avanzar, foco gestionado y borrador en localStorage.
 * Envío: endpoint (fetch JSON) → /gracias?id=…; si falla, WhatsApp y email prellenados.
 * Sin endpoint: WhatsApp → email → aviso discreto de configuración pendiente.
 */
export function Brief() {
  const lang = useLang()
  const t = briefCopy[lang]
  const navigate = useNavigate()
  const [data, setData] = useState<BriefData>(EMPTY)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [enhanced, setEnhanced] = useState(false)
  const [restored, setRestored] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'pending'>('idle')
  const [fail, setFail] = useState<BriefContext | null>(null)
  const [handoff, setHandoff] = useState<{ channel: 'whatsapp' | 'email'; href: string; id: string } | null>(null)
  const ctx = useRef({ entry: '', utm: '' })
  const headings = useRef<(HTMLHeadingElement | null)[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const focusError = useRef(false)
  const didMount = useRef(false)
  const alertRef = useRef<HTMLDivElement>(null)

  // Montaje: borrador + ?servicio= + UTM (tras hidratar, para no romper el HTML prerenderizado)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const raw = q.get('servicio') ?? q.get('service') ?? ''
    const entry = services.find((s) => s.id === raw || s.slug.es === raw || s.slug.en === raw)?.id ?? ''
    const utm = [...q.entries()].filter(([k]) => k.startsWith('utm_')).map(([k, v]) => `${k}=${v}`).join('; ')
    ctx.current = { entry, utm }
    const draft = readDraft()
    setData(() => {
      const base: BriefData = { ...EMPTY }
      if (draft) {
        for (const k of Object.keys(EMPTY) as (keyof BriefData)[]) {
          const v = draft[k]
          if (v !== undefined && typeof v === typeof EMPTY[k]) (base as Record<string, unknown>)[k] = v
        }
        base.services = (Array.isArray(draft.services) ? draft.services : []).filter((s) => validServices.has(s)) as ServiceChoice[]
        base.consent = false
        base.hp = ''
      }
      if (entry && !base.services.includes(entry)) base.services = [...base.services, entry]
      return base
    })
    setRestored(Boolean(draft && hasContent(draft)))
    setEnhanced(true)
  }, [])

  // Borrador
  useEffect(() => {
    if (enhanced && !handoff) writeDraft(data)
  }, [data, enhanced, handoff])

  // Foco al cambiar de paso (no en la primera carga)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    headings.current[step]?.focus()
  }, [step])

  // Envío fallido: el aviso y sus alternativas entran en pantalla y reciben el foco
  useEffect(() => {
    if (status !== 'error') return
    const el = alertRef.current
    if (!el) return
    el.focus({ preventScroll: true })
    el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [status])

  // Foco al primer campo con error
  useEffect(() => {
    if (!focusError.current) return
    focusError.current = false
    const el = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"] [aria-invalid="true"]`)
    el?.focus()
  }, [errors, step])

  const set = <K extends keyof BriefData>(k: K, v: BriefData[K]) => {
    const next = { ...data, [k]: v }
    setData(next)
    // Si el campo ya mostraba error, se revalida para retirarlo en cuanto es correcto
    const fields = (Object.keys(errors) as Field[]).filter((f) => f === k || (k === 'pref' && f === 'phone'))
    if (fields.length) {
      const fresh = validate(stepOf[fields[0]], next)
      const out = { ...errors }
      for (const f of fields) {
        if (fresh[f]) out[f] = fresh[f]
        else delete out[f]
      }
      setErrors(out)
    }
    if (status === 'error' || status === 'pending') setStatus('idle')
  }

  /** Validación al salir de un campo */
  const blur = (f: Field) => () => {
    if (!enhanced) return
    const fresh = validate(stepOf[f], data)
    setErrors((prev) => {
      const out = { ...prev }
      if (fresh[f]) out[f] = fresh[f]
      else delete out[f]
      return out
    })
  }

  const err = (f: Field) => (errors[f] ? t.err[errors[f]!] : undefined)

  const goNext = () => {
    const errs = validate(step, data)
    if (Object.keys(errs).length) {
      setErrors((prev) => ({ ...prev, ...errs }))
      focusError.current = true
      return
    }
    setStep((s) => Math.min(TOTAL - 1, s + 1))
  }

  const goBack = () => setStep((s) => Math.max(0, s - 1))

  const finish = (id: string) => {
    clearDraft()
    try {
      sessionStorage.setItem(LAST_KEY, JSON.stringify({ id, name: data.name.trim() }))
    } catch {
      /* nada */
    }
    navigate(`${to.thanks(lang)}?id=${id}`)
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    if (step < TOTAL - 1) {
      goNext()
      return
    }
    for (let i = 0; i < TOTAL; i++) {
      const errs = validate(i, data)
      if (Object.keys(errs).length) {
        setErrors(errs)
        setStep(i)
        focusError.current = true
        return
      }
    }
    const id = makeBriefId()
    const c: BriefContext = { id, lang, page: window.location.pathname, entry: ctx.current.entry, utm: ctx.current.utm }

    // Honeypot relleno: se simula el éxito sin enviar nada
    if (data.hp) {
      navigate(`${to.thanks(lang)}?id=${id}`)
      return
    }

    if (site.leadEndpoint) {
      setStatus('sending')
      try {
        const res = await fetch(site.leadEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(buildPayload(data, c)),
        })
        const json = (await res.json().catch(() => ({}))) as { success?: unknown }
        const ok = res.ok && (!isFormSubmit() || String(json.success) === 'true')
        if (!ok) throw new Error('lead endpoint rejected')
        finish(id)
      } catch {
        setFail(c)
        setStatus('error')
      }
      return
    }

    const wa = whatsappBriefHref(data, c)
    if (wa) {
      window.open(wa, '_blank', 'noopener,noreferrer')
      setHandoff({ channel: 'whatsapp', href: wa, id })
      return
    }
    const mail = mailtoHref(data, c)
    if (mail) {
      window.location.href = mail
      setHandoff({ channel: 'email', href: mail, id })
      return
    }
    setStatus('pending')
  }

  const reset = () => {
    clearDraft()
    setData({ ...EMPTY, services: ctx.current.entry ? [ctx.current.entry as ServiceChoice] : [] })
    setErrors({})
    setRestored(false)
    setStep(0)
  }

  const toggleService = (id: ServiceChoice, on: boolean) =>
    set('services', on ? [...data.services.filter((s) => s !== id), id] : data.services.filter((s) => s !== id))

  const { action, encType } = noJsAction()
  const noChannel = !site.leadEndpoint && !site.whatsapp && !site.email
  const thanksAbs = `${site.url.replace(/\/$/, '')}${to.thanks(lang)}`
  const hidden = (i: number) => (i === step ? '' : '[.js_&]:hidden')
  const waFail = fail ? whatsappBriefHref(data, fail) : null
  const mailFail = fail ? mailtoHref(data, fail) : null

  if (handoff) {
    return (
      <div role="status" className="rounded-3xl border border-line p-6 md:p-10">
        <p className="type-title">{t.handoffTitle(handoff.id)}</p>
        <p className="type-body mt-3 text-mute">{handoff.channel === 'whatsapp' ? t.handoffWhatsapp : t.handoffEmail}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            href={handoff.href}
            target={handoff.channel === 'whatsapp' ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full bg-paper px-6 text-[0.9375rem] font-[520] text-ink hover:bg-white"
          >
            {t.handoffAgain}
          </a>
          <button type="button" onClick={() => setHandoff(null)} className="inline-flex min-h-11 items-center text-[0.9375rem] text-paper underline-offset-4 hover:underline">
            {t.handoffBack}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      method="post"
      action={action}
      encType={encType}
      noValidate={enhanced}
      onSubmit={onSubmit}
      aria-labelledby="brief-title"
      className="relative"
    >
      <h2 id="brief-title" className="sr-only">
        {t.seo}
      </h2>

      {/* Progreso (solo con JS) */}
      <div className="mb-10 hidden [.js_&]:block" aria-hidden="true">
        <p className="type-meta text-paper">{t.step(step + 1, TOTAL)}</p>
        <div className="mt-3 h-px bg-line">
          <div
            className="h-px bg-accent transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      {restored && (
        <p className="type-small mb-8 flex flex-wrap items-center gap-x-3 text-mute">
          {t.draft}
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center text-paper underline underline-offset-4 hover:text-accent">
            {t.reset}
          </button>
        </p>
      )}

      {/* Campos ocultos para el envío sin JS (FormSubmit) */}
      {isFormSubmit() && (
        <>
          <input type="hidden" name="_next" value={thanksAbs} />
          <input type="hidden" name="_subject" value="Nuevo brief desde la web" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_captcha" value="false" />
        </>
      )}
      <input type="hidden" name="Idioma" value={lang.toUpperCase()} />

      {/* Paso 1 · ¿Qué necesitas? */}
      <fieldset data-step={0} className={hidden(0)}>
        <legend className="w-full">
          <StepHeading i={0} t={t} enhanced={enhanced} headings={headings} />
        </legend>
        <p className="type-small mt-2 text-mute">{t.steps[0].intro}</p>
        <div
          className="mt-8"
          role="group"
          aria-label={t.steps[0].title}
          aria-describedby={errors.services ? 'brief-services-err' : undefined}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <Choice
                key={s.id}
                variant="card"
                type="checkbox"
                name="Servicios"
                value={s.name.es}
                checked={data.services.includes(s.id)}
                onChange={(on) => toggleService(s.id, on)}
                label={s.name[lang]}
                hint={s.line[lang]}
                invalid={Boolean(errors.services)}
              />
            ))}
            <Choice
              variant="card"
              type="checkbox"
              name="Servicios"
              value="Aún no lo sé"
              checked={data.services.includes(UNSURE)}
              onChange={(on) => toggleService(UNSURE, on)}
              label={t.unsure}
              hint={t.unsureHint}
              invalid={Boolean(errors.services)}
            />
          </div>
          <ErrorText id="brief-services-err">{err('services')}</ErrorText>
        </div>
      </fieldset>

      {/* Paso 2 · Tu marca */}
      <fieldset data-step={1} className={`mt-16 [.js_&]:mt-0 ${hidden(1)}`}>
        <legend className="w-full">
          <StepHeading i={1} t={t} enhanced={enhanced} headings={headings} />
        </legend>
        <p className="type-small mt-2 text-mute">{t.steps[1].intro}</p>
        <div className="mt-8 flex flex-col gap-9">
          <TextField
            id="brief-brand"
            name="Marca"
            label={t.brand}
            value={data.brand}
            onChange={(v) => set('brand', v)}
            onBlur={blur('brand')}
            error={err('brand')}
            autoComplete="organization"
            required
          />
          <TextField
            id="brief-link"
            name="Web o Instagram"
            label={t.link}
            hint={t.linkHint}
            value={data.link}
            onChange={(v) => set('link', v)}
            autoComplete="url"
            inputMode="url"
          />
          <Group legend={t.sector} error={err('sector')} errId="brief-sector-err">
            <div className="flex flex-wrap gap-2">
              {BRIEF_SECTORS.map((o) => (
                <Choice
                  key={o.id}
                  type="radio"
                  name="Sector"
                  value={o.label.es}
                  checked={data.sector === o.id}
                  onChange={() => set('sector', o.id)}
                  label={o.label[lang]}
                  invalid={Boolean(errors.sector)}
                  required
                />
              ))}
            </div>
          </Group>
        </div>
      </fieldset>

      {/* Paso 3 · El encargo */}
      <fieldset data-step={2} className={`mt-16 [.js_&]:mt-0 ${hidden(2)}`}>
        <legend className="w-full">
          <StepHeading i={2} t={t} enhanced={enhanced} headings={headings} />
        </legend>
        <p className="type-small mt-2 text-mute">{t.steps[2].intro}</p>
        <div className="mt-8 flex flex-col gap-9">
          <Group legend={t.goal} error={err('goal')} errId="brief-goal-err">
            <div className="flex flex-wrap gap-2">
              {GOALS.map((o) => (
                <Choice
                  key={o.id}
                  type="radio"
                  name="Objetivo"
                  value={o.label.es}
                  checked={data.goal === o.id}
                  onChange={() => set('goal', o.id)}
                  label={o.label[lang]}
                  invalid={Boolean(errors.goal)}
                  required
                />
              ))}
            </div>
          </Group>
          <Group legend={t.timeline} hint={t.optional} hintId="brief-timeline-hint" errId="brief-timeline-err">
            <div className="flex flex-wrap gap-2">
              {TIMELINES.map((o) => (
                <Choice key={o.id} type="radio" name="Plazo" value={o.label.es} checked={data.timeline === o.id} onChange={() => set('timeline', o.id)} label={o.label[lang]} />
              ))}
            </div>
          </Group>
          {INVESTMENT.enabled && (
            <Group legend={t.budget} hint={t.budgetHint} hintId="brief-budget-hint" errId="brief-budget-err">
              <div className="flex flex-wrap gap-2">
                {INVESTMENT.options.map((o) => (
                  <Choice
                    key={o.id}
                    type="radio"
                    name="Inversión orientativa"
                    value={o.label.es}
                    checked={data.budget === o.id}
                    onChange={() => set('budget', o.id)}
                    label={o.label[lang]}
                  />
                ))}
              </div>
            </Group>
          )}
        </div>
      </fieldset>

      {/* Paso 4 · Referencias */}
      <fieldset data-step={3} className={`mt-16 [.js_&]:mt-0 ${hidden(3)}`}>
        <legend className="w-full">
          <StepHeading i={3} t={t} enhanced={enhanced} headings={headings} />
        </legend>
        <p className="type-small mt-2 text-mute">{t.steps[3].intro}</p>
        <div className="mt-8 flex flex-col gap-9">
          <TextArea id="brief-refs" name="Referencias" label={t.refs} hint={t.refsHint} value={data.refs} onChange={(v) => set('refs', v)} rows={3} />
          <TextArea
            id="brief-notes"
            name="¿A qué marca le gustaría parecerse?"
            label={t.notes}
            hint={t.notesHint(data.notes.length, NOTES_MAX)}
            value={data.notes}
            onChange={(v) => set('notes', v.slice(0, NOTES_MAX))}
            maxLength={NOTES_MAX}
            rows={4}
          />
        </div>
      </fieldset>

      {/* Paso 5 · Cómo hablamos */}
      <fieldset data-step={4} className={`mt-16 [.js_&]:mt-0 ${hidden(4)}`}>
        <legend className="w-full">
          <StepHeading i={4} t={t} enhanced={enhanced} headings={headings} />
        </legend>
        <p className="type-small mt-2 text-mute">{t.steps[4].intro}</p>
        <div className="mt-8 flex flex-col gap-9">
          <div className="grid gap-9 md:grid-cols-2 md:gap-8">
            <TextField
              id="brief-name"
              name="Nombre"
              label={t.name}
              value={data.name}
              onChange={(v) => set('name', v)}
              onBlur={blur('name')}
              error={err('name')}
              autoComplete="name"
              required
            />
            <TextField
              id="brief-email"
              name="email"
              type="email"
              label={t.email}
              value={data.email}
              onChange={(v) => set('email', v)}
              onBlur={blur('email')}
              error={err('email')}
              autoComplete="email"
              inputMode="email"
              required
            />
          </div>
          <TextField
            id="brief-phone"
            name="Teléfono"
            type="tel"
            label={t.phone}
            hint={t.phoneHint}
            value={data.phone}
            onChange={(v) => set('phone', v)}
            onBlur={blur('phone')}
            error={err('phone')}
            autoComplete="tel"
            inputMode="tel"
          />
          <Group legend={t.pref} errId="brief-pref-err">
            <div className="flex flex-wrap gap-2">
              {PREFERENCES.map((o) => (
                <Choice
                  key={o.id}
                  type="radio"
                  name="Prefiere contacto por"
                  value={o.label.es}
                  checked={data.pref === o.id}
                  onChange={() => set('pref', o.id as Preference)}
                  label={o.label[lang]}
                />
              ))}
            </div>
          </Group>

          <div>
            <label className="group flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="Consentimiento RGPD"
                value="Sí"
                required
                checked={data.consent}
                onChange={(e) => set('consent', e.target.checked)}
                onBlur={blur('consent')}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? 'brief-consent-err' : undefined}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-[0.15em] grid size-[1.125rem] shrink-0 place-items-center rounded-[0.3rem] border transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                  errors.consent ? 'border-[#ff7b72]' : 'border-line-strong'
                }`}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#000" strokeWidth="1.8" className={data.consent ? 'opacity-100' : 'opacity-0'}>
                  <path d="m1 4 2.6 2.6L9 1.2" />
                </svg>
              </span>
              <span className="type-small text-mute">
                {t.consentA}
                <a href={to.legal(lang, 'privacy')} target="_blank" rel="noopener" className="text-paper underline underline-offset-4 hover:text-accent">
                  {t.consentLink}
                </a>
                {t.consentB}
              </span>
            </label>
            <ErrorText id="brief-consent-err">{err('consent')}</ErrorText>
          </div>

          {/* Honeypot: invisible para personas y lectores de pantalla */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              No rellenar
              <input type="text" name="_honey" tabIndex={-1} autoComplete="off" value={data.hp} onChange={(e) => set('hp', e.target.value)} />
            </label>
          </div>
        </div>
      </fieldset>

      {/* Navegación del brief */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
        <button
          type="button"
          onClick={goBack}
          className={`hidden min-h-11 items-center gap-2 text-[0.9375rem] text-mute transition-colors hover:text-paper [.js_&]:inline-flex ${step === 0 ? 'invisible' : ''}`}
        >
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M6 1 1 6l5 5" />
          </svg>
          {t.back}
        </button>
        <div className="ml-auto flex items-center gap-4">
          {step < TOTAL - 1 && (
            <button
              type="button"
              onClick={goNext}
              className="hidden min-h-11 items-center justify-center rounded-full bg-paper px-7 text-[0.9375rem] font-[520] text-ink transition-colors hover:bg-white [.js_&]:inline-flex"
            >
              {t.next}
            </button>
          )}
          <button
            type="submit"
            // aria-disabled (no disabled): el botón conserva el foco mientras se envía; onSubmit ignora el doble envío
            aria-disabled={status === 'sending' || undefined}
            className={`inline-flex min-h-11 items-center justify-center rounded-full bg-paper px-7 text-[0.9375rem] font-[520] text-ink transition-colors hover:bg-white aria-disabled:cursor-wait aria-disabled:opacity-60 ${
              step < TOTAL - 1 ? '[.js_&]:hidden' : ''
            }`}
          >
            {status === 'sending' ? t.sending : t.submit}
          </button>
        </div>
      </div>

      {/* Estado del envío */}
      <div aria-live="polite">
        {status === 'error' && (
          <div ref={alertRef} role="alert" tabIndex={-1} className="mt-8 scroll-my-24 rounded-2xl border border-line-strong p-6 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            <p className="text-[1.0625rem] font-[480] text-paper">{t.failTitle}</p>
            <p className="type-small mt-2 text-mute">{t.failLine}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {waFail && (
                <a href={waFail} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-paper px-6 text-[0.9375rem] font-[520] text-ink hover:bg-white">
                  {t.sendWhatsapp}
                </a>
              )}
              {mailFail && (
                <a href={mailFail} className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-6 text-[0.9375rem] text-paper hover:border-paper">
                  {t.sendEmail}
                </a>
              )}
            </div>
          </div>
        )}
        {(noChannel || status === 'pending') && <p className="type-small mt-6 border-l border-line-strong pl-4 text-dim">{t.pending}</p>}
      </div>
    </form>
  )
}

function StepHeading({
  i,
  t,
  enhanced,
  headings,
}: {
  i: number
  t: (typeof briefCopy)['es'] | (typeof briefCopy)['en']
  enhanced: boolean
  headings: RefObject<(HTMLHeadingElement | null)[]>
}) {
  return (
    <h3
      ref={(el) => {
        headings.current[i] = el
      }}
      tabIndex={-1}
      className="type-title outline-none"
    >
      {enhanced && <span className="sr-only">{t.step(i + 1, TOTAL)}. </span>}
      {t.steps[i].title}
    </h3>
  )
}
