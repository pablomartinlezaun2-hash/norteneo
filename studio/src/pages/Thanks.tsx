import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { whatsappHref } from '@/content/site'
import { heroDelay } from '@/lib/motion'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { Seo } from '@/components/Seo'
import { Cta } from '@/components/Cta'
import { Meta } from '@/components/Meta'
import { LAST_KEY } from '@/sections/contact/config'
import { isBriefId } from '@/sections/contact/submit'

const copy = {
  es: {
    seo: 'Brief recibido',
    title: 'Recibido.',
    withId: (id: string) => `Tu brief ${id} ya está con nosotros. Guarda este número por si quieres citarlo.`,
    noId: 'Tu brief ya está con nosotros.',
    nextTitle: 'Qué pasa ahora',
    steps: [
      { term: 'Lo leemos con calma', text: 'Tu marca, tus referencias y lo que quieres conseguir.' },
      { term: 'Te escribimos', text: 'Por el canal que has elegido, con preguntas o una primera dirección.' },
      { term: 'Te enviamos una propuesta', text: 'A medida y sin precios de catálogo. Si no encaja, también te lo decimos.' },
    ],
    hurry: '¿Prefieres adelantarlo?',
    whatsapp: 'Escribir por WhatsApp',
    waMsg: (id: string | null, name: string) =>
      id ? (name ? `Hola, soy ${name}, brief ${id}.` : `Hola, os escribo por el brief ${id}.`) : 'Hola, acabo de enviaros un brief desde la web.',
    work: 'Ver trabajo',
    home: 'Volver al inicio',
  },
  en: {
    seo: 'Brief received',
    title: 'Received.',
    withId: (id: string) => `Your brief ${id} is with us. Keep this number handy in case you need to refer to it.`,
    noId: 'Your brief is with us.',
    nextTitle: 'What happens next',
    steps: [
      { term: 'We read it carefully', text: 'Your brand, your references and what you want to achieve.' },
      { term: 'We get in touch', text: 'Through the channel you chose, with questions or a first direction.' },
      { term: 'We send you a proposal', text: 'Tailored to you, with no price list. If we’re not the right fit, we’ll tell you that too.' },
    ],
    hurry: 'Want to speed things up?',
    whatsapp: 'Message on WhatsApp',
    waMsg: (id: string | null, name: string) =>
      id ? (name ? `Hi, I’m ${name}, brief ${id}.` : `Hi, I’m writing about brief ${id}.`) : 'Hi, I just sent you a brief from the website.',
    work: 'See the work',
    home: 'Back to home',
  },
}

/** /contacto/gracias · /en/contact/thank-you. noindex. Sin plazos que Pablo no haya comprometido. */
export function Component() {
  const lang = useLang()
  const t = copy[lang]
  const h1 = useRef<HTMLHeadingElement>(null)
  useSplitReveal(h1, { on: 'load', delay: heroDelay() })
  const [id, setId] = useState<string | null>(null)
  const [name, setName] = useState('')

  // El ID llega por la query; se lee tras montar (la página está prerenderizada sin query)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('id')
    if (!isBriefId(q)) return
    setId(q)
    try {
      const last = JSON.parse(sessionStorage.getItem(LAST_KEY) ?? 'null') as { id?: string; name?: string } | null
      if (last?.id === q && typeof last.name === 'string') setName(last.name.slice(0, 60))
    } catch {
      /* sin almacenamiento */
    }
  }, [])

  const wa = whatsappHref(t.waMsg(id, name))

  return (
    <>
      <Seo title={t.seo} noindex />
      <section className="container-x pt-[calc(var(--nav-h)+clamp(4rem,12vw,9rem))] pb-24 md:pb-36">
        {id && <Meta>{`Brief ${id}`}</Meta>}
        <h1 ref={h1} data-hero-reveal className="type-hero mt-6">
          {t.title}
        </h1>
        <p className="type-lead measure mt-6 text-mute" aria-live="polite">
          {id ? t.withId(id) : t.noId}
        </p>

        <div className="mt-20 grid gap-10 md:mt-28 md:grid-cols-12">
          <h2 className="type-title md:col-span-4">{t.nextTitle}</h2>
          <dl className="md:col-span-7 md:col-start-6">
            {t.steps.map((s) => (
              <div key={s.term} className="relative grid gap-1 py-6 md:grid-cols-7 md:gap-8">
                <span aria-hidden="true" className="hairline-dashed absolute inset-x-0 top-0" />
                <dt className="text-[1.0625rem] font-[480] text-paper md:col-span-3">{s.term}</dt>
                <dd className="type-body text-mute md:col-span-4">{s.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-20 flex flex-col gap-10 border-t border-line pt-10 md:mt-28 md:flex-row md:items-center md:justify-between">
          {wa ? (
            <div>
              <p className="type-small text-dim">{t.hurry}</p>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-[1.0625rem] text-paper underline-offset-4 hover:underline">
                {t.whatsapp}
              </a>
            </div>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Cta to={to.work(lang)}>{t.work}</Cta>
            <Cta to={to.home(lang)} variant="text">
              {t.home}
            </Cta>
          </div>
        </div>
      </section>
    </>
  )
}
