import { useRef } from 'react'
import { useLang, type L } from '@/i18n'
import { to } from '@/i18n/paths'
import { serviceById } from '@/content/services'
import { ImageSequence, type ImageSequenceHandle } from '@/components/ImageSequence'
import { Meta } from '@/components/Meta'
import { DiscoverLink } from '@/components/Cta'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { frameUrl, getMedia } from '@/lib/media'
import { gsap, MQ, useGSAP } from '@/lib/motion'
import { FPS, timecode, useScrubMode } from './hero/useScrubMode'

type Copy = {
  title: [string, string]
  hint: string
  still: string
  label: string
  phrases: [string, string, string]
  alts: [string, string, string]
  spec: string
}

const copy: L<Copy> = {
  es: {
    title: ['Un spot de cocina.', 'Sin cocina.'],
    hint: 'Desliza. Tú controlas el tiempo.',
    still: 'Cinco segundos, tres fotogramas.',
    label:
      'Spot de gastronomía generado con IA y controlado con el scroll: un cuchillo corta entre romero, sal y piel de limón suspendidos; al final, un plato con humo y una copa.',
    phrases: ['Cada gesto, dirigido.', 'Cada partícula, en su sitio.', 'Tu marca, a este nivel.'],
    alts: [
      'Un cuchillo cruza entre romero, sal, pimienta y piel de limón suspendidos sobre negro.',
      'Humo, una gota de aceite y un grano de pimienta flotan sobre la mesa a la luz de una vela.',
      'Plato negro con hierbas y humo sobre una mesa oscura, con una copa al fondo.',
    ],
    spec: 'Mesa negra · 2048 × 1152 · 60 fps · 5 s · Generado con IA, dirigido por NEO',
  },
  en: {
    title: ['A food commercial.', 'No kitchen.'],
    hint: 'Scroll. Time is in your hands.',
    still: 'Five seconds, three frames.',
    label:
      'AI-generated food commercial controlled by scrolling: a knife slices through suspended rosemary, salt and lemon peel; it ends on a smoking plate and a wine glass.',
    phrases: ['Every gesture, directed.', 'Every particle, in its place.', 'Your brand, at this level.'],
    alts: [
      'A knife slices through rosemary, salt, pepper and lemon peel suspended against black.',
      'Smoke, a drop of oil and a peppercorn float above the table by candlelight.',
      'A black plate with herbs and smoke on a dark table, a wine glass behind it.',
    ],
    spec: 'Black table · 2048 × 1152 · 60 fps · 5 s · AI-generated, directed by NEO',
  },
}

/** Marcas de tiempo de cada frase (segundos del clip). */
const MARKS = ['00:00:00', '00:00:02', '00:00:04'] as const
/** Fotogramas fijos de la variante sin scrub (~10 %, ~50 %, ~95 % de la secuencia de escritorio). */
const STILLS = [0.13, 0.53, 0.955] as const
/** Punto focal horizontal en móvil por tramo: cuchillo → ingredientes → copa. */
const FOCUS = [0.3, 0.56, 0.2] as const

const TOTAL_FRAMES = 5 * FPS
const HOLD = 0.15

/**
 * La Mesa · momento firma (PIN 1 de la home).
 * El scroll controla fotograma a fotograma el spot de gastronomía (canvas, nunca video.currentTime),
 * con timecode y punto REC. Reduced-motion, Save-Data o sin JS: tres fotogramas fijos con su frase.
 */
export function Signature() {
  const lang = useLang()
  const t = copy[lang]
  const scrub = useScrubMode()
  const wide = useMediaQuery(MQ.desktop)
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const seq = useRef<ImageSequenceHandle>(null)

  useGSAP(
    () => {
      const scope = root.current
      const stageEl = stage.current
      if (!scrub || !scope || !stageEl) return
      const mm = gsap.matchMedia()
      mm.add({ desktop: `${MQ.motion} and ${MQ.desktop}`, mobile: `${MQ.motion} and ${MQ.mobile}` }, (ctx) => {
        const desktop = !!ctx.conditions?.desktop
        const tcEls = Array.from(scope.querySelectorAll<HTMLElement>('[data-tc]'))
        const [a, b, c] = Array.from(scope.querySelectorAll<HTMLElement>('[data-phrase]'))
        const head = scope.querySelector<HTMLElement>('[data-head]')
        const media = scope.querySelector<HTMLElement>('[data-media]')
        const s = { p: 0, x: FOCUS[0] }
        let last = -1

        const paint = () => {
          seq.current?.render(s.p)
          const f = Math.round(s.p * TOTAL_FRAMES)
          if (f === last) return
          last = f
          const txt = timecode(f)
          for (const el of tcEls) el.textContent = txt
        }
        const focus = () => seq.current?.setFocus(s.x)

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: stageEl,
            pin: true,
            start: 'top top',
            end: desktop ? '+=250%' : '+=180%',
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: paint,
          },
        })

        // Fotogramas + timecode: 85 % del recorrido. El último frame se queda quieto el 15 % final.
        tl.to(s, { p: 1, duration: 1 - HOLD, onUpdate: paint }, 0)
        tl.to({}, { duration: HOLD }, 1 - HOLD)

        // Tres frases ligadas al progreso: entran con expo.out y salen más rápido (≈65 %).
        const enter = { autoAlpha: 1, y: 0, duration: 0.045, ease: 'expo.out' }
        const exit = { autoAlpha: 0, y: -10, duration: 0.03, ease: 'power2.in' }
        const from = { autoAlpha: 0, y: 14 }
        tl.fromTo(a, from, enter, 0.06)
          .to(a, exit, 0.27)
          .fromTo(b, from, enter, 0.35)
          .to(b, exit, 0.62)
          .fromTo(c, from, enter, 0.7)

        if (desktop) {
          // Se encienden las luces: el titular cede la pantalla y la imagen pasa de penumbra a plena luz.
          if (head) tl.to(head, { opacity: 0, duration: 0.08, ease: 'power1.in' }, 0.03)
          if (media) tl.fromTo(media, { opacity: 0.32 }, { opacity: 1, duration: 0.1, ease: 'power1.inOut' }, 0.03)
        } else {
          // Recorte 4:5 con punto focal por tramos: cuchillo → ingredientes → copa.
          tl.to(s, { x: FOCUS[1], duration: 0.16, ease: 'power2.inOut', onUpdate: focus }, 0.22)
          tl.to(s, { x: FOCUS[2], duration: 0.18, ease: 'power2.inOut', onUpdate: focus }, 0.56)
        }
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [scrub], revertOnUpdate: true },
  )

  return (
    <section ref={root} aria-labelledby="mesa-title" className="relative bg-ink">
      {scrub ? (
        // Envoltorio estable: el pin-spacer de GSAP vive dentro y React nunca lo toca.
        <div key="scrub">
          <div ref={stage} className="relative flex h-[100svh] flex-col overflow-hidden bg-ink">
            <div data-head className="relative z-[2]">
              {/* Velo superior solo en escritorio, donde el titular se apoya sobre la imagen en penumbra */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 hidden h-[calc(100%+7rem)] bg-linear-to-b from-black/80 via-black/45 to-transparent lg:block"
              />
              <div className="container-x relative pt-[calc(var(--nav-h)+1.25rem)] lg:pt-[calc(var(--nav-h)+2.5rem)]">
                <h2 id="mesa-title" className="type-display">
                  <span className="block">{t.title[0]}</span> <span className="block">{t.title[1]}</span>
                </h2>
                <p className="type-lead mt-3 text-mute lg:mt-5">{t.hint}</p>
              </div>
            </div>

            <div className="relative mt-6 h-[min(125vw,calc(100svh-20rem))] w-full lg:absolute lg:inset-0 lg:mt-0 lg:flex lg:h-auto lg:items-center lg:justify-center">
              <div data-media className="relative h-full w-full mask-y-from-90% lg:aspect-video lg:h-auto lg:w-[min(100%,calc(100svh*16/9))] lg:mask-x-from-90% lg:mask-y-from-78%">
                <ImageSequence
                  key={wide ? 'contain' : 'cover'}
                  ref={seq}
                  media="gastro"
                  fit={wide ? 'contain' : 'cover'}
                  focusX={FOCUS[0]}
                  label={t.label}
                  className="h-full w-full"
                />
              </div>
              <Hud className="absolute top-3 left-(--gutter) flex lg:hidden" />
            </div>

            <div className="container-x relative z-[2] mt-auto flex items-end justify-between gap-8 pt-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] lg:pb-10">
              <div className="grid" aria-hidden="true">
                {t.phrases.map((p, i) => (
                  <p key={i} data-phrase className="[grid-area:1/1]">
                    <Meta>{MARKS[i]}</Meta>
                    <span className="type-title mt-2 block">{p}</span>
                  </p>
                ))}
              </div>
              <Hud className="mb-1 hidden lg:flex" />
            </div>
          </div>
          <p className="sr-only">{t.phrases.map((p, i) => `${MARKS[i]} ${p}`).join(' ')}</p>
        </div>
      ) : (
        <Stills t={t} />
      )}

      <Spec spec={t.spec} />
    </section>
  )
}

/** Indicador de cámara: punto REC azul y timecode tabular (se actualiza por textContent, nunca por estado). */
function Hud({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`type-meta items-center gap-2 text-paper ${className}`}>
      <span className="size-1.5 rounded-full bg-accent" />
      <span className="text-mute">REC</span>
      <span data-tc className="min-w-[11ch]">
        {timecode(0)}
      </span>
    </div>
  )
}

/** Variante sin pin ni scrub: tres fotogramas clave apilados, cada uno con su frase. */
function Stills({ t }: { t: Copy }) {
  const desktop = getMedia('gastro')?.seq?.desktop
  return (
    <div className="container-x pt-28 pb-6 md:pt-40">
      <h2 id="mesa-title" className="type-display">
        <span className="block">{t.title[0]}</span> <span className="block">{t.title[1]}</span>
      </h2>
      <p className="type-lead mt-4 text-mute">{t.still}</p>
      {desktop && (
        <ol className="mt-14 grid gap-14 md:mt-20 md:gap-20">
          {STILLS.map((at, i) => (
            <li key={i}>
              <figure className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
                <div className="relative -mx-(--gutter) aspect-[4/5] overflow-hidden mask-y-from-92% sm:mx-0 sm:aspect-video lg:col-span-9 lg:mask-x-from-94%">
                  <img
                    src={frameUrl(desktop, Math.round(at * (desktop.count - 1)))}
                    alt={t.alts[i]}
                    width={desktop.w}
                    height={desktop.h}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: `${FOCUS[i] * 100}% 50%` }}
                  />
                </div>
                <figcaption className="lg:col-span-3 lg:pb-2">
                  <Meta>{MARKS[i]}</Meta>
                  <span className="type-title mt-2 block">{t.phrases[i]}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** Ficha técnica al soltar el pin y enlace al servicio. */
function Spec({ spec }: { spec: string }) {
  const lang = useLang()
  return (
    <div className="container-x flex flex-col items-start gap-3 pt-8 pb-28 md:flex-row md:items-center md:justify-between md:gap-8 md:pb-40">
      <Meta>{spec}</Meta>
      <DiscoverLink to={to.service(lang, 'ai-video')}>{lang === 'en' ? `See ${serviceById('ai-video').name.en}` : `Ver ${serviceById('ai-video').name.es}`}</DiscoverLink>
    </div>
  )
}
