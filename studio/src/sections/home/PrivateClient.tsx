import type { L } from '@/i18n'
import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { whatsappHref } from '@/content/site'
import { serviceById, type ServiceId } from '@/content/services'
import { Cta } from '@/components/Cta'

const copy = {
  es: {
    title: 'Cada encargo empieza con una conversación.',
    lead: 'Sin catálogo de precios. Estudiamos tu marca y te enviamos una propuesta a medida.',
    cta: 'Solicitar propuesta',
    or: 'o escríbenos por',
    whatsappMsg: 'Hola, me gustaría hablar de un proyecto con NEO Studio.',
    newTab: '(se abre en una pestaña nueva)',
    factsLabel: 'Cómo trabajamos',
    facts: [
      { term: 'Respuesta personal', desc: 'Te responde una persona del estudio, no un sistema automático.' },
      { term: 'Propuesta a medida', desc: 'Alcance, formatos y entregables pensados para tu marca, por escrito.' },
      { term: 'Sin compromiso', desc: 'Pedir una propuesta no te obliga a nada.' },
    ],
    testimonials: 'Lo que dicen los clientes',
    cols: { client: 'Cliente', sector: 'Sector', service: 'Servicio', quote: 'Cita' },
  },
  en: {
    title: 'Every commission starts with a conversation.',
    lead: 'No price list. We study your brand and send you a proposal made to measure.',
    cta: 'Request a proposal',
    or: 'or message us on',
    whatsappMsg: 'Hi, I’d like to talk about a project with NEO Studio.',
    newTab: '(opens in a new tab)',
    factsLabel: 'How we work',
    facts: [
      { term: 'A personal reply', desc: 'Someone from the studio answers you, not an automated system.' },
      { term: 'A tailored proposal', desc: 'Scope, formats and deliverables designed for your brand, in writing.' },
      { term: 'No commitment', desc: 'Asking for a proposal doesn’t commit you to anything.' },
    ],
    testimonials: 'What clients say',
    cols: { client: 'Client', sector: 'Sector', service: 'Service', quote: 'Quote' },
  },
}

/** Testimonio real (cita de 25 palabras como máximo). */
type Testimonial = { client: string; sector: L; service: ServiceId; quote: L }

/**
 * Pendiente del cliente: no hay testimonios reales todavía.
 * El bloque solo se renderiza con 2 o más; nunca se inventan.
 */
const testimonials: Testimonial[] = []

/**
 * Hairline discontinua sobre fondo claro (la utilidad global usa el blanco del tema oscuro), dibujada como
 * fondo para no meter <div> sueltos en el <dl>: cada par lleva la suya arriba y el <dl> cierra abajo.
 */
const dashedLight = 'bg-[linear-gradient(to_right,rgb(10_10_10/0.28)_50%,transparent_0)] bg-[length:6px_1px] bg-repeat-x'

/**
 * Cliente privado (venta). Única sección clara de la web: la sala privada se ilumina.
 * Solo el magnetismo del CTA (2/2 de la web). Foco visible oscuro, no azul.
 */
export function PrivateClient() {
  const lang = useLang()
  const t = copy[lang]
  const wa = whatsappHref(t.whatsappMsg)

  return (
    <section
      aria-labelledby="private-title"
      className="bg-light text-light-ink [&_:focus-visible]:outline-light-ink"
    >
      <div className="container-x py-[clamp(6rem,12vw,11rem)]">
        <div className="grid gap-y-16 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          <div className="lg:col-span-7">
            <h2 id="private-title" className="type-display max-w-[15ch]">
              {t.title}
            </h2>
            <p className="type-lead mt-6 max-w-[38ch] text-light-ink/70 lg:mt-8">{t.lead}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-7 lg:mt-12">
              <Cta variant="dark" to={to.contact(lang)} magnetic className="w-full sm:w-auto">
                {t.cta}
              </Cta>
              {wa && (
                <p className="type-small text-center text-light-ink/70 sm:text-left">
                  {t.or}{' '}
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 font-[520] text-light-ink underline decoration-light-ink/30 underline-offset-4 transition-colors hover:decoration-light-ink"
                  >
                    WhatsApp
                    <span className="sr-only"> {t.newTab}</span>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                      <path d="M1.5 7.5 7.5 1.5M3 1.5h4.5V6" />
                    </svg>
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <h3 className="type-small mb-4 text-light-ink/70">{t.factsLabel}</h3>
            <dl className={`${dashedLight} bg-bottom`}>
              {t.facts.map((f) => (
                <div key={f.term} className={`${dashedLight} bg-top py-5`}>
                  <dt className="type-body font-[540]">{f.term}</dt>
                  <dd className="type-body mt-1 text-light-ink/70">{f.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {testimonials.length >= 2 && (
          <div className="mt-[clamp(4rem,8vw,7rem)]">
            <h3 className="type-title mb-8">{t.testimonials}</h3>
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="sr-only">
                <tr>
                  <th scope="col">{t.cols.client}</th>
                  <th scope="col">{t.cols.sector}</th>
                  <th scope="col">{t.cols.service}</th>
                  <th scope="col">{t.cols.quote}</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((q) => (
                  <tr key={q.client} className="border-t border-dashed border-light-ink/25 align-top max-md:grid max-md:gap-1 max-md:py-5">
                    <th scope="row" className="type-body py-5 pr-6 font-[540] max-md:py-0">
                      {q.client}
                    </th>
                    <td className="type-small py-5 pr-6 text-light-ink/70 max-md:py-0">{q.sector[lang]}</td>
                    <td className="type-small py-5 pr-6 text-light-ink/70 max-md:py-0">{serviceById(q.service).name[lang]}</td>
                    <td className="type-lead py-5 max-md:py-0 md:w-1/2">“{q.quote[lang]}”</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
