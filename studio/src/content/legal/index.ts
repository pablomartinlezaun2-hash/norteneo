import type { Lang } from '@/i18n'
import type { LegalId } from '@/i18n/paths'
import { legalEn } from './en'
import { legalEs } from './es'
import type { LegalDoc } from './types'

export type { LegalBlock, LegalDoc, LegalSection } from './types'

export const legalDocs: Record<Lang, Record<LegalId, LegalDoc>> = { es: legalEs, en: legalEn }

/** Orden de los documentos en la navegación legal */
export const legalOrder: LegalId[] = ['notice', 'privacy', 'cookies']
