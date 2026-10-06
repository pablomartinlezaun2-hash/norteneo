/**
 * Infraestructura de animación (GSAP).
 * Regla: registrar plugins UNA vez aquí y que todo el código importe gsap desde este módulo.
 * Todas las animaciones van dentro de useGSAP({ scope }) y respetan prefers-reduced-motion
 * mediante gsap.matchMedia() con las condiciones de MQ.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { useGSAP } from '@gsap/react'

export const isBrowser = typeof window !== 'undefined'

if (isBrowser) {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip)
  gsap.defaults({ ease: 'expo.out', duration: 0.7 })
  ScrollTrigger.config({ ignoreMobileResize: true })
}

/** Media queries estándar para gsap.matchMedia(). */
export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 1024px)',
  mobile: '(max-width: 1023.98px)',
  hover: '(hover: hover) and (pointer: fine)',
} as const

/** Duraciones (s) y easings del sistema. */
export const DUR = { fast: 0.2, base: 0.5, focal: 0.75, exit: 0.35 } as const
export const EASE = { out: 'expo.out', inOut: 'power3.inOut', none: 'none' } as const
export const STAGGER = 0.04

export function prefersReducedMotion(): boolean {
  return isBrowser && window.matchMedia(MQ.reduce).matches
}

/** Retardo de entrada del hero: espera a que termine la intro del logo la primera vez. */
export function heroDelay(): number {
  if (!isBrowser) return 0
  return document.documentElement.classList.contains('intro-seen') ? 0.15 : 1.15
}

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP }
