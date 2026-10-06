import { useRef } from 'react'
import { useLang, type L } from '@/i18n'
import { to } from '@/i18n/paths'
import { Video } from '@/components/Video'
import { Cta } from '@/components/Cta'
import { Meta } from '@/components/Meta'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { gsap, heroDelay, MQ, useGSAP } from '@/lib/motion'

const copy: L<{ title: [string, string]; lead: string; cta: string; work: string; label: string; ai: string }> = {
  es: {
    title: ['Imagen de lujo,', 'sin plató'],
    lead: 'Vídeo, 3D y webs de autor con IA, dirigidos con oficio de cine.',
    cta: 'Solicitar propuesta',
    work: 'Ver trabajo',
    label: 'Reel de NEO Studio generado con IA: una copa de vino, alta cocina, una llave dorada y un comedor de lujo.',
    ai: 'Generado con IA, dirigido por NEO',
  },
  en: {
    title: ['Luxury imagery,', 'no set'],
    lead: 'AI video, AI 3D and signature websites, directed with a filmmaker’s craft.',
    cta: 'Request a proposal',
    work: 'View work',
    label: 'NEO Studio reel, AI-generated: a glass of wine, fine dining, a golden key and a luxury dining room.',
    ai: 'AI-generated, directed by NEO',
  },
}

/**
 * Hero "Reserva": el primer viewport es la tesis.
 * Reel a sangre (póster = LCP), titular en máscara de líneas tras la intro del logo y CTAs visibles sin scroll.
 * Sin efectos de scroll. Reduced-motion: todo en su sitio y vídeo en póster con play (lo gestiona <Video>).
 */
export function Hero() {
  const lang = useLang()
  const t = copy[lang]
  const root = useRef<HTMLElement>(null)
  const title = useRef<HTMLHeadingElement>(null)

  useSplitReveal(title, { on: 'load', delay: heroDelay() })

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        // Subtítulo, CTAs y etiqueta: solo opacidad, 150 ms después del titular.
        // SplitText vuelve a partir el titular cuando cargan las fuentes (y reinicia su retardo),
        // así que arrancamos a la vez: tras document.fonts.ready.
        const tw = gsap.fromTo(
          el.querySelectorAll('[data-hero-after]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.8, ease: 'expo.out', delay: heroDelay() + 0.15, stagger: 0.05, paused: true },
        )
        let live = true
        const go = () => {
          if (live) tw.restart(true)
        }
        if (document.fonts) void document.fonts.ready.then(go)
        else go()
        return () => {
          live = false
        }
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="grain relative isolate min-h-[100svh] overflow-hidden bg-ink [--hero-pb:clamp(1.25rem,4.5vh,3rem)]"
    >
      <div className="absolute inset-0">
        <Video
          media="reel-land"
          portrait="reel-port"
          priority
          exclusive
          controls
          label={t.label}
          className="h-full w-full [&>button]:right-(--gutter) [&>button]:bottom-(--hero-pb)"
        />
      </div>

      {/* Solo para legibilidad: oscurece la mitad inferior, donde vive el texto. Calibrado para los planos
          más claros del reel (cerradura con luz, llave dorada): ≥3:1 en el titular y ≥4,5:1 en el subtítulo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[85%] bg-linear-to-t from-black/90 from-0% via-black/65 via-45% to-transparent to-100% md:h-[75%]"
      />

      <div className="container-x relative z-[2] flex min-h-[100svh] flex-col justify-end pb-[calc(var(--hero-pb)+4rem)] md:pb-(--hero-pb)">
        <h1 id="hero-title" ref={title} data-hero-reveal className="type-hero [text-shadow:0_1px_14px_rgb(0_0_0/0.35)] max-sm:[font-stretch:104%]">
          {t.title[0]}
          <br />
          {t.title[1]}
          <span className="text-accent" aria-hidden="true">
            *
          </span>
        </h1>
        <p data-hero-reveal data-hero-after className="type-lead mt-5 max-w-[34ch] text-paper/85 [text-shadow:0_1px_12px_rgb(0_0_0/0.5)] md:mt-6">
          {t.lead}
        </p>
        <div data-hero-reveal data-hero-after className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-2 md:mt-9">
          <Cta to={to.contact(lang)} magnetic>
            {t.cta}
          </Cta>
          <Cta variant="text" to={to.work(lang)}>
            {t.work}
          </Cta>
        </div>
      </div>

      {/* Transparencia IA, junto al botón de pausa (móvil: misma línea, a la izquierda) */}
      <div
        data-hero-reveal
        data-hero-after
        className="absolute bottom-(--hero-pb) left-(--gutter) z-[2] flex h-11 items-center md:right-[calc(var(--gutter)+3.75rem)] md:left-auto"
      >
        <Meta className="text-paper/75!">{t.ai}</Meta>
      </div>
    </section>
  )
}
