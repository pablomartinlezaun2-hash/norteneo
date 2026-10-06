import type { Lang } from '@/i18n'
import type { LegalId } from '@/i18n/paths'
import { legalEn } from './en'
import { legalEs } from './es'
import type { LegalBlock, LegalDoc } from './types'

export type { LegalBlock, LegalDoc, LegalSection } from './types'

export const legalDocs: Record<Lang, Record<LegalId, LegalDoc>> = { es: legalEs, en: legalEn }

/** Orden de los documentos en la navegación legal */
export const legalOrder: LegalId[] = ['notice', 'privacy', 'cookies']

/** Marcador de dato del titular que falta: [PENDIENTE: …] / [PENDING: …] */
export const PENDING_MARK = /\[(?:PENDIENTE|PENDING):[^\]]+\]/

const blockText = (b: LegalBlock) => (typeof b === 'string' ? [b] : b.list)
const docText = (d: LegalDoc) => [d.title, d.description, d.intro, ...d.sections.flatMap((s) => [s.h, ...s.body.flatMap(blockText)])]

/** ¿Tiene este documento datos pendientes? (las páginas van con noindex mientras los tenga) */
export const docPending = (d: LegalDoc) => docText(d).some((t) => PENDING_MARK.test(t))

/**
 * true mientras quede algún [PENDIENTE: …] en los textos legales (ES o EN).
 * El build lo usa para avisar: no se debe publicar en producción con datos del titular sin completar.
 */
export const LEGAL_PENDING: boolean = Object.values(legalDocs).some((docs) => Object.values(docs).some(docPending))
