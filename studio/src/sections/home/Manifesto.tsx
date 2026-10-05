import { useRef } from 'react'
import { useCopy, type L } from '@/i18n'
import { useSplitReveal } from '@/hooks/useSplitReveal'

const copy: L<{ lead: string; word: string; tail: string; line: string }> = {
  es: {
    lead: 'Las marcas de lujo no compiten por atención. Compiten por',
    word: 'memoria',
    tail: '.',
    line: 'Restaurantes, inmobiliarias, moda, bebidas y creadores. Trabajamos pocas marcas a la vez.',
  },
  en: {
    lead: 'Luxury brands don’t compete for attention. They compete for',
    word: 'memory',
    tail: '.',
    line: 'Restaurants, real estate, fashion, drinks and creators. We take on only a few brands at a time.',
  },
}

/**
 * Manifiesto: el silencio después del vídeo. Negro puro, una frase y una línea.
 * Un solo énfasis por color ("memoria" en paper). Máscara de líneas una vez; el resto, quieto.
 */
export function Manifesto() {
  const t = useCopy(copy)
  const title = useRef<HTMLHeadingElement>(null)
  useSplitReveal(title)

  return (
    <section aria-labelledby="manifesto-title" className="bg-ink py-32 md:py-48">
      <div className="container-x grid grid-cols-12 gap-x-6">
        <h2 id="manifesto-title" ref={title} className="type-display col-span-12 max-w-[19ch] text-mute lg:col-span-10">
          {t.lead} <span className="text-paper">{t.word}</span>
          {t.tail}
        </h2>
        <p className="type-lead col-span-12 mt-12 max-w-[34ch] text-mute md:col-span-8 md:col-start-5 md:mt-20 lg:col-span-5 lg:col-start-7">
          {t.line}
        </p>
      </div>
    </section>
  )
}
