import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { Cta } from '@/components/Cta'

const copy = {
  es: {
    titleA: 'La IA genera.',
    titleB: 'Nosotros dirigimos.',
    lead: 'Las herramientas cambian cada mes; el criterio, no. Detrás de cada pieza hay alguien que decide plano a plano.',
    link: 'Conocer el estudio',
    steps: [
      { verb: 'Escuchar', text: 'Tu marca, tu público y lo que quieres contar, antes del primer fotograma.' },
      { verb: 'Dirigir', text: 'Guion, encuadre, luz y ritmo, decididos como en un rodaje.' },
      { verb: 'Generar', text: 'Cada plano con IA, repetido hasta que el producto es fiel al original.', ai: true },
      { verb: 'Pulir', text: 'Montaje, color y sonido. Solo sale lo que firmaríamos.' },
    ],
  },
  en: {
    titleA: 'AI generates.',
    titleB: 'We direct.',
    lead: 'Tools change every month; judgement doesn’t. Behind every piece is someone deciding shot by shot.',
    link: 'Meet the studio',
    steps: [
      { verb: 'Listen', text: 'Your brand, your audience and your story, before the first frame.' },
      { verb: 'Direct', text: 'Script, framing, light and pace, decided as on a film set.' },
      { verb: 'Generate', text: 'Every shot made with AI, redone until the product is true to the original.', ai: true },
      { verb: 'Polish', text: 'Editing, colour and sound. Only what we’d sign goes out.' },
    ],
  },
}

/**
 * Atelier (confianza). La sección más quieta de la web: sin animación, a propósito.
 * Sin foto de Pablo todavía: composición solo tipográfica. La parte de la IA ("genera", "Generar")
 * va en gris y la parte humana en blanco, para que el texto cuente el reparto de papeles.
 */
export function Atelier() {
  const lang = useLang()
  const t = copy[lang]
  return (
    <section aria-labelledby="atelier-title" className="py-[clamp(6rem,12vw,11rem)]">
      <div className="container-x">
        <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          <h2 id="atelier-title" className="type-display lg:col-span-8">
            <span className="block text-mute">{t.titleA}</span>
            <span className="block text-paper">{t.titleB}</span>
          </h2>
          <div className="lg:col-span-4 lg:self-end">
            <p className="type-lead max-w-[34ch] text-mute">{t.lead}</p>
            <Cta variant="text" to={to.studio(lang)} className="mt-4 underline decoration-line-strong hover:decoration-paper">
              {t.link}
            </Cta>
          </div>
        </div>

        <ol className="mt-[clamp(4.5rem,9vw,8rem)] grid gap-x-[var(--gutter)] gap-y-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:pt-12">
          {t.steps.map((s) => (
            <li key={s.verb}>
              <h3 className={`type-title ${s.ai ? 'text-mute' : 'text-paper'}`}>{s.verb}</h3>
              <p className="type-body mt-3 max-w-[30ch] text-mute">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
