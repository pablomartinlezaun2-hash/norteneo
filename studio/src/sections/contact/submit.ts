import type { Lang } from '@/i18n'
import { serviceById, type ServiceId } from '@/content/services'
import { site, whatsappHref } from '@/content/site'
import { BRIEF_SECTORS, GOALS, INVESTMENT, PREFERENCES, TIMELINES, UNSURE, type Option, type Preference, type ServiceChoice } from './config'

export type BriefData = {
  services: ServiceChoice[]
  brand: string
  link: string
  sector: string
  goal: string
  timeline: string
  budget: string
  refs: string
  notes: string
  name: string
  email: string
  phone: string
  pref: Preference
  consent: boolean
  /** Honeypot antispam (_honey en FormSubmit): un humano nunca lo rellena */
  hp: string
}

export const EMPTY: BriefData = {
  services: [],
  brand: '',
  link: '',
  sector: '',
  goal: '',
  timeline: '',
  budget: '',
  refs: '',
  notes: '',
  name: '',
  email: '',
  phone: '',
  pref: 'email',
  consent: false,
  hp: '',
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** ID corto y legible del brief: NEO-XXXX (sin caracteres ambiguos). */
export function makeBriefId(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(4)
  try {
    crypto.getRandomValues(bytes)
  } catch {
    for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return `NEO-${Array.from(bytes, (b) => abc[b % abc.length]).join('')}`
}

export const isBriefId = (v: string | null): v is string => Boolean(v && /^NEO-[A-Z0-9]{4,8}$/.test(v))

const label = (opts: Option[], id: string, lang: Lang) => opts.find((o) => o.id === id)?.label[lang] ?? ''

export function serviceNames(d: BriefData, lang: Lang): string {
  return d.services
    .map((s) => (s === UNSURE ? (lang === 'es' ? 'Aún no lo sé' : 'Not sure yet') : serviceById(s as ServiceId).name[lang]))
    .join(', ')
}

export type BriefContext = { id: string; lang: Lang; page: string; entry: string; utm: string }

/**
 * Cuerpo para FormSubmit (POST JSON). Las claves son las filas de la tabla del email que recibe Pablo,
 * por eso van en español y con los valores en español; "Idioma" indica el del visitante.
 * FormSubmit usa "email" como Reply-To.
 */
export function buildPayload(d: BriefData, ctx: BriefContext): Record<string, string> {
  const es: Lang = 'es'
  const rows: Record<string, string> = {
    _subject: `Nuevo brief ${ctx.id} · ${d.brand.trim()}`,
    _template: 'table',
    _captcha: 'false',
    _honey: d.hp,
    Brief: ctx.id,
    Servicios: serviceNames(d, es),
    Marca: d.brand.trim(),
    'Web o Instagram': d.link.trim(),
    Sector: label(BRIEF_SECTORS, d.sector, es),
    Objetivo: label(GOALS, d.goal, es),
    Plazo: label(TIMELINES, d.timeline, es),
    'Inversión orientativa': INVESTMENT.enabled ? label(INVESTMENT.options, d.budget, es) : '',
    Referencias: d.refs.trim(),
    '¿A qué marca le gustaría parecerse?': d.notes.trim(),
    Nombre: d.name.trim(),
    email: d.email.trim(),
    Teléfono: d.phone.trim(),
    'Prefiere contacto por': label(PREFERENCES, d.pref, es),
    Idioma: ctx.lang.toUpperCase(),
    'Página de origen': ctx.page,
    'Servicio de entrada': ctx.entry,
    UTM: ctx.utm,
    'Consentimiento RGPD': 'Sí',
  }
  // Fuera las filas vacías (salvo el honeypot, que FormSubmit necesita ver)
  return Object.fromEntries(Object.entries(rows).filter(([k, v]) => k === '_honey' || v !== ''))
}

/** Resumen en texto plano para WhatsApp y email. */
export function summary(d: BriefData, ctx: BriefContext): string {
  const l = ctx.lang
  const es = l === 'es'
  const lines = [
    es ? `Hola, soy ${d.name.trim()}. Os envío mi brief ${ctx.id}.` : `Hi, I’m ${d.name.trim()}. Here is my brief ${ctx.id}.`,
    '',
    `${es ? 'Servicios' : 'Services'}: ${serviceNames(d, l)}`,
    `${es ? 'Marca' : 'Brand'}: ${d.brand.trim()}${d.link.trim() ? ` (${d.link.trim()})` : ''}`,
    `Sector: ${label(BRIEF_SECTORS, d.sector, l)}`,
    `${es ? 'Objetivo' : 'Goal'}: ${label(GOALS, d.goal, l)}`,
    d.timeline ? `${es ? 'Plazo' : 'Timeline'}: ${label(TIMELINES, d.timeline, l)}` : null,
    INVESTMENT.enabled && d.budget ? `${es ? 'Inversión orientativa' : 'Approximate budget'}: ${label(INVESTMENT.options, d.budget, l)}` : null,
    d.refs.trim() ? `${es ? 'Referencias' : 'References'}: ${d.refs.trim()}` : null,
    d.notes.trim() ? `${es ? 'Me gustaría parecerme a' : 'I’d like to look like'}: ${d.notes.trim()}` : null,
    '',
    `Email: ${d.email.trim()}`,
    d.phone.trim() ? `${es ? 'Teléfono' : 'Phone'}: ${d.phone.trim()}` : null,
    `${es ? 'Prefiero' : 'I prefer'}: ${label(PREFERENCES, d.pref, l)}`,
  ]
  return lines.filter((x): x is string => x !== null).join('\n')
}

export function mailtoHref(d: BriefData, ctx: BriefContext): string | null {
  if (!site.email) return null
  const subject = `Brief ${ctx.id} · ${d.brand.trim()}`
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary(d, ctx))}`
}

export const whatsappBriefHref = (d: BriefData, ctx: BriefContext) => whatsappHref(summary(d, ctx))

/**
 * Acción del <form> sin JS. FormSubmit: el endpoint AJAX (/ajax/) responde JSON,
 * así que el envío clásico va al endpoint normal y redirige con _next.
 */
export function noJsAction(): { action?: string; encType?: string } {
  if (site.leadEndpoint) return { action: site.leadEndpoint.replace('formsubmit.co/ajax/', 'formsubmit.co/') }
  if (site.email) return { action: `mailto:${site.email}`, encType: 'text/plain' }
  return {}
}

export const isFormSubmit = () => site.leadEndpoint.includes('formsubmit.co')
