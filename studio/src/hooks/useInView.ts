import { useEffect, useState, type RefObject } from 'react'

/** IntersectionObserver simple. `once` deja de observar al entrar. */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { rootMargin = '0px', threshold = 0, once = false }: { rootMargin?: string; threshold?: number; once?: boolean } = {},
): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) io.disconnect()
      },
      { rootMargin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin, threshold, once])
  return inView
}
