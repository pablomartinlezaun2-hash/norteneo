import { useLang } from '@/i18n'
import type { Explainer as ExplainerData } from '@/content/services/types'
import { Meta } from '@/components/Meta'

const copy = {
  es: { title: 'Míralo en 60 segundos.', label: 'Vídeo explicativo del servicio', subs: 'Subtítulos en español', subsOther: 'Subtítulos en inglés' },
  en: { title: 'See it in 60 seconds.', label: 'Service explainer video', subs: 'English subtitles', subsOther: 'Spanish subtitles' },
}

/**
 * "Míralo en 60 segundos": solo se renderiza cuando existe el vídeo (pendiente del cliente).
 * Vídeo con sonido, iniciado por el usuario (controles nativos), póster primero, preload=none
 * y subtítulos VTT en ES y EN (el del idioma de la página por defecto).
 */
export function Explainer({ data }: { data: ExplainerData }) {
  const lang = useLang()
  const t = copy[lang]
  const other = lang === 'es' ? 'en' : 'es'
  return (
    <section aria-labelledby="explainer-title" className="container-x py-24 md:py-32">
      <h2 id="explainer-title" className="type-display">
        {t.title}
      </h2>
      <figure className="mt-10 md:mt-14">
        <video
          className="aspect-video w-full bg-surface"
          controls
          preload="none"
          playsInline
          poster={data.poster}
          aria-label={t.label}
        >
          <source src={data.src} />
          <track kind="subtitles" srcLang={lang} label={t.subs} src={data.vtt[lang]} default />
          <track kind="subtitles" srcLang={other} label={t.subsOther} src={data.vtt[other]} />
        </video>
        <figcaption className="mt-4">
          <Meta>60 s</Meta>
        </figcaption>
      </figure>
    </section>
  )
}
