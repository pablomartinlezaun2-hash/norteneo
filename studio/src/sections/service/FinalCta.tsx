import { useLang } from '@/i18n'
import { to } from '@/i18n/paths'
import { whatsappHref } from '@/content/site'
import type { Service } from '@/content/services'
import type { ServiceDetail } from '@/content/services/types'
import { Cta } from '@/components/Cta'
import { ui } from './copy'

/** Cierre de la página: "Solicitar propuesta" con el servicio ya marcado en el brief. */
export function FinalCta({ service, detail }: { service: Service; detail: ServiceDetail }) {
  const lang = useLang()
  const t = ui[lang]
  const wa = whatsappHref(t.whatsappMsg(service.name[lang]))
  return (
    <section aria-labelledby="cta-title" className="border-t border-line">
      <div className="container-x flex flex-col items-center py-28 text-center md:py-44">
        <h2 id="cta-title" className="type-display max-w-[16ch]">
          {detail.cta.title[lang]}
        </h2>
        <p className="type-lead mt-6 max-w-[40ch] text-mute">{detail.cta.text[lang]}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Cta to={to.contact(lang, service.id)}>{t.propose}</Cta>
          {wa && (
            <Cta to={wa} variant="ghost">
              {t.whatsapp}
            </Cta>
          )}
        </div>
      </div>
    </section>
  )
}
