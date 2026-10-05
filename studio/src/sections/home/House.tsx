import { useRef } from 'react'
import { useLang } from '@/i18n'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { HouseIndex } from '@/sections/house/HouseIndex'
import { houseCopy } from '@/sections/house/copy'

/**
 * La Casa (explicación nivel 1 + orientación).
 * Índice tipográfico de los 6 oficios con dos modos: "Por oficio" (vista previa en ventana fija)
 * y "Por situación" (5 radios, resultado recolocado con Flip).
 */
export function House() {
  const lang = useLang()
  const t = houseCopy[lang]
  const title = useRef<HTMLHeadingElement>(null)
  useSplitReveal(title)

  return (
    <section aria-labelledby="house-title" className="py-[clamp(6rem,12vw,11rem)]">
      <div className="container-x">
        <h2 id="house-title" ref={title} className="type-display mb-8 max-w-[14ch] text-paper lg:mb-10">
          {t.title}
        </h2>
        <HouseIndex intro={t.intro} />
      </div>
    </section>
  )
}
