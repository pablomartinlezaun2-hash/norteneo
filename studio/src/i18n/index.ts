import { useLocation } from 'react-router-dom'

export type Lang = 'es' | 'en'
export const LANGS: readonly Lang[] = ['es', 'en'] as const
export const DEFAULT_LANG: Lang = 'es'

/** Texto o dato localizado: { es, en } */
export type L<T = string> = Record<Lang, T>

export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'es'
}

export function useLang(): Lang {
  return langFromPath(useLocation().pathname)
}

/** Devuelve la variante del idioma activo de un diccionario { es, en }. */
export function useCopy<T>(dict: L<T>): T {
  return dict[useLang()]
}

export function pick<T>(dict: L<T>, lang: Lang): T {
  return dict[lang]
}
